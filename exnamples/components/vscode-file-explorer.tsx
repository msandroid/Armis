"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Search,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  File,
  Code,
  Image,
  Database,
  Settings,
  RefreshCw,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  children?: FileNode[]
  isExpanded?: boolean
  size?: number
  lastModified?: Date
  isHidden?: boolean
}

interface VSCodeFileExplorerProps {
  files: FileNode[]
  onFileSelect?: (file: FileNode) => void
  onFileCreate?: (parentPath: string, name: string, type: "file" | "folder") => void
  onFileDelete?: (path: string) => void
  onFileRename?: (oldPath: string, newPath: string) => void
  onRefresh?: () => void
  className?: string
}

export function VSCodeFileExplorer({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onRefresh,
  className
}: VSCodeFileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [contextMenuFile, setContextMenuFile] = useState<FileNode | null>(null)
  const [isRenaming, setIsRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const getFileIcon = (file: FileNode) => {
    if (file.type === "folder") {
      return expandedFolders.has(file.id) ? (
        <FolderOpen className="h-4 w-4 text-[#dcb67a]" />
      ) : (
        <Folder className="h-4 w-4 text-[#dcb67a]" />
      )
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="h-4 w-4 text-[#f9e71e]" />
      case 'css':
      case 'scss':
      case 'sass':
        return <FileText className="h-4 w-4 text-[#42a5f5]" />
      case 'html':
      case 'htm':
        return <Code className="h-4 w-4 text-[#e34c26]" />
      case 'json':
        return <Database className="h-4 w-4 text-[#4caf50]" />
      case 'md':
      case 'markdown':
        return <FileText className="h-4 w-4 text-[#42a5f5]" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-[#9c27b0]" />
      case 'env':
        return <Settings className="h-4 w-4 text-[#ff9800]" />
      default:
        return <File className="h-4 w-4 text-[#cccccc]" />
    }
  }

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }, [])

  const handleFileClick = useCallback((file: FileNode) => {
    if (file.type === "folder") {
      toggleFolder(file.id)
    } else {
      setSelectedFile(file.id)
      onFileSelect?.(file)
    }
  }, [toggleFolder, onFileSelect])

  const handleCreateFile = useCallback((parentPath: string, type: "file" | "folder") => {
    const name = type === "file" ? "新しいファイル.txt" : "新しいフォルダ"
    onFileCreate?.(parentPath, name, type)
  }, [onFileCreate])

  const handleDelete = useCallback((file: FileNode) => {
    if (confirm(`${file.name} を削除しますか？`)) {
      onFileDelete?.(file.path)
    }
  }, [onFileDelete])

  const handleRename = useCallback((file: FileNode) => {
    setIsRenaming(file.id)
    setRenameValue(file.name)
  }, [])

  const confirmRename = useCallback((file: FileNode) => {
    if (renameValue && renameValue !== file.name) {
      const newPath = file.path.replace(file.name, renameValue)
      onFileRename?.(file.path, newPath)
    }
    setIsRenaming(null)
    setRenameValue("")
  }, [renameValue, onFileRename])

  const filteredFiles = useCallback((nodes: FileNode[]): FileNode[] => {
    if (!searchQuery) return nodes

    return nodes.filter(node => {
      if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true
      }
      if (node.children) {
        const filteredChildren = filteredFiles(node.children)
        return filteredChildren.length > 0
      }
      return false
    }).map(node => ({
      ...node,
      children: node.children ? filteredFiles(node.children) : undefined
    }))
  }, [searchQuery])

  const renderFileTree = useCallback((nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`flex items-center py-1 px-2 cursor-pointer hover:bg-[#2a2a2a] ${
                selectedFile === node.id ? 'bg-[#094771]' : ''
              }`}
              style={{ paddingLeft: `${8 + depth * 16}px` }}
              onClick={() => handleFileClick(node)}
            >
              {node.type === "folder" && (
                <div className="mr-1">
                  {expandedFolders.has(node.id) ? (
                    <ChevronDown className="h-3 w-3 text-[#cccccc]" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-[#cccccc]" />
                  )}
                </div>
              )}
              <div className="mr-2">
                {getFileIcon(node)}
              </div>
              {isRenaming === node.id ? (
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => confirmRename(node)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      confirmRename(node)
                    } else if (e.key === 'Escape') {
                      setIsRenaming(null)
                      setRenameValue("")
                    }
                  }}
                  className="h-5 text-xs bg-[#3c3c3c] border-[#007acc] text-[#cccccc] px-1"
                  autoFocus
                />
              ) : (
                <span className="text-sm text-[#cccccc] truncate">
                  {node.name}
                </span>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="bg-[#252526] border-[#454545] text-[#cccccc]">
            {node.type === "folder" && (
              <>
                <ContextMenuItem
                  onClick={() => handleCreateFile(node.path, "file")}
                  className="hover:bg-[#2a2a2a]"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  新しいファイル
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleCreateFile(node.path, "folder")}
                  className="hover:bg-[#2a2a2a]"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  新しいフォルダ
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-[#454545]" />
              </>
            )}
            <ContextMenuItem
              onClick={() => handleRename(node)}
              className="hover:bg-[#2a2a2a]"
            >
              <Edit className="h-4 w-4 mr-2" />
              名前を変更
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleDelete(node)}
              className="hover:bg-[#2a2a2a] text-[#f14c4c]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        {node.type === "folder" && 
         expandedFolders.has(node.id) && 
         node.children && 
         node.children.length > 0 && (
          <div>
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ))
  }, [
    selectedFile, 
    expandedFolders, 
    isRenaming, 
    renameValue, 
    handleFileClick, 
    handleCreateFile, 
    handleRename, 
    handleDelete, 
    confirmRename
  ])

  return (
    <div className={`h-full flex flex-col bg-[#252526] text-[#cccccc] ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-3 border-b border-[#2d2d30]">
        <h3 className="text-sm font-medium text-[#cccccc] uppercase tracking-wide">
          エクスプローラー
        </h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2a2a2a]"
            title="検索"
          >
            <Search className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateFile("", "file")}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2a2a2a]"
            title="新しいファイル"
          >
            <FilePlus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateFile("", "folder")}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2a2a2a]"
            title="新しいフォルダ"
          >
            <FolderPlus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2a2a2a]"
            title="更新"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 検索バー */}
      {showSearch && (
        <div className="p-2 border-b border-[#2d2d30]">
          <Input
            placeholder="ファイルを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs bg-[#3c3c3c] border-[#454545] text-[#cccccc] placeholder-[#969696]"
          />
        </div>
      )}

      {/* ファイルツリー */}
      <div className="flex-1 overflow-auto">
        {filteredFiles(files).length > 0 ? (
          renderFileTree(filteredFiles(files))
        ) : (
          <div className="p-4 text-center text-[#969696] text-sm">
            {searchQuery ? "ファイルが見つかりません" : "ファイルがありません"}
          </div>
        )}
      </div>
    </div>
  )
}
