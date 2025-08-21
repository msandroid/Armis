import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Upload, X, FileText, Image, Video, Music, Link, AlertCircle, CheckCircle, FileWarning } from 'lucide-react'
import { EnhancedFilePreview } from './EnhancedFilePreview'

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
  useEnhancedPreview?: boolean // 拡張プレビューを使用するかどうか
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES = 10

const getFileType = (file: File): FileAttachment['type'] => {
  // MIMEタイプベースの判定
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  
  // 拡張子ベースの判定（MIMEタイプが不明な場合）
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  // 動画ファイルの拡張子
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'm4v', '3gp', 'ogv', 'flv', 'f4v', 'f4p', 'f4a', 'f4b']
  if (videoExtensions.includes(extension || '')) return 'video'
  
  // 音声ファイルの拡張子
  const audioExtensions = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'wma', 'flac', 'opus']
  if (audioExtensions.includes(extension || '')) return 'audio'
  
  // 画像ファイルの拡張子
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']
  if (imageExtensions.includes(extension || '')) return 'image'
  
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

// 動画ファイルのMIMEタイプを修正する関数
const getCorrectedVideoMimeType = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  // 拡張子ベースでMIMEタイプを決定
  const mimeTypeMap: Record<string, string> = {
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    'm4v': 'video/mp4',
    '3gp': 'video/3gpp',
    'ogv': 'video/ogg',
    'flv': 'video/x-flv',
    'f4v': 'video/mp4',
    'f4p': 'video/mp4',
    'f4a': 'audio/mp4',
    'f4b': 'audio/mp4'
  }
  
  if (extension && mimeTypeMap[extension]) {
    return mimeTypeMap[extension]
  }
  
  // 既存のMIMEタイプが有効な場合はそのまま使用
  if (file.type && file.type.startsWith('video/')) {
    return file.type
  }
  
  // デフォルトはmp4
  return 'video/mp4'
}

const validateFile = (file: File, maxFileSize: number): { valid: boolean; error?: string } => {
  console.log('=== ファイル検証開始 ===')
  console.log('ファイル名:', file.name)
  console.log('MIMEタイプ:', file.type)
  console.log('ファイルサイズ:', (file.size / 1024 / 1024).toFixed(2) + 'MB')
  console.log('最大ファイルサイズ:', (maxFileSize / 1024 / 1024).toFixed(2) + 'MB')
  
  if (file.size > maxFileSize) {
    console.error('ファイルサイズが制限を超えています')
    return { valid: false, error: `File size too large (max ${formatFileSize(maxFileSize)})` }
  }
  
  // 動画ファイルの特別処理
  const isVideoFile = file.type.startsWith('video/') || 
    ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv', '.flv']
    .some(ext => file.name.toLowerCase().endsWith(ext))
  
  if (isVideoFile) {
    console.log('動画ファイルとして認識されました')
    
    // 動画ファイルの場合はMIMEタイプを柔軟に処理
    const videoMimeTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
      'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-matroska',
      'video/3gpp', 'video/ogg', 'video/x-flv'
    ]
    
    // MIMEタイプが空または不明な場合でも、拡張子で判断
    if (!file.type || file.type === 'application/octet-stream') {
      console.log('MIMEタイプが不明ですが、拡張子で動画ファイルとして処理します')
      return { valid: true }
    }
    
    if (videoMimeTypes.includes(file.type)) {
      console.log('動画ファイルのMIMEタイプが有効です')
      return { valid: true }
    }
    
    console.warn('動画ファイルのMIMEタイプが認識されませんが、拡張子で処理します')
    return { valid: true }
  }
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
    'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg',
    'application/pdf', 'text/plain', 'text/markdown', 'application/json'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    console.error('サポートされていないファイル形式:', file.type)
    return { valid: false, error: 'Unsupported file format' }
  }
  
  console.log('ファイル検証が成功しました')
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
  useEnhancedPreview = true, // デフォルトで拡張プレビューを使用
}) => {
  const [dragReject, setDragReject] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('=== ファイルドロップ処理開始 ===')
    console.log('受け入れられたファイル数:', acceptedFiles.length)
    
    if (attachments.length + acceptedFiles.length > maxFiles) {
      console.error('ファイル数が制限を超えています')
      alert(`Maximum ${maxFiles} files can be uploaded`)
      return
    }

    const newAttachments: FileAttachment[] = []
    
    for (const file of acceptedFiles) {
      console.log(`\n--- ファイル処理: ${file.name} ---`)
      const validation = validateFile(file, maxFileSize)
      
      if (validation.valid) {
        console.log('ファイル検証成功、プレビュー生成中...')
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
        console.log('ファイル添付オブジェクト作成完了:', attachment)
        newAttachments.push(attachment)
      } else {
        console.error('ファイル検証失敗:', validation.error)
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
    
    if (newAttachments.length > 0) {
      onFilesAdded(newAttachments)
    }
  }, [attachments.length, maxFileSize, maxFiles, onFilesAdded])

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    console.error('=== ファイルドロップ拒否 ===')
    console.error('拒否されたファイル数:', rejectedFiles.length)
    
    rejectedFiles.forEach((rejection) => {
      console.error('拒否されたファイル:', {
        name: rejection.file.name,
        size: rejection.file.size,
        type: rejection.file.type,
        errors: rejection.errors
      })
    })
    
    setDragReject(true)
    setTimeout(() => setDragReject(false), 3000)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv', '.flv'],
      'audio/*': ['.mp3', '.wav', '.aac', '.ogg', '.m4a', '.wma', '.flac'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt', '.md', '.json', '.csv'],
      'application/json': ['.json']
    },
    maxSize: maxFileSize,
    multiple: true
  })

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : dragReject
            ? "border-red-500 bg-red-50"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isDragActive
              ? "ファイルをここにドロップ"
              : dragReject
              ? "ファイルが拒否されました"
              : "ファイルをドラッグ&ドロップまたはクリックして選択"}
          </p>
          <p className="text-xs text-muted-foreground">
            画像、動画、音声、PDF、テキストファイルをサポート
          </p>
          <p className="text-xs text-muted-foreground">
            最大 {formatFileSize(maxFileSize)} / {maxFiles} ファイルまで
          </p>
        </div>
      </div>

      {/* File Attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">添付ファイル ({attachments.length})</h3>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  attachment.status === 'error'
                    ? "border-red-200 bg-red-50"
                    : "border-border bg-background"
                )}
              >
                <div className="flex items-center space-x-3">
                  {attachment.status === 'error' ? (
                    <FileWarning className="h-5 w-5 text-red-500" />
                  ) : attachment.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  )}
                  
                  {getFileIcon(attachment.type)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                    {attachment.error && (
                      <p className="text-xs text-red-500">{attachment.error}</p>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileRemoved(attachment.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Preview */}
      {useEnhancedPreview && attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">プレビュー</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments
              .filter(attachment => attachment.status === 'success')
              .map((attachment) => (
                <EnhancedFilePreview
                  key={attachment.id}
                  file={attachment.file}
                  onRemove={() => onFileRemoved(attachment.id)}
                  expanded={false}
                  className="w-full"
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
