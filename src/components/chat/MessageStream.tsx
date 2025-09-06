import React, { useRef, useEffect, useState } from 'react'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { SplitText } from '@/components/ui/split-text'

interface MessageStreamProps {
  content: string
  isStreaming?: boolean
  role: 'assistant' | 'user'
  className?: string
}

export const MessageStream: React.FC<MessageStreamProps> = ({
  content,
  isStreaming = false,
  role,
  className = ''
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [displayedContent, setDisplayedContent] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // ストリーミングコンテンツの表示を改善
  useEffect(() => {
    if (isStreaming) {
      setDisplayedContent(content)
      setIsTyping(true)
    } else {
      // ストリーミング完了時の滑らかな表示
      if (content !== displayedContent) {
        setDisplayedContent(content)
        setIsTyping(false)
      }
    }
  }, [content, isStreaming])

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (contentRef.current) {
      const scrollToBottom = () => {
        contentRef.current!.scrollTop = contentRef.current!.scrollHeight
      }
      
      // 少し遅延を入れてスクロール（レンダリング完了後）
      const timeoutId = setTimeout(scrollToBottom, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [displayedContent, isStreaming])

  // タイピングアニメーション効果
  const renderContent = () => {
    if (!displayedContent) return null

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {role === 'assistant' ? (
            <SplitText 
              delay={0.1}
              stagger={0.01}
              duration={0.3}
              ease="easeOut"
            >
              {displayedContent}
            </SplitText>
          ) : (
            displayedContent
          )}
          {isStreaming && role === 'assistant' && (
            <span className="inline-block ml-1">
              <JumpingDots />
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {role === 'assistant' ? (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">U</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="p-4 transition-all duration-200">
            <div
              ref={contentRef}
              className="max-h-96 overflow-y-auto"
            >
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
