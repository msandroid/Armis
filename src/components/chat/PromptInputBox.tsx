import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, AtSign, Infinity as InfinityIcon, ChevronUp, Image as ImageIcon, FileText, Folder, Code, BookOpen, GitBranch, MessageSquare, Globe, Link, Clock, AlertTriangle, Search, Hash, Command, X, Paperclip, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModelSettings, AVAILABLE_PROVIDERS } from '@/types/ai-sdk'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { UpArrowIcon } from '@/components/ui/up-arrow-icon'


interface PromptInputBoxProps {
  onSend: (message: string, contexts?: SelectedContext[]) => void
  onAttachFiles: (files: File[]) => void
  onStop?: () => void // 停止コールバック
  disabled?: boolean
  placeholder?: string
  className?: string
  modelSettings?: ModelSettings
  onModelSettingsChange?: (settings: ModelSettings) => void
  onModelSelect?: (modelId: string) => void
  providerApiKeys?: Record<string, string>
  loadingState?: 'idle' | 'text' | 'media'
  selectedFiles?: File[]
  currentProviderConfig?: { providerId: string; modelId: string } | null
  isGenerating?: boolean // 生成中かどうかの状態
}

interface ModelOption {
  id: string
  name: string
  description: string
  providerId: string
}

interface ModeOption {
  id: string
  name: string
  description: string
}

interface ContextOption {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'files' | 'code' | 'docs' | 'git' | 'chat' | 'web' | 'tools'
}

interface SelectedContext {
  id: string
  type: string
  name: string
  value?: string
}

export const PromptInputBox: React.FC<PromptInputBoxProps> = ({
  onSend,
  onAttachFiles,
  onStop,
  disabled = false,
  placeholder = "Plan, search, build anything",
  className,
  modelSettings,
  onModelSettingsChange,
  onModelSelect,
  providerApiKeys = {},
  loadingState = 'idle',
  selectedFiles = [],
  currentProviderConfig = null,
  isGenerating = false,
}) => {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [selectedModel, setSelectedModel] = useState('auto')
  const [selectedMode, setSelectedMode] = useState('ask')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [showContextDropdown, setShowContextDropdown] = useState(false)
  const [selectedContexts, setSelectedContexts] = useState<SelectedContext[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 有効なモデルのみを取得
  const getEnabledModels = (): ModelOption[] => {
    if (!modelSettings) {
      // Default model options
      return [
        { id: 'auto', name: 'Auto', description: 'Auto select', providerId: 'auto' },
        { id: 'gpt4', name: 'GPT-4', description: 'Advanced reasoning', providerId: 'openai' },
        { id: 'claude', name: 'Claude', description: 'Creative thinking', providerId: 'anthropic' },
        { id: 'gemini', name: 'Gemini', description: 'Multimodal', providerId: 'google' },
      ]
    }

    const enabledModels: ModelOption[] = [
      { id: 'auto', name: 'Auto', description: 'Auto select', providerId: 'auto' }
    ]

    // Settingsで有効にされたモデルを追加
    modelSettings.enabledModels.forEach(enabledModel => {
      if (enabledModel.enabled) {
        const provider = AVAILABLE_PROVIDERS.find(p => p.id === enabledModel.providerId)
        const model = provider?.models.find(m => m.id === enabledModel.modelId)
        
        if (model) {
          // API Keyが設定されているかチェック
          const hasApiKey = providerApiKeys[enabledModel.providerId] && providerApiKeys[enabledModel.providerId].trim() !== ''
          const apiKeyWarning = !hasApiKey && provider?.requiresApiKey ? ' (API Key not set)' : ''
          
          enabledModels.push({
            id: `${enabledModel.providerId}:${enabledModel.modelId}`,
            name: model.name,
            description: `${model.description || `${provider?.name} model`}${apiKeyWarning}`,
            providerId: enabledModel.providerId
          })
        }
      }
    })

    return enabledModels
  }

  const modelOptions: ModelOption[] = getEnabledModels()

  // 選択されたモデルの表示名を取得
  const getSelectedModelDisplayName = (): string => {
    const selectedOption = modelOptions.find(option => option.id === selectedModel)
    if (selectedModel === 'auto') {
      // Auto modeの場合、現在選択されているモデルを表示
      const currentConfig = currentProviderConfig
      if (currentConfig) {
        const provider = AVAILABLE_PROVIDERS.find(p => p.id === currentConfig.providerId)
        const model = provider?.models.find(m => m.id === currentConfig.modelId)
        return model ? `Auto (${model.name})` : 'Auto'
      }
      return 'Auto'
    }
    return selectedOption ? selectedOption.name : 'Auto'
  }

  const modeOptions: ModeOption[] = [
    { id: 'ask', name: 'Ask', description: 'Ask mode' },
    { id: 'agent', name: 'Agent', description: 'Agent mode' },
  ]

  const contextOptions: ContextOption[] = [
    // Files & Folders
    { id: 'files', name: 'Files', description: 'プロジェクト内の特定ファイルを参照', icon: FileText, category: 'files' },
    { id: 'folders', name: 'Folders', description: 'フォルダ全体を参照し、広範な文脈を提供', icon: Folder, category: 'files' },
    { id: 'code', name: 'Code', description: 'コードの断片やシンボルをピンポイントで参照', icon: Code, category: 'code' },
    
    // Documentation
    { id: 'docs', name: 'Docs', description: '公式ドキュメントや追加インデックスされたドキュメントを参照', icon: BookOpen, category: 'docs' },
    { id: 'link', name: 'Link', description: 'ドキュメントやコードへのリンクを挿入（自動リンク化）', icon: Link, category: 'docs' },
    
    // Git & History
    { id: 'git', name: 'Git', description: 'Git のコミット・差分・プルリクエストなどを参照', icon: GitBranch, category: 'git' },
    { id: 'past-chats', name: 'Past Chats', description: '要約された過去のチャットセッションを参照', icon: MessageSquare, category: 'chat' },
    { id: 'recent-changes', name: 'Recent Changes', description: '最近の変更内容へのリンクを追加', icon: Clock, category: 'git' },
    
    // Web & External
    { id: 'web', name: 'Web', description: 'インターネット上の最新情報を検索・参照', icon: Globe, category: 'web' },
    
    // Tools & Errors
    { id: 'linter-errors', name: 'Linter Errors', description: 'リントエラーを参照（Chat のみ）', icon: AlertTriangle, category: 'tools' },
    { id: 'definitions', name: 'Definitions', description: 'シンボルの定義を参照（Inline Edit のみ）', icon: Search, category: 'code' },
    { id: 'hash-files', name: '#Files', description: 'ファイルをコンテキストに追加（参照なし）', icon: Hash, category: 'files' },
    { id: 'command', name: '/command', description: 'クイックコマンドで開いているファイルをコンテキストに追加', icon: Command, category: 'tools' },
  ]

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim(), selectedContexts)
      setMessage('')
      setSelectedContexts([])
    }
  }

  const handleStop = () => {
    if (onStop) {
      onStop()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      console.log('=== ファイル選択 ===')
      console.log('選択されたファイル数:', files.length)
      
      const fileArray = Array.from(files)
      fileArray.forEach((file, index) => {
        console.log(`ファイル ${index + 1}:`, {
          name: file.name,
          type: file.type,
          size: file.size,
          sizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
        })
        
        // 動画ファイルの特別処理
        if (file.type.startsWith('video/') || 
            ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv', '.flv']
            .some(ext => file.name.toLowerCase().endsWith(ext))) {
          console.log('動画ファイルとして認識:', file.name)
          
          // 動画ファイルのMIMEタイプを確認・修正
          const extension = file.name.split('.').pop()?.toLowerCase()
          const mimeTypeMap: Record<string, string> = {
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'wmv': 'video/x-ms-wmv',
            'webm': 'video/webm',
            'mkv': 'video/x-matroska',
            'm4v': 'video/mp4',
            '3gp': 'video/3gpp',
            'ogv': 'video/ogg',
            'flv': 'video/x-flv'
          }
          
          if (extension && mimeTypeMap[extension]) {
            console.log(`動画ファイルのMIMEタイプを修正: ${file.type} -> ${mimeTypeMap[extension]}`)
            // 新しいBlobを作成してMIMEタイプを修正
            const correctedBlob = new Blob([file], { type: mimeTypeMap[extension] })
            const correctedFile = new File([correctedBlob], file.name, { type: mimeTypeMap[extension] })
            fileArray[index] = correctedFile
          }
        }
      })
      
      onAttachFiles(fileArray)
      
      // ファイル入力をリセット（同じファイルを再度選択できるように）
      e.target.value = ''
    }
  }

  const handleContextSelect = (option: ContextOption) => {
    const newContext: SelectedContext = {
      id: option.id,
      type: option.category,
      name: option.name,
    }
    setSelectedContexts(prev => [...prev, newContext])
    setShowContextDropdown(false)
  }

  const handleContextRemove = (contextId: string) => {
    setSelectedContexts(prev => prev.filter(ctx => ctx.id !== contextId))
  }

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    setShowModelDropdown(false)
    // 親コンポーネントにモデル選択を通知
    onModelSelect?.(modelId)
  }

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelDropdown || showModeDropdown || showContextDropdown) {
        const target = event.target as Element
        if (!target.closest('.dropdown-container')) {
          setShowModelDropdown(false)
          setShowModeDropdown(false)
          setShowContextDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModelDropdown, showModeDropdown, showContextDropdown])

  // メッセージが変更されたときにテキストエリアの高さを調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  return (
    <div className={cn("flex flex-col gap-3 p-4 bg-background border-t border-border", className)}>
      {/* @ Add Context Button */}
      <div className="flex items-center gap-2">
        <div className="relative dropdown-container">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContextDropdown(!showContextDropdown)}
            className="h-7 px-3 text-xs border-border text-muted-foreground hover:bg-accent"
          >
            <AtSign className="w-3 h-3 mr-1" />
            Add Context
          </Button>
          
          {showContextDropdown && (
            <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 min-w-80 max-h-96 overflow-y-auto z-50">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">コンテキストを選択</div>
              
              {/* Files & Folders */}
              <div className="mb-3">
                <div className="text-xs font-medium text-foreground mb-1 px-2">ファイル & フォルダ</div>
                {contextOptions.filter(opt => opt.category === 'files').map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleContextSelect(option)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center gap-2"
                  >
                    <option.icon className="w-3 h-3" />
                    <div>
                      <div className="font-medium">@{option.name}</div>
                      <div className="text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Code */}
              <div className="mb-3">
                <div className="text-xs font-medium text-foreground mb-1 px-2">コード</div>
                {contextOptions.filter(opt => opt.category === 'code').map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleContextSelect(option)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center gap-2"
                  >
                    <option.icon className="w-3 h-3" />
                    <div>
                      <div className="font-medium">@{option.name}</div>
                      <div className="text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Documentation */}
              <div className="mb-3">
                <div className="text-xs font-medium text-foreground mb-1 px-2">ドキュメント</div>
                {contextOptions.filter(opt => opt.category === 'docs').map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleContextSelect(option)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center gap-2"
                  >
                    <option.icon className="w-3 h-3" />
                    <div>
                      <div className="font-medium">@{option.name}</div>
                      <div className="text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Git & History */}
              <div className="mb-3">
                <div className="text-xs font-medium text-foreground mb-1 px-2">Git & 履歴</div>
                {contextOptions.filter(opt => opt.category === 'git').map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleContextSelect(option)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center gap-2"
                  >
                    <option.icon className="w-3 h-3" />
                    <div>
                      <div className="font-medium">@{option.name}</div>
                      <div className="text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Chat */}
              <div className="mb-3">
                <div className="text-xs font-medium text-foreground mb-1 px-2">チャット</div>
                {contextOptions.filter(opt => opt.category === 'chat').map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleContextSelect(option)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center gap-2"
                  >
                    <option.icon className="w-3 h-3" />
                    <div>
                      <div className="font-medium">@{option.name}</div>
                      <div className="text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Web */}
              <div className="mb-3">
                <div className="text-xs font-medium text-foreground mb-1 px-2">Web</div>
                {contextOptions.filter(opt => opt.category === 'web').map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleContextSelect(option)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center gap-2"
                  >
                    <option.icon className="w-3 h-3" />
                    <div>
                      <div className="font-medium">@{option.name}</div>
                      <div className="text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Tools */}
              <div className="mb-3">
                <div className="text-xs font-medium text-foreground mb-1 px-2">ツール</div>
                {contextOptions.filter(opt => opt.category === 'tools').map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleContextSelect(option)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center gap-2"
                  >
                    <option.icon className="w-3 h-3" />
                    <div>
                      <div className="font-medium">@{option.name}</div>
                      <div className="text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Contexts Display */}
        {selectedContexts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedContexts.map((context) => (
              <div
                key={context.id}
                className="flex items-center gap-1 px-2 py-1 bg-accent border border-border rounded text-xs"
              >
                <span className="text-primary">@{context.name}</span>
                <button
                  onClick={() => handleContextRemove(context.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${context.name} context`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main input area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[100px] max-h-[200px] resize-none text-sm rounded-lg border-border bg-input pr-20"
          rows={1}
        />
        
        {/* Bottom controls */}
        <div className="absolute bottom-2 left-3 flex items-center gap-3">
          {/* Agent Model Switch */}
          <div className="relative dropdown-container">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="h-6 px-2 text-xs border-border text-muted-foreground hover:bg-accent"
            >
              <InfinityIcon className="w-3 h-3 mr-1" />
              {getSelectedModelDisplayName()}
              <span className="ml-1 text-xs opacity-60">⌘I</span>
              <ChevronUp className="w-3 h-3 ml-1" />
            </Button>
            
            {showModelDropdown && (
              <div className="absolute bottom-full left-0 mb-1 bg-card border border-border rounded-lg shadow-lg p-1 min-w-48 z-50">
                {modelOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleModelSelect(option.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded hover:bg-accent",
                      selectedModel === option.id ? "bg-accent" : ""
                    )}
                  >
                    <div className="font-medium">{option.name}</div>
                    <div className="text-muted-foreground">{option.description}</div>
                    {option.providerId !== 'auto' && (
                      <div className="text-xs text-muted-foreground/70">
                        {AVAILABLE_PROVIDERS.find(p => p.id === option.providerId)?.name}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Switch */}
          <div className="relative dropdown-container">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className="h-6 px-2 text-xs border-border text-muted-foreground hover:bg-accent"
            >
              {modeOptions.find(m => m.id === selectedMode)?.name || 'Ask'}
              <ChevronUp className="w-3 h-3 ml-1" />
            </Button>
            
            {showModeDropdown && (
              <div className="absolute bottom-full left-0 mb-1 bg-card border border-border rounded-lg shadow-lg p-1 min-w-48 z-50">
                {modeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedMode(option.id)
                      setShowModeDropdown(false)
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded hover:bg-accent",
                      selectedMode === option.id ? "bg-accent" : ""
                    )}
                  >
                    <div className="font-medium">{option.name}</div>
                    <div className="text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side action buttons */}
        <div className="absolute bottom-2 right-3 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.txt,.md,.json,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Select files"
          />
          <Button
            onClick={handleFileSelect}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 rounded border-border text-muted-foreground hover:bg-accent"
            disabled={disabled}
            title="ファイルを添付 (画像、動画、音声、ドキュメント)"
          >
            <Paperclip className="w-3 h-3" />
          </Button>
          
          <Button
            onClick={isGenerating ? handleStop : handleSend}
            disabled={!message.trim() || disabled}
            size="sm"
            className={cn(
              "h-6 w-6 p-0 rounded-full",
              isGenerating 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            title={isGenerating ? "生成を停止" : "送信"}
          >
            {loadingState === 'media' ? (
              <CircleSpinner size="sm" className="text-white" />
            ) : isGenerating ? (
              <Square className="w-3 h-3" />
            ) : (
              <UpArrowIcon className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
