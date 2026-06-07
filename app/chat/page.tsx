'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Message, ExpertConfig, ChatSession } from '@/types'
import { ExpertSelector } from '@/components/expert-selector'
import { ChatBubble } from '@/components/chat-bubble'
import { ChatInput } from '@/components/chat-input'
import { PresetQuestions } from '@/components/preset-questions'
import { SessionSidebar } from '@/components/session-sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { EXPERTS } from '@/types'
import { chatStream, getUserInfo, logout } from '@/lib/api'
import { LogOut, Menu, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User } from 'lucide-react'
import { toast } from 'sonner'

export default function ChatPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  
  // 状态
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null)
  const [expertConfig, setExpertConfig] = useState<ExpertConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSessionSidebar, setShowSessionSidebar] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  
  // 检查登录状态和恢复会话
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getUserInfo()
      if (!user) {
        router.push('/login')
        return
      }
      
      setUserInfo(user)
      
      // 验证当前用户与存储的用户是否匹配
      const storedUser = localStorage.getItem('current-user')
      if (storedUser && storedUser !== user.username) {
        // 用户切换，清空之前的聊天记录
        localStorage.removeItem('chat-sessions')
        localStorage.removeItem('selected-expert')
      }
      localStorage.setItem('current-user', user.username)
      
      // 客户端初始化：只从 localStorage 恢复专家选择
      const savedExpert = localStorage.getItem('selected-expert')
      if (savedExpert) {
        const expert = EXPERTS.find((e: ExpertConfig) => e.name === savedExpert)
        if (expert) {
          setSelectedExpert(savedExpert)
          setExpertConfig(expert)
        }
      }
      
      // 加载历史会话列表
      const savedSessions = localStorage.getItem('chat-sessions')
      if (savedSessions) {
        try {
          const sessions = JSON.parse(savedSessions)
          setSessions(sessions)
          
          // 如果有选中的专家，加载该专家的最新会话
          if (savedExpert && sessions.length > 0) {
            const expertSessions = sessions.filter((s: ChatSession) => s.expert === savedExpert)
            if (expertSessions.length > 0) {
              const latestSession = expertSessions[0]
              setCurrentSessionId(latestSession.id)
              setMessages(latestSession.messages || [])
            }
          }
        } catch {}
      }
      
      // 初始化完成
      setIsInitializing(false)
    }
    checkAuth()
  }, [router])
  
  // 监听滚动位置，判断是否应该自动滚动
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // 距离底部小于 100px 时认为用户在底部
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      shouldAutoScroll.current = isNearBottom
      
      // 显示/隐藏滚动到底部按钮
      setShowScrollButton(!isNearBottom && scrollHeight > clientHeight)
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])
  
  // 智能滚动：仅在用户在底部时自动滚动
  useEffect(() => {
    // 禁用自动滚动，由用户手动控制
    return
    
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])
  
  // 保存会话
  const saveSession = useCallback((session: ChatSession) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === session.id ? session : s)
      localStorage.setItem('chat-sessions', JSON.stringify(updated))
      return updated
    })
  }, [])
  
  // 创建新会话
  const createNewSession = useCallback((expert: ExpertConfig, initialTitle?: string) => {
    const session: ChatSession = {
      id: Date.now().toString(),
      title: initialTitle || '新对话',
      messages: [],
      expert: expert.name,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    setSessions(prev => {
      const updated = [session, ...prev]
      localStorage.setItem('chat-sessions', JSON.stringify(updated))
      return updated
    })
    
    setCurrentSessionId(session.id)
    return session
  }, [])
  
  // 选择专家
  const handleSelectExpert = (expert: ExpertConfig) => {
    setSelectedExpert(expert.name)
    setExpertConfig(expert)
    localStorage.setItem('selected-expert', expert.name)
    
    // 加载该专家的最新会话
    const expertSessions = sessions.filter((s: ChatSession) => s.expert === expert.name)
    if (expertSessions.length > 0) {
      const latestSession = expertSessions[0]
      setCurrentSessionId(latestSession.id)
      setMessages(latestSession.messages || [])
    } else {
      // 没有会话则清空
      setCurrentSessionId(null)
      setMessages([])
    }
  }
  
  // 发送消息
  const handleSend = async (text: string, enableSearch: boolean = false, enableThinking: boolean = false, files?: any[]) => {
    console.log('handleSend called:', { text, expertConfig: !!expertConfig })
    if (!expertConfig || !text.trim()) {
      console.log('Blocked: missing expert or text')
      return
    }
    
    // 停止当前流
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    }
    
    // 创建会话（如果是第一条消息）
    let sessionId = currentSessionId
    let newMessages: Message[]
    
    if (!sessionId) {
      const initialTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '')
      newMessages = [userMessage]
      
      // 创建新会话时直接包含用户消息
      const session: ChatSession = {
        id: Date.now().toString(),
        title: initialTitle,
        messages: newMessages,
        expert: expertConfig.name,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      setSessions(prev => {
        const updated = [session, ...prev]
        localStorage.setItem('chat-sessions', JSON.stringify(updated))
        return updated
      })
      
      sessionId = session.id
      setCurrentSessionId(sessionId)
    } else {
      // 已有会话，添加消息
      newMessages = [...messages, userMessage]
    }
    
    setMessages(newMessages)
    setIsLoading(true)
    
    // 如果是已有会话，保存更新
    if (sessionId && currentSessionId) {
      // 使用函数形式获取最新会话状态
      setSessions(prevSessions => {
        const session = prevSessions.find(s => s.id === sessionId)
        if (session) {
          const updatedSession = {
            ...session,
            messages: newMessages,
            updatedAt: Date.now()
          }
          const updatedSessions = prevSessions.map(s => 
            s.id === sessionId ? updatedSession : s
          )
          localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions))
          return updatedSessions
        }
        return prevSessions
      })
    }
    
    // 发送新消息时强制滚动到底部
    shouldAutoScroll.current = true
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    // 创建 AI 消息占位
    const assistantMessageId = (Date.now() + 1).toString()
    setStreamingMessageId(assistantMessageId)
    
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      thinking: '',
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, assistantMessage])
    
    console.log('[ChatPage] 发送请求 - 历史消息数量:', newMessages.length);
    
    abortControllerRef.current = new AbortController()
    
    try {
      // 传入历史消息（去掉当前用户消息，因为prompt已经包含）
      // newMessages 包含当前用户消息，我们需要传递之前的历史消息
      const historyMessages = newMessages.slice(0, -1); // 去掉最后一条（当前用户消息）
      
      console.log('[ChatPage] 发送请求 - 历史消息数量:', historyMessages.length);
      
      const stream = chatStream(
        text,
        expertConfig.name,
        historyMessages,  // 传入历史消息（不包含当前用户消息）
        enableSearch,
        enableThinking,
        abortControllerRef.current?.signal,
        files
      )
      
      let thinkingContent = ''
      let contentText = ''
      
      // 使用 requestAnimationFrame 优化更新频率（60fps）
      let rafId: number | null = null
      let pendingUpdate = false
      
      const updateMessage = () => {
        if (pendingUpdate) return
        pendingUpdate = true
        
        rafId = requestAnimationFrame(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, thinking: thinkingContent, content: contentText }
                : msg
            )
          )
          pendingUpdate = false
        })
      }
      
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'thinking') {
            thinkingContent += chunk.data
          } else if (chunk.type === 'content') {
            contentText += chunk.data
          }
          
          updateMessage()
        }
      } catch (error: any) {
        // 用户点击停止或页面刷新
        if (error.name === 'AbortError' || error.message === 'The operation was aborted') {
          console.log('[ChatPage] 用户停止生成')
          // 更新消息显示已终止
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { 
                    ...msg, 
                    content: msg.content + '\n\n---\n*回答已终止*',
                    thinking: enableThinking ? thinkingContent : undefined
                  }
                : msg
            )
          )
          setStreamingMessageId(null)
          setIsLoading(false)
          abortControllerRef.current = null
          return
        }
        throw error
      }
      
      // 强制最后一次更新
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { 
                ...msg, 
                // 如果关闭了思考，不保存 thinking 内容
                thinking: enableThinking ? thinkingContent : undefined,
                content: contentText 
              }
            : msg
        )
      )
      
      // 完成
      setStreamingMessageId(null)
      
      // 从当前状态获取所有消息并更新会话
      setMessages(prevMessages => {
        const currentMessages = prevMessages.map(msg =>
          msg.id === assistantMessageId
            ? { 
                ...msg, 
                thinking: enableThinking ? thinkingContent : undefined,
                content: contentText 
              }
            : msg
        )
        
        // 直接保存会话（从当前状态获取）
        setSessions(prevSessions => {
          const updatedSessions = prevSessions.map(s => 
            s.id === sessionId 
              ? { ...s, messages: currentMessages, updatedAt: Date.now() }
              : s
          )
          localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions))
          return updatedSessions
        })
        
        return currentMessages
      })
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error)
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: '抱歉，出现了错误，请稍后重试。' }
              : msg
          )
        )
      }
    } finally {
      setIsLoading(false)
      setStreamingMessageId(null)
      abortControllerRef.current = null
    }
  }
  
  // 停止生成
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setStreamingMessageId(null)
      abortControllerRef.current = null
      toast.info('已停止生成')
    }
  }
  
  // 清空对话
  const handleClear = () => {
    setShowClearDialog(true)
  }
  
  const confirmClear = () => {
    // 删除当前专家的所有会话
    if (selectedExpert) {
      const updatedSessions = sessions.filter((s: ChatSession) => s.expert !== selectedExpert)
      setSessions(updatedSessions)
      localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions))
    }
    
    setMessages([])
    setCurrentSessionId(null)
    setStreamingMessageId(null)
    setShowClearDialog(false)
    toast.success('对话已清空')
  }
  
  // 登出
  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }
  
  // 选择预设问题
  const handlePresetSelect = (question: string) => {
    handleSend(question)
  }
  
  // 选择会话
  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id)
    setMessages(session.messages || [])
    setShowSessionSidebar(false)
    
    // 更新选中的专家
    const expert = EXPERTS.find((e: ExpertConfig) => e.name === session.expert)
    if (expert) {
      setSelectedExpert(expert.name)
      setExpertConfig(expert)
      localStorage.setItem('selected-expert', expert.name)
    }
  }
  
  // 新会话
  const handleNewSession = () => {
    // 停止当前生成
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setMessages([])
    setCurrentSessionId(null)
    setIsLoading(false)
    setStreamingMessageId(null)
    setShowSessionSidebar(false)
    toast.success('已创建新对话')
  }
  
  // 删除会话
  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter((s: ChatSession) => s.id !== sessionId)
    setSessions(updatedSessions)
    localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions))
    
    // 如果删除的是当前会话，清空消息
    if (currentSessionId === sessionId) {
      setMessages([])
      setCurrentSessionId(null)
    }
    
    toast.success('会话已删除')
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* 会话侧边栏 - 桌面端 */}
      {showSessionSidebar && (
        <div className="hidden md:block w-80 flex-shrink-0 transition-all duration-300 ease-in-out border-r border-border">
          <SessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            selectedExpert={selectedExpert}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
          />
        </div>
      )}
      
      {/* 会话侧边栏 - 移动端 */}
      {showSessionSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSessionSidebar(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-background shadow-xl">
            <SessionSidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              selectedExpert={selectedExpert}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        </div>
      )}
      
      {/* 侧边栏 - 移动端 */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-background z-50 lg:hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">菜单</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  handleNewSession()
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>开启新对话</span>
              </button>
              <button
                onClick={() => {
                  handleLogout()
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left text-destructive"
              >
                <LogOut size={20} />
                <span>登出</span>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航 */}
        <header className="bg-card px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-between shrink-0">
          {/* 左侧：专家选择器 */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu size={20} />
            </button>
            
            {/* 专家选择器 */}
          <div className="min-w-0 flex-1">
              <ExpertSelector
                selectedExpert={selectedExpert}
                onSelect={handleSelectExpert}
              />
            </div>
          </div>
          
          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 会话列表 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowSessionSidebar(!showSessionSidebar)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      showSessionSidebar 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>会话列表</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* 新对话 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleNewSession}
                    className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>开启新对话</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* 用户菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors ml-1">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-cyan-500 text-white text-xs font-semibold">
                      {userInfo?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleClear}>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  清空专家记录
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut size={16} className="mr-2" />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* 消息列表 */}
        <main className="flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto"
          >
            {isInitializing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">加载中...</div>
              </div>
            ) : messages.length === 0 && expertConfig ? (
              <PresetQuestions
                expert={expertConfig}
                onSelect={handlePresetSelect}
              />
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                请先选择一位专家开始对话
              </div>
            ) : (
              <div className="max-w-5xl mx-auto py-6 space-y-6 px-3 md:px-4 relative">
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isStreaming={message.id === streamingMessageId}
                    username={userInfo?.username}
                    expertIcon={expertConfig?.icon}
                    expertColor={expertConfig?.color}
                  />
                ))}
                
                {/* 滚动到底部按钮 */}
                {showScrollButton && (
                  <button
                    onClick={() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                      shouldAutoScroll.current = true
                    }}
                    className="fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-10"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                )}
                
                {/* 等待响应状态 - 仅在无思考内容时显示 */}
                {isLoading && streamingMessageId && (() => {
                  const streamingMsg = messages.find(m => m.id === streamingMessageId)
                  return !streamingMsg?.thinking
                })() && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>
        
        {/* 输入框 */}
        <ChatInput
          onSend={handleSend}
          onStop={handleStop}
          onClear={handleClear}
          isLoading={isLoading}
          disabled={!expertConfig}
        />
      </div>
      
      {/* 清空确认对话框 */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>清空对话</DialogTitle>
            <DialogDescription>
              确定要清空当前对话吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowClearDialog(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmClear}
              className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              确定清空
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
