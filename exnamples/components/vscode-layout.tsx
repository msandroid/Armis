"use client"

import { useState } from "react"
import { Activity, FileText, Settings, MessageSquare, Radio, Zap } from "lucide-react"
import { EnhancedFileManager } from "@/components/enhanced-file-manager"
import { FinalVSCodeEditor } from "@/components/final-vscode-editor"
import { AIChatEnhanced } from "@/components/ai-chat-enhanced"
import { MulmocastPanel } from "@/components/mulmocast-panel"
import { ComfyUIPanel } from "@/components/comfyui-panel"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  children?: FileNode[]
  language?: string
  content?: string
  isOpen?: boolean
}

interface VSCodeLayoutProps {
  files: FileNode[]
  onFileSelect?: (file: FileNode) => void
  onContentChange?: (fileId: string, content: string) => void
}

export function VSCodeLayout({ files, onFileSelect, onContentChange }: VSCodeLayoutProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [activePanel, setActivePanel] = useState<"explorer" | "search" | "git" | "debug">("explorer")
  const [showChat, setShowChat] = useState(false)
  const [showMulmocast, setShowMulmocast] = useState(false)
  const [showComfyUI, setShowComfyUI] = useState(false)

  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file)
    onFileSelect?.(file)
  }

  const handleContentChange = (content: string) => {
    if (selectedFile) {
      onContentChange?.(selectedFile.id, content)
    }
  }

  const getSelectedFileContent = () => {
    return selectedFile?.content || ""
  }

  const getSelectedFileLanguage = () => {
    return selectedFile?.language || "javascript"
  }

  const findFileById = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findFileById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  return (
    <div className="h-screen flex bg-zinc-900 text-zinc-100">
      {/* 左側のサイドバー */}
      <div className="w-16 bg-zinc-950 flex flex-col items-center py-4 space-y-2">
        <button
          className={`h-10 w-10 flex items-center justify-center rounded ${
            activePanel === "explorer" ? "bg-zinc-800 text-blue-400" : "text-zinc-400 hover:text-zinc-300"
          }`}
          onClick={() => setActivePanel("explorer")}
          title="Explorer"
        >
          <FileText className="h-5 w-5" />
        </button>
        
        <button
          className="h-10 w-10 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-300"
          title="Search"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        <button
          className="h-10 w-10 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-300"
          title="Git"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </button>
        
        <button
          className="h-10 w-10 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-300"
          title="Debug"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        <div className="flex-1"></div>
        
        <button
          variant="ghost"
          size="sm"
          className={`h-10 w-10 mb-1 ${
            showChat ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400 hover:text-zinc-300'
          }`}
          onClick={() => setShowChat(!showChat)}
          title="AI Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
        
        <button
          variant="ghost"
          size="sm"
          className={`h-10 w-10 mb-1 ${
            showMulmocast ? 'bg-zinc-800 text-green-400' : 'text-zinc-400 hover:text-zinc-300'
          }`}
          onClick={() => setShowMulmocast(!showMulmocast)}
          title="Mulmocast CLI"
        >
          <Radio className="h-5 w-5" />
        </button>
        
        <button
          variant="ghost"
          size="sm"
          className={`h-10 w-10 mb-1 ${
            showComfyUI ? 'bg-zinc-800 text-purple-400' : 'text-zinc-400 hover:text-zinc-300'
          }`}
          onClick={() => setShowComfyUI(!showComfyUI)}
          title="ComfyUI"
        >
          <Zap className="h-5 w-5" />
        </button>
        
        <button
          variant="ghost"
          size="sm"
          className="h-10 w-10 text-zinc-400 hover:text-zinc-300"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* ファイルエクスプローラーパネル */}
        {activePanel === "explorer" && (
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <EnhancedFileManager
              onFileSelect={handleFileSelect}
              onFileChange={(updatedFiles) => {
                // ファイルツリーが更新された時の処理
                console.log('File tree updated:', updatedFiles)
              }}
              showPreview={false} // サイドパネルでは簡易表示
              showSearch={true}
            />
          </ResizablePanel>
        )}

        {/* チャットパネル */}
        {showChat && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <AIChatEnhanced
                chatHistory={[
                  {
                    role: "assistant",
                    content: "こんにちは！VSCodeライクなArmisエディターへようこそ。何かお手伝いできることはありますか？",
                  },
                ]}
                onChatSubmit={(message) => console.log("Chat:", message)}
                onChatResponse={(response) => console.log("Response:", response)}
              />
            </ResizablePanel>
          </>
        )}

        {/* Mulmocastパネル */}
        {showMulmocast && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <div className="h-full bg-zinc-900 border-r border-zinc-800 p-4">
                <MulmocastPanel />
              </div>
            </ResizablePanel>
          </>
        )}

        {/* ComfyUIパネル */}
        {showComfyUI && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
              <div className="h-full bg-zinc-900 border-r border-zinc-800 p-4">
                <ComfyUIPanel />
              </div>
            </ResizablePanel>
          </>
        )}

        {/* メインエディターエリア */}
        <ResizablePanel defaultSize={showChat || showMulmocast || showComfyUI ? 55 : 80} minSize={40}>
          <div className="flex-1 flex flex-col">
            {selectedFile ? (
              <FinalVSCodeEditor
                content={getSelectedFileContent()}
                language={getSelectedFileLanguage()}
                onContentChange={handleContentChange}
                theme="vs-dark"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400">
                <div className="text-center">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Welcome to Armis Editor</h3>
                  <p className="text-sm">Select a file from the explorer to start editing</p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
} 