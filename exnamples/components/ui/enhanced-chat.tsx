"use client"

import React, { forwardRef, useCallback, useRef, useState } from "react"
import { ArrowDown, ThumbsDown, ThumbsUp, Send, Mic, Paperclip, Square, X, Bot, Volume2, VolumeX, Pause, Play, Loader2, Settings } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CopyButton } from "@/components/ui/copy-button"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { FilePreview } from "@/components/ui/file-preview"
import { JumpingDots } from "@/components/ui/jumping-dots"
import { useTTS } from "@/hooks/use-tts"
import { extractTextForTTS, isTextFile } from "@/lib/file-text-extractor"
import { 
  processChatTTSInstruction, 
  TTSGenerationResult,
  ChatMessage as TTSChatMessage 
} from "@/lib/chat-tts-processor"
import { AudioGenerationResult, AudioGenerationLoading } from "@/components/audio-generation-result"
import { TTSConfigDiagnostics } from "@/components/tts-config-diagnostics"

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt?: Date
  attachments?: File[]
  isStreaming?: boolean
}

interface EnhancedChatProps {
  messages: Message[]
  input: string
  handleInputChange: (value: string) => void
  handleSubmit: (message: string, attachments?: File[]) => void
  isGenerating: boolean
  stop?: () => void
  className?: string
  placeholder?: string
  suggestions?: string[]
  onRateResponse?: (messageId: string, rating: "thumbs-up" | "thumbs-down") => void
  transcribeAudio?: (blob: Blob) => Promise<string>
  enableTTS?: boolean
}

export function EnhancedChat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isGenerating,
  stop,
  className,
  placeholder = "send message...",
  suggestions = [],
  onRateResponse,
  transcribeAudio,
  enableTTS = true,
}: EnhancedChatProps) {
  const [attachments, setAttachments] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [shouldShowScrollButton, setShouldShowScrollButton] = useState(false)
  const [audioGenerationResult, setAudioGenerationResult] = useState<TTSGenerationResult | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [showTTSDiagnostics, setShowTTSDiagnostics] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自動スクロール
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      } else {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      }
      setShouldShowScrollButton(false)
    }
  }, [])

  // スクロール位置を監視してボタン表示を制御
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShouldShowScrollButton(!isNearBottom)
      } else {
        // フォールバック: 直接のスクロール要素をチェック
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShouldShowScrollButton(!isNearBottom)
      }
    }
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // スクロールイベントリスナーを設定
  React.useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        viewport.addEventListener('scroll', handleScroll)
        return () => viewport.removeEventListener('scroll', handleScroll)
      } else {
        // フォールバック: 直接のスクロール要素にリスナーを設定
        scrollArea.addEventListener('scroll', handleScroll)
        return () => scrollArea.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  // ファイルアップロード処理
  const handleFileUpload = (files: FileList | File[]) => {
    const newFiles = Array.from(files)
    setAttachments(prev => [...prev, ...newFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // ドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  // メッセージ送信
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && attachments.length === 0) return

    const userInput = input.trim()
    
    // TTS指示を検出して音声生成を試行
    if (enableTTS && userInput) {
      try {
        setIsGeneratingAudio(true)
        setAudioGenerationResult(null)
        
        // チャット履歴をTTSChatMessage形式に変換
        const ttsHistory: TTSChatMessage[] = messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
          attachments: msg.attachments
        }))
        
        const result = await processChatTTSInstruction(userInput, ttsHistory)
        
        if (result.success) {
          setAudioGenerationResult(result)
          // 音声生成が成功した場合、入力フィールドをクリアして通常のチャット送信をスキップ
          handleInputChange("")
          setIsGeneratingAudio(false)
          return
        }
      } catch (error) {
        console.warn('TTS instruction processing failed:', error)
      } finally {
        setIsGeneratingAudio(false)
      }
    }

    // 通常のメッセージ送信
    handleSubmit(userInput, attachments)
    setAttachments([])
  }

  // キーボードショートカット
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as any)
    }
  }

  return (
    <TooltipProvider>
      <div className={cn("flex h-full flex-col", className)}>
        {/* メッセージエリア */}
        <div className="relative flex-1 min-h-0 chat-messages-area">
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-full w-full"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-4 space-y-4 pb-8">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRateResponse={onRateResponse}
                  enableTTS={enableTTS}
                />
              ))}
              
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="inline-block max-w-[85%] sm:max-w-[80%] lg:max-w-[75%]">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-center py-1">
                        <JumpingDots size="sm" color="rgb(var(--primary))" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 音声生成中表示 */}
              {isGeneratingAudio && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-[85%] sm:max-w-[80%] lg:max-w-[75%]"
                >
                  <AudioGenerationLoading text="指示された内容を音声化しています..." />
                </motion.div>
              )}

              {/* 音声生成結果表示 */}
              {audioGenerationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-[85%] sm:max-w-[80%] lg:max-w-[75%]"
                >
                  <AudioGenerationResult 
                    result={audioGenerationResult}
                    onPlay={() => console.log('Audio started playing')}
                    onPause={() => console.log('Audio paused')}
                  />
                </motion.div>
              )}

              {/* TTS設定診断 */}
              {showTTSDiagnostics && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-[85%] sm:max-w-[80%] lg:max-w-[75%]"
                >
                  <TTSConfigDiagnostics 
                    onConfigUpdated={() => {
                      setShowTTSDiagnostics(false)
                      // 設定更新後にTTS機能を再初期化
                    }}
                  />
                </motion.div>
              )}

            </div>
          </ScrollArea>

          {/* スクロールボトムボタン */}
          {shouldShowScrollButton && (
            <Button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg z-10"
              size="icon"
              variant="secondary"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 提案ボタン */}
        {messages.length === 0 && suggestions.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 入力エリア */}
        <div className="border-t p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            {/* 添付ファイル表示 */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-muted rounded-lg p-2">
                    <FilePreview file={file} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 入力フィールド */}
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="min-h-[60px] max-h-[200px] resize-none pr-12"
                  disabled={isGenerating}
                />
                
                {/* ファイルアップロードボタン */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 bottom-2 h-8 w-8 p-0"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.multiple = true
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files
                          if (files) handleFileUpload(files)
                        }
                        input.click()
                      }}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>ファイルを添付</TooltipContent>
                </Tooltip>

                {/* 音声入力ボタン */}
                {transcribeAudio && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-10 bottom-2 h-8 w-8 p-0"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>音声入力</TooltipContent>
                  </Tooltip>
                )}
              </div>



              {/* 送信ボタン */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={(!input.trim() && attachments.length === 0) || isGenerating}
                    className="h-10 w-10 p-0"
                  >
                    {isGenerating ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isGenerating ? "停止" : "送信"}
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </div>

        {/* ドラッグオーバーレイ */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center"
            >
              <div className="text-center">
                <Paperclip className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">ファイルをドロップしてアップロード</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

interface MessageBubbleProps {
  message: Message
  onRateResponse?: (messageId: string, rating: "thumbs-up" | "thumbs-down") => void
  enableTTS?: boolean
}

function MessageBubble({ message, onRateResponse, enableTTS = true }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const [isPlaying, setIsPlaying] = useState(false)
  
  // TTS機能を初期化（APIキーなしでも動作するように設定）
  const { synthesize, play, stop, status } = useTTS({
    autoPlay: false,
    debug: false,
    // APIキーが設定されていない場合は、ローカルTTSサーバーを使用
    engine: 'auto'
  })

  // 音声再生処理
  const handlePlayText = useCallback(async () => {
    try {
      if (isPlaying) {
        stop()
        setIsPlaying(false)
        return
      }

      setIsPlaying(true)
      
      // メッセージのテキストから Markdown を除去
      const textContent = message.content
        .replace(/```[\s\S]*?```/g, '') // コードブロック除去
        .replace(/`[^`]*`/g, '') // インラインコード除去
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // リンク除去
        .replace(/[#*_~]/g, '') // マークダウン記号除去
        .trim()

      if (!textContent) {
        setIsPlaying(false)
        return
      }

      await synthesize(textContent)
      
    } catch (error) {
      console.error('TTS error:', error)
      // エラーメッセージをユーザーに表示
      const errorMessage = error instanceof Error ? error.message : '音声合成に失敗しました'
      if (errorMessage.includes('APIキー')) {
        console.warn('APIキーが設定されていません。ローカルTTSサーバーを使用してください。')
        // APIキーエラーの場合、設定診断を表示
        setShowTTSDiagnostics(true)
      }
      setIsPlaying(false)
    } finally {
      setIsPlaying(false)
    }
  }, [isPlaying, message.content, synthesize, stop])

  // ファイルからテキストを抽出してTTS再生
  const handlePlayFileText = useCallback(async (file: File) => {
    try {
      if (!isTextFile(file)) {
        return
      }

      setIsPlaying(true)
      const text = await extractTextForTTS(file, {
        maxLength: 5000, // 5000文字まで
        cleanMarkdown: true,
        removeCodeBlocks: true
      })
      
      if (!text.trim()) {
        setIsPlaying(false)
        return
      }

      await synthesize(text)
      
    } catch (error) {
      console.error('File TTS error:', error)
      setIsPlaying(false)
    } finally {
      setIsPlaying(false)
    }
  }, [synthesize])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start space-x-3", isUser && "flex-row-reverse space-x-reverse")}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isUser ? "U" : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex-1 space-y-2 min-w-0", isUser && "text-right")}>
        <Card className={cn(
          "inline-block max-w-[85%] sm:max-w-[80%] lg:max-w-[75%] break-words overflow-wrap-anywhere",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <CardContent className="p-3">
            {/* 添付ファイル表示 */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 space-y-2">
                {message.attachments.map((file, index) => (
                  <div key={index} className="relative">
                    <FilePreview file={file} />
                    {/* ファイル用TTSボタン */}
                    {enableTTS && isTextFile(file) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => handlePlayFileText(file)}
                            disabled={status.status === 'synthesizing'}
                          >
                            {status.status === 'synthesizing' ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isPlaying ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {status.status === 'synthesizing' ? '音声合成中...' : isPlaying ? '一時停止' : 'ファイルを音声で再生'}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* メッセージ内容 */}
            <div className="prose prose-sm max-w-none break-words overflow-wrap-anywhere">
              <MarkdownRenderer>{message.content}</MarkdownRenderer>
            </div>

            {/* タイムスタンプ */}
            {message.createdAt && (
              <time className="text-xs opacity-70 mt-2 block">
                {message.createdAt.toLocaleTimeString()}
              </time>
            )}
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className={cn("flex items-center space-x-1", isUser && "justify-end")}>
          {!isUser && <CopyButton content={message.content} />}
          
          {/* TTSボタン（ユーザーとアシスタント両方） */}
          {enableTTS && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handlePlayText}
                  disabled={status.status === 'synthesizing' || !message.content.trim()}
                >
                  {status.status === 'synthesizing' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isPlaying ? (
                    <VolumeX className="h-3 w-3" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {status.status === 'synthesizing' ? '音声合成中...' : isPlaying ? '音声停止' : '音声で再生'}
              </TooltipContent>
            </Tooltip>
          )}

          {!isUser && onRateResponse && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onRateResponse(message.id, "thumbs-up")}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onRateResponse(message.id, "thumbs-down")}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
