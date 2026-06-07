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
  let lastTextLength = 0
  let lastThoughtLength = 0
  
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
              
              // 格式1: 百炼标准格式 output.text / output.reasoningContent
              if (parsed.output) {
                console.log('[API] output字段:', JSON.stringify(parsed.output, null, 2))
                
                // 处理思考内容
                if (parsed.output.reasoningContent) {
                  const currentReasoning = parsed.output.reasoningContent
                  if (lastThoughtLength === 0) {
                    lastThoughtLength = currentReasoning.length
                    console.log('[API] 收到思考内容（首次），长度:', currentReasoning.length)
                    yield { type: 'thinking', data: currentReasoning }
                  } else if (currentReasoning.length > lastThoughtLength) {
                    const delta = currentReasoning.slice(lastThoughtLength)
                    lastThoughtLength = currentReasoning.length
                    console.log('[API] 收到思考内容（累积）增量，长度:', delta.length)
                    yield { type: 'thinking', data: delta }
                  } else {
                    console.log('[API] 收到思考内容（增量），长度:', currentReasoning.length)
                    yield { type: 'thinking', data: currentReasoning }
                  }
                }
                
                // 处理文本内容
                if (parsed.output.text) {
                  const currentText = parsed.output.text
                  if (lastTextLength === 0) {
                    lastTextLength = currentText.length
                    console.log('[API] 收到文本内容（首次），长度:', currentText.length)
                    yield { type: 'content', data: currentText }
                  } else if (currentText.length > lastTextLength) {
                    const delta = currentText.slice(lastTextLength)
                    lastTextLength = currentText.length
                    console.log('[API] 收到文本内容（累积）增量，长度:', delta.length)
                    yield { type: 'content', data: delta }
                  } else {
                    console.log('[API] 收到文本内容（增量），长度:', currentText.length)
                    yield { type: 'content', data: currentText }
                  }
                }
                
                if (parsed.output.finish_reason && parsed.output.finish_reason !== 'null') {
                  console.log('[API] 收到结束原因:', parsed.output.finish_reason)
                  yield { type: 'done', data: '' }
                  return
                }
              }
              
              // 格式2: OpenAI 兼容格式 choices[].delta
              else if (parsed.choices && parsed.choices.length > 0) {
                const delta = parsed.choices[0].delta
                console.log('[API] delta字段:', JSON.stringify(delta, null, 2))
                
                // 处理思考内容 (reasoning_content)
                if (delta.reasoning_content) {
                  const currentReasoning = delta.reasoning_content
                  if (lastThoughtLength === 0) {
                    lastThoughtLength = currentReasoning.length
                    console.log('[API] 收到思考内容(delta)（首次），长度:', currentReasoning.length)
                    yield { type: 'thinking', data: currentReasoning }
                  } else if (currentReasoning.length > lastThoughtLength) {
                    const deltaContent = currentReasoning.slice(lastThoughtLength)
                    lastThoughtLength = currentReasoning.length
                    console.log('[API] 收到思考内容(delta)（累积）增量，长度:', deltaContent.length)
                    yield { type: 'thinking', data: deltaContent }
                  } else {
                    console.log('[API] 收到思考内容(delta)（增量），长度:', currentReasoning.length)
                    yield { type: 'thinking', data: currentReasoning }
                  }
                }
                
                // 处理文本内容 (content)
                if (delta.content) {
                  const currentText = delta.content
                  if (lastTextLength === 0) {
                    lastTextLength = currentText.length
                    console.log('[API] 收到文本内容(delta)（首次），长度:', currentText.length)
                    yield { type: 'content', data: currentText }
                  } else if (currentText.length > lastTextLength) {
                    const deltaContent = currentText.slice(lastTextLength)
                    lastTextLength = currentText.length
                    console.log('[API] 收到文本内容(delta)（累积）增量，长度:', deltaContent.length)
                    yield { type: 'content', data: deltaContent }
                  } else {
                    console.log('[API] 收到文本内容(delta)（增量），长度:', currentText.length)
                    yield { type: 'content', data: currentText }
                  }
                }
                
                if (parsed.choices[0].finish_reason && parsed.choices[0].finish_reason !== 'null') {
                  console.log('[API] 收到结束原因:', parsed.choices[0].finish_reason)
                  yield { type: 'done', data: '' }
                  return
                }
              }
              
              // 格式3: 直接字段
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
