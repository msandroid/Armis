import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Upload, X, FileText, Image, Video, Music, Link, AlertCircle, CheckCircle, FileWarning } from 'lucide-react'

export interface FileAttachment {
  id: string
  file: File
  type: 'image' | 'video' | 'audio' | 'document' | 'url'
  name: string
  size: number
  url?: string
  preview?: string
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface FileDropZoneProps {
  onFilesAdded: (files: FileAttachment[]) => void
  onFileRemoved: (fileId: string) => void
  attachments: FileAttachment[]
  className?: string
  maxFileSize?: number // in bytes
  maxFiles?: number
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES = 10

const getFileType = (file: File): FileAttachment['type'] => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'document'
}

const getFileIcon = (type: FileAttachment['type']) => {
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

const validateFile = (file: File, maxFileSize: number): { valid: boolean; error?: string } => {
  if (file.size > maxFileSize) {
    return { valid: false, error: `File size too large (max ${formatFileSize(maxFileSize)})` }
  }
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
    'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg',
    'application/pdf', 'text/plain', 'text/markdown', 'application/json'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported file format' }
  }
  
  return { valid: true }
}

const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      resolve('')
    }
  })
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesAdded,
  onFileRemoved,
  attachments,
  className,
  maxFileSize = MAX_FILE_SIZE,
  maxFiles = MAX_FILES,
}) => {
  const [dragReject, setDragReject] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (attachments.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files can be uploaded`)
      return
    }

    const newAttachments: FileAttachment[] = []
    
    for (const file of acceptedFiles) {
      const validation = validateFile(file, maxFileSize)
      
      if (validation.valid) {
        const preview = await createFilePreview(file)
        const attachment: FileAttachment = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: getFileType(file),
          name: file.name,
          size: file.size,
          preview,
          status: 'success',
        }
        newAttachments.push(attachment)
      } else {
        const attachment: FileAttachment = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: getFileType(file),
          name: file.name,
          size: file.size,
          status: 'error',
          error: validation.error,
        }
        newAttachments.push(attachment)
      }
    }
    
    onFilesAdded(newAttachments)
  }, [onFilesAdded, attachments.length, maxFiles, maxFileSize])

  const onDropRejected = useCallback(() => {
    setDragReject(true)
    setTimeout(() => setDragReject(false), 2000)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.aac', '.ogg'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md', '.json'],
    },
    multiple: true,
    maxSize: maxFileSize,
  })

  const handleUrlInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const url = event.currentTarget.value.trim()
      if (url) {
        try {
          new URL(url) // Validate URL
          const urlAttachment: FileAttachment = {
            id: Math.random().toString(36).substr(2, 9),
            file: new File([], 'url'),
            type: 'url',
            name: url,
            size: 0,
            url,
            status: 'success',
          }
          onFilesAdded([urlAttachment])
          event.currentTarget.value = ''
        } catch {
          alert('Please enter a valid URL')
        }
      }
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Limits Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileWarning className="w-3 h-3" />
        <span>Maximum {maxFiles} files, {formatFileSize(maxFileSize)} each</span>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Add URL</label>
        <input
          type="url"
          placeholder="Enter URL and press Enter"
          className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          onKeyDown={handleUrlInput}
        />
      </div>

      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-all duration-200 rounded-lg p-6 text-center",
          isDragActive
            ? "border-primary bg-primary/5 scale-105"
            : dragReject
            ? "border-destructive bg-destructive/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <Upload className={cn(
            "w-8 h-8 mx-auto",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )} />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragActive
                ? "Drop files here"
                : dragReject
                ? "Files rejected"
                : "Drag & drop files or click to select"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: Images, Videos, Audio, PDF, Text
            </p>
          </div>
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Attachments ({attachments.length})</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => attachments.forEach(att => onFileRemoved(att.id))}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Remove All
            </Button>
          </div>
          
          <div className="grid gap-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  attachment.status === 'error'
                    ? "border-destructive bg-destructive/5"
                    : "border-border bg-background hover:bg-accent/50"
                )}
              >
                {/* File Preview */}
                {attachment.preview && attachment.type === 'image' && (
                  <div className="flex-shrink-0">
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  </div>
                )}
                
                {/* File Icon */}
                {!attachment.preview && (
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-accent rounded border">
                    {getFileIcon(attachment.type)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {attachment.name}
                    </p>
                    {attachment.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {attachment.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>•</span>
                    <span className="capitalize">{attachment.type}</span>
                  </div>
                  
                  {attachment.error && (
                    <p className="text-xs text-destructive mt-1">{attachment.error}</p>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileRemoved(attachment.id)}
                  className="flex-shrink-0 h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
