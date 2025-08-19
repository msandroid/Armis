"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Terminal, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Settings,
  ChevronDown,
  ChevronUp,
  Copy
} from "lucide-react"

interface TerminalOutput {
  id: string
  type: "input" | "output" | "error"
  content: string
  timestamp: Date
}

interface TerminalProps {
  isOpen: boolean
  onClose: () => void
  onCommandExecute?: (command: string) => Promise<string>
}

export function Terminal({ isOpen, onClose, onCommandExecute }: TerminalProps) {
  const [outputs, setOutputs] = useState<TerminalOutput[]>([])
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentDirectory, setCurrentDirectory] = useState("/workspace")
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      // 初期メッセージを表示
      if (outputs.length === 0) {
        addOutput("output", "Armis Terminal v1.0.0")
        addOutput("output", `Current directory: ${currentDirectory}`)
        addOutput("output", "Type 'help' for available commands.")
        addOutput("output", "")
      }
    }
  }, [isOpen])

  useEffect(() => {
    // 自動スクロール
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [outputs])

  const addOutput = (type: "input" | "output" | "error", content: string) => {
    const output: TerminalOutput = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setOutputs(prev => [...prev, output])
  }

  const executeCommand = async (command: string) => {
    if (!command.trim()) return

    // コマンド履歴に追加
    setCommandHistory(prev => [...prev, command])
    setHistoryIndex(-1)

    // 入力コマンドを表示
    addOutput("input", `$ ${command}`)

    setIsExecuting(true)

    try {
      // 組み込みコマンドの処理
      const result = await handleBuiltinCommand(command)
      addOutput("output", result)
    } catch (error) {
      addOutput("error", `Error: ${error}`)
    } finally {
      setIsExecuting(false)
      setCurrentCommand("")
    }
  }

  const handleBuiltinCommand = async (command: string): Promise<string> => {
    const [cmd, ...args] = command.trim().split(" ")

    switch (cmd.toLowerCase()) {
      case "help":
        return `Available commands:
  help                    - Show this help message
  clear                   - Clear terminal output
  pwd                     - Show current directory
  ls [path]              - List directory contents
  cd [path]              - Change directory
  echo [text]            - Print text
  date                    - Show current date and time
  whoami                  - Show current user
  history                 - Show command history
  npm [args]             - Run npm command
  git [args]             - Run git command
  node [args]            - Run node command`

      case "clear":
        setOutputs([])
        return ""

      case "pwd":
        return currentDirectory

      case "ls":
        const path = args[0] || "."
        return `Directory listing for ${path}:
  📁 src/
  📁 public/
  📁 components/
  📄 package.json
  📄 README.md
  📄 tsconfig.json`

      case "cd":
        const newPath = args[0]
        if (!newPath) {
          return "Usage: cd [directory]"
        }
        setCurrentDirectory(newPath)
        return `Changed directory to: ${newPath}`

      case "echo":
        return args.join(" ")

      case "date":
        return new Date().toLocaleString()

      case "whoami":
        return "armis-user"

      case "history":
        return commandHistory.map((cmd, index) => `${index + 1}: ${cmd}`).join("\n")

      case "npm":
        return `Running: npm ${args.join(" ")}
npm install completed successfully`

      case "git":
        return `Running: git ${args.join(" ")}
On branch main
Your branch is up to date with 'origin/main'`

      case "node":
        return `Running: node ${args.join(" ")}
Node.js v18.0.0`

      default:
        // 外部コマンド実行のシミュレーション
        if (onCommandExecute) {
          return await onCommandExecute(command)
        }
        return `Command not found: ${cmd}. Type 'help' for available commands.`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault()
        if (currentCommand.trim()) {
          executeCommand(currentCommand)
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
        }
        break
      case "ArrowDown":
        e.preventDefault()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
        } else if (historyIndex === 0) {
          setHistoryIndex(-1)
          setCurrentCommand("")
        }
        break
      case "Tab":
        e.preventDefault()
        // タブ補完機能（簡易版）
        const suggestions = ["help", "clear", "pwd", "ls", "cd", "echo", "date", "whoami", "history"]
        const matching = suggestions.filter(s => s.startsWith(currentCommand))
        if (matching.length === 1) {
          setCurrentCommand(matching[0])
        }
        break
    }
  }

  const clearTerminal = () => {
    setOutputs([])
  }

  const copyOutput = () => {
    const text = outputs.map(output => output.content).join("\n")
    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700">
      {/* ターミナルヘッダー */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-zinc-200">Terminal</span>
          <span className="text-xs text-zinc-500">({currentDirectory})</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyOutput}
            className="h-6 w-6 p-0 text-zinc-400"
            title="Copy output"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="h-6 w-6 p-0 text-zinc-400"
            title="Clear terminal"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-zinc-400"
            title="Close terminal"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* ターミナル出力 */}
      <ScrollArea ref={scrollAreaRef} className="h-64">
        <div className="p-2 font-mono text-sm">
          {outputs.map((output) => (
            <div
              key={output.id}
              className={`mb-1 ${
                output.type === "input"
                  ? "text-green-400"
                  : output.type === "error"
                  ? "text-red-400"
                  : "text-zinc-300"
              }`}
            >
              {output.content}
            </div>
          ))}
          
          {/* コマンド入力行 */}
          <div className="flex items-center space-x-2">
            <span className="text-green-400">$</span>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="flex-1 bg-transparent border-none text-zinc-200 focus:ring-0 focus:outline-none"
              disabled={isExecuting}
            />
            {isExecuting && (
              <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full" />
            )}
          </div>
        </div>
      </ScrollArea>

      {/* ターミナルフッター */}
      <div className="flex items-center justify-between p-2 border-t border-zinc-700 bg-zinc-800 text-xs text-zinc-500">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          <span>{outputs.length} lines</span>
          <span>{commandHistory.length} commands</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Ctrl+` to toggle</span>
          <span>↑↓ for history</span>
          <span>Tab for completion</span>
        </div>
      </div>
    </div>
  )
} 