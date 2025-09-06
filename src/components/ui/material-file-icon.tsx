import React, { useState, useEffect } from 'react'
import { getFileIconProps, getFileTypeIconName, getIconPath } from '@/utils/material-icons'
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Code, 
  Archive,
  File,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface MaterialFileIconProps {
  fileName?: string
  fileType?: 'text' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'document' | 'other'
  status?: 'creating' | 'processing' | 'completed' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSpinner?: boolean
}

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'sm':
      return 'w-4 h-4'
    case 'lg':
      return 'w-6 h-6'
    default:
      return 'w-5 h-5'
  }
}

const getFallbackIcon = (fileType: string, status?: string) => {
  if (status === 'completed') {
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }
  
  if (status === 'error') {
    return <AlertCircle className="w-5 h-5 text-red-500" />
  }

  switch (fileType) {
    case 'text':
      return <FileText className="w-5 h-5" />
    case 'image':
      return <Image className="w-5 h-5" />
    case 'video':
      return <Video className="w-5 h-5" />
    case 'audio':
      return <Music className="w-5 h-5" />
    case 'code':
      return <Code className="w-5 h-5" />
    case 'archive':
      return <Archive className="w-5 h-5" />
    case 'document':
      return <FileText className="w-5 h-5" />
    default:
      return <File className="w-5 h-5" />
  }
}

export const MaterialFileIcon: React.FC<MaterialFileIconProps> = ({
  fileName,
  fileType = 'other',
  status,
  size = 'md',
  className = '',
  showSpinner = false
}) => {
  const [iconPath, setIconPath] = useState<string>('')
  const [iconError, setIconError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadIcon = async () => {
      try {
        setIsLoading(true)
        setIconError(false)

        let iconName: string
        let path: string

        if (fileName) {
          const props = getFileIconProps(fileName)
          iconName = props.iconName
          path = props.iconPath
        } else {
          iconName = getFileTypeIconName(fileType)
          path = getIconPath(iconName)
        }

        setIconPath(path)
      } catch (error) {
        console.warn('Failed to load Material Icon:', error)
        setIconError(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadIcon()
  }, [fileName, fileType])

  const sizeClasses = getSizeClasses(size)

  // ローディング中またはエラーの場合はフォールバックアイコンを使用
  if (isLoading || iconError) {
    return (
      <div className={`${sizeClasses} ${className}`}>
        {getFallbackIcon(fileType, status)}
      </div>
    )
  }

  // スピナー表示が必要な場合
  if (showSpinner && (status === 'creating' || status === 'processing')) {
    return (
      <div className={`${sizeClasses} ${className} relative`}>
        <img
          src={iconPath}
          alt={`${fileName || fileType} icon`}
          className={`${sizeClasses} opacity-50`}
          onError={() => setIconError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // 通常のアイコン表示
  return (
    <img
      src={iconPath}
      alt={`${fileName || fileType} icon`}
      className={`${sizeClasses} ${className}`}
      onError={() => setIconError(true)}
    />
  )
}

// ファイル名から自動的にアイコンを決定するコンポーネント
export const AutoFileIcon: React.FC<Omit<MaterialFileIconProps, 'fileType'> & { fileName: string }> = ({
  fileName,
  ...props
}) => {
  return <MaterialFileIcon fileName={fileName} {...props} />
}

// ファイルタイプからアイコンを表示するコンポーネント
export const TypeFileIcon: React.FC<Omit<MaterialFileIconProps, 'fileName'> & { fileType: MaterialFileIconProps['fileType'] }> = ({
  fileType,
  ...props
}) => {
  return <MaterialFileIcon fileType={fileType} {...props} />
}
