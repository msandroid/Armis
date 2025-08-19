// AI Chat with Sequential Thinking integration
// AIChatWithSequentialThinking コンポーネントを直接エクスポート
export { AIChatWithSequentialThinking as AIChat } from "@/components/ai-chat-with-sequential-thinking"

// 型定義の再エクスポート
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  preview?: string
  status: 'uploading' | 'success' | 'error'
}

export interface AIChatProps {
  chatHistory: Array<{ role: string; content: string }>
  onChatSubmit: (message: string) => void
  onChatResponse: (response: string) => void
  theme?: "dark" | "light"
  onFileUpload?: (files: UploadedFile[]) => void
}