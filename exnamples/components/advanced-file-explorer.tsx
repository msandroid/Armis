"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Folder, 
  File, 
  Search, 
  Settings, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  FolderOpen,
  FileText,
  Code,
  Image,
  Video,
  Music,
  Archive,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Scissors,
  Clipboard,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  GitCompare
} from "lucide-react"
import { FileNode, FileSystemManager } from "@/lib/file-system"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface AdvancedFileExplorerProps {
  rootPath?: string
  onFileSelect?: (file: FileNode) => void
  onFileCreate?: (path: string, type: 'file' | 'folder') => void
  onFileDelete?: (path: string) => void
  onFileRename?: (oldPath: string, newPath: string) => void
  onFileCopy?: (sourcePath: string, targetPath: string) => void
  onFileMove?: (sourcePath: string, targetPath: string) => void
}

export function AdvancedFileExplorer({
  rootPath = '/',
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileCopy,
  onFileMove
}: AdvancedFileExplorerProps) {
  const [fileSystem] = useState(() => new FileSystemManager(rootPath))
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showHiddenFiles, setShowHiddenFiles] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clipboard, setClipboard] = useState<{
    type: 'copy' | 'cut'
    path: string
    node: FileNode
  } | null>(null)
  const [gitStatus, setGitStatus] = useState<Record<string, 'modified' | 'added' | 'deleted' | 'untracked'>>({})

  // ファイルツリーの初期化
  useEffect(() => {
    loadFileTree()
  }, [rootPath])

  const loadFileTree = async () => {
    setIsLoading(true)
    try {
      const tree = await fileSystem.buildFileTree()
      setFileTree(tree)
    } catch (error) {
      console.error('Error loading file tree:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ファイルの選択
  const handleFileSelect = useCallback((file: FileNode) => {
    setSelectedFile(file.id)
    onFileSelect?.(file)
  }, [onFileSelect])

  // フォルダーの開閉
  const toggleFolder = useCallback((fileId: string) => {
    const updateFileTree = (items: FileNode[]): FileNode[] => {
      return items.map(item => {
        if (item.id === fileId) {
          return { ...item, isOpen: !item.isOpen }
        }
        if (item.children) {
          return { ...item, children: updateFileTree(item.children) }
        }
        return item
      })
    }
    setFileTree(updateFileTree(fileTree))
  }, [fileTree])

  // ファイルアイコンの取得
  const getFileIcon = useCallback((fileName: string, type: 'file' | 'folder') => {
    if (type === 'folder') {
      return <Folder className="h-4 w-4 text-blue-500" />
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'tsx':
      case 'ts':
      case 'js':
      case 'jsx':
        return <Code className="h-4 w-4 text-blue-400" />
      case 'css':
      case 'scss':
      case 'sass':
        return <FileText className="h-4 w-4 text-pink-400" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-green-400" />
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="h-4 w-4 text-purple-400" />
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="h-4 w-4 text-yellow-400" />
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-4 w-4 text-orange-400" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }, [])

  // Gitステータスアイコンの取得
  const getGitStatusIcon = useCallback((filePath: string) => {
    const status = gitStatus[filePath]
    if (!status) return null

    switch (status) {
      case 'modified':
        return <GitCommit className="h-3 w-3 text-yellow-500" />
      case 'added':
        return <Plus className="h-3 w-3 text-green-500" />
      case 'deleted':
        return <Trash2 className="h-3 w-3 text-red-500" />
      case 'untracked':
        return <GitBranch className="h-3 w-3 text-gray-500" />
      default:
        return null
    }
  }, [gitStatus])

  // ファイルの作成
  const handleCreateFile = useCallback(async (parentPath: string, type: 'file' | 'folder') => {
    const name = type === 'file' ? 'new-file.txt' : 'new-folder'
    const path = `${parentPath}/${name}`
    
    try {
      if (type === 'file') {
        await fileSystem.createFile(path)
      } else {
        await fileSystem.createFolder(path)
      }
      
      onFileCreate?.(path, type)
      await loadFileTree()
    } catch (error) {
      console.error('Error creating file:', error)
    }
  }, [fileSystem, onFileCreate, loadFileTree])

  // ファイルの削除
  const handleDeleteFile = useCallback(async (filePath: string) => {
    try {
      await fileSystem.deleteFile(filePath)
      onFileDelete?.(filePath)
      await loadFileTree()
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }, [fileSystem, onFileDelete, loadFileTree])

  // ファイルの名前変更
  const handleRenameFile = useCallback(async (oldPath: string, newName: string) => {
    const newPath = oldPath.replace(/\/[^\/]+$/, `/${newName}`)
    try {
      await fileSystem.renameFile(oldPath, newPath)
      onFileRename?.(oldPath, newPath)
      await loadFileTree()
    } catch (error) {
      console.error('Error renaming file:', error)
    }
  }, [fileSystem, onFileRename, loadFileTree])

  // ファイルのコピー
  const handleCopyFile = useCallback((file: FileNode) => {
    setClipboard({ type: 'copy', path: file.path, node: file })
  }, [])

  // ファイルの切り取り
  const handleCutFile = useCallback((file: FileNode) => {
    setClipboard({ type: 'cut', path: file.path, node: file })
  }, [])

  // ファイルの貼り付け
  const handlePasteFile = useCallback(async (targetPath: string) => {
    if (!clipboard) return

    try {
      const targetName = clipboard.node.name
      const newPath = `${targetPath}/${targetName}`
      
      if (clipboard.type === 'copy') {
        onFileCopy?.(clipboard.path, newPath)
      } else {
        onFileMove?.(clipboard.path, newPath)
      }
      
      setClipboard(null)
      await loadFileTree()
    } catch (error) {
      console.error('Error pasting file:', error)
    }
  }, [clipboard, onFileCopy, onFileMove, loadFileTree])

  // ファイルツリーのレンダリング
  const renderFileTree = useCallback((items: FileNode[], level = 0) => {
    return items
      .filter(item => showHiddenFiles || !item.isHidden)
      .map(item => (
        <ContextMenu key={item.id}>
          <ContextMenuTrigger>
            <div
              className={`flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer ${
                selectedFile === item.id ? 'bg-blue-100' : ''
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                if (item.type === 'folder') {
                  toggleFolder(item.id)
                } else {
                  handleFileSelect(item)
                }
              }}
            >
              {item.type === 'folder' ? (
                <div className="flex items-center">
                  {item.isOpen ? (
                    <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
                  )}
                  {item.isOpen ? (
                    <FolderOpen className="h-4 w-4 text-blue-500 mr-2" />
                  ) : (
                    <Folder className="h-4 w-4 text-blue-500 mr-2" />
                  )}
                </div>
              ) : (
                <div className="w-6 mr-2 flex justify-center">
                  {getFileIcon(item.name, item.type)}
                </div>
              )}
              
              <span className="text-sm truncate flex-1">{item.name}</span>
              
              {/* Git status */}
              {getGitStatusIcon(item.path)}
              
              {/* Modified indicator */}
              {item.isModified && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  M
                </Badge>
              )}
              
              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleCopyFile(item)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCutFile(item)}>
                    <Scissors className="h-4 w-4 mr-2" />
                    Cut
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteFile(item.path)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRenameFile(item.path, item.name)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleFileSelect(item)}>
              <FileText className="h-4 w-4 mr-2" />
              Open
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCopyFile(item)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCutFile(item)}>
              <Scissors className="h-4 w-4 mr-2" />
              Cut
            </ContextMenuItem>
            {clipboard && (
              <ContextMenuItem onClick={() => handlePasteFile(item.path)}>
                <Clipboard className="h-4 w-4 mr-2" />
                Paste
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleRenameFile(item.path, item.name)}>
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDeleteFile(item.path)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))
  }, [
    showHiddenFiles,
    selectedFile,
    toggleFolder,
    handleFileSelect,
    getFileIcon,
    getGitStatusIcon,
    handleCopyFile,
    handleCutFile,
    handleDeleteFile,
    handleRenameFile,
    clipboard,
    handlePasteFile
  ])

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="New File"
            onClick={() => handleCreateFile(rootPath, 'file')}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="New Folder"
            onClick={() => handleCreateFile(rootPath, 'folder')}
          >
            <Folder className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Toggle Hidden Files"
            onClick={() => setShowHiddenFiles(!showHiddenFiles)}
          >
            {showHiddenFiles ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Refresh"
            onClick={loadFileTree}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : (
          <div className="py-2">
            {renderFileTree(fileTree)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Files: {fileTree.length}</span>
          <div className="flex items-center space-x-2">
            {clipboard && (
              <Badge variant="outline" className="text-xs">
                {clipboard.type === 'copy' ? 'Copy' : 'Cut'}: {clipboard.node.name}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Settings"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 