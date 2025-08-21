"use client"

import React, { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileIcon, 
  X, 
  FileText, 
  Image, 
  Code, 
  FileVideo, 
  FileAudio, 
  Archive, 
  FileText as FilePdf, 
  Eye, 
  Download, 
  ExternalLink,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AudioTranscriptionButton } from './AudioTranscriptionButton'
import { GeminiFileService } from '@/services/llm/gemini-file-service'

interface EnhancedFilePreviewProps {
  file: File
  onRemove?: () => void
  showPreview?: boolean
  expanded?: boolean
  onExpand?: () => void
  className?: string
  googleService?: GeminiFileService
  onTranscriptionComplete?: (text: string) => void
}

export const EnhancedFilePreview: React.FC<EnhancedFilePreviewProps> = ({
  file,
  onRemove,
  showPreview = true,
  expanded = false,
  onExpand,
  className = "",
  googleService,
  onTranscriptionComplete
}) => {
  const [fileUrl, setFileUrl] = useState<string>("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const createFileUrl = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // 動画ファイルの場合は特別な処理
        if (getFileType() === "video") {
          // 動画ファイルのMIMEタイプを確認・修正
          const correctedMimeType = getCorrectedMimeType(file)
          console.log('動画ファイル処理:', {
            name: file.name,
            originalType: file.type,
            correctedType: correctedMimeType
          })
          
          // 新しいBlobを作成してMIMEタイプを修正
          const correctedBlob = new Blob([file], { type: correctedMimeType })
          const url = URL.createObjectURL(correctedBlob)
          setFileUrl(url)
        } else {
          // その他のファイルは通常通り処理
          const url = URL.createObjectURL(file)
          setFileUrl(url)
        }
        
        setIsLoading(false)
      } catch (err) {
        console.error('ファイルURL作成エラー:', err)
        setError('ファイルの読み込みに失敗しました')
        setIsLoading(false)
      }
    }

    createFileUrl()
    
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [file])

  // 動画ファイルのMIMEタイプを修正する関数
  const getCorrectedMimeType = (file: File): string => {
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

  const getFileType = () => {
    if (file.type.startsWith("image/")) return "image"
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) return "pdf"
    if (file.type.startsWith("text/") || 
        [".txt", ".md", ".json", ".js", ".ts", ".jsx", ".tsx", ".css", ".html", ".xml", ".csv", ".log"]
        .some(ext => file.name.endsWith(ext))) return "text"
    if (file.type.startsWith("video/")) return "video"
    if (file.type.startsWith("audio/")) return "audio"
    if (file.type.includes("zip") || file.type.includes("rar") || file.type.includes("7z") ||
        [".zip", ".rar", ".7z", ".tar", ".gz"].some(ext => file.name.endsWith(ext))) return "archive"
    
    // 拡張子ベースで動画ファイルを判定
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'm4v', '3gp', 'ogv', 'flv', 'f4v', 'f4p', 'f4a', 'f4b']
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension && videoExtensions.includes(extension)) {
      return "video"
    }
    
    return "generic"
  }

  const getFileIcon = () => {
    const fileType = getFileType()
    switch (fileType) {
      case "image":
        return <Image className="h-5 w-5 text-muted-foreground" />
      case "pdf":
        return <FilePdf className="h-5 w-5 text-muted-foreground" />
      case "text":
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (['js', 'ts', 'jsx', 'tsx', 'html', 'xml', 'css'].includes(ext || '')) {
          return <Code className="h-5 w-5 text-muted-foreground" />
        }
        return <FileText className="h-5 w-5 text-muted-foreground" />
      case "video":
        return <FileVideo className="h-5 w-5 text-muted-foreground" />
      case "audio":
        return <FileAudio className="h-5 w-5 text-muted-foreground" />
      case "archive":
        return <Archive className="h-5 w-5 text-muted-foreground" />
      default:
        return <FileIcon className="h-5 w-5 text-muted-foreground" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank')
  }

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">読み込み中...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center gap-2 p-4 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )
    }

    const fileType = getFileType()

    switch (fileType) {
      case "image":
        return (
          <div className="space-y-2">
            <img
              src={fileUrl}
              alt={file.name}
              className={cn(
                "w-full object-contain rounded",
                expanded ? "max-h-96" : "max-h-32"
              )}
              onError={() => setError('画像の読み込みに失敗しました')}
            />
            {expanded && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )

      case "pdf":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInNewTab}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-6 w-6 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
            {expanded && (
              <iframe
                ref={iframeRef}
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-64 border rounded"
                title={file.name}
                onError={() => setError('PDFの読み込みに失敗しました')}
              />
            )}
          </div>
        )

      case "video":
        return (
          <div className="space-y-2">
            <video
              ref={videoRef}
              className={cn(
                "w-full object-contain rounded",
                expanded ? "max-h-64" : "max-h-20"
              )}
              controls={expanded}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => {
                console.log('動画ファイル読み込み成功:', file.name)
                setError(null)
              }}
              onError={(e) => {
                console.error('動画ファイル読み込みエラー:', e)
                setError('動画の読み込みに失敗しました。ファイル形式を確認してください。')
              }}
            >
              <source src={fileUrl} type={getCorrectedMimeType(file)} />
              <source src={fileUrl} type="video/mp4" />
              <source src={fileUrl} type="video/webm" />
              Your browser does not support the video tag.
            </video>
            {expanded && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVideoPlayback}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? '停止' : '再生'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20"
                  aria-label="音量調整"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )

      case "text":
        return <TextFileContent file={file} />

      case "audio":
        return (
          <div className="space-y-4">
            <audio
              src={fileUrl}
              controls
              className="w-full"
              onError={() => setError('音声の読み込みに失敗しました')}
            />
            {expanded && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-6 w-6 p-0"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    音声ファイル
                  </span>
                </div>
                {googleService && onTranscriptionComplete && (
                  <AudioTranscriptionButton
                    audioFile={file}
                    googleService={googleService}
                    onTranscriptionComplete={onTranscriptionComplete}
                  />
                )}
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-6 w-6 p-0"
            >
              <Download className="h-3 w-3" />
            </Button>
            <span className="text-sm text-muted-foreground">
              プレビューは利用できません
            </span>
          </div>
        )
    }
  }

  return (
    <motion.div
      className={cn(
        "border rounded-lg overflow-hidden",
        expanded ? "p-4" : "p-2",
        className
      )}
      layout
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
    >
      <div className="flex items-center space-x-2 mb-2">
        {getFileIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        {onExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="h-6 w-6 p-0"
          >
            {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {showPreview && renderPreviewContent()}
    </motion.div>
  )
}

// テキストファイルの内容を表示するコンポーネント
const TextFileContent: React.FC<{ file: File }> = ({ file }) => {
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setContent(text)
      setLoading(false)
    }
    reader.onerror = () => {
      setLoading(false)
    }
    reader.readAsText(file)
  }, [file])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="max-h-32 overflow-y-auto">
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  )
}
