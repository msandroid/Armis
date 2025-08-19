"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Archive
} from "lucide-react"

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileItem[]
  isOpen?: boolean
}

interface FileExplorerProps {
  files?: FileItem[]
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

export function FileExplorer({ files = defaultFiles }: FileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileItem[]>(files)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const toggleFolder = (fileId: string) => {
    const updateFileTree = (items: FileItem[]): FileItem[] => {
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
  }

  const getFileIcon = (fileName: string, type: 'file' | 'folder') => {
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
  }

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <div
          className={`flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer ${
            selectedFile === item.id ? 'bg-blue-100' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.id)
            } else {
              setSelectedFile(item.id)
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
          <span className="text-sm truncate">{item.name}</span>
        </div>
        {item.children && item.isOpen && renderFileTree(item.children, level + 1)}
      </div>
    ))
  }

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
          >
            <Plus className="h-3 w-3" />
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
        <div className="py-2">
          {renderFileTree(fileTree)}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Files: {fileTree.length}</span>
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
  )
} 