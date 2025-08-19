"use client"

import { useState, useEffect } from "react"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Upload, 
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Filter,
  X
} from "lucide-react"
import { FolderFileIcon } from "@/components/file-icons"
import { FileManager } from "@/components/file-manager"
import { AdvancedFileSearch } from "@/components/advanced-file-search"
import { FilePreview } from "@/components/file-preview"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileItem[]
  isOpen?: boolean
  size?: number
  lastModified?: Date
}

interface EnhancedFileManagerProps {
  className?: string
  onFileSelect?: (file: FileItem) => void
  onFileChange?: (files: FileItem[]) => void
  showPreview?: boolean
  showSearch?: boolean
}

export function EnhancedFileManager({ 
  className,
  onFileSelect,
  onFileChange,
  showPreview = true,
  showSearch = true
}: EnhancedFileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(showPreview)
  const [isLoading, setIsLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<FileItem[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])

  // 初期ファイルツリーの読み込み
  useEffect(() => {
    loadFileTree()
  }, [])

  // ファイルツリーの読み込み
  const loadFileTree = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/files')
      if (!response.ok) throw new Error('Failed to load files')
      
      const data = await response.json()
      // APIレスポンスを階層構造に変換
      const hierarchicalFiles = convertToHierarchy(data.files || [])
      setFiles(hierarchicalFiles)
      onFileChange?.(hierarchicalFiles)
    } catch (error) {
      console.error('Failed to load file tree:', error)
      // エラー時はデフォルトのファイル構造を使用
      setFiles([])
      onFileChange?.([])
    } finally {
      setIsLoading(false)
    }
  }

  // フラットなファイルリストを階層構造に変換
  const convertToHierarchy = (flatFiles: any[]): FileItem[] => {
    const fileMap = new Map<string, FileItem>()
    const rootFiles: FileItem[] = []

    // まず全てのファイルをマップに追加
    flatFiles.forEach(file => {
      const fileItem: FileItem = {
        id: file.path,
        name: file.name,
        type: file.type,
        path: file.path,
        size: file.size,
        lastModified: file.lastModified,
        children: file.type === 'folder' ? [] : undefined,
        isOpen: false
      }
      fileMap.set(file.path, fileItem)
    })

    // 階層構造を構築
    flatFiles.forEach(file => {
      const fileItem = fileMap.get(file.path)!
      const parentPath = file.path.substring(0, file.path.lastIndexOf('/'))
      
      if (parentPath === '' || parentPath === file.path) {
        // ルートファイル
        rootFiles.push(fileItem)
      } else {
        // 子ファイル
        const parent = fileMap.get(parentPath)
        if (parent && parent.children) {
          parent.children.push(fileItem)
        }
      }
    })

    return rootFiles
  }

  // ファイル選択
  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file)
    onFileSelect?.(file)
  }

  // ファイル作成
  const handleFileCreate = async (parentPath: string, name: string, type: 'file' | 'folder') => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'file' ? 'create' : 'createFolder',
          [type === 'file' ? 'filePath' : 'folderPath']: `${parentPath}/${name}`,
          ...(type === 'file' && { content: '' })
        })
      })

      if (!response.ok) throw new Error('Failed to create file')
      
      // ファイルツリーを再読み込み
      await loadFileTree()
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  // ファイル削除
  const handleFileDelete = async (fileId: string) => {
    const file = findFileById(files, fileId)
    if (!file) return

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          filePath: file.path
        })
      })

      if (!response.ok) throw new Error('Failed to delete file')
      
      // 選択中のファイルが削除された場合はクリア
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
      }
      
      // ファイルツリーを再読み込み
      await loadFileTree()
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  // ファイル名変更
  const handleFileRename = async (fileId: string, newName: string) => {
    const file = findFileById(files, fileId)
    if (!file) return

    try {
      const newPath = `${file.path.substring(0, file.path.lastIndexOf('/'))}/${newName}`
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          oldPath: file.path,
          newPath
        })
      })

      if (!response.ok) throw new Error('Failed to rename file')
      
      // ファイルツリーを再読み込み
      await loadFileTree()
    } catch (error) {
      console.error('Failed to rename file:', error)
    }
  }

  // ファイルアップロード
  const handleFileUpload = async (files: FileList) => {
    setUploadingFiles(Array.from(files))
    setUploadProgress(0)
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()
        
        reader.onload = async (e) => {
          const content = e.target?.result as string
          
          try {
            const response = await fetch('/api/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'upload',
                filePath: file.name,
                content: content
              })
            })
            
            if (!response.ok) throw new Error('Failed to upload file')
            
            // プログレス更新
            setUploadProgress(((i + 1) / files.length) * 100)
          } catch (error) {
            console.error('Failed to upload file:', error)
          }
        }
        
        reader.readAsText(file)
      }
    } catch (error) {
      console.error('Upload error:', error)
    }
    
    setUploadingFiles([])
    setUploadProgress(0)
    setIsUploadDialogOpen(false)
    
    // ファイルツリーを再読み込み
    await loadFileTree()
  }

  // 検索結果選択
  const handleSearchResultSelect = (result: any) => {
    const file: FileItem = {
      id: result.id,
      name: result.name,
      type: result.type,
      path: result.path,
      size: result.size,
      lastModified: result.lastModified ? new Date(result.lastModified) : undefined
    }
    
    handleFileSelect(file)
    setIsSearchOpen(false)
  }

  // ファイル検索
  const findFileById = (files: FileItem[], id: string): FileItem | null => {
    for (const file of files) {
      if (file.id === id) return file
      if (file.children) {
        const found = findFileById(file.children, id)
        if (found) return found
      }
    }
    return null
  }

  // リフレッシュ
  const handleRefresh = () => {
    loadFileTree()
  }

  return (
    <TooltipProvider>
      <div className={`h-full flex flex-col ${className}`}>
        {/* ツールバー */}
        <div className="flex items-center justify-between p-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">File Manager</h2>
          </div>
          
          <div className="flex items-center gap-1">
            {showSearch && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchOpen(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Advanced Search</TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload Files</TooltipContent>
            </Tooltip>
            
            {showPreview && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    className="h-8 w-8 p-0"
                  >
                    {isPreviewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
                </TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* ファイルツリー */}
            <ResizablePanel 
              defaultSize={isPreviewVisible ? 50 : 100} 
              minSize={30}
            >
              <FileManager
                files={files}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                onFileRename={handleFileRename}
              />
            </ResizablePanel>

            {/* プレビューパネル */}
            {isPreviewVisible && selectedFile && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full overflow-auto bg-gray-50">
                    {selectedFile.type === 'file' ? (
                      <FilePreview
                        filePath={selectedFile.path}
                        fileName={selectedFile.name}
                        fileSize={selectedFile.size}
                        lastModified={selectedFile.lastModified}
                        className="m-4"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="mb-4">
                            <FolderFileIcon isOpen={true} size="large" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Folder Selected
                          </h3>
                          <p className="text-gray-600">
                            Select a file to preview its contents
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* 高度な検索ダイアログ */}
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <AdvancedFileSearch
              onResultSelect={handleSearchResultSelect}
              onClose={() => setIsSearchOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* ファイルアップロードダイアログ */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Select files to upload to the current directory
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  Select files to upload
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(e.target.files)
                    }
                  }}
                  className="w-full"
                  accept="*/*"
                  title="Select files to upload"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Select multiple files to upload
                </p>
              </div>

              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
