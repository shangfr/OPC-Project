'use client'

import { ChatSession } from '@/types'
import { cn } from '@/lib/utils'
import { MessageSquare, Trash2, Plus } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface SessionSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  selectedExpert: string | null
  onSelectSession: (session: ChatSession) => void
  onNewSession: () => void
  onDeleteSession: (sessionId: string) => void
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  selectedExpert,
  onSelectSession,
  onNewSession,
  onDeleteSession
}: SessionSidebarProps) {
  // 按专家分组，每组最多显示5条最新的会话
  const groupedSessions = sessions.reduce((acc, session) => {
    const expert = session.expert
    if (!acc[expert]) {
      acc[expert] = []
    }
    acc[expert].push(session)
    return acc
  }, {} as Record<string, ChatSession[]>)

  // 对每个专家的会话按时间排序（最新的在前）并限制最多5条
  const limitedSessions = Object.entries(groupedSessions).reduce((acc, [expert, expertSessions]) => {
    acc[expert] = expertSessions
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5)
    return acc
  }, {} as Record<string, ChatSession[]>)

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* 头部 */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">开启新对话</span>
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(limitedSessions).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p>暂无历史会话</p>
          </div>
        ) : (
          Object.entries(limitedSessions).map(([expert, expertSessions]) => (
            <div key={expert} className="mb-2">
              {/* 专家标题 */}
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                {expert}
              </div>

              {/* 该专家的会话 */}
              {expertSessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors hover:bg-muted',
                    currentSessionId === session.id && 'bg-primary/10 border-r-2 border-primary'
                  )}
                  onClick={() => onSelectSession(session)}
                >
                  <MessageSquare size={16} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{session.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(session.updatedAt)}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
        {sessions.length} 个会话（最多显示5条/专家）
      </div>
    </div>
  )
}
