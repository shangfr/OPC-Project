'use client'

import { ExpertConfig } from '@/types'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PresetQuestionsProps {
  expert: ExpertConfig
  onSelect: (question: string) => void
}

export function PresetQuestions({ expert, onSelect }: PresetQuestionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* 专家信息 */}
      <div className="mb-8 text-center">
        <div className={cn(
          'inline-flex items-center justify-center w-20 h-20 rounded-2xl text-white mb-4 shadow-lg',
          expert.color
        )}>
          <span className="text-4xl">{expert.icon}</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">{expert.name}</h2>
        <p className="text-muted-foreground">{expert.role}</p>
        <p className="text-sm text-muted-foreground mt-2">{expert.description}</p>
      </div>
      
      {/* 预设问题 */}
      <div className="w-full max-w-2xl">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <MessageSquare size={16} />
          您可以问：
        </h3>
        
        <div className="grid gap-3">
          {expert.questions.map((question, index) => (
            <button
              key={index}
              onClick={() => onSelect(question)}
              className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium mt-0.5 group-hover:bg-primary/20">
                  {index + 1}
                </div>
                <div className="text-sm">{question}</div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 text-center text-xs text-muted-foreground">
          或直接输入您的问题开始对话
        </div>
      </div>
    </div>
  )
}
