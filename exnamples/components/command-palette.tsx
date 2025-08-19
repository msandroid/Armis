"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  FileText, 
  Settings, 
  Palette, 
  Code, 
  Terminal,
  GitBranch,
  Bug,
  Puzzle,
  MessageSquare,
  Download,
  Upload,
  Save,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff
} from "lucide-react"

interface Command {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  category: string
  shortcut?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onCommandExecute: (commandId: string) => void
}

export function CommandPalette({ isOpen, onClose, onCommandExecute }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const commands: Command[] = [
    // ファイル操作
    {
      id: "file.new",
      title: "New File",
      description: "新しいファイルを作成",
      icon: FileText,
      category: "File",
      shortcut: "Cmd/Ctrl + N",
      action: () => onCommandExecute("file.new")
    },
    {
      id: "file.open",
      title: "Open File",
      description: "ファイルを開く",
      icon: FileText,
      category: "File",
      shortcut: "Cmd/Ctrl + O",
      action: () => onCommandExecute("file.open")
    },
    {
      id: "file.save",
      title: "Save",
      description: "ファイルを保存",
      icon: Save,
      category: "File",
      shortcut: "Cmd/Ctrl + S",
      action: () => onCommandExecute("file.save")
    },
    {
      id: "file.saveAs",
      title: "Save As",
      description: "名前を付けて保存",
      icon: Save,
      category: "File",
      shortcut: "Cmd/Ctrl + Shift + S",
      action: () => onCommandExecute("file.saveAs")
    },
    {
      id: "file.close",
      title: "Close File",
      description: "ファイルを閉じる",
      icon: FileText,
      category: "File",
      shortcut: "Cmd/Ctrl + W",
      action: () => onCommandExecute("file.close")
    },

    // 編集操作
    {
      id: "edit.undo",
      title: "Undo",
      description: "元に戻す",
      icon: Undo,
      category: "Edit",
      shortcut: "Cmd/Ctrl + Z",
      action: () => onCommandExecute("edit.undo")
    },
    {
      id: "edit.redo",
      title: "Redo",
      description: "やり直し",
      icon: Redo,
      category: "Edit",
      shortcut: "Cmd/Ctrl + Shift + Z",
      action: () => onCommandExecute("edit.redo")
    },
    {
      id: "edit.copy",
      title: "Copy",
      description: "コピー",
      icon: Copy,
      category: "Edit",
      shortcut: "Cmd/Ctrl + C",
      action: () => onCommandExecute("edit.copy")
    },
    {
      id: "edit.cut",
      title: "Cut",
      description: "切り取り",
      icon: Scissors,
      category: "Edit",
      shortcut: "Cmd/Ctrl + X",
      action: () => onCommandExecute("edit.cut")
    },
    {
      id: "edit.paste",
      title: "Paste",
      description: "貼り付け",
      icon: Clipboard,
      category: "Edit",
      shortcut: "Cmd/Ctrl + V",
      action: () => onCommandExecute("edit.paste")
    },

    // 表示操作
    {
      id: "view.zoomIn",
      title: "Zoom In",
      description: "拡大",
      icon: ZoomIn,
      category: "View",
      shortcut: "Cmd/Ctrl + =",
      action: () => onCommandExecute("view.zoomIn")
    },
    {
      id: "view.zoomOut",
      title: "Zoom Out",
      description: "縮小",
      icon: ZoomOut,
      category: "View",
      shortcut: "Cmd/Ctrl + -",
      action: () => onCommandExecute("view.zoomOut")
    },
    {
      id: "view.toggleSidebar",
      title: "Toggle Sidebar",
      description: "サイドバーの表示/非表示",
      icon: Eye,
      category: "View",
      shortcut: "Cmd/Ctrl + B",
      action: () => onCommandExecute("view.toggleSidebar")
    },

    // 開発ツール
    {
      id: "workbench.action.toggleTerminal",
      title: "Toggle Terminal",
      description: "ターミナルの表示/非表示",
      icon: Terminal,
      category: "Development",
      shortcut: "Ctrl + `",
      action: () => onCommandExecute("workbench.action.toggleTerminal")
    },
    {
      id: "workbench.action.showCommands",
      title: "Show Commands",
      description: "コマンドパレットを表示",
      icon: Palette,
      category: "Development",
      shortcut: "Cmd/Ctrl + Shift + P",
      action: () => onCommandExecute("workbench.action.showCommands")
    },
    {
      id: "workbench.action.quickOpen",
      title: "Quick Open",
      description: "ファイルを素早く開く",
      icon: Search,
      category: "Development",
      shortcut: "Cmd/Ctrl + P",
      action: () => onCommandExecute("workbench.action.quickOpen")
    },

    // 設定
    {
      id: "workbench.action.openSettings",
      title: "Open Settings",
      description: "設定を開く",
      icon: Settings,
      category: "Preferences",
      shortcut: "Cmd/Ctrl + ,",
      action: () => onCommandExecute("workbench.action.openSettings")
    },
    {
      id: "workbench.action.openGlobalKeybindings",
      title: "Open Keyboard Shortcuts",
      description: "キーボードショートカットを開く",
      icon: Settings,
      category: "Preferences",
      action: () => onCommandExecute("workbench.action.openGlobalKeybindings")
    },

    // AI機能
    {
      id: "ai.chat",
      title: "Open AI Chat",
      description: "AIチャットを開く",
      icon: MessageSquare,
      category: "AI",
      shortcut: "Cmd/Ctrl + Shift + A",
      action: () => onCommandExecute("ai.chat")
    },
    {
      id: "ai.generateCode",
      title: "Generate Code",
      description: "AIでコードを生成",
      icon: Code,
      category: "AI",
      action: () => onCommandExecute("ai.generateCode")
    },

    // その他
    {
      id: "workbench.action.showAbout",
      title: "About",
      description: "アプリケーションについて",
      icon: FileText,
      category: "Help",
      action: () => onCommandExecute("workbench.action.showAbout")
    }
  ]

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onClose()
        }
        break
      case "Escape":
        e.preventDefault()
        onClose()
        break
    }
  }

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    // 選択されたアイテムが表示範囲外の場合、スクロール
    if (scrollAreaRef.current && selectedIndex >= 0) {
      const selectedElement = scrollAreaRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedIndex])

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, Command[]>)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center space-x-2 mb-2">
              <Palette className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-200">コマンドパレット</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="コマンドを検索..."
                className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-200"
              />
            </div>
          </div>

          {/* コマンドリスト */}
          <ScrollArea className="flex-1 max-h-96">
            <div ref={scrollAreaRef} className="p-2">
              {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category} className="mb-4">
                  <div className="px-2 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {category}
                  </div>
                  {categoryCommands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command)
                    return (
                      <div
                        key={command.id}
                        data-index={globalIndex}
                        className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer ${
                          globalIndex === selectedIndex
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                        onClick={() => {
                          command.action()
                          onClose()
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <command.icon className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">{command.title}</div>
                            <div className="text-xs opacity-70">{command.description}</div>
                          </div>
                        </div>
                        {command.shortcut && (
                          <div className="text-xs opacity-60">
                            {command.shortcut}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
              
              {filteredCommands.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>コマンドが見つかりません</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* フッター */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{filteredCommands.length} コマンド</span>
              <div className="flex items-center space-x-4">
                <span>↑↓ で選択</span>
                <span>Enter で実行</span>
                <span>Esc で閉じる</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 