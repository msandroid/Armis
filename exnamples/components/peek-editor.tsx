"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  FileText,
  Code,
  ExternalLink
} from "lucide-react"

interface PeekLocation {
  line: number
  column: number
  file: string
  content: string
  context: string
}

interface PeekEditorProps {
  isOpen: boolean
  onClose: () => void
  locations: PeekLocation[]
  title: string
  onNavigateToLocation: (location: PeekLocation) => void
  onOpenInEditor: (location: PeekLocation) => void
}

export function PeekEditor({ 
  isOpen, 
  onClose, 
  locations, 
  title, 
  onNavigateToLocation, 
  onOpenInEditor 
}: PeekEditorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedLocation, setSelectedLocation] = useState<PeekLocation | null>(null)

  useEffect(() => {
    if (locations.length > 0) {
      setSelectedLocation(locations[0])
      setCurrentIndex(0)
    }
  }, [locations])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault()
          onClose()
          break
        case "ArrowDown":
          e.preventDefault()
          if (currentIndex < locations.length - 1) {
            const newIndex = currentIndex + 1
            setCurrentIndex(newIndex)
            setSelectedLocation(locations[newIndex])
            onNavigateToLocation(locations[newIndex])
          }
          break
        case "ArrowUp":
          e.preventDefault()
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1
            setCurrentIndex(newIndex)
            setSelectedLocation(locations[newIndex])
            onNavigateToLocation(locations[newIndex])
          }
          break
        case "Enter":
          e.preventDefault()
          if (selectedLocation) {
            onOpenInEditor(selectedLocation)
            onClose()
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, currentIndex, locations, selectedLocation, onClose, onNavigateToLocation, onOpenInEditor])

  if (!isOpen || locations.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-zinc-200">{title}</h2>
            <span className="text-sm text-zinc-400">
              {currentIndex + 1} / {locations.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedLocation) {
                  onOpenInEditor(selectedLocation)
                  onClose()
                }
              }}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              エディターで開く
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

        {/* ナビゲーション */}
        <div className="flex items-center justify-between p-2 border-b border-zinc-700 bg-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (currentIndex > 0) {
                const newIndex = currentIndex - 1
                setCurrentIndex(newIndex)
                setSelectedLocation(locations[newIndex])
                onNavigateToLocation(locations[newIndex])
              }
            }}
            disabled={currentIndex === 0}
            className="h-6 px-2 text-xs"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            前へ
          </Button>
          
          <span className="text-xs text-zinc-400">
            {currentIndex + 1} / {locations.length}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (currentIndex < locations.length - 1) {
                const newIndex = currentIndex + 1
                setCurrentIndex(newIndex)
                setSelectedLocation(locations[newIndex])
                onNavigateToLocation(locations[newIndex])
              }
            }}
            disabled={currentIndex === locations.length - 1}
            className="h-6 px-2 text-xs"
          >
            次へ
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 flex">
          {/* ファイルリスト */}
          <div className="w-64 border-r border-zinc-700 bg-zinc-900">
            <div className="p-3 border-b border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-200">ファイル</h3>
            </div>
            <ScrollArea className="h-full">
              <div className="p-2">
                {locations.map((location, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                      index === currentIndex
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    }`}
                    onClick={() => {
                      setCurrentIndex(index)
                      setSelectedLocation(location)
                      onNavigateToLocation(location)
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{location.file}</div>
                      <div className="text-xs opacity-70">
                        {location.line}:{location.column}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* コードプレビュー */}
          <div className="flex-1 flex flex-col">
            {selectedLocation && (
              <>
                <div className="p-3 border-b border-zinc-700 bg-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-200">
                        {selectedLocation.file}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        行 {selectedLocation.line}, 列 {selectedLocation.column}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onOpenInEditor(selectedLocation)
                        onClose()
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      開く
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <div className="bg-zinc-800 border border-zinc-700 rounded p-4 font-mono text-sm">
                    <div className="text-zinc-400 mb-2">
                      // {selectedLocation.context}
                    </div>
                    <div className="text-zinc-200">
                      {selectedLocation.content.split('\n').map((line, lineIndex) => (
                        <div key={lineIndex} className="mb-1">
                          <span className="text-zinc-500 mr-2">
                            {selectedLocation.line + lineIndex - 2}
                          </span>
                          <span className={lineIndex === 1 ? 'bg-blue-600 text-white px-1 rounded' : ''}>
                            {line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="p-3 border-t border-zinc-700 bg-zinc-900">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{locations.length} 箇所</span>
            <div className="flex items-center space-x-4">
              <span>↑↓ で移動</span>
              <span>Enter で開く</span>
              <span>Esc で閉じる</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 