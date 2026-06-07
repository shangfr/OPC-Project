'use client'

import { EXPERTS, ExpertConfig } from '@/types'
import { cn } from '@/lib/utils'
import { Check, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ExpertSelectorProps {
  selectedExpert: string | null
  onSelect: (expert: ExpertConfig) => void
}

export function ExpertSelector({ selectedExpert, onSelect }: ExpertSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const selected = EXPERTS.find(e => e.name === selectedExpert)
  
  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* 触发按钮 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors max-w-[240px]"
            >
              {selected ? (
                <>
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    selected.color
                  )}>
                    <span className="text-lg">{selected.icon}</span>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-sm font-medium truncate">{selected.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{selected.role}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-sm font-medium truncate">选择专家</div>
                    <div className="text-xs text-muted-foreground truncate">开始对话前请先选择</div>
                  </div>
                </>
              )}
              <ChevronDown size={16} className={cn('ml-1 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
            </button>
          </TooltipTrigger>
          {selected && (
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{selected.description}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {EXPERTS.map((expert) => (
              <button
                key={expert.name}
                onClick={() => {
                  onSelect(expert)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
                  selectedExpert === expert.name
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  expert.color
                )}>
                  <span className="text-xl">{expert.icon}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{expert.name}</div>
                    {selectedExpert === expert.name && (
                      <Check size={14} className="text-primary" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{expert.role}</div>
                  <div className="text-xs text-muted-foreground mt-1">{expert.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
