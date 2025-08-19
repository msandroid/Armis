"use client"

import { useState, useEffect, useCallback } from "react"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"
import { 
  FileText, 
  Search, 
  GitBranch,
  Bug,
  Package,
  Settings,
  Terminal,
  MessageSquare,
  Radio,
  Zap,
  Play,
  Square,
  RefreshCw,
  FolderOpen,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonacoVSCodeEditor } from "./monaco-vscode-editor"
import { VSCodeFileExplorer } from "./vscode-file-explorer"
import { ExtensionManagerPanel } from "./extension-manager-panel"
import { extensionManager } from "@/lib/extensions/extension-manager"
import { loadSampleExtensions } from "@/lib/extensions/sample-extensions"

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  children?: FileNode[]
  isExpanded?: boolean
  size?: number
  lastModified?: Date
  content?: string
  language?: string
}

interface CompleteVSCodeEditorProps {
  initialFiles?: FileNode[]
  className?: string
  onFileChange?: (files: FileNode[]) => void
}

interface EditorTab {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirty: boolean
}

export function CompleteVSCodeEditor({ 
  initialFiles = [], 
  className,
  onFileChange
}: CompleteVSCodeEditorProps) {
  const [files, setFiles] = useState<FileNode[]>(initialFiles)
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [sidebarPanel, setSidebarPanel] = useState<"explorer" | "search" | "git" | "debug" | "extensions">("explorer")
  const [showSidebar, setShowSidebar] = useState(true)
  const [showPanel, setShowPanel] = useState(false)
  const [panelContent, setPanelContent] = useState<"terminal" | "problems" | "output" | "debug">("terminal")
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  // サンプルファイルデータの初期化と拡張機能のロード
  useEffect(() => {
    // サンプル拡張機能をロード
    loadSampleExtensions()
    
    if (initialFiles.length === 0) {
      const sampleFiles: FileNode[] = [
        {
          id: "1",
          name: "src",
          type: "folder",
          path: "/src",
          isExpanded: true,
          children: [
            {
              id: "2",
              name: "App.tsx",
              type: "file",
              path: "/src/App.tsx",
              language: "typescript",
              content: `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Armis VSCode Editor</h1>
        <p>Start editing to see some magic happen!</p>
      </header>
    </div>
  )
}

export default App`
            },
            {
              id: "3",
              name: "index.tsx",
              type: "file",
              path: "/src/index.tsx",
              language: "typescript",
              content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
            },
            {
              id: "4",
              name: "components",
              type: "folder",
              path: "/src/components",
              children: [
                {
                  id: "5",
                  name: "Button.tsx",
                  type: "file",
                  path: "/src/components/Button.tsx",
                  language: "typescript",
                  content: `import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}`
                }
              ]
            }
          ]
        },
        {
          id: "6",
          name: "package.json",
          type: "file",
          path: "/package.json",
          language: "json",
          content: `{
  "name": "armis-vscode-demo",
  "version": "1.0.0",
  "description": "VSCode-like editor demo",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}`
        },
        {
          id: "7",
          name: "README.md",
          type: "file",
          path: "/README.md",
          language: "markdown",
          content: `# Armis VSCode Editor

VSCode風の高機能なコードエディタです。

## 機能

- 🎨 Monaco Editor による高機能なコード編集
- 📁 ファイルエクスプローラー
- 🔧 拡張機能システム
- 🎯 コマンドパレット
- 🔍 検索・置換
- 🐛 デバッグサポート
- 📊 ステータスバー

## 使い方

1. 左側のエクスプローラーからファイルを選択
2. エディタでコードを編集
3. 拡張機能で機能を追加
4. ターミナルでコマンド実行

楽しいコーディングを！`
        }
      ]
      setFiles(sampleFiles)
    }
  }, [initialFiles])

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === "file") {
      setSelectedFile(file)
      
      // タブが既に開かれているかチェック
      const existingTab = openTabs.find(tab => tab.path === file.path)
      if (existingTab) {
        setActiveTabId(existingTab.id)
      } else {
        // 新しいタブを作成
        const newTab: EditorTab = {
          id: file.id,
          name: file.name,
          path: file.path,
          content: file.content || "",
          language: file.language || "plaintext",
          isDirty: false
        }
        setOpenTabs(prev => [...prev, newTab])
        setActiveTabId(newTab.id)
      }
    }
  }, [openTabs])

  const handleTabClose = useCallback((tabId: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      
      // アクティブタブが閉じられた場合、隣のタブをアクティブにする
      if (activeTabId === tabId) {
        const tabIndex = prev.findIndex(tab => tab.id === tabId)
        if (newTabs.length > 0) {
          const nextActiveTab = newTabs[Math.min(tabIndex, newTabs.length - 1)]
          setActiveTabId(nextActiveTab.id)
        } else {
          setActiveTabId(null)
          setSelectedFile(null)
        }
      }
      
      return newTabs
    })
  }, [activeTabId])

  const handleContentChange = useCallback((content: string) => {
    if (activeTabId) {
      setOpenTabs(prev => 
        prev.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, content, isDirty: true }
            : tab
        )
      )
    }
  }, [activeTabId])

  const handleSave = useCallback(() => {
    if (activeTabId) {
      setOpenTabs(prev => 
        prev.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, isDirty: false }
            : tab
        )
      )
      console.log("File saved")
    }
  }, [activeTabId])

  const handleRun = useCallback(() => {
    setIsRunning(true)
    setShowPanel(true)
    setPanelContent("terminal")
    
    const activeTab = openTabs.find(tab => tab.id === activeTabId)
    if (activeTab) {
      setTerminalOutput(prev => [
        ...prev,
        `> Running ${activeTab.name}...`,
        `Successfully executed ${activeTab.name}`,
        `Process finished with exit code 0`
      ])
    }
    
    setTimeout(() => {
      setIsRunning(false)
    }, 2000)
  }, [activeTabId, openTabs])

  const handleDebug = useCallback(() => {
    setShowPanel(true)
    setPanelContent("debug")
    console.log("Debug started")
  }, [])

  const activeTab = openTabs.find(tab => tab.id === activeTabId)

  const sidebarIcons = [
    { id: "explorer", icon: FileText, title: "エクスプローラー" },
    { id: "search", icon: Search, title: "検索" },
    { id: "git", icon: GitBranch, title: "Git" },
    { id: "debug", icon: Bug, title: "デバッグ" },
    { id: "extensions", icon: Package, title: "拡張機能" }
  ] as const

  return (
    <div className={`h-screen flex bg-[#1e1e1e] text-[#cccccc] ${className}`}>
      {/* アクティビティバー */}
      <div className="w-12 bg-[#333333] flex flex-col items-center py-2 border-r border-[#2d2d30]">
        {sidebarIcons.map(({ id, icon: Icon, title }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            onClick={() => {
              setSidebarPanel(id)
              setShowSidebar(true)
            }}
            className={`h-12 w-12 p-0 mb-1 ${
              sidebarPanel === id && showSidebar
                ? 'bg-[#007acc] text-white' 
                : 'text-[#cccccc] hover:bg-[#444444]'
            }`}
            title={title}
          >
            <Icon className="h-6 w-6" />
          </Button>
        ))}
        
        <div className="flex-1" />
        
          <Button
            variant="ghost"
            size="sm"
          className="h-12 w-12 p-0 text-[#cccccc] hover:bg-[#444444]"
          title="設定"
        >
          <Settings className="h-6 w-6" />
          </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* サイドバー */}
        {showSidebar && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <div className="h-full bg-[#252526] border-r border-[#2d2d30]">
                {sidebarPanel === "explorer" && (
                  <VSCodeFileExplorer
                    files={files}
                    onFileSelect={handleFileSelect}
                    onRefresh={() => console.log("Refresh files")}
                  />
                )}
                {sidebarPanel === "search" && (
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-4 uppercase tracking-wide">検索</h3>
                    <p className="text-sm text-[#969696]">検索機能は実装中です</p>
                  </div>
                )}
                {sidebarPanel === "git" && (
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-4 uppercase tracking-wide">Git</h3>
                    <p className="text-sm text-[#969696]">Git機能は実装中です</p>
                  </div>
                )}
                {sidebarPanel === "debug" && (
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-4 uppercase tracking-wide">デバッグ</h3>
                    <p className="text-sm text-[#969696]">デバッグ機能は実装中です</p>
                  </div>
                )}
                {sidebarPanel === "extensions" && (
                  <ExtensionManagerPanel />
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* メインエディタエリア */}
        <ResizablePanel>
          <ResizablePanelGroup direction="vertical">
            {/* エディタ */}
            <ResizablePanel>
              <div className="h-full flex flex-col">
                {/* タブバー */}
                {openTabs.length > 0 && (
                  <div className="flex items-center bg-[#252526] border-b border-[#2d2d30] overflow-x-auto">
                    {openTabs.map(tab => (
                      <div
                        key={tab.id}
                        className={`flex items-center px-3 py-2 border-r border-[#2d2d30] cursor-pointer min-w-0 ${
                          activeTabId === tab.id 
                            ? 'bg-[#1e1e1e] text-[#ffffff]' 
                            : 'bg-[#252526] text-[#cccccc] hover:bg-[#2a2a2a]'
                        }`}
                        onClick={() => setActiveTabId(tab.id)}
                      >
                        <span className="text-sm truncate mr-2">{tab.name}</span>
                        {tab.isDirty && (
                          <span className="text-[#ffffff] text-xs mr-1">●</span>
                        )}
          <Button
            variant="ghost"
            size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTabClose(tab.id)
                          }}
                          className="h-4 w-4 p-0 text-[#cccccc] hover:text-[#ffffff] opacity-60 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
          </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* エディタ本体 */}
                <div className="flex-1">
                  {activeTab ? (
                    <MonacoVSCodeEditor
                      content={activeTab.content}
                      language={activeTab.language}
                      path={activeTab.path}
                      onContentChange={handleContentChange}
                      onSave={handleSave}
                      onRun={handleRun}
                      onDebug={handleDebug}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
                      <div className="text-center">
                        <FolderOpen className="h-16 w-16 mx-auto mb-4 text-[#454545]" />
                        <h3 className="text-lg font-medium mb-2 text-[#cccccc]">
                          Welcome to Armis VSCode Editor
                        </h3>
                        <p className="text-[#969696] mb-4">
                          ファイルエクスプローラーからファイルを選択して編集を開始してください
                        </p>
                        <div className="flex flex-col space-y-2 text-sm text-[#969696]">
                          <div>• <kbd className="bg-[#333333] px-2 py-1 rounded">Ctrl+Shift+P</kbd> コマンドパレット</div>
                          <div>• <kbd className="bg-[#333333] px-2 py-1 rounded">Ctrl+F</kbd> 検索</div>
                          <div>• <kbd className="bg-[#333333] px-2 py-1 rounded">Ctrl+S</kbd> 保存</div>
                          <div>• <kbd className="bg-[#333333] px-2 py-1 rounded">F5</kbd> 実行</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            {/* パネル */}
            {showPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <div className="h-full bg-[#252526] border-t border-[#2d2d30]">
                    {/* パネルタブ */}
                    <Tabs value={panelContent} onValueChange={(value) => setPanelContent(value as any)}>
                      <div className="flex items-center justify-between border-b border-[#2d2d30] bg-[#252526]">
                        <TabsList className="bg-transparent border-none">
                          <TabsTrigger 
                            value="terminal" 
                            className="data-[state=active]:bg-[#1e1e1e] text-[#cccccc]"
                          >
                            <Terminal className="h-4 w-4 mr-2" />
                            ターミナル
                          </TabsTrigger>
                          <TabsTrigger 
                            value="problems" 
                            className="data-[state=active]:bg-[#1e1e1e] text-[#cccccc]"
                          >
                            問題
                          </TabsTrigger>
                          <TabsTrigger 
                            value="output" 
                            className="data-[state=active]:bg-[#1e1e1e] text-[#cccccc]"
                          >
                            出力
                          </TabsTrigger>
                          <TabsTrigger 
                            value="debug" 
                            className="data-[state=active]:bg-[#1e1e1e] text-[#cccccc]"
                          >
                            デバッグコンソール
                          </TabsTrigger>
                        </TabsList>
          <Button
            variant="ghost"
            size="sm"
                          onClick={() => setShowPanel(false)}
                          className="h-6 w-6 p-0 mr-2 text-[#cccccc] hover:text-[#ffffff]"
          >
                          <X className="h-4 w-4" />
          </Button>
        </div>
        
                      <TabsContent value="terminal" className="h-full mt-0">
                        <div className="h-full p-3 font-mono text-sm bg-[#1e1e1e] overflow-auto">
                          {terminalOutput.map((line, index) => (
                            <div key={index} className="text-[#cccccc]">{line}</div>
                          ))}
                          <div className="flex items-center text-[#cccccc]">
                            <span className="text-green-400">$</span>
                            <span className="ml-2">_</span>
        </div>
      </div>
                      </TabsContent>

                      <TabsContent value="problems" className="h-full p-3 mt-0">
                        <div className="text-[#969696] text-sm">
                          問題は見つかりませんでした
      </div>
                      </TabsContent>

                      <TabsContent value="output" className="h-full p-3 mt-0">
                        <div className="text-[#969696] text-sm">
                          出力はありません
                        </div>
                      </TabsContent>

                      <TabsContent value="debug" className="h-full p-3 mt-0">
                        <div className="text-[#969696] text-sm">
                          デバッグセッションが開始されていません
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
} 