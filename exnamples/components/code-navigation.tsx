"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  ArrowRight, 
  FileText, 
  Code, 
  Zap,
  Variable,
  Square,
  Circle,
  Type,
  Package,
  Settings,
  Key
} from "lucide-react"

interface Symbol {
  name: string
  type: "function" | "variable" | "class" | "interface" | "type" | "method" | "property"
  line: number
  column: number
  file: string
  description?: string
}

interface Reference {
  line: number
  column: number
  file: string
  context: string
}

interface CodeNavigationProps {
  editor: any
  currentFile: string
  onNavigateToSymbol?: (symbol: Symbol) => void
  onNavigateToReference?: (reference: Reference) => void
}

export function CodeNavigation({ 
  editor, 
  currentFile, 
  onNavigateToSymbol, 
  onNavigateToReference 
}: CodeNavigationProps) {
  const [showSymbolSearch, setShowSymbolSearch] = useState(false)
  const [showReferences, setShowReferences] = useState(false)
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [references, setReferences] = useState<Reference[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + O: シンボル検索
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault()
        setShowSymbolSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      // Cmd/Ctrl + Shift + F12: 参照の検索
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F12') {
        e.preventDefault()
        findReferences()
      }
      // F12: 定義へのジャンプ
      else if (e.key === 'F12') {
        e.preventDefault()
        goToDefinition()
      }
      // Escape: モーダルを閉じる
      else if (e.key === 'Escape') {
        if (showSymbolSearch) setShowSymbolSearch(false)
        if (showReferences) setShowReferences(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSymbolSearch, showReferences])

  const extractSymbols = (code: string): Symbol[] => {
    const symbols: Symbol[] = []
    const lines = code.split('\n')

    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1

      // 関数の検出
      const functionMatches = line.match(/(?:function\s+)?(\w+)\s*\(/g)
      if (functionMatches) {
        functionMatches.forEach(match => {
          const name = match.replace(/(?:function\s+)?(\w+)\s*\(/, '$1')
          symbols.push({
            name,
            type: 'function',
            line: lineNumber,
            column: line.indexOf(name) + 1,
            file: currentFile,
            description: `関数: ${name}`
          })
        })
      }

      // クラスの検出
      const classMatches = line.match(/class\s+(\w+)/g)
      if (classMatches) {
        classMatches.forEach(match => {
          const name = match.replace(/class\s+(\w+)/, '$1')
          symbols.push({
            name,
            type: 'class',
            line: lineNumber,
            column: line.indexOf(name) + 1,
            file: currentFile,
            description: `クラス: ${name}`
          })
        })
      }

      // インターフェースの検出
      const interfaceMatches = line.match(/interface\s+(\w+)/g)
      if (interfaceMatches) {
        interfaceMatches.forEach(match => {
          const name = match.replace(/interface\s+(\w+)/, '$1')
          symbols.push({
            name,
            type: 'interface',
            line: lineNumber,
            column: line.indexOf(name) + 1,
            file: currentFile,
            description: `インターフェース: ${name}`
          })
        })
      }

      // 変数の検出
      const variableMatches = line.match(/(?:const|let|var)\s+(\w+)/g)
      if (variableMatches) {
        variableMatches.forEach(match => {
          const name = match.replace(/(?:const|let|var)\s+(\w+)/, '$1')
          symbols.push({
            name,
            type: 'variable',
            line: lineNumber,
            column: line.indexOf(name) + 1,
            file: currentFile,
            description: `変数: ${name}`
          })
        })
      }

      // メソッドの検出
      const methodMatches = line.match(/(\w+)\s*\([^)]*\)\s*{/g)
      if (methodMatches) {
        methodMatches.forEach(match => {
          const name = match.replace(/(\w+)\s*\([^)]*\)\s*{/, '$1')
          symbols.push({
            name,
            type: 'method',
            line: lineNumber,
            column: line.indexOf(name) + 1,
            file: currentFile,
            description: `メソッド: ${name}`
          })
        })
      }
    })

    return symbols
  }

  const findSymbols = () => {
    if (!editor) return

    const code = editor.getValue()
    const extractedSymbols = extractSymbols(code)
    setSymbols(extractedSymbols)
  }

  const goToDefinition = () => {
    if (!editor) return

    const position = editor.getPosition()
    const model = editor.getModel()
    if (!model) return

    const word = model.getWordAtPosition(position)
    if (!word) return

    // 簡易的な定義検索
    const code = model.getValue()
    const lines = code.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const definitionPatterns = [
        new RegExp(`(?:function|const|let|var|class|interface)\\s+${word.word}\\b`),
        new RegExp(`\\b${word.word}\\s*[:=]`),
        new RegExp(`\\b${word.word}\\s*\\(`)
      ]

      for (const pattern of definitionPatterns) {
        if (pattern.test(line)) {
          editor.setPosition({
            lineNumber: i + 1,
            column: line.indexOf(word.word) + 1
          })
          editor.revealLine(i + 1)
          return
        }
      }
    }
  }

  const findReferences = () => {
    if (!editor) return

    const position = editor.getPosition()
    const model = editor.getModel()
    if (!model) return

    const word = model.getWordAtPosition(position)
    if (!word) return

    const code = model.getValue()
    const lines = code.split('\n')
    const references: Reference[] = []

    lines.forEach((line: string, lineIndex: number) => {
      const wordRegex = new RegExp(`\\b${word.word}\\b`, 'g')
      let match

      while ((match = wordRegex.exec(line)) !== null) {
        references.push({
          line: lineIndex + 1,
          column: match.index + 1,
          file: currentFile,
          context: line.trim()
        })
      }
    })

    setReferences(references)
    setShowReferences(true)
  }

  const navigateToSymbol = (symbol: Symbol) => {
    if (!editor) return

    editor.setPosition({
      lineNumber: symbol.line,
      column: symbol.column
    })
    editor.revealLine(symbol.line)
    setShowSymbolSearch(false)
    onNavigateToSymbol?.(symbol)
  }

  const navigateToReference = (reference: Reference) => {
    if (!editor) return

    editor.setPosition({
      lineNumber: reference.line,
      column: reference.column
    })
    editor.revealLine(reference.line)
    setShowReferences(false)
    onNavigateToReference?.(reference)
  }

  const getSymbolIcon = (type: Symbol['type']) => {
    switch (type) {
      case 'function':
        return <Zap className="h-4 w-4 text-blue-400" />
      case 'class':
        return <Square className="h-4 w-4 text-green-400" />
      case 'interface':
        return <Circle className="h-4 w-4 text-purple-400" />
      case 'variable':
        return <Variable className="h-4 w-4 text-orange-400" />
      case 'method':
        return <Settings className="h-4 w-4 text-cyan-400" />
      case 'property':
        return <Key className="h-4 w-4 text-yellow-400" />
      default:
        return <Code className="h-4 w-4 text-gray-400" />
    }
  }

  const filteredSymbols = symbols.filter(symbol =>
    symbol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    symbol.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* シンボル検索ダイアログ */}
      <Dialog open={showSymbolSearch} onOpenChange={setShowSymbolSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center space-x-2 mb-2">
                <Search className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">シンボル検索</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="シンボルを検索..."
                  className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-200"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredSymbols.map((symbol, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                      selectedSymbol?.name === symbol.name
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    }`}
                    onClick={() => navigateToSymbol(symbol)}
                  >
                    {getSymbolIcon(symbol.type)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{symbol.name}</div>
                      <div className="text-xs opacity-70">{symbol.description}</div>
                    </div>
                    <div className="text-xs opacity-60">
                      {symbol.line}:{symbol.column}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{filteredSymbols.length} シンボル</span>
                <div className="flex items-center space-x-4">
                  <span>Cmd/Ctrl + Shift + O</span>
                  <span>F12: 定義へジャンプ</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 参照検索ダイアログ */}
      <Dialog open={showReferences} onOpenChange={setShowReferences}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center space-x-2 mb-2">
                <Search className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">参照の検索</span>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {references.map((reference, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-zinc-800 text-zinc-300"
                    onClick={() => navigateToReference(reference)}
                  >
                    <FileText className="h-4 w-4 text-blue-400" />
                    <div className="flex-1">
                      <div className="text-sm">{reference.context}</div>
                      <div className="text-xs opacity-70">{reference.file}</div>
                    </div>
                    <div className="text-xs opacity-60">
                      {reference.line}:{reference.column}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{references.length} 参照</span>
                <div className="flex items-center space-x-4">
                  <span>Cmd/Ctrl + Shift + F12</span>
                  <span>F12: 定義へジャンプ</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 