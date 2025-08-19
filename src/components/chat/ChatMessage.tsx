import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Image, Video, Music, Link, ExternalLink, Download, Eye } from 'lucide-react'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { Button } from '@/components/ui/button'
import { FilePreview } from './file-preview'

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
  content,
  role,
  attachments = [],
  files = [], // 新しいFileオブジェクトの配列
  isTyping = false,
  loadingState = 'idle',
  isStreaming = false, // ストリーミング状態を追加
}) => {
  const isUser = role === 'user'
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set())

  const toggleImageExpansion = (attachmentId: string) => {
    const newExpanded = new Set(expandedImages)
    if (newExpanded.has(attachmentId)) {
      newExpanded.delete(attachmentId)
    } else {
      newExpanded.add(attachmentId)
    }
    setExpandedImages(newExpanded)
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
          <div className="whitespace-pre-wrap">
            {content}
            {(isTyping || isStreaming) && (
              <JumpingDots className="mt-2" color={isUser ? "white" : "currentColor"} />
            )}
          </div>
        </div>

        {/* Fileオブジェクトのプレビュー */}
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, index) => (
              <div key={`file-${index}`} className="flex flex-wrap gap-2">
                <FilePreview file={file} />
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
      </div>
    </div>
  )
}
