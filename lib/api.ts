import { Message } from '@/types'

// 获取用户信息
export async function getUserInfo() {
  try {
    const response = await fetch('/api/user', {
      credentials: 'include'
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data.success ? data.user : null
  } catch {
    return null
  }
}

// 登出
export async function logout() {
  await fetch('/api/logout', { method: 'POST' })
  localStorage.removeItem('current-user')
  localStorage.removeItem('chat-sessions')
  localStorage.removeItem('selected-expert')
}

// 流式聊天
export async function* chatStream(
  text: string,
  expert: string,
  history: Message[] = [],
  enableSearch: boolean = false,
  enableThinking: boolean = true,
  signal?: AbortSignal,
  files?: Array<{ name: string; size: number; type: string; data: string }>
): AsyncGenerator<{ type: 'thinking' | 'content' | 'done', data: string }> {
  console.log('[API] chatStream调用 - 历史消息数量:', history.length)
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    signal,
    body: JSON.stringify({
      text,
      expert,
      messages: history
        .filter(msg => msg.content || msg.role === 'user')
        .map(msg => ({ role: msg.role, content: msg.content })),
      enable_search: enableSearch,
      enable_thinking: enableThinking,
      files: files?.map(f => ({
        name: f.name,
        contentType: f.type,
        data: f.data
      })) || []
    })
  })
  
  console.log('[API] 收到响应 - status:', response.status)
  
  if (!response.ok) {
    console.error('[API] HTTP错误:', response.status)
    const errorText = await response.text()
    console.error('[API] 错误响应内容:', errorText)
    try {
      const error = JSON.parse(errorText)
      throw new Error(error.error || error.detail || `HTTP error! status: ${response.status}`)
    } catch (e) {
      throw new Error(errorText || `HTTP error! status: ${response.status}`)
    }
  }
  
  const contentType = response.headers.get('content-type')
  console.log('[API] Content-Type:', contentType)
  
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }
  
  const decoder = new TextDecoder()
  let buffer = ''
  let eventCount = 0
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        console.log('[API] 流读取完成，事件数:', eventCount)
        break
      }
      
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      console.log('[API] 收到数据块，长度:', chunk.length, '内容前100字符:', chunk.substring(0, 100))
      
      // SSE事件用 \n\n 分隔
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''
      
      for (const event of events) {
        eventCount++
        const lines = event.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim()
            
            if (!data || data === '[DONE]') {
              console.log('[API] 收到完成信号')
              yield { type: 'done', data: '' }
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              console.log('[API] 解析事件', eventCount, ':', Object.keys(parsed))
              
              if (parsed.error) {
                console.error('[API] 百炼返回错误:', parsed.error)
                throw new Error(parsed.error)
              }
              
              if (parsed.output) {
                if (parsed.output.thoughts && parsed.output.thoughts.length > 0) {
                  const lastThought = parsed.output.thoughts[parsed.output.thoughts.length - 1]
                  if (lastThought.thought) {
                    console.log('[API] 收到思考内容')
                    yield { type: 'thinking', data: lastThought.thought }
                  }
                }
                if (parsed.output.text) {
                  console.log('[API] 收到文本内容，长度:', parsed.output.text.length)
                  yield { type: 'content', data: parsed.output.text }
                }
                if (parsed.output.finish_reason && parsed.output.finish_reason !== 'null') {
                  console.log('[API] 收到结束原因:', parsed.output.finish_reason)
                  yield { type: 'done', data: '' }
                  return
                }
              }
              else if (parsed.thinking !== undefined) {
                console.log('[API] 收到thinking字段')
                yield { type: 'thinking', data: parsed.thinking }
              } else if (parsed.content !== undefined) {
                console.log('[API] 收到content字段')
                yield { type: 'content', data: parsed.content }
              }
            } catch (e) {
              console.error('[API] 解析SSE数据失败:', data, e)
            }
          }
        }
      }
    }
    
    // 如果流结束了但还没有收到完成信号，发送一个
    if (buffer.trim()) {
      console.log('[API] 流结束后还有残留数据:', buffer)
    }
  } finally {
    reader.releaseLock()
  }
}
