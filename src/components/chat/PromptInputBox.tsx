import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, AtSign, Infinity as InfinityIcon, ChevronUp, Image as ImageIcon, FileText, Folder, Code, BookOpen, GitBranch, MessageSquare, Globe, Link, Clock, AlertTriangle, Search, Hash, Command, X, Paperclip, Square, Volume2, Video, Settings, Mic, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModelSettings, AVAILABLE_PROVIDERS } from '@/types/ai-sdk'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { UpArrowIcon } from '@/components/ui/up-arrow-icon'
import { createSTTService, STTSettingsService, STTService } from '@/services/stt'


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
  webSearchEnabled?: boolean // ウェブ検索が有効かどうか
  onWebSearchToggle?: (enabled: boolean) => void // ウェブ検索のON/OFF切り替え
  createImageEnabled?: boolean // 画像生成が有効かどうか
  onCreateImageToggle?: (enabled: boolean) => void // 画像生成のON/OFF切り替え
  audioEnabled?: boolean // 音声生成が有効かどうか
  onAudioToggle?: (enabled: boolean) => void // 音声生成のON/OFF切り替え
  videoEnabled?: boolean // 動画生成が有効かどうか
  onVideoToggle?: (enabled: boolean) => void // 動画生成のON/OFF切り替え
  onGetCurrentMessage?: () => string // 現在のメッセージを取得するコールバック
  generationSettings?: any // TTSモデル情報を含む生成設定
  onSTTStatusChange?: (isTranscribing: boolean, fileName?: string) => void // STT実行状態の変更通知
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
  webSearchEnabled = false,
  onWebSearchToggle,
  createImageEnabled = false,
  onCreateImageToggle,
  audioEnabled = false,
  onAudioToggle,
  videoEnabled = false,
  onVideoToggle,
  onGetCurrentMessage,
  generationSettings,
  onSTTStatusChange,

}) => {
  // isGeneratingの状態変更をログ出力
  useEffect(() => {
    console.log('🔄 PromptInputBox isGenerating changed:', isGenerating)
  }, [isGenerating])
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [selectedModel, setSelectedModel] = useState('auto')
  const [selectedMode, setSelectedMode] = useState('ask')
  const [selectedTTSModel, setSelectedTTSModel] = useState('auto')
  const [selectedSTTModel, setSelectedSTTModel] = useState('auto')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [showTTSModelDropdown, setShowTTSModelDropdown] = useState(false)
  const [showSTTModelDropdown, setShowSTTModelDropdown] = useState(false)
  const [showContextDropdown, setShowContextDropdown] = useState(false)

  const [selectedContexts, setSelectedContexts] = useState<SelectedContext[]>([])
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([])
  const [ttsModelOptions, setTtsModelOptions] = useState<ModelOption[]>([])
  const [sttModelOptions, setSttModelOptions] = useState<ModelOption[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 音声関連の状態
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [whisperService, setWhisperService] = useState<STTService | null>(null)
  const whisperServiceRef = useRef<STTService | null>(null)
  const sttSettingsService = STTSettingsService.getInstance()

  // STT設定に基づいてWhisperServiceを初期化
  useEffect(() => {
    const initializeWhisperService = async () => {
      // 既にWhisperServiceが初期化されている場合はスキップ
      if (whisperServiceRef.current) {
        console.log('✅ Whisper service already initialized, skipping...')
        return
      }

      const sttSettings = sttSettingsService.getSettings()
      
      // デバッグ情報を追加
      console.log('🔄 STT Settings Debug:', {
        enabled: sttSettings.enabled,
        provider: sttSettings.provider,
        defaultModel: sttSettings.defaultModel,
        enabledModels: sttSettingsService.getEnabledModels()
      })
      
      // STT設定が無効の場合は自動的に有効化を試行
      if (!sttSettings.enabled) {
        console.log('🔄 STT is disabled, attempting to enable...')
        sttSettingsService.toggleEnabled()
      }
      
      // 設定を再取得（有効化された可能性があるため）
      const currentSettings = sttSettingsService.getSettings()
      
      if (currentSettings.enabled && currentSettings.provider === 'whisper-cpp') {
        try {
          // WhisperServiceFactoryを使用して適切なサービスを選択
          const { WhisperServiceFactory } = await import('../../services/stt/whisper-service-factory')
          const newService = await WhisperServiceFactory.createWhisperService()
          whisperServiceRef.current = newService
          setWhisperService(newService)
          console.log('✅ Whisper service initialized successfully')
        } catch (error) {
          console.error('Failed to create STT service:', error)
          whisperServiceRef.current = null
          setWhisperService(null)
        }
      } else {
        console.log('❌ STT service not available:', {
          enabled: currentSettings.enabled,
          provider: currentSettings.provider
        })
        whisperServiceRef.current = null
        setWhisperService(null)
      }
    }

    initializeWhisperService()
  }, [sttSettingsService])

  // STT設定の変更を監視して、現在有効なモデルを自動選択
  useEffect(() => {
    const handleSTTModelChange = () => {
      const sttSettings = sttSettingsService.getSettings()
      const enabledModelId = Object.entries(sttSettings.models)
        .find(([_, config]) => config.enabled)?.[0]
      
      // 現在選択されているモデルが無効になった場合、有効なモデルに切り替え
      if (selectedSTTModel !== 'auto' && enabledModelId && selectedSTTModel !== enabledModelId) {
        const isCurrentModelEnabled = sttSettings.models[selectedSTTModel]?.enabled || false
        if (!isCurrentModelEnabled) {
          console.log(`STT model ${selectedSTTModel} disabled, switching to ${enabledModelId}`)
          setSelectedSTTModel(enabledModelId)
        }
      }
      
      // 現在選択されているモデルがautoで、有効なモデルがある場合はそのモデルを選択
      if (selectedSTTModel === 'auto' && enabledModelId) {
        console.log(`Auto STT mode, selecting enabled model: ${enabledModelId}`)
        setSelectedSTTModel(enabledModelId)
      }
    }

    // STT設定サービスの変更リスナーを追加
    sttSettingsService.addChangeListener(handleSTTModelChange)
    
    // 初期化時に一度実行
    handleSTTModelChange()
    
    // クリーンアップ時にリスナーを削除
    return () => {
      sttSettingsService.removeChangeListener(handleSTTModelChange)
    }
  }, [sttSettingsService, selectedSTTModel])

  // 音声ファイルのアップロードと文字起こし処理
  const handleAudioFileUpload = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      console.error('Invalid audio file')
      return
    }

    if (!whisperServiceRef.current) {
      alert('STT service is not available. Please check your STT settings.')
      return
    }

    setIsTranscribing(true)
    // STT実行開始を親コンポーネントに通知
    onSTTStatusChange?.(true, file.name)
    
    try {
      console.log('Starting audio transcription with whisper.cpp...')
      console.log('Audio file:', file.name, 'Size:', file.size, 'Type:', file.type)
      
      // ファイルをArrayBufferに変換
      const arrayBuffer = await file.arrayBuffer()
      
      // whisper.cppで文字起こし実行
      const result = await whisperServiceRef.current.transcribe(arrayBuffer, {
        language: 'ja',
        temperature: 0.0
      })
      
      console.log('Transcription completed:', result)
      
      // 文字起こし結果をメッセージ入力欄に設定
      const transcriptionText = `[音声文字起こし結果]\n${result.text}\n\n`
      setMessage(prev => prev + transcriptionText)
      
      // テキストエリアにフォーカス
      if (textareaRef.current) {
        textareaRef.current.focus()
        // カーソルを末尾に移動
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        )
      }
      
    } catch (error) {
      console.error('Audio transcription failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Whisper初期化エラーの場合は特別なメッセージを表示
      if (errorMessage.includes('Whisper initialization failed') || errorMessage.includes('initialization timeout')) {
        alert(`Whisperモジュールの初期化に失敗しました。\n\nWebAssembly版のwhisper.cppに切り替えて再試行します。\n\nしばらくお待ちください...`)
        
        // WebAssembly版にフォールバック
        try {
          const { WhisperServiceFactory } = await import('../../services/stt/whisper-service-factory')
          const fallbackService = await WhisperServiceFactory.createWhisperService()
          setWhisperService(fallbackService)
          
          // 再度音声認識を試行
          const retryResult = await fallbackService.transcribe(await file.arrayBuffer(), {
            language: 'ja',
            temperature: 0.0
          })
          
          console.log('✅ Fallback transcription completed:', retryResult)
          
          // 文字起こし結果をメッセージ入力欄に設定
          const transcriptionText = `[音声文字起こし結果]\n${retryResult.text}\n\n`
          setMessage(prev => prev + transcriptionText)
          
          // テキストエリアにフォーカス
          if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(
              textareaRef.current.value.length,
              textareaRef.current.value.length
            )
          }
          
          return // 成功した場合は処理を終了
        } catch (fallbackError) {
          console.error('Fallback transcription also failed:', fallbackError)
          alert(`WebAssembly版でも音声の文字起こしに失敗しました: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
        }
      } else {
        alert(`音声の文字起こしに失敗しました: ${errorMessage}`)
      }
    } finally {
      setIsTranscribing(false)
      // STT実行終了を親コンポーネントに通知
      onSTTStatusChange?.(false)
    }
  }

  // 有効なLLMモデルのみを取得（TTSモデルは除外）
  const getEnabledModels = (): ModelOption[] => {
    if (!modelSettings) {
      // Default model options
      return [
        { id: 'auto', name: 'Auto', description: 'Auto select', providerId: 'auto' },
        { id: 'gpt4', name: 'GPT-4', description: 'Advanced reasoning', providerId: 'openai' },
        { id: 'claude', name: 'Claude', description: 'Creative thinking', providerId: 'anthropic' },
      ]
    }

    const enabledModels: ModelOption[] = [
      { id: 'auto', name: 'Auto', description: 'Auto select', providerId: 'auto' }
    ]

    // Settingsで有効にされたLLMモデルのみを追加（TTSモデルは除外）
    modelSettings.enabledModels.forEach(enabledModel => {
      if (enabledModel.enabled) {
        const provider = AVAILABLE_PROVIDERS.find(p => p.id === enabledModel.providerId)
        const model = provider?.models.find(m => m.id === enabledModel.modelId)
        
        // TTSモデルは除外（-ttsで終わるモデルID）
        if (model && !enabledModel.modelId.endsWith('-tts')) {
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

  // TTSモデルオプションを取得
  const getTTSModelOptions = (): ModelOption[] => {
    if (!generationSettings?.audio?.enabled) {
      return []
    }

    const ttsModels: ModelOption[] = [
      { id: 'auto', name: 'Auto TTS', description: 'Auto select TTS model', providerId: 'auto' }
    ]

    // 利用可能なTTSモデルを追加（設定に関係なく）
    const availableTTSModels = [
      { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash TTS', description: 'Google Gemini TTS model', providerId: 'google' },
      { id: 'gemini-2.5-pro-preview-tts', name: 'Gemini 2.5 Pro TTS', description: 'Google Gemini Pro TTS model', providerId: 'google' },
      { id: 'gpt-4o-mini-tts', name: 'GPT-4o Mini TTS', description: 'OpenAI TTS model', providerId: 'openai' },
      { id: 'inworld-tts-1', name: 'Inworld TTS', description: 'Inworld AI TTS model', providerId: 'inworld' }
    ]

    availableTTSModels.forEach(model => {
      // API Keyが設定されているかチェック
      const hasApiKey = providerApiKeys[model.providerId] && providerApiKeys[model.providerId].trim() !== ''
      const apiKeyWarning = !hasApiKey ? ' (API Key not set)' : ''
      
      ttsModels.push({
        id: model.id,
        name: model.name,
        description: `${model.description}${apiKeyWarning}`,
        providerId: model.providerId
      })
    })

    return ttsModels
  }

  // STTモデルオプションを取得
  const getSTTModelOptions = (): ModelOption[] => {
    const sttSettings = sttSettingsService.getSettings()
    
    // デバッグ情報を追加
    console.log('STT Settings Debug:', {
      enabled: sttSettings.enabled,
      provider: sttSettings.provider,
      models: sttSettings.models,
      enabledModels: Object.entries(sttSettings.models).filter(([_, config]) => config.enabled)
    })
    
    // STT設定が無効でも、有効化されたモデルがあれば表示する
    const enabledModels = Object.entries(sttSettings.models).filter(([_, config]) => config.enabled)
    if (enabledModels.length === 0) {
      console.log('No enabled STT models found')
      return []
    }

    const sttModels: ModelOption[] = [
      { id: 'auto', name: 'Auto STT', description: 'Auto select STT model', providerId: 'auto' }
    ]

    // 有効化されたWhisper.cppモデルを追加
    Object.entries(sttSettings.models).forEach(([modelId, config]) => {
      if (config.enabled) {
        const model = sttSettingsService.getAvailableModels().find(m => m.id === modelId)
        if (model) {
          sttModels.push({
            id: modelId,
            name: model.name,
            description: model.description,
            providerId: 'whisper-cpp'
          })
        } else {
          console.warn(`STT model not found in available models: ${modelId}`)
        }
      }
    })

    console.log('STT Model Options:', sttModels)
    return sttModels
  }

  // modelSettings、providerApiKeys、またはgenerationSettingsが変更されたときにモデルオプションを更新
  useEffect(() => {
    const newModelOptions = getEnabledModels()
    const newTTSModelOptions = getTTSModelOptions()
    const newSTTModelOptions = getSTTModelOptions()
    setModelOptions(newModelOptions)
    setTtsModelOptions(newTTSModelOptions)
    setSttModelOptions(newSTTModelOptions)
    
    // デバッグ情報
    console.log('Model Options Debug:', {
      audioEnabled: audioEnabled,
      generationSettingsAudioEnabled: generationSettings?.audio?.enabled,
      llmModelOptionsLength: newModelOptions.length,
      llmModelOptions: newModelOptions,
      ttsModelOptionsLength: newTTSModelOptions.length,
      ttsModelOptions: newTTSModelOptions,
      sttModelOptionsLength: newSTTModelOptions.length,
      sttModelOptions: newSTTModelOptions,
      providerApiKeys: Object.keys(providerApiKeys)
    })
    
    // 現在選択されているモデルが無効になった場合、autoに戻す
    if (selectedModel !== 'auto' && !newModelOptions.find(option => option.id === selectedModel)) {
      setSelectedModel('auto')
    }

    // 現在選択されているTTSモデルが無効になった場合、autoに戻す
    if (selectedTTSModel !== 'auto' && !newTTSModelOptions.find(option => option.id === selectedTTSModel)) {
      setSelectedTTSModel('auto')
    }

    // 現在選択されているSTTモデルが無効になった場合、autoに戻す
    if (selectedSTTModel !== 'auto' && !newSTTModelOptions.find(option => option.id === selectedSTTModel)) {
      setSelectedSTTModel('auto')
    }
  }, [modelSettings, providerApiKeys, generationSettings, audioEnabled, sttSettingsService])

    // STT設定が変更されたときにモデルオプションを更新
  useEffect(() => {
    let isInitialized = false
    let lastModelOptions = ''
    let isProcessing = false
    let changeCount = 0
    
    const handleSTTSettingsChange = () => {
      console.log('STT settings change detected')
      
      // 処理中の場合はスキップ
      if (isProcessing) {
        console.log('STT settings change processing, skipping...')
        return
      }
      
      // 変更回数が多すぎる場合はスキップ（無限ループ防止）
      if (changeCount > 10) {
        console.warn('STT settings change limit reached, skipping further updates')
        return
      }
      
      isProcessing = true
      changeCount++
      
      try {
        const newSTTModelOptions = getSTTModelOptions()
        const modelOptionsString = JSON.stringify(newSTTModelOptions.map(opt => opt.id))
        
        // モデルオプションが変更されていない場合はスキップ
        if (modelOptionsString === lastModelOptions) {
          console.log('STT model options unchanged, skipping update')
          return
        }
        
        lastModelOptions = modelOptionsString
        setSttModelOptions(newSTTModelOptions)
        
        // 現在有効なSTTモデルを取得
        const sttSettings = sttSettingsService.getSettings()
        const enabledModelId = Object.entries(sttSettings.models)
          .find(([_, config]) => config.enabled)?.[0]
        
        // 初期化時のみモデル選択を自動調整
        if (!isInitialized) {
          // 現在選択されているSTTモデルが無効になった場合、有効なモデルまたはautoに設定
          if (selectedSTTModel !== 'auto' && !newSTTModelOptions.find(option => option.id === selectedSTTModel)) {
            if (enabledModelId && newSTTModelOptions.find(option => option.id === enabledModelId)) {
              setSelectedSTTModel(enabledModelId)
            } else {
              setSelectedSTTModel('auto')
            }
          }
          
          // 初期化時または有効なモデルがある場合は、そのモデルを選択
          if (selectedSTTModel === 'auto' && enabledModelId && newSTTModelOptions.find(option => option.id === enabledModelId)) {
            setSelectedSTTModel(enabledModelId)
          }
          
          isInitialized = true
        }
        
        console.log('STT settings changed, updated model options:', newSTTModelOptions, 'enabled model:', enabledModelId)
      } finally {
        isProcessing = false
      }
    }

    // STT設定サービスの変更リスナーを追加
    sttSettingsService.addChangeListener(handleSTTSettingsChange)
    
    // 初期化時に一度実行
    handleSTTSettingsChange()
    
    // クリーンアップ時にリスナーを削除
    return () => {
      sttSettingsService.removeChangeListener(handleSTTSettingsChange)
    }
  }, [sttSettingsService])

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
    console.log('🛑 Stop button clicked, isGenerating:', isGenerating)
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

  // ファイル選択処理を拡張
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // 音声ファイルの場合は文字起こし処理
    const audioFiles = files.filter(file => file.type.startsWith('audio/'))
    const otherFiles = files.filter(file => !file.type.startsWith('audio/'))

    // 音声ファイルがある場合は文字起こし実行
    if (audioFiles.length > 0) {
      audioFiles.forEach(file => handleAudioFileUpload(file))
    }

    // その他のファイルは通常の添付処理
    if (otherFiles.length > 0) {
      onAttachFiles(otherFiles)
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

  const handleModelSelect = async (modelId: string) => {
    setSelectedModel(modelId)
    setShowModelDropdown(false)
    // 親コンポーネントにモデル選択を通知
    onModelSelect?.(modelId)
  }

  const handleTTSModelSelect = async (modelId: string) => {
    setSelectedTTSModel(modelId)
    setShowTTSModelDropdown(false)
    
    // TTSモデル選択を親コンポーネントに通知
    if (modelId !== 'auto') {
      onModelSelect?.(`tts:${modelId}`)
    }
  }

  const handleSTTModelSelect = async (modelId: string) => {
    setSelectedSTTModel(modelId)
    setShowSTTModelDropdown(false)
    
    // Auto以外のモデルが選択された場合、STT設定でそのモデルを有効にする
    if (modelId !== 'auto') {
      const currentSettings = sttSettingsService.getSettings()
      
      // 選択されたモデルが有効でない場合、有効にする
      if (!currentSettings.models[modelId]?.enabled) {
        // 他のモデルを無効にして、選択されたモデルのみを有効にする
        const updatedModels = { ...currentSettings.models }
        Object.keys(updatedModels).forEach(key => {
          updatedModels[key].enabled = key === modelId
        })
        
        sttSettingsService.updateSettings({ models: updatedModels })
        console.log(`STT model ${modelId} enabled in settings`)
      }
      
      // STTモデル選択を親コンポーネントに通知
      onModelSelect?.(`stt:${modelId}`)
    }
  }



  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelDropdown || showModeDropdown || showTTSModelDropdown || showSTTModelDropdown || showContextDropdown) {
        const target = event.target as Element
        if (!target.closest('.dropdown-container')) {
          setShowModelDropdown(false)
          setShowModeDropdown(false)
          setShowTTSModelDropdown(false)
          setShowSTTModelDropdown(false)
          setShowContextDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModelDropdown, showModeDropdown, showTTSModelDropdown, showSTTModelDropdown, showContextDropdown])

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
        </div>
        
        {/* WebSearch Button */}
        <Button
          variant={webSearchEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onWebSearchToggle?.(!webSearchEnabled)}
          className={cn(
            "h-7 px-3 text-xs",
            webSearchEnabled 
              ? "bg-blue-600 text-white hover:bg-blue-700" 
              : "border-border text-muted-foreground hover:bg-accent"
          )}
          title={webSearchEnabled ? "ウェブ検索を無効にする" : "ウェブ検索を有効にする"}
        >
          <Search className="w-3 h-3 mr-1" />
          WebSearch
        </Button>

        {/* Create Image Button */}
        <Button
          variant={createImageEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onCreateImageToggle?.(!createImageEnabled)}
          className={cn(
            "h-7 px-3 text-xs",
            createImageEnabled 
              ? "bg-purple-600 text-white hover:bg-purple-700" 
              : "border-border text-muted-foreground hover:bg-accent"
          )}
          title={createImageEnabled ? "画像生成を無効にする" : "画像生成を有効にする"}
        >
          <ImageIcon className="w-3 h-3 mr-1" />
          Create Image
        </Button>

        {/* Audio Button */}
        <Button
          variant={audioEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onAudioToggle?.(!audioEnabled)}
          className={cn(
            "h-7 px-3 text-xs",
            audioEnabled 
              ? "bg-blue-600 text-white hover:bg-blue-700" 
              : "border-border text-muted-foreground hover:bg-accent"
          )}
          title={audioEnabled ? "音声生成を無効にする" : "音声生成を有効にする"}
        >
          <Volume2 className="w-3 h-3 mr-1" />
          Audio
        </Button>

        {/* Video Button */}
        <Button
          variant={videoEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onVideoToggle?.(!videoEnabled)}
          className={cn(
            "h-7 px-3 text-xs",
            videoEnabled 
              ? "bg-green-600 text-white hover:bg-green-700" 
              : "border-border text-muted-foreground hover:bg-accent"
          )}
          title={videoEnabled ? "動画生成を無効にする" : "動画生成を有効にする"}
        >
          <Video className="w-3 h-3 mr-1" />
          Video
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
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TTS Model Switch */}
          <div className="relative dropdown-container">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTTSModelDropdown(!showTTSModelDropdown)}
              className="h-6 px-2 text-xs border-border text-muted-foreground hover:bg-accent"
              disabled={ttsModelOptions.length <= 1}
              title={ttsModelOptions.length <= 1 ? "TTS models not available" : "Select TTS model"}
            >
              <Volume2 className="w-3 h-3 mr-1" />
              {ttsModelOptions.find(m => m.id === selectedTTSModel)?.name || 'Auto TTS'}
              <ChevronUp className="w-3 h-3 ml-1" />
            </Button>
            
            {showTTSModelDropdown && ttsModelOptions.length > 1 && (
              <div className="absolute bottom-full left-0 mb-1 bg-card border border-border rounded-lg shadow-lg p-1 min-w-48 z-50">
                {ttsModelOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleTTSModelSelect(option.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded hover:bg-accent",
                      selectedTTSModel === option.id ? "bg-accent" : ""
                    )}
                  >
                    <div className="font-medium">{option.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STT Model Switch */}
          <div className="relative dropdown-container">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSTTModelDropdown(!showSTTModelDropdown)}
              className="h-6 px-2 text-xs border-border text-muted-foreground hover:bg-accent"
              disabled={sttModelOptions.length <= 1}
              title={sttModelOptions.length <= 1 ? "STT models not available" : `Current: ${selectedSTTModel === 'auto' ? 'Auto STT' : sttModelOptions.find(m => m.id === selectedSTTModel)?.name || 'Auto STT'}`}
            >
              <Mic className="w-3 h-3 mr-1" />
              {selectedSTTModel === 'auto' ? 'Auto STT' : sttModelOptions.find(m => m.id === selectedSTTModel)?.name || 'Auto STT'}
              <ChevronUp className="w-3 h-3 ml-1" />
            </Button>
            
            {showSTTModelDropdown && sttModelOptions.length > 1 && (
              <div className="absolute bottom-full left-0 mb-1 bg-card border border-border rounded-lg shadow-lg p-1 min-w-48 z-50">
                {sttModelOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSTTModelSelect(option.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded hover:bg-accent",
                      selectedSTTModel === option.id ? "bg-accent" : ""
                    )}
                  >
                    <div className="font-medium">{option.name}</div>
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
            disabled={disabled || isTranscribing}
            title="ファイルを添付 (画像、動画、音声、ドキュメント) - 音声ファイルは自動で文字起こしされます"
          >
            {isTranscribing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Paperclip className="w-3 h-3" />
            )}
          </Button>
          
          <Button
            onClick={isGenerating ? handleStop : handleSend}
            disabled={isGenerating ? false : (!message.trim() || disabled)}
            size="sm"
            className={cn(
              "h-6 w-6 p-0 rounded-full",
              isGenerating 
                ? "bg-white text-gray-900 hover:bg-gray-100 border border-gray-300" 
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
