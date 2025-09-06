import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ShimmerText } from '@/components/ui/shimmer-text'
import { 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import { MaterialFileIcon } from './material-file-icon'

export interface FileCreationInfo {
  id: string
  fileName: string
  fileType: 'text' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'document' | 'other'
  status: 'creating' | 'processing' | 'completed' | 'error'
  progress?: number
  startTime: Date
  estimatedDuration?: number
  currentStep?: string
  totalSteps?: number
  currentStepIndex?: number
  metadata?: {
    size?: number
    format?: string
    quality?: string
    compression?: string
  }
}

interface FileCreationLoaderProps {
  fileInfo: FileCreationInfo
  className?: string
}

const getFileIcon = (fileType: FileCreationInfo['fileType'], fileName?: string) => {
  if (fileName) {
    return <MaterialFileIcon fileName={fileName} size="md" />
  }
  return <MaterialFileIcon fileType={fileType} size="md" />
}

const getStatusColor = (status: FileCreationInfo['status']) => {
  switch (status) {
    case 'creating':
      return 'bg-blue-500'
    case 'processing':
      return 'bg-yellow-500'
    case 'completed':
      return 'bg-green-500'
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusText = (status: FileCreationInfo['status']) => {
  switch (status) {
    case 'creating':
      return '作成中'
    case 'processing':
      return '処理中'
    case 'completed':
      return '完了'
    case 'error':
      return 'エラー'
    default:
      return '不明'
  }
}

const getFileTypeLabel = (fileType: FileCreationInfo['fileType']) => {
  switch (fileType) {
    case 'text':
      return 'テキスト'
    case 'image':
      return '画像'
    case 'video':
      return '動画'
    case 'audio':
      return '音声'
    case 'code':
      return 'コード'
    case 'archive':
      return 'アーカイブ'
    case 'document':
      return 'ドキュメント'
    default:
      return 'ファイル'
  }
}

export const FileCreationLoader: React.FC<FileCreationLoaderProps> = ({
  fileInfo,
  className = ''
}) => {
  const elapsedTime = Date.now() - fileInfo.startTime.getTime()
  const elapsedSeconds = Math.floor(elapsedTime / 1000)
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  const formatElapsedTime = () => {
    if (elapsedMinutes > 0) {
      return `${elapsedMinutes}分${elapsedSeconds % 60}秒`
    }
    return `${elapsedSeconds}秒`
  }

  const getEstimatedTimeRemaining = () => {
    if (!fileInfo.estimatedDuration || !fileInfo.progress || fileInfo.progress === 0) {
      return null
    }
    
    const remainingProgress = 100 - fileInfo.progress
    const timePerPercent = elapsedTime / fileInfo.progress
    const remainingTime = remainingProgress * timePerPercent
    
    const remainingMinutes = Math.floor(remainingTime / 60000)
    const remainingSeconds = Math.floor((remainingTime % 60000) / 1000)
    
    if (remainingMinutes > 0) {
      return `${remainingMinutes}分${remainingSeconds}秒`
    }
    return `${remainingSeconds}秒`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className={`border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {fileInfo.status === 'creating' || fileInfo.status === 'processing' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5"
                    >
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </motion.div>
                  ) : fileInfo.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : fileInfo.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    getFileIcon(fileInfo.fileType, fileInfo.fileName)
                  )}
                  <div className="flex items-center gap-2">
                    <ShimmerText className="font-semibold text-lg">
                      {fileInfo.fileName}
                    </ShimmerText>
                    <Badge variant="outline" className="text-xs">
                      {getFileTypeLabel(fileInfo.fileType)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(fileInfo.status)} text-white border-0`}
                >
                  {getStatusText(fileInfo.status)}
                </Badge>
              </div>
            </div>

            {/* ファイル情報 */}
            <div className="text-sm text-muted-foreground">
              <ShimmerText>
                ファイル作成中: {fileInfo.fileName}
              </ShimmerText>
            </div>

            {/* 進捗バー */}
            {fileInfo.progress !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {fileInfo.currentStep && (
                      <ShimmerText>
                        ステップ: {fileInfo.currentStep}
                      </ShimmerText>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {fileInfo.progress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={fileInfo.progress} className="h-2" />
                
                {/* ステップ表示 */}
                {fileInfo.totalSteps && fileInfo.currentStepIndex !== undefined && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      ステップ {fileInfo.currentStepIndex + 1} / {fileInfo.totalSteps}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 時間情報 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>経過時間: {formatElapsedTime()}</span>
                {fileInfo.estimatedDuration && (
                  <span>予想時間: {Math.floor(fileInfo.estimatedDuration / 60000)}分</span>
                )}
              </div>
              
              {fileInfo.status === 'creating' && getEstimatedTimeRemaining() && (
                <span>残り時間: {getEstimatedTimeRemaining()}</span>
              )}
            </div>

            {/* メタデータ */}
            {fileInfo.metadata && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {fileInfo.metadata.size && (
                  <div className="flex items-center gap-1">
                    <MaterialFileIcon fileType="document" size="sm" />
                    <span>{fileInfo.metadata.size} bytes</span>
                  </div>
                )}
                {fileInfo.metadata.format && (
                  <div className="flex items-center gap-1">
                    <MaterialFileIcon fileName={`file.${fileInfo.metadata.format}`} size="sm" />
                    <span>{fileInfo.metadata.format}</span>
                  </div>
                )}
                {fileInfo.metadata.quality && (
                  <div className="flex items-center gap-1">
                    <MaterialFileIcon fileType="image" size="sm" />
                    <span>{fileInfo.metadata.quality}</span>
                  </div>
                )}
                {fileInfo.metadata.compression && (
                  <div className="flex items-center gap-1">
                    <MaterialFileIcon fileType="archive" size="sm" />
                    <span>{fileInfo.metadata.compression}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
