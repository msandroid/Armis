"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Replace, 
  X, 
  ChevronUp, 
  ChevronDown,
  CaseSensitive,
  Regex,
  WholeWord,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react"

interface AdvancedEditorProps {
  content?: string
  language?: string
  onContentChange?: (content: string) => void
  theme?: "vs-dark" | "vs-light" | "hc-black"
  settings?: any
}

interface SearchOptions {
  caseSensitive: boolean
  useRegex: boolean
  wholeWord: boolean
}

interface SearchResult {
  line: number
  column: number
  text: string
  length: number
}

export function AdvancedEditor({ 
  content = "", 
  language = "javascript",
  onContentChange,
  theme = "vs-dark",
  settings
}: AdvancedEditorProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isReplaceVisible, setIsReplaceVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [replaceQuery, setReplaceQuery] = useState("")
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    useRegex: false,
    wholeWord: false
  })
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const [errors, setErrors] = useState<any[]>([])
  const [warnings, setWarnings] = useState<any[]>([])
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F: 検索
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setIsSearchVisible(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      // Cmd/Ctrl + H: 置換
      else if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault()
        setIsSearchVisible(true)
        setIsReplaceVisible(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      // Escape: 検索を閉じる
      else if (e.key === 'Escape' && isSearchVisible) {
        e.preventDefault()
        setIsSearchVisible(false)
        setIsReplaceVisible(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchVisible])

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    onContentChange?.(value)
    validateCode(value)
  }

  const validateCode = (code: string) => {
    // 簡易的なコード検証
    const newErrors: any[] = []
    const newWarnings: any[] = []

    const lines = code.split('\n')
    lines.forEach((line, index) => {
      // 未使用変数の検出
      if (line.includes('const ') && !line.includes('console.log') && !line.includes('return')) {
        const match = line.match(/const\s+(\w+)/)
        if (match && !code.includes(match[1])) {
          newWarnings.push({
            line: index + 1,
            message: `未使用の変数 '${match[1]}'`
          })
        }
      }

      // 構文エラーの検出
      if (line.includes('function') && !line.includes('{')) {
        newErrors.push({
          line: index + 1,
          message: '関数の構文が不完全です'
        })
      }
    })

    setErrors(newErrors)
    setWarnings(newWarnings)
  }

  const performSearch = () => {
    if (!editorRef.current || !searchQuery) return

    const text = editorRef.current.value
    const results: SearchResult[] = []
    const lines = text.split('\n')

    lines.forEach((line, lineIndex) => {
      let searchText = searchQuery
      if (!searchOptions.caseSensitive) {
        searchText = searchText.toLowerCase()
        line = line.toLowerCase()
      }

      let index = 0
      while ((index = line.indexOf(searchText, index)) !== -1) {
        results.push({
          line: lineIndex + 1,
          column: index + 1,
          text: searchText,
          length: searchText.length
        })
        index += searchText.length
      }
    })

    setSearchResults(results)
    setTotalMatches(results.length)
    setCurrentMatchIndex(0)
  }

  const goToNextMatch = () => {
    if (currentMatchIndex < searchResults.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1)
    }
  }

  const goToPreviousMatch = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1)
    }
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100">
      {/* 検索・置換バー */}
      {isSearchVisible && (
        <div className="flex items-center space-x-2 p-2 border-b border-zinc-800 bg-zinc-800">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-zinc-400" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索..."
              className="h-8 text-sm bg-zinc-700 border-zinc-600 text-zinc-100"
            />
            {totalMatches > 0 && (
              <span className="text-xs text-zinc-400">
                {currentMatchIndex + 1} / {totalMatches}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMatch}
              disabled={currentMatchIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMatch}
              disabled={currentMatchIndex === searchResults.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={performSearch}
              className="h-8 px-3 text-xs"
            >
              検索
            </Button>
          </div>

          {/* 閉じるボタン */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsSearchVisible(false)
              setIsReplaceVisible(false)
            }}
            className="h-8 w-8 p-0 text-zinc-400"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* エラー・警告バー */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="flex items-center space-x-4 p-2 border-b border-zinc-800 bg-zinc-900">
          {errors.length > 0 && (
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errors.length} エラー</span>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <Info className="h-4 w-4" />
              <span className="text-sm">{warnings.length} 警告</span>
            </div>
          )}
        </div>
      )}

      {/* メインエディター */}
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleEditorChange}
          className="w-full h-full bg-zinc-900 text-zinc-100 p-4 font-mono text-sm resize-none border-none outline-none"
          style={{
            fontFamily: settings?.fontFamily || "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: settings?.fontSize || 14,
            lineHeight: '1.5',
            tabSize: settings?.tabSize || 2
          }}
          placeholder="コードを入力してください..."
        />
      </div>

      {/* ステータスバー */}
      <div className="flex items-center justify-between p-2 border-t border-zinc-800 bg-zinc-900 text-xs text-zinc-400">
        <div className="flex items-center space-x-4">
          <span>{language}</span>
          <span>UTF-8</span>
          {totalMatches > 0 && (
            <span>{totalMatches} マッチ</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>Spaces: {settings?.tabSize || 2}</span>
        </div>
      </div>
    </div>
  )
} 