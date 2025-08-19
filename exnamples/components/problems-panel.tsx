"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileText,
  ExternalLink
} from "lucide-react"

interface Problem {
  id: string
  type: "error" | "warning" | "info"
  message: string
  file: string
  line: number
  column: number
  source: string
  code?: string
  context?: string
}

interface ProblemsPanelProps {
  isOpen: boolean
  onClose: () => void
  problems: Problem[]
  onNavigateToProblem: (problem: Problem) => void
  onFilterProblems?: (filter: string) => void
}

export function ProblemsPanel({ 
  isOpen, 
  onClose, 
  problems, 
  onNavigateToProblem,
  onFilterProblems 
}: ProblemsPanelProps) {
  const [filterQuery, setFilterQuery] = useState("")
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [groupedProblems, setGroupedProblems] = useState<Record<string, Problem[]>>({})
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    // 問題をファイル別にグループ化
    const grouped = problems.reduce((acc, problem) => {
      if (!acc[problem.file]) {
        acc[problem.file] = []
      }
      acc[problem.file].push(problem)
      return acc
    }, {} as Record<string, Problem[]>)

    setGroupedProblems(grouped)
    
    // すべてのグループを展開
    setExpandedGroups(new Set(Object.keys(grouped)))
  }, [problems])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault()
          onClose()
          break
        case "Enter":
          e.preventDefault()
          if (selectedProblem) {
            onNavigateToProblem(selectedProblem)
          }
          break
        case "ArrowDown":
          e.preventDefault()
          navigateToNextProblem()
          break
        case "ArrowUp":
          e.preventDefault()
          navigateToPreviousProblem()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, selectedProblem, problems])

  const navigateToNextProblem = () => {
    const flatProblems = Object.values(groupedProblems).flat()
    if (flatProblems.length === 0) return

    const currentIndex = selectedProblem 
      ? flatProblems.findIndex(p => p.id === selectedProblem.id)
      : -1
    
    const nextIndex = currentIndex < flatProblems.length - 1 ? currentIndex + 1 : 0
    setSelectedProblem(flatProblems[nextIndex])
  }

  const navigateToPreviousProblem = () => {
    const flatProblems = Object.values(groupedProblems).flat()
    if (flatProblems.length === 0) return

    const currentIndex = selectedProblem 
      ? flatProblems.findIndex(p => p.id === selectedProblem.id)
      : 0
    
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : flatProblems.length - 1
    setSelectedProblem(flatProblems[prevIndex])
  }

  const toggleGroup = (file: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(file)) {
      newExpanded.delete(file)
    } else {
      newExpanded.add(file)
    }
    setExpandedGroups(newExpanded)
  }

  const getProblemIcon = (type: Problem['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />
      default:
        return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const getProblemTypeCount = (type: Problem['type']) => {
    return problems.filter(p => p.type === type).length
  }

  const filteredProblems = problems.filter(problem =>
    problem.message.toLowerCase().includes(filterQuery.toLowerCase()) ||
    problem.file.toLowerCase().includes(filterQuery.toLowerCase()) ||
    problem.source.toLowerCase().includes(filterQuery.toLowerCase())
  )

  const filteredGroupedProblems = Object.entries(groupedProblems).reduce((acc, [file, fileProblems]) => {
    const filtered = fileProblems.filter(problem =>
      problem.message.toLowerCase().includes(filterQuery.toLowerCase()) ||
      problem.file.toLowerCase().includes(filterQuery.toLowerCase()) ||
      problem.source.toLowerCase().includes(filterQuery.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[file] = filtered
    }
    return acc
  }, {} as Record<string, Problem[]>)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-zinc-200">Problems</h2>
            <div className="flex items-center space-x-2 text-sm text-zinc-400">
              {getProblemTypeCount('error') > 0 && (
                <span className="text-red-400">{getProblemTypeCount('error')} エラー</span>
              )}
              {getProblemTypeCount('warning') > 0 && (
                <span className="text-yellow-400">{getProblemTypeCount('warning')} 警告</span>
              )}
              {getProblemTypeCount('info') > 0 && (
                <span className="text-blue-400">{getProblemTypeCount('info')} 情報</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // 問題の再検証
                console.log("Refreshing problems...")
              }}
              className="h-8 px-3 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              更新
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

        {/* 検索・フィルター */}
        <div className="p-4 border-b border-zinc-700">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              ref={inputRef}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="問題を検索..."
              className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-200"
            />
          </div>
        </div>

        {/* 問題リスト */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {Object.entries(filteredGroupedProblems).map(([file, fileProblems]) => (
              <div key={file} className="mb-2">
                <div
                  className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-zinc-800"
                  onClick={() => toggleGroup(file)}
                >
                  {expandedGroups.has(file) ? (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  )}
                  <FileText className="h-4 w-4 text-blue-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-200">{file}</div>
                    <div className="text-xs text-zinc-400">
                      {fileProblems.length} 問題
                    </div>
                  </div>
                </div>
                
                {expandedGroups.has(file) && (
                  <div className="ml-6">
                    {fileProblems.map((problem) => (
                      <div
                        key={problem.id}
                        className={`flex items-start space-x-2 p-2 rounded cursor-pointer ${
                          selectedProblem?.id === problem.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                        onClick={() => {
                          setSelectedProblem(problem)
                          onNavigateToProblem(problem)
                        }}
                      >
                        {getProblemIcon(problem.type)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">{problem.message}</div>
                          <div className="text-xs opacity-70">
                            {problem.file}:{problem.line}:{problem.column}
                          </div>
                          {problem.source && (
                            <div className="text-xs opacity-50">
                              {problem.source}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onNavigateToProblem(problem)
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {filteredProblems.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>問題が見つかりません</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* フッター */}
        <div className="p-3 border-t border-zinc-700 bg-zinc-900">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{filteredProblems.length} 問題</span>
            <div className="flex items-center space-x-4">
              <span>↑↓ で移動</span>
              <span>Enter でジャンプ</span>
              <span>Esc で閉じる</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 