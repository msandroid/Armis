"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Replace, 
  X, 
  ChevronUp, 
  ChevronDown,
  CaseSensitive,
  Regex,
  WholeWord,
  ArrowLeft,
  ArrowRight,
  ReplaceAll
} from "lucide-react"

interface SearchReplaceProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string, options: SearchOptions) => void
  onReplace: (query: string, replacement: string, options: SearchOptions) => void
  onReplaceAll: (query: string, replacement: string, options: SearchOptions) => void
  searchResults?: SearchResult[]
  currentMatchIndex?: number
  totalMatches?: number
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

export function SearchReplace({ 
  isOpen, 
  onClose, 
  onSearch, 
  onReplace, 
  onReplaceAll,
  searchResults = [],
  currentMatchIndex = 0,
  totalMatches = 0
}: SearchReplaceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [replaceQuery, setReplaceQuery] = useState("")
  const [isReplaceMode, setIsReplaceMode] = useState(false)
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    useRegex: false,
    wholeWord: false
  })
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery) {
      onSearch(searchQuery, options)
    }
  }, [searchQuery, options])

  const handleSearch = () => {
    if (searchQuery) {
      onSearch(searchQuery, options)
    }
  }

  const handleReplace = () => {
    if (searchQuery && replaceQuery) {
      onReplace(searchQuery, replaceQuery, options)
    }
  }

  const handleReplaceAll = () => {
    if (searchQuery && replaceQuery) {
      onReplaceAll(searchQuery, replaceQuery, options)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault()
        if (e.shiftKey) {
          // Shift + Enter: 前のマッチに移動
          // この機能は親コンポーネントで実装
        } else {
          // Enter: 次のマッチに移動
          // この機能は親コンポーネントで実装
        }
        break
      case "Escape":
        e.preventDefault()
        onClose()
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 rounded-b-lg shadow-lg">
      <div className="flex items-center space-x-2 p-3">
        {/* 検索入力 */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="検索..."
            className="w-64 pl-8 bg-zinc-800 border-zinc-700 text-zinc-200"
          />
        </div>

        {/* 置換入力 */}
        {isReplaceMode && (
          <div className="relative">
            <Replace className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="置換..."
              className="w-64 pl-8 bg-zinc-800 border-zinc-700 text-zinc-200"
            />
          </div>
        )}

        {/* 検索オプション */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOptions(prev => ({ ...prev, caseSensitive: !prev.caseSensitive }))}
            className={`h-8 w-8 p-0 ${options.caseSensitive ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
            title="大文字小文字を区別"
          >
            <CaseSensitive className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOptions(prev => ({ ...prev, wholeWord: !prev.wholeWord }))}
            className={`h-8 w-8 p-0 ${options.wholeWord ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
            title="単語全体に一致"
          >
            <WholeWord className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOptions(prev => ({ ...prev, useRegex: !prev.useRegex }))}
            className={`h-8 w-8 p-0 ${options.useRegex ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
            title="正規表現"
          >
            <Regex className="h-4 w-4" />
          </Button>
        </div>

        {/* 検索結果カウンター */}
        {totalMatches > 0 && (
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <span>{currentMatchIndex + 1} / {totalMatches}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="前のマッチ"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="次のマッチ"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* 置換ボタン */}
        {isReplaceMode && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReplace}
              className="h-8 px-3 text-xs"
            >
              <Replace className="h-3 w-3 mr-1" />
              置換
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReplaceAll}
              className="h-8 px-3 text-xs"
            >
              <ReplaceAll className="h-3 w-3 mr-1" />
              すべて置換
            </Button>
          </div>
        )}

        {/* モード切り替え */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsReplaceMode(!isReplaceMode)}
          className={`h-8 px-3 text-xs ${isReplaceMode ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
        >
          <Replace className="h-3 w-3 mr-1" />
          置換
        </Button>

        {/* 閉じるボタン */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-zinc-400"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 検索結果リスト */}
      {searchResults.length > 0 && (
        <div className="border-t border-zinc-700 max-h-48 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-zinc-500 mb-2">検索結果:</div>
            {searchResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                  index === currentMatchIndex ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800 text-zinc-300'
                }`}
                onClick={() => {
                  // このマッチにジャンプする処理
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs">行 {result.line}:</span>
                  <span className="text-sm">{result.text}</span>
                </div>
                <span className="text-xs opacity-60">{result.length}文字</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 