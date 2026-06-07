'use client'

import { Message } from '@/types'
import { MarkdownRenderer } from './markdown-renderer'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { User, Bot, Copy, Check, Globe, Brain, Paperclip } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ChatBubbleProps {
  message: Message
  isStreaming?: boolean
  username?: string
  expertIcon?: string
  expertColor?: string
}

export function ChatBubble({ message, isStreaming, username, expertIcon, expertColor }: ChatBubbleProps) {
  const [showThinking, setShowThinking] = useState(true) // 默认显示思考过程
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  
  // 流式输出时自动展开思考过程
  useEffect(() => {
    if (isStreaming && message.thinking) {
      setShowThinking(true)
    }
  }, [isStreaming, message.thinking])
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }
  
  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-cyan-500 text-white'
            : expertColor || 'bg-muted'
        )}
      >
        {isUser ? (
          <span className="text-xs font-semibold">
            {username?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        ) : (
          <span className="text-lg">{expertIcon || '🤖'}</span>
        )}
      </div>
      
      {/* 消息内容 */}
      <div className={cn('flex flex-col max-w-[85%] md:max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        {/* 思考过程 */}
        {message.thinking !== undefined && message.thinking !== null && !isUser && (
          <div className="mb-2 w-full">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className={cn(
                  'w-4 h-4 transition-transform',
                  showThinking && 'rotate-90',
                  isStreaming && 'animate-pulse'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {isStreaming ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span>正在思考...</span>
                </span>
              ) : showThinking ? '隐藏思考过程' : '显示思考过程'}
            </button>
            
            {showThinking && message.thinking && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground min-h-[32px]">
                <MarkdownRenderer content={message.thinking} />
                {/* 思考中的光标 */}
                {isStreaming && <span className="typing-cursor" />}
              </div>
            )}
          </div>
        )}
        
        {/* 消息气泡 */}
        <div className="group relative">
          <div
            className={cn(
              'rounded-lg px-1 py-1 min-h-[32px]',
              isUser
                ? 'text-foreground'
                : 'text-foreground'
            )}
          >
            {isUser ? (
              <div className="text-sm whitespace-pre-wrap text-right">{message.content}</div>
            ) : (
              <div className="relative">
                <MarkdownRenderer content={message.content || ' '} />
                {/* 正文中的光标 */}
                {isStreaming && message.content && <span className="typing-cursor" />}
              </div>
            )}
          </div>
          
          {/* 复制按钮（仅AI消息且非流式） */}
          {!isUser && !isStreaming && message.content && (
            <button
              onClick={handleCopy}
              className="absolute bottom-1 right-1 p-1.5 rounded-lg bg-card border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              title="复制内容"
            >
              {copied ? (
                <Check size={14} className="text-green-600" />
              ) : (
                <Copy size={14} className="text-muted-foreground" />
              )}
            </button>
          )}
        </div>
        
        {/* 时间戳和标记 */}
        <div className="mt-1 px-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {/* 消息标记 */}
          {isUser && (
            <div className="flex items-center gap-1">
              {message.enableSearch && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100" title="联网搜索">
                  <Globe size={10} />
                  联网
                </span>
              )}
              {message.enableThinking && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-600 border border-purple-100" title="深度思考">
                  <Brain size={10} />
                  思考
                </span>
              )}
              {message.hasFiles && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-orange-50 text-orange-600 border border-orange-100" title="包含文件">
                  <Paperclip size={10} />
                  文件
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
