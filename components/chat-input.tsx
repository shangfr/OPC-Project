'use client'

import { useState, useRef, useEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Send, Square, Trash2, Paperclip, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

interface AttachedFile {
  name: string
  size: number
  type: string
  data: string // base64
}

interface ChatInputProps {
  onSend: (text: string, enableSearch?: boolean, enableThinking?: boolean, files?: AttachedFile[]) => void
  onStop?: () => void
  onClear?: () => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, onClear, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [enableSearch, setEnableSearch] = useState(false)
  const [enableThinking, setEnableThinking] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  
  // 自动聚焦
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isLoading])
  
  const handleSubmit = () => {
    const text = input.trim()
    if (!text || isLoading || disabled) return
    
    onSend(text, enableSearch, enableThinking, attachedFiles)
    setInput('')
    setAttachedFiles([])
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`文件 ${file.name} 超过 10MB 限制`)
        continue
      }
      
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64
        }])
      }
      reader.readAsDataURL(file)
    }
    
    // 清空 input 以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  // 语音输入
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别，请使用 Chrome 浏览器')
      return
    }
    
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = true
    recognition.continuous = true
    
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(prev => prev + transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    
    recognitionRef.current = recognition
    recognition.start()
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
  
  return (
    <div className="bg-gradient-to-b from-background to-card/50 p-3 md:p-4">
      <div className="max-w-5xl mx-auto">
        {/* 附件预览 */}
        {attachedFiles.length > 0 && (
          <div className="max-w-4xl mx-auto mb-2">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="hidden">
          <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            {/* 联网搜索开关 */}
            <div className="flex items-center gap-2">
              <Switch
                checked={enableSearch}
                onCheckedChange={setEnableSearch}
                id="search-switch"
              />
              <label
                htmlFor="search-switch"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                联网搜索
              </label>
            </div>
            
            <Separator orientation="vertical" className="h-4" />
            
            {/* 深度思考开关 */}
            <div className="flex items-center gap-2">
              <Switch
                checked={enableThinking}
                onCheckedChange={setEnableThinking}
                id="thinking-switch"
              />
              <label
                htmlFor="thinking-switch"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                深度思考
              </label>
            </div>
          </div>
          
          <div className="flex gap-2">
            {onClear && !isLoading && (
              <button
                onClick={onClear}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
              >
                <Trash2 size={14} />
                清空
              </button>
            )}
          </div>
        </div>
        </div>
        
        {/* 输入框容器 */}
        <div className={cn(
          'rounded-2xl border border-border bg-background shadow-sm transition-all',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md',
          disabled && 'opacity-50 cursor-not-allowed'
        )}>
          {/* 文本输入 */}
          <div className="p-3">
            <TextareaAutosize
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? '请先选择专家' : '和我聊聊吧'}
              disabled={disabled}
              minRows={1}
              maxRows={6}
              className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
            />
          </div>
          
          {/* 底部工具栏 */}
          <div className="flex items-center gap-2 px-3 pb-3">
            {/* 左侧：附件 */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-border"
              title="上传文件"
            >
              <Paperclip size={16} />
            </button>
            
            {/* 中间：功能按钮 */}
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={handleVoiceInput}
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all border',
                  isListening
                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border'
                )}
                title={isListening ? '点击停止录音' : '语音输入'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              
              <button
                onClick={() => setEnableThinking(!enableThinking)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border',
                  enableThinking
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                思考
              </button>
              
              <button
                onClick={() => setEnableSearch(!enableSearch)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border',
                  enableSearch
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                联网
              </button>
            </div>
            
            {/* 右侧：发送/停止按钮 */}
            <button
              onClick={isLoading ? onStop : handleSubmit}
              disabled={!input.trim() && !isLoading || disabled}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all',
                isLoading
                  ? 'bg-destructive text-white hover:bg-destructive/90'
                  : 'bg-primary text-white hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary',
                'hover:scale-105 active:scale-95'
              )}
            >
              {isLoading ? (
                <Square size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
