"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  Calendar,
  Settings,
  ChevronDown
} from "lucide-react"
import { FileIcon, FolderFileIcon } from "@/components/file-icons"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Checkbox
} from "@/components/ui/checkbox"

interface SearchResult {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  lastModified: Date
  content?: string
  matchedContent?: string[]
  language?: string
}

interface SearchFilter {
  fileTypes: string[]
  sizeRange: { min?: number; max?: number }
  dateRange: { from?: Date; to?: Date }
  includeContent: boolean
  caseSensitive: boolean
  useRegex: boolean
  includeHidden: boolean
}

interface AdvancedFileSearchProps {
  onResultSelect?: (result: SearchResult) => void
  onClose?: () => void
}

const FILE_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Files', extensions: ['.txt', '.md', '.log'] },
  { value: 'code', label: 'Code Files', extensions: ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs'] },
  { value: 'style', label: 'Style Files', extensions: ['.css', '.scss', '.sass', '.less'] },
  { value: 'config', label: 'Config Files', extensions: ['.json', '.yaml', '.yml', '.xml', '.ini', '.toml'] },
  { value: 'image', label: 'Image Files', extensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'] },
  { value: 'video', label: 'Video Files', extensions: ['.mp4', '.avi', '.mov', '.mkv', '.webm'] },
  { value: 'audio', label: 'Audio Files', extensions: ['.mp3', '.wav', '.flac', '.ogg', '.aac'] },
  { value: 'archive', label: 'Archive Files', extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'] },
]

export function AdvancedFileSearch({ onResultSelect, onClose }: AdvancedFileSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState<SearchFilter>({
    fileTypes: [],
    sizeRange: {},
    dateRange: {},
    includeContent: true,
    caseSensitive: false,
    useRegex: false,
    includeHidden: false
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // コンポーネントマウント時にフォーカス
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // 検索実行（デバウンス付き）
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim().length < 2) {
      setResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch()
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, filters])

  // 検索実行
  const performSearch = async () => {
    setIsSearching(true)
    try {
      const searchParams = new URLSearchParams({
        q: query,
        includeContent: filters.includeContent.toString(),
        caseSensitive: filters.caseSensitive.toString(),
        useRegex: filters.useRegex.toString(),
        includeHidden: filters.includeHidden.toString(),
        fileTypes: filters.fileTypes.join(','),
        ...(filters.sizeRange.min && { sizeMin: filters.sizeRange.min.toString() }),
        ...(filters.sizeRange.max && { sizeMax: filters.sizeRange.max.toString() }),
        ...(filters.dateRange.from && { dateFrom: filters.dateRange.from.toISOString() }),
        ...(filters.dateRange.to && { dateTo: filters.dateRange.to.toISOString() })
      })

      const response = await fetch(`/api/files/search?${searchParams}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // フィルター更新
  const updateFilter = <K extends keyof SearchFilter>(
    key: K, 
    value: SearchFilter[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // ファイルタイプフィルター切り替え
  const toggleFileType = (type: string) => {
    const extensions = FILE_TYPE_OPTIONS.find(opt => opt.value === type)?.extensions || []
    setFilters(prev => {
      const newTypes = prev.fileTypes.includes(type)
        ? prev.fileTypes.filter(t => t !== type)
        : [...prev.fileTypes, type]
      return { ...prev, fileTypes: newTypes }
    })
  }

  // ファイルアイコン取得（Material Icons使用）
  const getFileIcon = (fileName: string, type: 'file' | 'folder') => {
    if (type === 'folder') {
      return <FolderFileIcon size="small" />
    }
    
    return <FileIcon fileName={fileName} fileType="file" size="small" />
  }

  // ファイルサイズフォーマット
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // 相対時間フォーマット
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced File Search
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* 検索フィールド */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files and folders..."
              className="pl-10 pr-4"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* フィルター */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              Advanced
              <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>

            {/* アクティブフィルターの表示 */}
            {filters.fileTypes.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Types: {filters.fileTypes.length}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('fileTypes', [])}
                />
              </Badge>
            )}
            
            {filters.includeContent && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Content search
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('includeContent', false)}
                />
              </Badge>
            )}
          </div>

          {/* 高度なフィルター */}
          {showAdvanced && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              {/* ファイルタイプ */}
              <div>
                <h4 className="text-sm font-medium mb-2">File Types</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FILE_TYPE_OPTIONS.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={filters.fileTypes.includes(type.value)}
                        onCheckedChange={() => toggleFileType(type.value)}
                      />
                      <label htmlFor={type.value} className="text-sm">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 検索オプション */}
              <div>
                <h4 className="text-sm font-medium mb-2">Search Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeContent"
                      checked={filters.includeContent}
                      onCheckedChange={(checked) => updateFilter('includeContent', !!checked)}
                    />
                    <label htmlFor="includeContent" className="text-sm">
                      Search in file content
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="caseSensitive"
                      checked={filters.caseSensitive}
                      onCheckedChange={(checked) => updateFilter('caseSensitive', !!checked)}
                    />
                    <label htmlFor="caseSensitive" className="text-sm">
                      Case sensitive
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useRegex"
                      checked={filters.useRegex}
                      onCheckedChange={(checked) => updateFilter('useRegex', !!checked)}
                    />
                    <label htmlFor="useRegex" className="text-sm">
                      Use regular expressions
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHidden"
                      checked={filters.includeHidden}
                      onCheckedChange={(checked) => updateFilter('includeHidden', !!checked)}
                    />
                    <label htmlFor="includeHidden" className="text-sm">
                      Include hidden files
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* 検索結果 */}
        <div className="space-y-2">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : results.length === 0 && query.trim() ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm">Try adjusting your search terms or filters</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Start typing to search files and folders</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </span>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-1">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border"
                    onClick={() => onResultSelect?.(result)}
                  >
                    <div className="mt-0.5">
                      {getFileIcon(result.name, result.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {result.name}
                        </span>
                        {result.language && (
                          <Badge variant="outline" className="text-xs">
                            {result.language}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 truncate">
                        {result.path}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        {result.size && (
                          <span className="flex items-center gap-1">
                            <File className="h-3 w-3" />
                            {formatFileSize(result.size)}
                          </span>
                        )}
                        
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(result.lastModified)}
                        </span>
                      </div>

                      {/* マッチしたコンテンツのプレビュー */}
                      {result.matchedContent && result.matchedContent.length > 0 && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                          {result.matchedContent.slice(0, 2).map((match, index) => (
                            <div key={index} className="font-mono text-gray-700">
                              ...{match}...
                            </div>
                          ))}
                          {result.matchedContent.length > 2 && (
                            <div className="text-gray-500">
                              +{result.matchedContent.length - 2} more matches
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
