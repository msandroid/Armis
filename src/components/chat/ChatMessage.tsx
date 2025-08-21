import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Image, Video, Music, Link, ExternalLink, Download, Eye, Edit2, Check, X } from 'lucide-react'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { EnhancedFilePreview } from './EnhancedFilePreview'

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
  }
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
  isTyping = false,
  loadingState = 'idle',
  isStreaming = false, // ストリーミング状態を追加
  useEnhancedPreview = true, // デフォルトで拡張プレビューを使用
  onEdit,
  onCancelEdit,
  metadata,
}) => {
  const isUser = role === 'user'
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set())
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)

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

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%]"
      )}>
        <div className={cn(
          "px-3 py-2 text-sm transition-all duration-200",
          isUser 
            ? "bg-primary text-primary-foreground rounded-lg" 
            : "text-foreground"
        )}>
          {isEditing ? (
            <div className="space-y-2">
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
                  className="h-6 px-2 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {content}
              {(isTyping || isStreaming) && (
                <JumpingDots className="mt-2" color={isUser ? "white" : "currentColor"} />
              )}
            </div>
          )}
          
          {/* 編集ボタン（ユーザーメッセージのみ、編集モードでない場合） */}
          {isUser && !isEditing && onEdit && (
            <div className="mt-2 flex justify-end">
              <Button
                onClick={handleEdit}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/20"
                title="メッセージを編集"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Fileオブジェクトのプレビュー */}
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, index) => (
              <div key={`file-${index}`} className="flex flex-wrap gap-2">
                {useEnhancedPreview ? (
                  <EnhancedFilePreview
                    file={file}
                    expanded={expandedFiles.has(index)}
                    onExpand={() => toggleFileExpansion(index)}
                    className={cn(
                      isUser 
                        ? "border-primary/20 bg-primary/5" 
                        : "border-border bg-background"
                    )}
                  />
                ) : (
                  <EnhancedFilePreview file={file} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 既存のattachmentオブジェクトのプレビュー */}
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  "border rounded-lg overflow-hidden",
                  isUser 
                    ? "border-primary/20 bg-primary/5" 
                    : "border-border bg-background"
                )}
              >
                {/* Image Preview */}
                {attachment.preview && attachment.type === 'image' && (
                  <div className="relative group">
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className={cn(
                        "w-full object-cover transition-all duration-200 cursor-pointer",
                        expandedImages.has(attachment.id) 
                          ? "max-h-96" 
                          : "max-h-32"
                      )}
                      onClick={() => toggleImageExpansion(attachment.id)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 text-black hover:bg-white"
                        onClick={() => toggleImageExpansion(attachment.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {expandedImages.has(attachment.id) ? 'Shrink' : 'Expand'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-accent rounded-lg">
                      {getFileIcon(attachment.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getFileTypeLabel(attachment.type)}</span>
                        {attachment.size && attachment.size > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(attachment.size)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {attachment.type === 'url' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileAction(attachment, 'open')}
                          className="h-8 w-8 p-0"
                          title="Open URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {attachment.type !== 'url' && attachment.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileAction(attachment, 'download')}
                          className="h-8 w-8 p-0"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {attachment.preview && attachment.type === 'image' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileAction(attachment, 'view')}
                          className="h-8 w-8 p-0"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metadata Display */}
        {metadata && !isUser && (
          <div className="mt-3 p-2 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {metadata.agentType && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  {metadata.agentType}
                </span>
              )}
              {metadata.confidence && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                  {Math.round(metadata.confidence * 100)}% confidence
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
