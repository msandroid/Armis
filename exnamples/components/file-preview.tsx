"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Maximize2,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react"
import { FileIcon } from "@/components/file-icons"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

interface FilePreviewProps {
  filePath: string
  fileName: string
  fileSize?: number
  lastModified?: Date
  onClose?: () => void
  className?: string
}

interface FileInfo {
  name: string
  path: string
  type: 'file' | 'folder'
  size: number
  lastModified: Date
  content?: string
  language?: string
  mimeType?: string
}

export function FilePreview({ 
  filePath, 
  fileName, 
  fileSize, 
  lastModified, 
  onClose,
  className 
}: FilePreviewProps) {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioVolume, setAudioVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ファイル情報の取得
  useEffect(() => {
    if (filePath) {
      loadFileInfo()
    }
  }, [filePath])

  const loadFileInfo = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', filePath })
      })
      
      if (!response.ok) {
        throw new Error('Failed to load file')
      }
      
      const data = await response.json()
      setFileInfo(data.file)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // ファイルタイプの判定
  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    if (!ext) return 'unknown'
    
    const typeMap: Record<string, string> = {
      // 画像
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 
      'svg': 'image', 'webp': 'image', 'bmp': 'image', 'ico': 'image',
      
      // 動画
      'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video',
      'webm': 'video', 'wmv': 'video', 'flv': 'video',
      
      // 音声
      'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'ogg': 'audio',
      'aac': 'audio', 'm4a': 'audio', 'wma': 'audio',
      
      // テキスト・コード
      'txt': 'text', 'md': 'text', 'json': 'code', 'js': 'code', 'ts': 'code',
      'tsx': 'code', 'jsx': 'code', 'html': 'code', 'css': 'code', 'scss': 'code',
      'py': 'code', 'java': 'code', 'cpp': 'code', 'c': 'code', 'cs': 'code',
      'php': 'code', 'rb': 'code', 'go': 'code', 'rs': 'code', 'sql': 'code',
      'xml': 'code', 'yaml': 'code', 'yml': 'yaml', 'toml': 'code',
      
      // アーカイブ
      'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive',
      'gz': 'archive', 'bz2': 'archive',
      
      // PDF
      'pdf': 'pdf',
      
      // Office
      'doc': 'document', 'docx': 'document', 'xls': 'document', 'xlsx': 'document',
      'ppt': 'document', 'pptx': 'document'
    }
    
    return typeMap[ext] || 'unknown'
  }

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // 言語の取得（現在は未使用、将来の機能拡張用に保持）
  // const getLanguage = (fileName: string): string => {
  //   const ext = fileName.split('.').pop()?.toLowerCase()
  //   const languageMap: Record<string, string> = {
  //     'js': 'javascript',
  //     'jsx': 'jsx',
  //     'ts': 'typescript',
  //     'tsx': 'tsx',
  //     'html': 'html',
  //     'css': 'css',
  //     'scss': 'scss',
  //     'json': 'json',
  //     'md': 'markdown',
  //     'py': 'python',
  //     'java': 'java',
  //     'cpp': 'cpp',
  //     'c': 'c',
  //     'cs': 'csharp',
  //     'php': 'php',
  //     'rb': 'ruby',
  //     'go': 'go',
  //     'rs': 'rust',
  //     'sql': 'sql',
  //     'xml': 'xml',
  //     'yaml': 'yaml',
  //     'yml': 'yaml'
  //   }
  //   return languageMap[ext!] || 'text'
  // }

  // ファイルアイコンの取得（Material Icons使用）
  const getFileIcon = (fileName: string) => {
    return <FileIcon fileName={fileName} fileType="file" size="medium" />
  }

  // ダウンロード
  const handleDownload = () => {
    if (!fileInfo) return
    
    const link = document.createElement('a')
    link.href = `/api/files/download?path=${encodeURIComponent(fileInfo.path)}`
    link.download = fileInfo.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 動画再生制御
  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  // 音声再生制御
  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsAudioPlaying(!isAudioPlaying)
    }
  }

  // 音量制御
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // プレビューコンテンツのレンダリング
  const renderPreviewContent = () => {
    if (!fileInfo) return null
    
    const fileType = getFileType(fileInfo.name)
    
    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center">
            <img
              src={`/api/files/content?path=${encodeURIComponent(fileInfo.path)}`}
              alt={fileInfo.name}
              className="max-w-full max-h-96 object-contain rounded"
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setError('Failed to load image')}
            />
          </div>
        )
      
      case 'video':
        return (
          <div className="space-y-4">
            <video
              ref={videoRef}
              className="w-full max-h-96 rounded"
              controls
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            >
              <source src={`/api/files/content?path=${encodeURIComponent(fileInfo.path)}`} />
              Your browser does not support the video tag.
            </video>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleVideoPlayback}
              >
                {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isVideoPlaying ? 'Pause' : 'Play'}
              </Button>
            </div>
          </div>
        )
      
      case 'audio':
        return (
          <div className="space-y-4">
            <audio
              ref={audioRef}
              onPlay={() => setIsAudioPlaying(true)}
              onPause={() => setIsAudioPlaying(false)}
              onVolumeChange={(e) => setAudioVolume((e.target as HTMLAudioElement).volume)}
            >
              <source src={`/api/files/content?path=${encodeURIComponent(fileInfo.path)}`} />
              Your browser does not support the audio tag.
            </audio>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAudioPlayback}
              >
                {isAudioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isAudioPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )
      
      case 'code':
      case 'text':
        return (
          <div className="max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm p-4 bg-gray-50 rounded border overflow-x-auto font-mono">
              {fileInfo.content || ''}
            </pre>
          </div>
        )
      
      case 'pdf':
        return (
          <div className="text-center py-8">
            <div className="mb-4">
              <FileIcon fileName="document.pdf" fileType="file" size="large" />
            </div>
            <p className="text-gray-600 mb-4">PDF Preview</p>
            <p className="text-sm text-gray-500 mb-4">
              PDF files require a separate viewer
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        )
      
      case 'archive':
        return (
          <div className="text-center py-8">
            <div className="mb-4">
              <FileIcon fileName="archive.zip" fileType="file" size="large" />
            </div>
            <p className="text-gray-600 mb-4">Archive File</p>
            <p className="text-sm text-gray-500 mb-4">
              Archive files cannot be previewed directly
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Archive
            </Button>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8">
            <div className="mb-4">
              <FileIcon fileName="unknown.file" fileType="file" size="large" />
            </div>
            <p className="text-gray-600 mb-4">Preview not available</p>
            <p className="text-sm text-gray-500 mb-4">
              This file type cannot be previewed
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading preview...</span>
        </CardContent>
      </Card>
    )
  }

      if (error) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <div className="mb-4">
            <FileIcon fileName="error.file" fileType="file" size="large" />
          </div>
          <p className="text-red-600 mb-2">Preview Error</p>
          <p className="text-sm text-gray-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(fileName)}
              <CardTitle className="text-lg truncate">{fileName}</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* ファイル情報 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {fileInfo && (
              <>
                <span>{formatFileSize(fileInfo.size)}</span>
                <span>•</span>
                <span>{new Date(fileInfo.lastModified).toLocaleString()}</span>
                {fileInfo.language && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {fileInfo.language}
                    </Badge>
                  </>
                )}
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderPreviewContent()}
        </CardContent>
      </Card>

      {/* フルスクリーンダイアログ */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon(fileName)}
              {fileName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
