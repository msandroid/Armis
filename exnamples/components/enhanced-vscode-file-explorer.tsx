"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scrollarea"
import { Badge } from "@/components/ui/badge"
import { 
  Folder,
  FolderOpen,
  File,
  Search,
  Plus,
  MoreHorizontal,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Copy,
  Scissors,
  Download,
  Upload,
  GitBranch,
  GitCommit,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  SortDesc,
  X
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileIcon } from "@/components/file-icons"
import { FileOperationHeuristics } from "@/lib/file-operation-heuristics"
import { chatEditingService } from "@/lib/chat-editing-service"

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
  isGitTracked?: boolean
  gitStatus?: 'modified' | 'added' | 'deleted' | 'untracked' | 'staged'
  language?: string
  isReadOnly?: boolean
}

interface EnhancedVSCodeFileExplorerProps {
  files?: FileNode[]
  onFileSelect?: (file: FileNode) => void
  onFileCreate?: (path: string, type: 'file' | 'folder') => void
  onFileDelete?: (path: string) => void
  onFileRename?: (oldPath: string, newPath: string) => void
  onFileCopy?: (sourcePath: string, targetPath: string) => void
  onFileMove?: (sourcePath: string, targetPath: string) => void
  onFileUpload?: (files: FileList, targetPath: string) => void
  className?: string
  showGitStatus?: boolean
  showHiddenFiles?: boolean
  enableSearch?: boolean
  enableDragDrop?: boolean
}

type SortBy = 'name' | 'type' | 'size' | 'modified'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'tree' | 'list'

export function EnhancedVSCodeFileExplorer({
  files = [],
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileCopy,
  onFileMove,
  onFileUpload,
  className = "",
  showGitStatus = true,
  showHiddenFiles = false,
  enableSearch = true,
  enableDragDrop = true
}: EnhancedVSCodeFileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>(files)
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFiles, setFilteredFiles] = useState<FileNode[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [showHidden, setShowHidden] = useState(showHiddenFiles)
  const [isLoading, setIsLoading] = useState(false)
  
  // ダイアログ状態
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createType, setCreateType] = useState<'file' | 'folder'>('file')
  const [createName, setCreateName] = useState("")
  const [createPath, setCreatePath] = useState("")
  
  // ドラッグ&ドロップ状態
  const [draggedFile, setDraggedFile] = useState<FileNode | null>(null)
  const [dropTarget, setDropTarget] = useState<FileNode | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // 編集状態
  const [editingFile, setEditingFile] = useState<FileNode | null>(null)
  const [editingName, setEditingName] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ファイルツリーの更新
  useEffect(() => {
    setFileTree(files)
  }, [files])

  // 検索とフィルタリング
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      const filtered = searchFiles(fileTree, searchQuery)
      setFilteredFiles(filtered)
    } else {
      setIsSearching(false)
      setFilteredFiles([])
    }
  }, [searchQuery, fileTree])

  // ファイル検索
  const searchFiles = useCallback((nodes: FileNode[], query: string): FileNode[] => {
    const results: FileNode[] = []
    const searchTerm = query.toLowerCase()

    const searchInNode = (node: FileNode) => {
      if (node.name.toLowerCase().includes(searchTerm)) {
        results.push(node)
      }
      if (node.children) {
        node.children.forEach(searchInNode)
      }
    }

    nodes.forEach(searchInNode)
    return results
  }, [])

  // ファイルソート
  const sortFiles = useCallback((nodes: FileNode[]): FileNode[] => {
    return [...nodes].sort((a, b) => {
      // フォルダーを先に表示
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }

      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'type':
          const aExt = a.name.split('.').pop() || ''
          const bExt = b.name.split('.').pop() || ''
          comparison = aExt.localeCompare(bExt)
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'modified':
          const aTime = a.lastModified?.getTime() || 0
          const bTime = b.lastModified?.getTime() || 0
          comparison = aTime - bTime
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [sortBy, sortOrder])

  // ファイル選択
  const handleFileSelect = useCallback((file: FileNode) => {
    setSelectedFile(file)
    onFileSelect?.(file)

    // チャット編集サービスに報告
    const activeSession = chatEditingService.getActiveSession()
    if (activeSession) {
      chatEditingService.addMessage(
        activeSession.id,
        `Opened file: ${file.path}`,
        'system',
        {
          workspaceFiles: fileTree.map(f => f.path),
          openFiles: [file.path],
          currentFile: file.path
        }
      )
    }
  }, [onFileSelect, fileTree])

  // フォルダーの展開/折りたたみ
  const toggleFolder = useCallback((folderId: string) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === folderId) {
          return { ...node, isExpanded: !node.isExpanded }
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) }
        }
        return node
      })
    }
    setFileTree(updateNode(fileTree))
  }, [fileTree])

  // ファイル作成ダイアログを開く
  const openCreateDialog = useCallback((type: 'file' | 'folder', parentPath: string = '') => {
    setCreateType(type)
    setCreatePath(parentPath)
    setCreateName("")
    setShowCreateDialog(true)
  }, [])

  // ファイル作成
  const handleCreate = useCallback(() => {
    if (!createName.trim()) return

    const fullPath = createPath ? `${createPath}/${createName}` : createName
    onFileCreate?.(fullPath, createType)
    setShowCreateDialog(false)
    setCreateName("")
  }, [createName, createPath, createType, onFileCreate])

  // ファイル削除
  const handleDelete = useCallback((file: FileNode) => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      onFileDelete?.(file.path)
    }
  }, [onFileDelete])

  // ファイル名変更開始
  const startRename = useCallback((file: FileNode) => {
    setEditingFile(file)
    setEditingName(file.name)
  }, [])

  // ファイル名変更完了
  const finishRename = useCallback(() => {
    if (editingFile && editingName.trim() && editingName !== editingFile.name) {
      const newPath = editingFile.path.replace(editingFile.name, editingName)
      onFileRename?.(editingFile.path, newPath)
    }
    setEditingFile(null)
    setEditingName("")
  }, [editingFile, editingName, onFileRename])

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, file: FileNode) => {
    if (!enableDragDrop) return
    setDraggedFile(file)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
  }, [enableDragDrop])

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent, file: FileNode) => {
    if (!enableDragDrop || !draggedFile) return
    e.preventDefault()
    if (file.type === 'folder' && file.id !== draggedFile.id) {
      setDropTarget(file)
      e.dataTransfer.dropEffect = 'move'
    }
  }, [enableDragDrop, draggedFile])

  // ドロップ
  const handleDrop = useCallback((e: React.DragEvent, targetFile: FileNode) => {
    if (!enableDragDrop || !draggedFile) return
    e.preventDefault()
    
    if (targetFile.type === 'folder' && targetFile.id !== draggedFile.id) {
      const newPath = `${targetFile.path}/${draggedFile.name}`
      onFileMove?.(draggedFile.path, newPath)
    }
    
    setDraggedFile(null)
    setDropTarget(null)
    setIsDragging(false)
  }, [enableDragDrop, draggedFile, onFileMove])

  // ファイルアップロード
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && onFileUpload) {
      const targetPath = selectedFile?.type === 'folder' ? selectedFile.path : ''
      onFileUpload(files, targetPath)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [selectedFile, onFileUpload])

  // ファイルアイコンの取得
  const getFileIcon = useCallback((file: FileNode) => {
    if (file.type === 'folder') {
      return file.isExpanded ? (
        <FolderOpen className="h-4 w-4 text-blue-400" />
      ) : (
        <Folder className="h-4 w-4 text-blue-400" />
      )
    }
    return <FileIcon fileName={file.name} fileType="file" size="small" />
  }, [])

  // Git ステータスバッジ
  const getGitStatusBadge = useCallback((file: FileNode) => {
    if (!showGitStatus || !file.gitStatus) return null

    const statusColors = {
      modified: 'bg-yellow-500',
      added: 'bg-green-500',
      deleted: 'bg-red-500',
      untracked: 'bg-gray-500',
      staged: 'bg-blue-500'
    }

    return (
      <div className={`w-2 h-2 rounded-full ${statusColors[file.gitStatus]}`} />
    )
  }, [showGitStatus])

  // ファイルノードをレンダリング
  const renderFileNode = useCallback((file: FileNode, depth: number = 0) => {
    if (!showHidden && file.isHidden) return null

    const isSelected = selectedFile?.id === file.id
    const isEditing = editingFile?.id === file.id
    const isDropTarget = dropTarget?.id === file.id

    return (
      <div key={file.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 pl-${Math.min(depth * 4 + 2, 20)} ${
                isSelected ? 'bg-blue-600' : ''
              } ${isDropTarget ? 'bg-blue-500/20 border border-blue-500' : ''}`}
              onClick={() => file.type === 'file' ? handleFileSelect(file) : toggleFolder(file.id)}
              onDoubleClick={() => file.type === 'file' && handleFileSelect(file)}
              draggable={enableDragDrop}
              onDragStart={(e) => handleDragStart(e, file)}
              onDragOver={(e) => handleDragOver(e, file)}
              onDrop={(e) => handleDrop(e, file)}
            >
              {/* 展開アイコン */}
              {file.type === 'folder' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFolder(file.id)
                  }}
                >
                  {file.isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}

              {/* ファイルアイコン */}
              {getFileIcon(file)}

              {/* ファイル名 */}
              {isEditing ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRename()
                    if (e.key === 'Escape') {
                      setEditingFile(null)
                      setEditingName("")
                    }
                  }}
                  className="h-6 text-sm"
                  autoFocus
                />
              ) : (
                <span className={`flex-1 ${file.isReadOnly ? 'text-gray-400' : ''}`}>
                  {file.name}
                </span>
              )}

              {/* Git ステータス */}
              {getGitStatusBadge(file)}

              {/* ファイルサイズ */}
              {file.size && viewMode === 'list' && (
                <span className="text-xs text-gray-400">
                  {formatFileSize(file.size)}
                </span>
              )}

              {/* 更新日時 */}
              {file.lastModified && viewMode === 'list' && (
                <span className="text-xs text-gray-400">
                  {file.lastModified.toLocaleDateString()}
                </span>
              )}
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent>
            {file.type === 'file' && (
              <ContextMenuItem onClick={() => handleFileSelect(file)}>
                <Eye className="h-3 w-3 mr-2" />
                Open
              </ContextMenuItem>
            )}
            <ContextMenuItem onClick={() => startRename(file)}>
              <Edit className="h-3 w-3 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onFileCopy?.(file.path, '')}>
              <Copy className="h-3 w-3 mr-2" />
              Copy
            </ContextMenuItem>
            <ContextMenuSeparator />
            {file.type === 'folder' && (
              <>
                <ContextMenuItem onClick={() => openCreateDialog('file', file.path)}>
                  <File className="h-3 w-3 mr-2" />
                  New File
                </ContextMenuItem>
                <ContextMenuItem onClick={() => openCreateDialog('folder', file.path)}>
                  <Folder className="h-3 w-3 mr-2" />
                  New Folder
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem 
              onClick={() => handleDelete(file)}
              className="text-red-400"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* 子ノード */}
        {file.type === 'folder' && file.isExpanded && file.children && (
          <div>
            {sortFiles(file.children).map(child => 
              renderFileNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    )
  }, [
    showHidden, selectedFile, editingFile, dropTarget, editingName,
    handleFileSelect, toggleFolder, enableDragDrop, handleDragStart,
    handleDragOver, handleDrop, getFileIcon, getGitStatusBadge,
    viewMode, startRename, finishRename, onFileCopy, openCreateDialog,
    handleDelete, sortFiles
  ])

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-100 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          <span className="text-sm font-medium">Explorer</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openCreateDialog('file')}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 w-6 p-0"
          >
            <Upload className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLoading(true)}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={showHidden}
                onCheckedChange={setShowHidden}
              >
                Show Hidden Files
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showGitStatus}
                onCheckedChange={() => {}}
              >
                Show Git Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <DropdownMenuRadioItem value="name">Sort by Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="type">Sort by Type</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="size">Sort by Size</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="modified">Sort by Modified</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? <SortDesc className="h-3 w-3 mr-2" /> : <SortAsc className="h-3 w-3 mr-2" />}
                {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 検索バー */}
      {enableSearch && (
        <div className="p-2 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-8 h-8 text-sm bg-gray-800 border-gray-600"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ファイルリスト */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {isSearching ? (
            // 検索結果
            <div>
              <div className="px-2 py-1 text-xs text-gray-400 border-b border-gray-700">
                Search Results ({filteredFiles.length})
              </div>
              {filteredFiles.map(file => renderFileNode(file, 0))}
            </div>
          ) : (
            // ファイルツリー
            <div>
              {sortFiles(fileTree).map(file => renderFileNode(file, 0))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ファイル作成ダイアログ */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {createType === 'file' ? 'File' : 'Folder'}</DialogTitle>
            <DialogDescription>
              {createPath && `Creating in: ${createPath}`}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder={`Enter ${createType} name...`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!createName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 隠しファイルアップロード入力 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        aria-label="Upload files"
        title="Upload files"
      />
    </div>
  )
}

// ファイルサイズをフォーマット
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export default EnhancedVSCodeFileExplorer
