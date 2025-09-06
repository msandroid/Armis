import { useState, useEffect } from 'react'
import { Upload, File, Trash2, Download, Eye, Clock, CheckCircle, XCircle, RefreshCw, MessageSquare, X } from 'lucide-react'
import { GoogleDirectService, FileMetadata } from '@/services/llm/google-direct-service'
import { FileChat } from './FileChat'

interface FileManagerProps {
  googleService: GoogleDirectService
  onFileSelect?: (file: FileMetadata) => void
}

export function FileManager({ googleService, onFileSelect }: FileManagerProps) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null)
  const [showChat, setShowChat] = useState(false)

  // ファイルリストを取得
  const loadFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const fileList = await googleService.listFiles(20)
      setFiles(fileList)
      console.log('ファイルリスト取得成功:', fileList.length, '個のファイル')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get file list')
      console.error('ファイルリスト取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  // ファイルをアップロード
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      console.log('ファイルアップロード開始:', file.name)
      const uploadedFile = await googleService.uploadFile(file)
      console.log('ファイルアップロード成功:', uploadedFile)
      
      // ファイルリストを更新
      await loadFiles()
      
      // 成功メッセージ
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      console.error('ファイルアップロードエラー:', err)
    } finally {
      setUploading(false)
      // ファイル入力をリセット
      event.target.value = ''
    }
  }

  // ファイルを削除
  const handleFileDelete = async (fileName: string) => {
    if (!confirm('このファイルを削除しますか？')) return

    try {
      await googleService.deleteFile(fileName)
      console.log('ファイル削除成功:', fileName)
      
      // ファイルリストを更新
      await loadFiles()
      
      // 選択中のファイルが削除された場合、選択をクリア
      if (selectedFile?.name === fileName) {
        setSelectedFile(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
      console.error('ファイル削除エラー:', err)
    }
  }

  // ファイルを選択
  const handleFileSelect = (file: FileMetadata) => {
    setSelectedFile(file)
    onFileSelect?.(file)
  }

  // チャットを開始
  const handleStartChat = (file: FileMetadata) => {
    setSelectedFile(file)
    setShowChat(true)
  }

  // チャットを閉じる
  const handleCloseChat = () => {
    setShowChat(false)
    setSelectedFile(null)
  }

  // ファイルの状態アイコンを取得
  const getStatusIcon = (state?: string) => {
    switch (state) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'PROCESSING':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  // ファイルサイズを人間が読みやすい形式に変換
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '不明'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // ファイルタイプを取得
  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType.startsWith('audio/')) return 'Audio'
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('document')) return 'Document'
    return 'Other'
  }

  // コンポーネントマウント時にファイルリストを読み込み
  useEffect(() => {
    loadFiles()
  }, [])

  return (
    <div className="flex h-full">
      {/* ファイル管理パネル */}
      <div className={`${showChat ? 'w-1/2' : 'w-full'} space-y-4 p-4 border-r border-gray-200 dark:border-gray-700`}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Gemini Files API File Management
          </h3>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="text-sm text-red-800 dark:text-red-200">
              Error: {error}
            </div>
          </div>
        )}

        {/* ファイルアップロード */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload files to use with Gemini API
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.txt"
              />
              <span className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50">
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </>
                )}
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Supported formats: Video, Audio, Image, PDF, Documents
            </p>
          </div>
        </div>

        {/* ファイルリスト */}
        <div className="space-y-2">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
            Uploaded Files ({files.length})
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading file list...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No uploaded files
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.name}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedFile?.name === file.name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {file.displayName}
                          </span>
                          {getStatusIcon(file.state)}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{getFileType(file.mimeType)}</span>
                          <span>{formatFileSize(file.sizeBytes)}</span>
                          {file.createTime && (
                            <span>{new Date(file.createTime).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileSelect(file)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Select file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartChat(file)
                        }}
                        className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                        title="Start chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileDelete(file.name)
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 選択されたファイルの詳細 */}
        {selectedFile && !showChat && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
              Selected File
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div><strong>Name:</strong> {selectedFile.displayName}</div>
              <div><strong>Type:</strong> {getFileType(selectedFile.mimeType)} ({selectedFile.mimeType})</div>
              <div><strong>Size:</strong> {formatFileSize(selectedFile.sizeBytes)}</div>
              <div><strong>Status:</strong> {selectedFile.state || 'Unknown'}</div>
              {selectedFile.createTime && (
                <div><strong>Created:</strong> {new Date(selectedFile.createTime).toLocaleString()}</div>
              )}
              <div><strong>URI:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{selectedFile.uri}</code></div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => handleStartChat(selectedFile)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Start Chat with This File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* チャットパネル */}
      {showChat && selectedFile && (
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              File Chat
            </h3>
            <button
              onClick={handleCloseChat}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1">
            <FileChat googleService={googleService} selectedFile={selectedFile} />
          </div>
        </div>
      )}
    </div>
  )
}
