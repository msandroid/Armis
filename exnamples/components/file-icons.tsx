"use client"

import React from 'react'
import { SvgIcon, SvgIconProps } from '@mui/material'
import {
  // フォルダー
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  
  // コードファイル
  Code as CodeIcon,
  Html as HtmlIcon,
  Css as CssIcon,
  Javascript as JavascriptIcon,
  
  // テキストファイル
  TextFields as TextIcon,
  Article as MarkdownIcon,
  Description as DocumentIcon,
  
  // 設定ファイル
  Settings as ConfigIcon,
  DataObject as JsonIcon,
  
  // 画像ファイル
  Image as ImageIcon,
  PhotoCamera as PhotoIcon,
  Palette as GraphicsIcon,
  
  // 動画ファイル
  VideoFile as VideoIcon,
  Videocam as CameraIcon,
  Movie as MovieIcon,
  
  // 音声ファイル
  AudioFile as AudioIcon,
  MusicNote as MusicIcon,
  Mic as RecordIcon,
  
  // アーカイブファイル
  Archive as ArchiveIcon,
  FolderZip as ZipIcon,
  
  // ドキュメントファイル
  PictureAsPdf as PdfIcon,
  TableChart as SpreadsheetIcon,
  Slideshow as PresentationIcon,
  
  // システムファイル
  Terminal as TerminalIcon,
  Memory as BinaryIcon,
  Build as ExecutableIcon,
  
  // データファイル
  Storage as DatabaseIcon,
  CloudDownload as BackupIcon,
  
  // その他
  InsertDriveFile as DefaultFileIcon,
  Language as WebIcon,
  Security as LockIcon,
  BugReport as LogIcon,
  
} from '@mui/icons-material'

export interface FileIconProps extends Omit<SvgIconProps, 'children'> {
  fileName: string
  fileType: 'file' | 'folder'
  isOpen?: boolean
  size?: 'small' | 'medium' | 'large'
}

// ファイル拡張子とアイコンのマッピング
const FILE_ICON_MAP: Record<string, React.ComponentType<SvgIconProps>> = {
  // コードファイル
  'js': JavascriptIcon,
  'jsx': JavascriptIcon,
  'ts': CodeIcon,
  'tsx': CodeIcon,
  'html': HtmlIcon,
  'htm': HtmlIcon,
  'css': CssIcon,
  'scss': CssIcon,
  'sass': CssIcon,
  'less': CssIcon,
  'py': CodeIcon,
  'java': CodeIcon,
  'cpp': CodeIcon,
  'c': CodeIcon,
  'cs': CodeIcon,
  'php': CodeIcon,
  'rb': CodeIcon,
  'go': CodeIcon,
  'rs': CodeIcon,
  'swift': CodeIcon,
  'kt': CodeIcon,
  'dart': CodeIcon,
  
  // テキストファイル
  'txt': TextIcon,
  'md': MarkdownIcon,
  'markdown': MarkdownIcon,
  'readme': MarkdownIcon,
  'doc': DocumentIcon,
  'docx': DocumentIcon,
  'rtf': DocumentIcon,
  
  // 設定ファイル
  'json': JsonIcon,
  'xml': ConfigIcon,
  'yaml': ConfigIcon,
  'yml': ConfigIcon,
  'toml': ConfigIcon,
  'ini': ConfigIcon,
  'conf': ConfigIcon,
  'config': ConfigIcon,
  'env': ConfigIcon,
  'properties': ConfigIcon,
  
  // 画像ファイル
  'png': ImageIcon,
  'jpg': PhotoIcon,
  'jpeg': PhotoIcon,
  'gif': ImageIcon,
  'svg': GraphicsIcon,
  'webp': ImageIcon,
  'bmp': ImageIcon,
  'ico': ImageIcon,
  'tiff': ImageIcon,
  'tif': ImageIcon,
  'psd': GraphicsIcon,
  'ai': GraphicsIcon,
  'sketch': GraphicsIcon,
  'fig': GraphicsIcon,
  
  // 動画ファイル
  'mp4': VideoIcon,
  'avi': MovieIcon,
  'mov': CameraIcon,
  'mkv': VideoIcon,
  'webm': VideoIcon,
  'wmv': VideoIcon,
  'flv': VideoIcon,
  'f4v': VideoIcon,
  'm4v': VideoIcon,
  '3gp': VideoIcon,
  'ogv': VideoIcon,
  
  // 音声ファイル
  'mp3': MusicIcon,
  'wav': AudioIcon,
  'flac': AudioIcon,
  'ogg': AudioIcon,
  'aac': MusicIcon,
  'm4a': MusicIcon,
  'wma': AudioIcon,
  'opus': AudioIcon,
  'ape': AudioIcon,
  'alac': AudioIcon,
  
  // アーカイブファイル
  'zip': ZipIcon,
  'rar': ArchiveIcon,
  '7z': ArchiveIcon,
  'tar': ArchiveIcon,
  'gz': ArchiveIcon,
  'bz2': ArchiveIcon,
  'xz': ArchiveIcon,
  'dmg': ArchiveIcon,
  'iso': ArchiveIcon,
  
  // ドキュメントファイル
  'pdf': PdfIcon,
  'xls': SpreadsheetIcon,
  'xlsx': SpreadsheetIcon,
  'csv': SpreadsheetIcon,
  'ppt': PresentationIcon,
  'pptx': PresentationIcon,
  'key': PresentationIcon,
  'pages': DocumentIcon,
  'numbers': SpreadsheetIcon,
  
  // システムファイル
  'exe': ExecutableIcon,
  'msi': ExecutableIcon,
  'deb': ExecutableIcon,
  'rpm': ExecutableIcon,
  'dmg': ExecutableIcon,
  'app': ExecutableIcon,
  'bin': BinaryIcon,
  'dll': BinaryIcon,
  'so': BinaryIcon,
  'dylib': BinaryIcon,
  
  // シェル・スクリプト
  'sh': TerminalIcon,
  'bash': TerminalIcon,
  'zsh': TerminalIcon,
  'fish': TerminalIcon,
  'bat': TerminalIcon,
  'cmd': TerminalIcon,
  'ps1': TerminalIcon,
  'psm1': TerminalIcon,
  
  // データベース
  'db': DatabaseIcon,
  'sqlite': DatabaseIcon,
  'sqlite3': DatabaseIcon,
  'sql': DatabaseIcon,
  'mdb': DatabaseIcon,
  
  // バックアップ
  'bak': BackupIcon,
  'backup': BackupIcon,
  'old': BackupIcon,
  
  // ログファイル
  'log': LogIcon,
  'logs': LogIcon,
  
  // Web関連
  'css': CssIcon,
  'js': JavascriptIcon,
  'ts': CodeIcon,
  'vue': CodeIcon,
  'angular': CodeIcon,
  'react': CodeIcon,
  
  // セキュリティ
  'key': LockIcon,
  'pem': LockIcon,
  'cert': LockIcon,
  'crt': LockIcon,
  'p12': LockIcon,
  'pfx': LockIcon,
  'keystore': LockIcon,
}

// ファイルタイプによる色のマッピング
const FILE_COLOR_MAP: Record<string, string> = {
  // コード
  'js': '#F7DF1E',
  'jsx': '#61DAFB',
  'ts': '#3178C6',
  'tsx': '#3178C6',
  'html': '#E34F26',
  'css': '#1572B6',
  'scss': '#CF649A',
  'py': '#3776AB',
  'java': '#ED8B00',
  'cpp': '#00599C',
  'c': '#A8B9CC',
  'cs': '#239120',
  'php': '#777BB4',
  'rb': '#CC342D',
  'go': '#00ADD8',
  'rs': '#000000',
  
  // 画像
  'png': '#4CAF50',
  'jpg': '#FF9800',
  'jpeg': '#FF9800',
  'gif': '#E91E63',
  'svg': '#673AB7',
  'webp': '#4CAF50',
  
  // 動画
  'mp4': '#FF5722',
  'avi': '#FF5722',
  'mov': '#FF5722',
  'mkv': '#FF5722',
  
  // 音声
  'mp3': '#2196F3',
  'wav': '#2196F3',
  'flac': '#2196F3',
  
  // アーカイブ
  'zip': '#FFC107',
  'rar': '#FFC107',
  '7z': '#FFC107',
  
  // ドキュメント
  'pdf': '#F44336',
  'doc': '#2196F3',
  'docx': '#2196F3',
  'xls': '#4CAF50',
  'xlsx': '#4CAF50',
  'ppt': '#FF9800',
  'pptx': '#FF9800',
  
  // デフォルト
  default: '#9E9E9E'
}

// サイズのマッピング
const SIZE_MAP = {
  small: 16,
  medium: 20,
  large: 24
}

export function FileIcon({ 
  fileName, 
  fileType, 
  isOpen = false, 
  size = 'medium',
  sx,
  ...props 
}: FileIconProps) {
  // フォルダーの場合
  if (fileType === 'folder') {
    const FolderComponent = isOpen ? FolderOpenIcon : FolderIcon
    return (
      <FolderComponent
        sx={{
          fontSize: SIZE_MAP[size],
          color: isOpen ? '#2196F3' : '#FFC107',
          ...sx
        }}
        {...props}
      />
    )
  }

  // ファイルの拡張子を取得
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  
  // アイコンコンポーネントを取得
  const IconComponent = FILE_ICON_MAP[extension] || DefaultFileIcon
  
  // 色を取得
  const color = FILE_COLOR_MAP[extension] || FILE_COLOR_MAP.default

  return (
    <IconComponent
      sx={{
        fontSize: SIZE_MAP[size],
        color,
        ...sx
      }}
      {...props}
    />
  )
}

// 特定のファイルタイプ用のヘルパーコンポーネント
export function CodeFileIcon(props: Omit<FileIconProps, 'fileType'>) {
  return <FileIcon {...props} fileType="file" />
}

export function ImageFileIcon(props: Omit<FileIconProps, 'fileType'>) {
  return <FileIcon {...props} fileType="file" />
}

export function VideoFileIcon(props: Omit<FileIconProps, 'fileType'>) {
  return <FileIcon {...props} fileType="file" />
}

export function AudioFileIcon(props: Omit<FileIconProps, 'fileType'>) {
  return <FileIcon {...props} fileType="file" />
}

export function DocumentFileIcon(props: Omit<FileIconProps, 'fileType'>) {
  return <FileIcon {...props} fileType="file" />
}

export function FolderFileIcon({ isOpen, ...props }: Omit<FileIconProps, 'fileType' | 'fileName'> & { isOpen?: boolean }) {
  return <FileIcon {...props} fileName="" fileType="folder" isOpen={isOpen} />
}

// ファイルタイプの判定ユーティリティ
export function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  
  const typeCategories = {
    code: ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs'],
    image: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'],
    video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'flv'],
    audio: ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    document: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'],
    spreadsheet: ['xls', 'xlsx', 'csv'],
    presentation: ['ppt', 'pptx', 'key'],
    config: ['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'conf']
  }
  
  for (const [category, extensions] of Object.entries(typeCategories)) {
    if (extensions.includes(extension)) {
      return category
    }
  }
  
  return 'unknown'
}

// ファイルカテゴリの色を取得
export function getFileTypeColor(fileName: string): string {
  const fileType = getFileType(fileName)
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  
  return FILE_COLOR_MAP[extension] || FILE_COLOR_MAP[fileType] || FILE_COLOR_MAP.default
}
