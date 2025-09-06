import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Image, Video, Music, Link, ExternalLink, Download, Eye, Edit2, Check, X, Copy } from 'lucide-react'
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from '@/components/ui/video-player'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { SplitText } from '@/components/ui/split-text'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ShimmerText } from '@/components/ui/shimmer-text'

// AI Elements imports
import { Response } from '@/components/ai-elements/response'
import { Task, TaskTrigger, TaskContent, TaskItem, TaskItemFile } from '@/components/ai-elements/task'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { 
  InlineCitation, 
  InlineCitationText, 
  InlineCitationCard, 
  InlineCitationCardTrigger, 
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationQuote
} from '@/components/ai-elements/inline-citation'
import { 
  Tool, 
  ToolContent, 
  ToolHeader, 
  ToolInput, 
  ToolOutput,
  ToolUIPartRenderer 
} from '@/components/ai-elements/tool'
import { 
  WebPreview, 
  WebPreviewNavigation, 
  WebPreviewNavigationButton, 
  WebPreviewUrl, 
  WebPreviewBody,
  WebPreviewConsole 
} from '@/components/ai-elements/web-preview'

import { EnhancedFilePreview } from './EnhancedFilePreview'

// 構造化テキストコンポーネント
const StructuredTechnicalDocument: React.FC<{ content: string }> = ({ content }) => {
  // 技術文書の構造を解析してレンダリング
  const renderStructuredContent = (text: string) => {
    // 見出しを検出（# で始まる行）
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      // 見出しの検出
      if (trimmedLine.startsWith('#')) {
        const level = trimmedLine.match(/^#+/)?.[0].length || 1
        const title = trimmedLine.replace(/^#+\s*/, '')
        
        const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements
        elements.push(
          <HeadingTag 
            key={`heading-${index}`}
            className={cn(
              "font-bold text-white mb-4 mt-6",
              level === 1 && "text-5xl border-b-2 border-gray-600 pb-3",
              level === 2 && "text-4xl",
              level === 3 && "text-3xl",
              level === 4 && "text-2xl",
              level >= 5 && "text-xl"
            )}
          >
            {title}
          </HeadingTag>
        )
        return
      }
      
      // 番号付きリストの検出
      if (/^\d+\.\s/.test(trimmedLine)) {
        const itemText = trimmedLine.replace(/^\d+\.\s/, '')
        elements.push(
          <div key={`numbered-${index}`} className="flex items-start gap-2 mb-2">
            <span className="flex-shrink-0 w-7 h-7 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {trimmedLine.match(/^\d+/)?.[0]}
            </span>
            <div className="text-sm leading-relaxed text-white">
              {renderHighlightedText(itemText)}
            </div>
          </div>
        )
        return
      }
      
      // 箇条書きリストの検出
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ') || trimmedLine.startsWith('* ')) {
        const itemText = trimmedLine.replace(/^[-•*]\s/, '')
        elements.push(
          <div key={`bullet-${index}`} className="flex items-start gap-2 mb-1">
            <span className="flex-shrink-0 text-white mt-1 text-lg font-bold">・</span>
            <div className="text-sm leading-relaxed text-white">
              {renderHighlightedText(itemText)}
            </div>
          </div>
        )
        return
      }
      
      // 通常のテキスト
      if (trimmedLine) {
        elements.push(
          <p key={`text-${index}`} className="text-base leading-relaxed mb-2 text-white">
            {renderHighlightedText(trimmedLine)}
          </p>
        )
      } else {
        // 空行
        elements.push(<div key={`empty-${index}`} className="h-1"></div>)
      }
    })
    
    return elements
  }

  // キーワードのハイライト処理
  const renderHighlightedText = (text: string): React.ReactNode[] => {
    // バッククォートで囲まれたテキストと太字をハイライト
    let parts: (string | React.ReactNode)[] = text.split(/(`[^`]+`)/g)
    
    // 太字の処理
    parts = parts.map(part => {
      if (typeof part === 'string' && (!part.startsWith('`') || !part.endsWith('`'))) {
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
        return boldParts.map((boldPart, index) => {
          if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
            const boldText = boldPart.slice(2, -2)
            return (
              <span 
                key={index}
                className="font-semibold text-white"
              >
                {boldText}
              </span>
            )
          }
          return boldPart
        })
      }
      return part
    }).flat()
    
    // URLの処理
    parts = parts.map(part => {
      if (typeof part === 'string' && (!part.startsWith('`') || !part.endsWith('`'))) {
        const urlParts = part.split(/(https?:\/\/(?:www\.)?[^\s<>"{}|\\^`\[\]]+)/gi)
        return urlParts.map((urlPart, index) => {
          if (urlPart.match(/^https?:\/\/(?:www\.)?[^\s<>"{}|\\^`\[\]]+$/i)) {
            return (
              <a
                key={index}
                href={urlPart}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(urlPart, '_blank')
                }}
              >
                {urlPart}
              </a>
            )
          }
          return urlPart
        })
      }
      return part
    }).flat()
    
    return parts.map((part, index) => {
      if (typeof part === 'string' && part.startsWith('`') && part.endsWith('`')) {
        const keyword = part.slice(1, -1)
        return (
          <span 
            key={index}
            className="bg-gray-600 px-2 py-1 rounded text-sm font-mono text-white font-semibold"
          >
            {keyword}
        </span>
        )
      }
      return part
    })
  }

  return (
    <div className="border border-[#5a5a5a] rounded-lg p-4">
      <div className="space-y-3">
        {renderStructuredContent(content)}
      </div>
    </div>
  )
}

// URL検出とリンク化のためのユーティリティ関数
const convertUrlsToLinks = (text: string): React.ReactNode[] => {
  // より包括的なURL正規表現（http/https、www、ドメイン、パス、クエリパラメータに対応）
  const urlRegex = /(https?:\/\/(?:www\.)?[^\s<>"{}|\\^`\[\]]+)/gi
  const parts = text.split(urlRegex)
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer break-all"
          onClick={(e) => {
            e.stopPropagation()
            window.open(part, '_blank')
          }}
        >
          {part}
        </a>
      )
    }
    return part
  })
}

export interface ChatMessageProps {
  id: string
  content: string
  role: 'user' | 'assistant'
  attachments?: Array<{
    id: string
    name: string
    type: 'image' | 'video' | 'audio' | 'document' | 'url'
    url?: string
    size?: number
    preview?: string
  }>
  files?: File[] // 新しいFileオブジェクトの配列
  images?: string[] // 生成された画像データの配列
  audioUrl?: string // TTS音声のURL
  audioData?: ArrayBuffer // TTS音声の生データ
  ttsInfo?: {
    provider?: string
    model?: string
    selectedModel?: string
    voice: string
    language: string
    style?: string
    text: string
  }
  isTyping?: boolean
  loadingState?: 'idle' | 'text' | 'media'
  isStreaming?: boolean // ストリーミング状態を追加
  useEnhancedPreview?: boolean // 拡張プレビューを使用するかどうか
  onEdit?: (messageId: string, newContent: string) => void // 編集コールバック
  onCancelEdit?: (messageId: string) => void // 編集キャンセルコールバック
  metadata?: {
    agentType?: string
    confidence?: number
    reasoning?: string
    executionTime?: number
    complexity?: string
    title?: string
  }
  isError?: boolean // エラーメッセージかどうかを示すフラグ
  isTTSLoading?: boolean // TTSローディング状態を示すフラグ
  audioEnabled?: boolean // Audio有効状態を示すフラグ
  isVideoLoading?: boolean // 動画生成ローディング状態を示すフラグ
  videoProgress?: number // 動画生成の進捗（0-100）
  videoUrl?: string // 生成された動画のURL
  videoDetails?: {
    duration: number
    aspectRatio: string
    quality: string
    provider?: string
    model?: string
    isSimulation?: boolean
  }
  // AI Elements support
  useAIElements?: boolean // AI Elementsを使用するかどうか
  sources?: Array<{
    id: string
    href: string
    title?: string
    description?: string
  }>
  tasks?: Array<{
    id: string
    title: string
    status: 'pending' | 'in_progress' | 'completed' | 'error'
    items?: Array<{
      id: string
      text: string
      status: 'pending' | 'in_progress' | 'completed' | 'error'
      file?: {
        name: string
        icon?: React.ReactNode
      }
    }>
  }>
  // InlineCitation support
  citations?: Array<{
    id: string
    text: string
    sources: Array<{
      id: string
      url: string
      title?: string
      description?: string
      quote?: string
    }>
  }>
  // Tool support
  tools?: Array<{
    id: string
    type: string
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
    input: any
    output?: any
    errorText?: string
  }>
  // WebPreview support
  webPreviews?: Array<{
    id: string
    url: string
    title?: string
    consoleLogs?: Array<{ level: 'log' | 'warn' | 'error'; message: string; timestamp: Date }>
  }>
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <Image className="w-4 h-4" />
    case 'video':
      return <Video className="w-4 h-4" />
    case 'audio':
      return <Music className="w-4 h-4" />
    case 'document':
      return <FileText className="w-4 h-4" />
    case 'url':
      return <Link className="w-4 h-4" />
    default:
      return <FileText className="w-4 h-4" />
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileTypeLabel = (type: string): string => {
  switch (type) {
    case 'image':
      return 'Image'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Audio'
    case 'document':
      return 'Document'
    case 'url':
      return 'URL'
    default:
      return 'File'
  }
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  content,
  role,
  attachments = [],
  files = [], // 新しいFileオブジェクトの配列
  images = [], // 生成された画像データの配列
  audioUrl,
  audioData,
  ttsInfo,
  isTyping = false,
  loadingState = 'idle',
  isStreaming = false, // ストリーミング状態を追加
  useEnhancedPreview = true, // デフォルトで拡張プレビューを使用
  onEdit,
  onCancelEdit,
  metadata,
  isError = false, // エラーメッセージかどうか
  isTTSLoading = false, // TTSローディング状態
  audioEnabled = false, // Audio有効状態
  isVideoLoading = false, // 動画生成ローディング状態
  videoProgress = 0, // 動画生成の進捗
  videoUrl, // 生成された動画のURL
  videoDetails, // 動画の詳細情報
  useAIElements = false, // AI Elementsを使用するかどうか
  sources = [], // ソース情報
  tasks = [], // タスク情報
  citations = [], // インライン引用情報
  tools = [], // ツール情報
  webPreviews = [] // Webプレビュー情報
}) => {
  const isUser = role === 'user'
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set())
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [isHovered, setIsHovered] = useState(false)
  
  // タイプライター効果用の状態
  const [displayedContent, setDisplayedContent] = useState(content)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  // メディアコンテンツがあるかどうかを判定
  const hasMediaContent = (attachments && attachments.length > 0) || 
                         (files && files.length > 0) || 
                         (images && images.length > 0)

  // タイプライター効果のアニメーション
  useEffect(() => {
    console.log('ChatMessage useEffect:', { 
      content: content?.substring(0, 50) + (content && content.length > 50 ? '...' : ''), 
      displayedContent: displayedContent?.substring(0, 50) + (displayedContent && displayedContent.length > 50 ? '...' : ''), 
      isUser, 
      role, 
      isStreaming 
    })
    
    // ストリーミング中はアニメーションを開始しない
    if (isStreaming) {
      setDisplayedContent(content)
      setIsAnimating(false)
      return
    }
    
    // コンテンツが変更された場合のみアニメーションを実行
    if (content !== displayedContent) {
      if (!isUser && content) {
        // 動画がある場合は即座に表示（タイプライター効果を適用しない）
        if (videoUrl) {
          setDisplayedContent(content)
          setIsAnimating(false)
        } else {
          // AIメッセージの場合、タイプライター効果を適用
          setIsAnimating(true)
          
          // 既存のアニメーションをクリア
          if (animationRef.current) {
            clearTimeout(animationRef.current)
          }

          // 新しいアニメーションを開始
          const animateText = (currentIndex: number) => {
            if (currentIndex <= content.length) {
              setDisplayedContent(content.substring(0, currentIndex))
              animationRef.current = setTimeout(() => {
                animateText(currentIndex + 1)
              }, 20) // 20ms間隔で文字を表示
            } else {
              setIsAnimating(false)
            }
          }

          animateText(0)
        }
      } else if (isUser) {
        // ユーザーメッセージは即座に表示
        setDisplayedContent(content)
        setIsAnimating(false)
      }
    }

    // クリーンアップ
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [content, isUser, isStreaming])

  const toggleImageExpansion = (attachmentId: string) => {
    const newExpanded = new Set(expandedImages)
    if (newExpanded.has(attachmentId)) {
      newExpanded.delete(attachmentId)
    } else {
      newExpanded.add(attachmentId)
    }
    setExpandedImages(newExpanded)
  }

  const toggleFileExpansion = (fileIndex: number) => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(fileIndex)) {
      newExpanded.delete(fileIndex)
    } else {
      newExpanded.add(fileIndex)
    }
    setExpandedFiles(newExpanded)
  }

  const handleFileAction = (attachment: any, action: 'view' | 'download' | 'open') => {
    switch (action) {
      case 'view':
        if (attachment.preview) {
          toggleImageExpansion(attachment.id)
        } else if (attachment.url) {
          window.open(attachment.url, '_blank')
        }
        break
      case 'download':
        if (attachment.url) {
          const link = document.createElement('a')
          link.href = attachment.url
          link.download = attachment.name
          link.click()
        }
        break
      case 'open':
        if (attachment.url) {
          window.open(attachment.url, '_blank')
        }
        break
    }
  }

  const handleTTSDownload = () => {
    if (audioUrl && ttsInfo) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const provider = ttsInfo.provider || 'unknown'
      const model = ttsInfo.model || 'unknown'
      const filename = `tts-${provider}-${model}-${ttsInfo.voice.toLowerCase()}-${timestamp}.wav`
      
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('TTS音声をダウンロードしました:', filename)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(content)
  }

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== content) {
      onEdit(id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(content)
    setIsEditing(false)
    onCancelEdit?.(id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      // コピー成功のフィードバックを追加できます
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // 空のコンテンツの場合は何も表示しない
  if (!content || 
      content.trim() === '' || 
      content.length === 0 || 
      content === undefined || 
      content === null || 
      typeof content !== 'string' ||
      content.replace(/\s/g, '').length === 0 ||
      content === 'Chat Response Generation' ||
      content === ' ' ||
      content === '\n' ||
      content === '\t' ||
      content === '{}' ||
      content === '[]' ||
      content === 'null' ||
      content === 'undefined' ||
      /^\s*$/.test(content) ||
      /^\s*\{\s*\}\s*$/.test(content) ||
      /^\s*\[\s*\]\s*$/.test(content) ||
      // 空のオブジェクトや配列の文字列表現もチェック
      content === '[object Object]' ||
      content === '[object Array]' ||
      // displayedContentも空の場合は表示しない
      (!displayedContent || 
       displayedContent.trim() === '' || 
       displayedContent.length === 0 ||
       displayedContent === '{}' ||
       displayedContent === '[]' ||
       displayedContent === 'null' ||
       displayedContent === 'undefined' ||
       displayedContent === '[object Object]' ||
       displayedContent === '[object Array]' ||
       /^\s*\{\s*\}\s*$/.test(displayedContent) ||
       /^\s*\[\s*\]\s*$/.test(displayedContent))) {
    return null
  }

  // 初期表示の処理
  if (displayedContent === '' && content) {
    setDisplayedContent(content)
  }

  // 表示するコンテンツがあるかチェック
  const hasDisplayContent = (displayedContent && displayedContent.trim() !== '') || (content && content.trim() !== '')
  
  if (!hasDisplayContent) {
    return null
  }

  return (
    <div className={cn(
      "flex gap-2",
      isUser ? "justify-center" : "justify-start"
    )}>
      <div className={cn(
        isUser ? "w-[95%] mx-auto" : "max-w-[95%]",
        isUser ? "text-left" : ""
      )}>
        <div 
          className={cn(
            "px-1 py-1 text-sm transition-all duration-0 relative rounded-lg",
            isUser 
              ? "bg-[#181818] text-white border-[0.5px] border-[#2B2B2B]" 
              : "text-foreground",
            isError && "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isEditing ? (
            <div className="space-y-1">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] resize-none text-sm bg-background text-foreground border-border"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Send
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "whitespace-pre-wrap",
              isUser ? "px-3 py-2" : "leading-relaxed [&>p]:mb-2 [&>p]:last:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>blockquote]:mb-2"
            )}>
              {isUser ? (
                convertUrlsToLinks(content)
              ) : (
                (displayedContent || content) ? (
                  <div className="ai-message-content prose prose-sm max-w-none dark:prose-invert">
                    {isTTSLoading && content === 'audio generating...' ? (
                      // TTSローディング状態の場合はShimmerTextを適用
                      <ShimmerText className="text-blue-500">
                        {displayedContent || content}
                      </ShimmerText>
                    ) : isVideoLoading && content === 'Video generating...' ? (
                      // 動画生成ローディング状態の場合はプログレスバーを表示
                      <div className="flex flex-col items-center space-y-4 p-6">
                        <div className="relative w-24 h-24">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 45}`}
                              strokeDashoffset={`${2 * Math.PI * 45 * (1 - (videoProgress || 0) / 100)}`}
                              className="transition-all duration-300 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-semibold text-white">
                              {Math.round(videoProgress || 0)}%
                            </span>
                          </div>
                        </div>
                        <ShimmerText className="text-green-500 text-center">
                          Video generating...
                        </ShimmerText>
                      </div>
                    ) : useAIElements ? (
                      // AI Elementsを使用する場合
                      <div>
                        <Response parseIncompleteMarkdown={isStreaming}>
                          {displayedContent || content}
                        </Response>
                        {/* InlineCitationは別途表示 */}
                        {citations && citations.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {citations.map((citation, index) => (
                              <InlineCitation key={citation.id}>
                                <InlineCitationText>{citation.text}</InlineCitationText>
                                <InlineCitationCard>
                                  <InlineCitationCardTrigger sources={citation.sources.map(s => s.url)} />
                                  <InlineCitationCardBody>
                                    <InlineCitationCarousel>
                                      <InlineCitationCarouselHeader>
                                        <InlineCitationCarouselIndex />
                                      </InlineCitationCarouselHeader>
                                      <InlineCitationCarouselContent>
                                        {citation.sources.map((source, sourceIndex) => (
                                          <InlineCitationCarouselItem key={source.id}>
                                            <InlineCitationSource
                                              title={source.title}
                                              url={source.url}
                                              description={source.description}
                                            />
                                            {source.quote && (
                                              <InlineCitationQuote>
                                                {source.quote}
                                              </InlineCitationQuote>
                                            )}
                                          </InlineCitationCarouselItem>
                                        ))}
                                      </InlineCitationCarouselContent>
                                    </InlineCitationCarousel>
                                  </InlineCitationCardBody>
                                </InlineCitationCard>
                              </InlineCitation>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : isStreaming ? (
                      // ストリーミング中は通常のテキスト表示
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {displayedContent || content}
                      </div>
                    ) : (
                                              // 構造化テキストの検出と適用
                        (() => {
                          const text = displayedContent || content
                          // 技術文書の特徴を検出（見出し、番号付きリスト、キーワードハイライト）
                          const hasStructuredFeatures = 
                            text.includes('#') || 
                            /\d+\.\s/.test(text) || 
                            text.includes('`') ||
                            text.includes('問題の原因') ||
                            text.includes('具体的には') ||
                            text.includes('ArmisSettings') ||
                            text.includes('useEffect') ||
                            text.includes('document.documentElement.classList.add') ||
                            text.includes('##') ||
                            text.includes('###') ||
                            text.includes('**') ||
                            text.includes('```') ||
                            /\n\d+\./.test(text) ||
                            /\n- /.test(text) ||
                            /\n• /.test(text)
                          
                          if (hasStructuredFeatures) {
                            return <StructuredTechnicalDocument content={text} />
                          } else {
                            // 通常のSplitTextアニメーション
                            return (
                              <SplitText 
                                delay={0.1}
                                stagger={0.01}
                                duration={0.3}
                                ease="easeOut"
                              >
                                {text}
                              </SplitText>
                            )
                          }
                        })()
                    )}
                  </div>
                ) : null
              )}
              {isStreaming && !hasMediaContent && (
                <JumpingDots className="mt-2" color="currentColor" />
              )}
            </div>
          )}
          
          {/* ホバー時に表示されるアクションボタン（編集モードでない場合） */}
          {!isEditing && !isUser && (
            <div 
              className={cn(
                "mt-2 flex items-center gap-1 transition-opacity duration-200",
                isHovered ? "opacity-100" : "opacity-0",
                "justify-start"
              )}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                title="コピー"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* ユーザーチャットバブルの外側に表示されるアクションボタン */}
        {!isEditing && isUser && (
          <div 
            className={cn(
              "mt-2 flex items-center gap-1 transition-opacity duration-200 justify-end",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title="コピー"
            >
              <Copy className="w-3 h-3" />
            </Button>
            {onEdit && (
              <Button
                onClick={handleEdit}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                title="メッセージを編集"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* 生成された画像の表示 */}
        {images && images.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground mb-2">
              Generated Image
            </div>
            <div className="grid grid-cols-1 gap-3">
              {images.map((imageData: string, index: number) => (
                <div key={`generated-image-${index}`} className="border rounded-lg overflow-hidden">
                  <div className="relative group">
                    <img
                      src={`data:image/png;base64,${imageData}`}
                      alt={`Generated image ${index + 1}`}
                      className={cn(
                        "w-full object-cover transition-all duration-200 cursor-pointer",
                        expandedImages.has(`generated-${index}`) 
                          ? "max-h-96" 
                          : "max-h-64"
                      )}
                      onClick={() => toggleImageExpansion(`generated-${index}`)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/90 text-black hover:bg-white"
                          onClick={() => toggleImageExpansion(`generated-${index}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {expandedImages.has(`generated-${index}`) ? 'Shrink' : 'Expand'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/90 text-black hover:bg-white"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = `data:image/png;base64,${imageData}`
                            link.download = `generated-image-${index + 1}.png`
                            link.click()
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TTSローディング状態の表示（Audio無効時のみ） */}
        {isTTSLoading && !audioEnabled && (
          <div className="mt-3 p-3 bg-black dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-gray-300 dark:text-gray-300" />
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* TTS音声の表示 */}
        {audioUrl && ttsInfo && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  TTS音声 ({ttsInfo.voice}, {ttsInfo.language})
                </span>
              </div>
              <Button
                onClick={handleTTSDownload}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                title="音声をダウンロード"
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
            <audio controls className="w-full" preload="none" autoPlay={false}>
              <source src={audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* 添付ファイルの表示 */}
        {attachments && attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground mb-2">
              📎 Attachments ({attachments.length})
            </div>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {attachment.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleFileAction(attachment, 'view')}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      title="プレビュー"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleFileAction(attachment, 'download')}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      title="ダウンロード"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ファイルの表示 */}
        {files && files.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground mb-2">
              📁 Files ({files.length})
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => toggleFileExpansion(index)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      title={expandedFiles.has(index) ? "縮小" : "拡大"}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => {
                        const url = URL.createObjectURL(file)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = file.name
                        link.click()
                        URL.revokeObjectURL(url)
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      title="ダウンロード"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Elements - Sources */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3">
            <Sources>
              <SourcesTrigger count={sources.length} />
              <SourcesContent>
                {sources.map((source) => (
                  <Source
                    key={source.id}
                    href={source.href}
                    title={source.title}
                    description={source.description}
                  />
                ))}
              </SourcesContent>
            </Sources>
          </div>
        )}

        {/* 動画生成結果の表示 */}
        {!isUser && videoUrl && (
          // 動画表示の条件を満たしている
          <div className="mt-3">
            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg group">
              {/* ホバー時に表示されるダウンロードボタン */}
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = videoUrl
                    link.download = `generated-video-${Date.now()}.mp4`
                    link.click()
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm text-gray-800 border-white/90 hover:bg-white rounded-lg px-3 py-1.5 h-8"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              {/* shadcn/ui Video Player */}
              <VideoPlayer className="overflow-hidden rounded-xl">
                <VideoPlayerContent
                  crossOrigin=""
                  muted
                  preload="auto"
                  slot="media"
                  src={videoUrl}
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%231f2937'/%3E%3Ccircle cx='200' cy='112.5' r='40' fill='%236b7280' opacity='0.5'/%3E%3Cpolygon points='190,100 190,125 210,112.5' fill='white'/%3E%3C/svg%3E"
                />
                <VideoPlayerControlBar>
                  <VideoPlayerPlayButton />
                  <VideoPlayerSeekBackwardButton />
                  <VideoPlayerSeekForwardButton />
                  <VideoPlayerTimeRange />
                  <VideoPlayerTimeDisplay showDuration />
                  <VideoPlayerMuteButton />
                  <VideoPlayerVolumeRange />
                </VideoPlayerControlBar>
              </VideoPlayer>
            </div>
          </div>
        )}

        {/* AI Elements - Tasks */}
        {!isUser && tasks && tasks.length > 0 && (
          <div className="mt-3 space-y-2">
            {tasks.map((task) => (
              <Task key={task.id} status={task.status} defaultOpen={task.status === 'in_progress'}>
                <TaskTrigger title={task.title} status={task.status} />
                <TaskContent>
                  {task.items?.map((item) => (
                    <TaskItem key={item.id} status={item.status}>
                      {item.file ? (
                        <>
                          {item.text}
                          <TaskItemFile icon={item.file.icon}>
                            {item.file.name}
                          </TaskItemFile>
                        </>
                      ) : (
                        item.text
                      )}
                    </TaskItem>
                  ))}
                </TaskContent>
              </Task>
            ))}
          </div>
        )}

        {/* AI Elements - Tools */}
        {!isUser && tools && tools.length > 0 && (
          <div className="mt-3 space-y-2">
            {tools.map((tool) => (
              <Tool key={tool.id} defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type={tool.type} state={tool.state} />
                <ToolContent>
                  <ToolInput input={tool.input} />
                  <ToolOutput 
                    output={tool.output} 
                    errorText={tool.errorText} 
                  />
                </ToolContent>
              </Tool>
            ))}
          </div>
        )}

        {/* AI Elements - WebPreviews */}
        {!isUser && webPreviews && webPreviews.length > 0 && (
          <div className="mt-3 space-y-4">
            {webPreviews.map((preview) => (
              <div key={preview.id} className="border rounded-lg overflow-hidden">
                <div className="p-2 bg-muted/50 border-b">
                  <h4 className="text-sm font-medium">{preview.title || 'Web Preview'}</h4>
                </div>
                <div className="h-64">
                  <WebPreview defaultUrl={preview.url}>
                    <WebPreviewNavigation>
                      <WebPreviewUrl />
                    </WebPreviewNavigation>
                    <WebPreviewBody src={preview.url} />
                    {preview.consoleLogs && preview.consoleLogs.length > 0 && (
                      <WebPreviewConsole logs={preview.consoleLogs} />
                    )}
                  </WebPreview>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metadata Display */}
        {metadata && !isUser && metadata.agentType !== 'llm-manager' && (
          <div className="mt-3 p-2 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {metadata.agentType && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  {metadata.agentType}
                </span>
              )}
              {metadata.executionTime && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                  {metadata.executionTime}ms
                </span>
              )}
              {metadata.complexity && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                  {metadata.complexity}
                </span>
              )}
            </div>
            {metadata.reasoning && (
              <div className="mt-1 text-xs text-muted-foreground">
                {metadata.reasoning}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
