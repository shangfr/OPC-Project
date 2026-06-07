'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { cn } from '@/lib/utils'
import { defaultSchema } from 'rehype-sanitize'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // 代码块
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !String(children).includes('\n')
            
            if (isInline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
            
            return (
              <div className="relative my-3">
                <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg text-xs text-muted-foreground">
                  <span>{match?.[1] || 'code'}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(String(children))}
                    className="hover:text-foreground transition-colors"
                  >
                    复制
                  </button>
                </div>
                <pre className="bg-muted rounded-t-none rounded-b-lg">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          },
          // 链接
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            )
          },
          // 表格
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-3">
                <table {...props}>{children}</table>
              </div>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
