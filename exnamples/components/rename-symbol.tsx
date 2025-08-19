"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Edit3, 
  X, 
  Check, 
  AlertCircle,
  FileText,
  ArrowRight
} from "lucide-react"

interface RenameLocation {
  file: string
  line: number
  column: number
  endColumn: number
  context: string
  oldName: string
}

interface RenameSymbolProps {
  isOpen: boolean
  onClose: () => void
  symbolName: string
  locations: RenameLocation[]
  onRename: (newName: string, locations: RenameLocation[]) => void
  onNavigateToLocation: (location: RenameLocation) => void
}

export function RenameSymbol({ 
  isOpen, 
  onClose, 
  symbolName, 
  locations, 
  onRename,
  onNavigateToLocation 
}: RenameSymbolProps) {
  const [newName, setNewName] = useState(symbolName)
  const [selectedLocation, setSelectedLocation] = useState<RenameLocation | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setNewName(symbolName)
      setSelectedLocation(locations[0] || null)
      setPreviewMode(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, symbolName, locations])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault()
          onClose()
          break
        case "Enter":
          e.preventDefault()
          if (newName.trim() && newName !== symbolName) {
            handleRename()
          }
          break
        case "Tab":
          e.preventDefault()
          setPreviewMode(!previewMode)
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, newName, symbolName, previewMode, onClose])

  const handleRename = () => {
    if (newName.trim() && newName !== symbolName) {
      onRename(newName, locations)
      onClose()
    }
  }

  const handleLocationClick = (location: RenameLocation) => {
    setSelectedLocation(location)
    onNavigateToLocation(location)
  }

  const getPreviewText = (location: RenameLocation) => {
    const before = location.context.substring(0, location.column - 1)
    const after = location.context.substring(location.endColumn - 1)
    return `${before}${newName}${after}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-zinc-200">Rename Symbol</h2>
            <span className="text-sm text-zinc-400">
              {locations.length} 箇所
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className={`h-8 px-3 text-xs ${previewMode ? 'bg-blue-600 text-white' : ''}`}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              プレビュー
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 入力エリア */}
        <div className="p-4 border-b border-zinc-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-300">新しい名前:</span>
            <Input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="シンボル名を入力..."
              className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200"
            />
            <Button
              onClick={handleRename}
              disabled={!newName.trim() || newName === symbolName}
              className="h-8 px-3 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              リネーム
            </Button>
          </div>
          
          {newName !== symbolName && (
            <div className="mt-2 p-2 bg-blue-900 border border-blue-700 rounded text-sm text-blue-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>
                  "{symbolName}" を "{newName}" に変更します ({locations.length} 箇所)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 変更箇所リスト */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {locations.map((location, index) => (
              <div
                key={index}
                className={`mb-2 p-3 rounded border ${
                  selectedLocation === location
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                    : 'border-zinc-700 hover:border-zinc-600'
                } cursor-pointer`}
                onClick={() => handleLocationClick(location)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-zinc-200">
                      {location.file}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {location.line}:{location.column}
                    </span>
                  </div>
                </div>
                
                <div className="font-mono text-sm">
                  {previewMode ? (
                    <div className="space-y-1">
                      <div className="text-zinc-400 text-xs">変更前:</div>
                      <div className="text-zinc-300 bg-zinc-800 p-2 rounded">
                        {location.context}
                      </div>
                      <div className="text-zinc-400 text-xs">変更後:</div>
                      <div className="text-green-300 bg-green-900 bg-opacity-20 p-2 rounded">
                        {getPreviewText(location)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-300 bg-zinc-800 p-2 rounded">
                      {location.context}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* フッター */}
        <div className="p-3 border-t border-zinc-700 bg-zinc-900">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{locations.length} 箇所で変更</span>
            <div className="flex items-center space-x-4">
              <span>Tab: プレビュー切り替え</span>
              <span>Enter: リネーム実行</span>
              <span>Esc: キャンセル</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 