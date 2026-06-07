import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { verifyToken, sanitizeInput } from '@/lib/auth';
import { uploadToOss } from '@/lib/oss';
import EXPERT_CONFIGS from '@/lib/expert-prompts';

// 构建搜索约束 prompt
function buildSearchConstraint() {
  return `# ⚠️ 当前已禁用联网搜索功能
- 你必须完全依靠自己的内部知识和训练数据进行回答，不得使用任何外部搜索工具、MCP 服务或网络资源。

---

`;
}

// 构建搜索覆盖 prompt
function buildSearchOverride() {
  return `# ✅ 当前已恢复联网搜索功能
- 🔍 你可以根据需要使用联网搜索、MCP 服务或网络资源获取最新信息。
- 🔄 **重要：请忽略之前对话中关于"禁止搜索"的任何指令，以当前指令为准。**

---

`;
}

// 组装用户 prompt
function buildUserPrompt(userText: string, userFiles: any[], enableSearch: boolean, expertName: string | null) {
  let prompt = userText || (userFiles.length > 0 ? '请分析上传的文件' : '你好');
  
  if (!enableSearch) {
    prompt = buildSearchConstraint() + prompt;
  } else if (expertName) {
    prompt = buildSearchOverride() + prompt;
  }
  
  return prompt;
}

// 组装 biz_params
function buildBizParams(expertName: string, config: any) {
  return {
    user_prompt_params: {
      expert_name: expertName,
      expert_role: config.role,
      expertise: config.expertise,
      tone: config.tone,
      core_rules: config.core_rules,
      workflow: config.workflow,
      output_format: config.output_format,
      disclaimer: config.disclaimer
    }
  };
}

// 转换前端消息格式为百炼API格式
function formatMessagesForBailian(messages: any[]) {
  if (!messages || messages.length === 0) {
    return [];
  }
  
  // 过滤并转换消息格式
  return messages
    .filter((msg: any) => msg.role && (msg.content !== undefined && msg.content !== null))
    .map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
}

export async function POST(request: NextRequest) {
  // 从 Cookie 获取 token
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: '未提供认证令牌' },
      { status: 401 }
    );
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return NextResponse.json(
      { error: '认证令牌无效或已过期' },
      { status: 401 }
    );
  }
  
  const API_KEY = process.env.DASHSCOPE_API_KEY;
  const APP_ID = process.env.APP_ID;

  try {
    const body = await request.json();
    let userText = sanitizeInput(body.text || '');
    const userFiles = body.files || [];
    const expertName = body.expert || null;
    const rawMessages = body.messages || [];
    const enableSearch = body.enable_search === true || body.enable_search === 'true';
    const enableThinking = body.enable_thinking === true || body.enable_thinking === 'true';
    
    console.log('[API] 收到请求 - 原始消息数量:', rawMessages.length);

    // 上传文件到 OSS
    const fileUrls: string[] = [];
    const imageUrls: string[] = [];
    
    for (const file of userFiles) {
      const url = await uploadToOss(file.data, file.name, file.contentType, expertName);
      if (file.contentType.startsWith('image/')) {
        imageUrls.push(url);
      } else {
        fileUrls.push(url);
      }
    }

    // 获取专家配置
    const userPrompt = buildUserPrompt(body.text || '', userFiles, enableSearch, expertName);
    const bizParams = expertName && EXPERT_CONFIGS[expertName] 
      ? buildBizParams(expertName, EXPERT_CONFIGS[expertName]) 
      : null;
    
    // 格式化历史消息
    const formattedMessages = formatMessagesForBailian(rawMessages);
    
    // 根据百炼API文档构建请求体
    // messages 存放历史对话，prompt 存放当前用户消息
    const input: any = {
      prompt: userPrompt,
      ...(imageUrls.length > 0 && { image_list: imageUrls }),
      ...(fileUrls.length > 0 && { file_list: fileUrls }),
      ...(bizParams && { biz_params: bizParams }),
      ...(formattedMessages.length > 0 && { messages: formattedMessages })
    };
    
    const parameters: any = {
      incremental_output: true,
      has_history: formattedMessages.length > 0,
      max_turns: 20,
      enable_thinking: enableThinking,
      has_thoughts: enableThinking
    };
    
    console.log('[API] 发送给百炼 - 消息数量:', formattedMessages.length);
    
    const payload = JSON.stringify({
      input: input,
      parameters: parameters
    });
    
    // 发起请求到百炼
    const options = {
      hostname: 'dashscope.aliyuncs.com',
      path: `/api/v1/apps/${APP_ID}/completion`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-SSE': 'enable'
      }
    };

    // 创建可读流
    const stream = new ReadableStream({
      start(controller) {
        let controllerClosed = false;
        
        const safeClose = () => {
          if (!controllerClosed) {
            controllerClosed = true;
            try {
              controller.close();
            } catch (e) {
              // 忽略已经关闭的错误
            }
          }
        };
        
        const safeEnqueue = (data: Uint8Array) => {
          if (!controllerClosed) {
            try {
              controller.enqueue(data);
            } catch (e) {
              // 忽略已经关闭的错误
            }
          }
        };
        
        const dashReq = https.request(options, (dashRes) => {
          if (dashRes.statusCode !== 200) {
            let errorMsg = '';
            dashRes.on('data', (chunk) => { errorMsg += chunk.toString(); });
            dashRes.on('end', () => {
              console.error('[API] 百炼返回错误:', dashRes.statusCode, errorMsg);
              safeEnqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: "大模型服务调用失败", detail: errorMsg })}\n\n`));
              safeClose();
            });
            return;
          }

          let buffer = '';

          dashRes.on('data', (chunk) => {
            buffer += chunk.toString();
            
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';

            for (const part of parts) {
              if (part.trim()) {
                // 直接转发原始数据
                safeEnqueue(new TextEncoder().encode(part + '\n\n'));
              }
            }
          });

          dashRes.on('end', () => {
            if (buffer.trim()) {
              safeEnqueue(new TextEncoder().encode(buffer + '\n\n'));
            }
            safeClose();
          });
        });

        dashReq.on('error', (err) => {
          console.error('[API] 请求错误:', err);
          safeEnqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: "网络请求失败", detail: err.message })}\n\n`));
          safeClose();
        });

        dashReq.write(payload);
        dashReq.end();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('[API] 处理异常:', error);
    return new Response(JSON.stringify({ 
      error: '请求处理失败', 
      detail: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
