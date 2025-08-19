"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Settings, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  FilePlus,
  FolderPlus
} from "lucide-react"
import { FileIcon, FolderFileIcon } from "@/components/file-icons"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileItem[]
  isOpen?: boolean
  isEditing?: boolean
}

interface FileManagerProps {
  files?: FileItem[]
  onFileSelect?: (file: FileItem) => void
  onFileCreate?: (parentPath: string, name: string, type: 'file' | 'folder') => void
  onFileDelete?: (fileId: string) => void
  onFileRename?: (fileId: string, newName: string) => void
}

const defaultFiles: FileItem[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    path: '/src',
    isOpen: true,
    children: [
      {
        id: '1-1',
        name: 'components',
        type: 'folder',
        path: '/src/components',
        isOpen: true,
        children: [
          { id: '1-1-1', name: 'ai-chat.tsx', type: 'file', path: '/src/components/ai-chat.tsx' },
          { id: '1-1-2', name: 'simple-editor.tsx', type: 'file', path: '/src/components/simple-editor.tsx' },
          { id: '1-1-3', name: 'file-explorer.tsx', type: 'file', path: '/src/components/file-explorer.tsx' }
        ]
      },
      {
        id: '1-2',
        name: 'pages',
        type: 'folder',
        path: '/src/pages',
        isOpen: false,
        children: [
          { id: '1-2-1', name: 'index.tsx', type: 'file', path: '/src/pages/index.tsx' }
        ]
      },
      { id: '1-3', name: 'styles.css', type: 'file', path: '/src/styles.css' }
    ]
  },
  {
    id: '2',
    name: 'public',
    type: 'folder',
    path: '/public',
    isOpen: false,
    children: [
      { id: '2-1', name: 'icon.png', type: 'file', path: '/public/icon.png' },
      { id: '2-2', name: 'favicon.ico', type: 'file', path: '/public/favicon.ico' }
    ]
  },
  { id: '3', name: 'package.json', type: 'file', path: '/package.json' },
  { id: '4', name: 'README.md', type: 'file', path: '/README.md' }
]

export function FileManager({ 
  files = defaultFiles, 
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename 
}: FileManagerProps) {
  const [fileTree, setFileTree] = useState<FileItem[]>(files)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createType, setCreateType] = useState<'file' | 'folder'>('file')
  const [createName, setCreateName] = useState("")
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // ファイルツリーの更新関数
  const updateFileTree = (items: FileItem[], updater: (item: FileItem) => FileItem): FileItem[] => {
    return items.map(item => {
      const updatedItem = updater(item)
      if (updatedItem.children) {
        updatedItem.children = updateFileTree(updatedItem.children, updater)
      }
      return updatedItem
    })
  }

  // ファイルツリー内のアイテムを検索
  const findFileById = (items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findFileById(item.children, id)
        if (found) return found
      }
    }
    return null
  }

  // フォルダの開閉
  const toggleFolder = (fileId: string) => {
    setFileTree(prev => updateFileTree(prev, item => 
      item.id === fileId ? { ...item, isOpen: !item.isOpen } : item
    ))
  }

  // ファイルアイコンの取得（Material Icons使用）
  const getFileIcon = (fileName: string, type: 'file' | 'folder', isOpen = false) => {
    if (type === 'folder') {
      return <FolderFileIcon isOpen={isOpen} size="small" />
    }
    
    return <FileIcon fileName={fileName} fileType="file" size="small" />
  }

  // ファイル作成
  const handleCreateFile = () => {
    if (!createName.trim()) return

    const newId = Date.now().toString()
    const parentPath = contextMenuFile?.path || '/'
    const newPath = `${parentPath}/${createName}`
    
    const newItem: FileItem = {
      id: newId,
      name: createName,
      type: createType,
      path: newPath,
      children: createType === 'folder' ? [] : undefined
    }

    if (contextMenuFile) {
      // 特定のフォルダ内に作成
      setFileTree(prev => updateFileTree(prev, item => {
        if (item.id === contextMenuFile.id) {
          return {
            ...item,
            children: [...(item.children || []), newItem],
            isOpen: true
          }
        }
        return item
      }))
    } else {
      // ルートに作成
      setFileTree(prev => [...prev, newItem])
    }

    onFileCreate?.(parentPath, createName, createType)
    setIsCreateDialogOpen(false)
    setCreateName("")
    setContextMenuFile(null)
  }

  // ファイル削除
  const handleDeleteFile = (fileId: string) => {
    setFileTree(prev => prev.filter(item => item.id !== fileId))
    onFileDelete?.(fileId)
    if (selectedFile === fileId) {
      setSelectedFile(null)
    }
  }

  // ファイルリネーム開始
  const startRename = (fileId: string, currentName: string) => {
    setEditingFile(fileId)
    setEditName(currentName)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // ファイルリネーム完了
  const finishRename = () => {
    if (!editingFile || !editName.trim()) return

    setFileTree(prev => updateFileTree(prev, item => 
      item.id === editingFile ? { ...item, name: editName } : item
    ))
    
    onFileRename?.(editingFile, editName)
    setEditingFile(null)
    setEditName("")
  }

  // リフレッシュ
  const handleRefresh = () => {
    // 実際のアプリケーションでは、ファイルシステムから最新の状態を取得
    console.log('Refreshing file tree...')
  }

  // フィルタリングされたファイルツリーの取得
  const getFilteredFileTree = (items: FileItem[]): FileItem[] => {
    if (!searchQuery.trim()) return items

    const query = searchQuery.toLowerCase()
    const filterItems = (items: FileItem[]): FileItem[] => {
      return items.filter(item => {
        const nameMatches = item.name.toLowerCase().includes(query)
        const hasMatchingChildren = item.children && filterItems(item.children).length > 0
        return nameMatches || hasMatchingChildren
      }).map(item => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined,
        isOpen: searchQuery.trim() ? true : item.isOpen // 検索中は自動展開
      }))
    }

    return filterItems(items)
  }

  // ドラッグ&ドロップ関連の状態
  const [draggedItem, setDraggedItem] = useState<FileItem | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  // ドラッグ開始
  const handleDragStart = (e: React.DragEvent, item: FileItem) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
    setDraggedItem(item)
  }

  // ドロップ許可
  const handleDragOver = (e: React.DragEvent, item: FileItem) => {
    if (item.type === 'folder' && draggedItem && draggedItem.id !== item.id) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDropTarget(item.id)
    }
  }

  // ドロップ処理
  const handleDrop = (e: React.DragEvent, targetItem: FileItem) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetItem.id) return

    // ファイルを移動
    moveFile(draggedItem, targetItem)
    setDraggedItem(null)
    setDropTarget(null)
  }

  // ファイル移動処理
  const moveFile = (sourceItem: FileItem, targetFolder: FileItem) => {
    if (targetFolder.type !== 'folder') return

    // 元の場所から削除
    setFileTree(prev => removeItemFromTree(prev, sourceItem.id))
    
    // 新しい場所に追加
    const movedItem = {
      ...sourceItem,
      path: `${targetFolder.path}/${sourceItem.name}`
    }
    
    setFileTree(prev => updateFileTree(prev, item => {
      if (item.id === targetFolder.id) {
        return {
          ...item,
          children: [...(item.children || []), movedItem],
          isOpen: true
        }
      }
      return item
    }))
  }

  // ツリーからアイテムを削除
  const removeItemFromTree = (items: FileItem[], itemId: string): FileItem[] => {
    return items.filter(item => {
      if (item.id === itemId) return false
      if (item.children) {
        item.children = removeItemFromTree(item.children, itemId)
      }
      return true
    })
  }

  // ファイルツリーのレンダリング
  const renderFileTree = (items: FileItem[], level = 0) => {
    const filteredItems = getFilteredFileTree(items)
    
    return filteredItems.map(item => (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger>
          <div
            className={`flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer text-gray-900 ${
              selectedFile === item.id ? 'bg-blue-100' : ''
            } ${dropTarget === item.id ? 'bg-green-100 border-2 border-green-300' : ''}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDrop={(e) => handleDrop(e, item)}
            onDragLeave={() => setDropTarget(null)}
            onClick={() => {
              if (item.type === 'folder') {
                toggleFolder(item.id)
              } else {
                setSelectedFile(item.id)
                onFileSelect?.(item)
              }
            }}
            onDoubleClick={() => {
              if (item.type === 'folder') {
                toggleFolder(item.id)
              } else {
                setSelectedFile(item.id)
                onFileSelect?.(item)
              }
            }}
          >
            {item.type === 'folder' ? (
              <div className="flex items-center">
                {item.isOpen ? (
                  <ChevronDown className="h-3 w-3 text-gray-600 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-600 mr-1" />
                )}
                <div className="mr-2">
                  {getFileIcon(item.name, item.type, item.isOpen)}
                </div>
              </div>
            ) : (
              <div className="w-6 mr-2 flex justify-center">
                {getFileIcon(item.name, item.type)}
              </div>
            )}
            
            {editingFile === item.id ? (
              <Input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={finishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishRename()
                  if (e.key === 'Escape') {
                    setEditingFile(null)
                    setEditName("")
                  }
                }}
                className="h-6 text-sm text-gray-900"
                autoFocus
              />
            ) : (
              <span className="text-sm truncate flex-1 text-gray-900">{item.name}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onFileSelect?.(item)}>
            Open
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => startRename(item.id, item.name)}>
            <Edit className="h-4 w-4 mr-2 text-gray-700" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={() => {
              setContextMenuFile(item)
              setCreateType('file')
              setIsCreateDialogOpen(true)
            }}
          >
            <FilePlus className="h-4 w-4 mr-2 text-gray-700" />
            New File
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={() => {
              setContextMenuFile(item)
              setCreateType('folder')
              setIsCreateDialogOpen(true)
            }}
          >
            <FolderPlus className="h-4 w-4 mr-2 text-gray-700" />
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => handleDeleteFile(item.id)}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ))
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="New File/Folder"
              >
                <Plus className="h-3 w-3 text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                onClick={() => {
                  setContextMenuFile(null)
                  setCreateType('file')
                  setIsCreateDialogOpen(true)
                }}
              >
                <FilePlus className="h-4 w-4 mr-2 text-gray-700" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setContextMenuFile(null)
                  setCreateType('folder')
                  setIsCreateDialogOpen(true)
                }}
              >
                <FolderPlus className="h-4 w-4 mr-2 text-gray-700" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Refresh"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3 w-3 text-gray-700" />
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="More Options"
            >
              <MoreHorizontal className="h-3 w-3 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2 text-gray-700" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2 text-gray-700" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="pl-8 h-8 text-xs text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {renderFileTree(fileTree)}
          {/* Empty space for root-level drops */}
          <div 
            className="h-8 w-full"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (draggedItem) {
                // Move to root
                setFileTree(prev => {
                  const filtered = removeItemFromTree(prev, draggedItem.id)
                  return [...filtered, { ...draggedItem, path: `/${draggedItem.name}` }]
                })
                setDraggedItem(null)
              }
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between text-xs text-gray-700">
          <span>Files: {fileTree.length}</span>
          <span>{selectedFile ? 'Selected' : 'No selection'}</span>
        </div>
      </div>

      {/* Create File/Folder Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'file' ? 'File' : 'Folder'}
            </DialogTitle>
            <DialogDescription>
              {contextMenuFile 
                ? `Create a new ${createType} in "${contextMenuFile.name}"`
                : `Create a new ${createType} in the root directory`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={`Enter ${createType} name...`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile()
                if (e.key === 'Escape') setIsCreateDialogOpen(false)
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile} disabled={!createName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 