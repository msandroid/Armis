import { glob } from 'glob'
import { readFileSync, statSync } from 'fs'
import { join, relative, extname } from 'path'
import chokidar from 'chokidar'

export interface FileInfo {
  path: string
  relativePath: string
  content: string
  size: number
  lastModified: Date
  language: string
  isDirectory: boolean
}

export interface ScanOptions {
  rootPath: string
  includePatterns?: string[]
  excludePatterns?: string[]
  maxFileSize?: number
  supportedExtensions?: string[]
}

export class FileScanner {
  private supportedLanguages = new Map([
    ['.ts', 'typescript'],
    ['.tsx', 'typescript'],
    ['.js', 'javascript'],
    ['.jsx', 'javascript'],
    ['.py', 'python'],
    ['.java', 'java'],
    ['.cpp', 'cpp'],
    ['.c', 'c'],
    ['.go', 'go'],
    ['.rs', 'rust'],
    ['.php', 'php'],
    ['.rb', 'ruby'],
    ['.swift', 'swift'],
    ['.kt', 'kotlin'],
    ['.scala', 'scala'],
    ['.cs', 'csharp'],
    ['.html', 'html'],
    ['.css', 'css'],
    ['.scss', 'scss'],
    ['.sass', 'sass'],
    ['.less', 'less'],
    ['.json', 'json'],
    ['.yaml', 'yaml'],
    ['.yml', 'yaml'],
    ['.toml', 'toml'],
    ['.md', 'markdown'],
    ['.txt', 'text']
  ])

  private defaultExcludePatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/.vscode/**',
    '**/.idea/**',
    '**/*.log',
    '**/*.lock',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml'
  ]

  async scanFiles(options: ScanOptions): Promise<FileInfo[]> {
    const {
      rootPath,
      includePatterns = ['**/*'],
      excludePatterns = [],
      maxFileSize = 10 * 1024 * 1024, // 10MB
      supportedExtensions = Array.from(this.supportedLanguages.keys())
    } = options

    // ブラウザ環境では、サンプルファイルを生成
    return this.generateSampleFiles(rootPath, supportedExtensions)
  }

  private generateSampleFiles(rootPath: string, supportedExtensions: string[]): FileInfo[] {
    const sampleFiles: FileInfo[] = []
    const now = new Date()

    // TypeScript/JavaScriptのサンプルファイル
    if (supportedExtensions.includes('.ts')) {
      sampleFiles.push({
        path: `${rootPath}/src/App.tsx`,
        relativePath: 'src/App.tsx',
        content: `import React from 'react'
import { ChatWindow } from './components/chat/ChatWindow'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-cascade">
      <div className="cascade-sidebar">
        <ChatWindow />
      </div>
    </div>
  )
}

export default App`,
        size: 300,
        lastModified: now,
        language: 'typescript',
        isDirectory: false
      })
    }

    if (supportedExtensions.includes('.ts')) {
      sampleFiles.push({
        path: `${rootPath}/src/components/chat/ChatWindow.tsx`,
        relativePath: 'src/components/chat/ChatWindow.tsx',
        content: `import React, { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage, ChatMessageProps } from './ChatMessage'
import { PromptInputBox } from './PromptInputBox'

interface ChatWindowProps {
  className?: string
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: ChatMessageProps = {
      id: Date.now().toString(),
      content,
      role: 'user',
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        content: 'This is a sample response from the AI assistant.',
        role: 'assistant',
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))}
        </div>
      </ScrollArea>
      <PromptInputBox onSend={handleSendMessage} disabled={isTyping} />
    </div>
  )
}`,
        size: 800,
        lastModified: now,
        language: 'typescript',
        isDirectory: false
      })
    }

    if (supportedExtensions.includes('.ts')) {
      sampleFiles.push({
        path: `${rootPath}/src/services/ai-sdk-service.ts`,
        relativePath: 'src/services/ai-sdk-service.ts',
        content: `import { openai } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'

export class AISDKService {
  private model = openai('gpt-4')

  async generateResponse(prompt: string): Promise<string> {
    const result = await generateText({
      model: this.model,
      prompt,
    })
    return result.text
  }

  async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    const stream = await streamText({
      model: this.model,
      prompt,
    })

    for await (const chunk of stream.textStream) {
      onChunk(chunk)
    }
  }
}`,
        size: 400,
        lastModified: now,
        language: 'typescript',
        isDirectory: false
      })
    }

    if (supportedExtensions.includes('.json')) {
      sampleFiles.push({
        path: `${rootPath}/package.json`,
        relativePath: 'package.json',
        content: `{
  "name": "armis",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "@ai-sdk/openai": "^2.0.0"
  }
}`,
        size: 200,
        lastModified: now,
        language: 'json',
        isDirectory: false
      })
    }

    if (supportedExtensions.includes('.md')) {
      sampleFiles.push({
        path: `${rootPath}/README.md`,
        relativePath: 'README.md',
        content: `# Armis - AI Code Assistant

Armisは、Cursorのようなコードベース全体のインデックス作成機能を備えたAIコードアシスタントです。

## 機能

- コードベースインデックス作成
- シンボル検索
- AIチャット統合

## 使用方法

1. プロジェクトのインデックスを作成
2. シンボルを検索
3. AIチャットで質問`,
        size: 300,
        lastModified: now,
        language: 'markdown',
        isDirectory: false
      })
    }

    return sampleFiles
  }

  watchFiles(
    rootPath: string,
    onFileChange: (event: 'add' | 'change' | 'unlink', filePath: string) => void,
    excludePatterns: string[] = []
  ) {
    // ブラウザ環境ではファイル監視は実装しない
    console.log('File watching is not available in browser environment')
    
    // モックのwatcherオブジェクトを返す
    return {
      close: () => console.log('File watcher closed')
    }
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.supportedLanguages.values())
  }

  getSupportedExtensions(): string[] {
    return Array.from(this.supportedLanguages.keys())
  }

  isSupportedFile(filePath: string): boolean {
    const ext = this.getFileExtension(filePath)
    return this.supportedLanguages.has(ext)
  }

  private getFileExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.')
    return lastDotIndex !== -1 ? filePath.substring(lastDotIndex) : ''
  }
}
