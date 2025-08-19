"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings as SettingsIcon, 
  Palette, 
  Keyboard, 
  Code, 
  Eye, 
  FileText,
  Save,
  RotateCcw,
  Search,
  Zap,
  Monitor,
  Moon,
  Sun,
  Brain,
  Bot,
  Type,
  Layers,
  Cpu,
  Sparkles,
  Globe,
  Shield,
  Zap as ZapIcon,
  Palette as PaletteIcon,
  Keyboard as KeyboardIcon,
  Code as CodeIcon
} from "lucide-react"
import { AVAILABLE_MODELS_ARRAY, getModelsByCategory, AVAILABLE_MODELS } from "@/lib/models"
import { useTheme } from "@/hooks/use-theme"

interface EditorSettings {
  theme: "vs-dark" | "vs-light" | "hc-black"
  appTheme: "light" | "dark" | "system"
  fontSize: number
  fontFamily: string
  lineNumbers: "on" | "off" | "relative"
  wordWrap: "on" | "off" | "wordWrapColumn"
  minimap: boolean
  bracketPairColorization: boolean
  guides: {
    bracketPairs: boolean
    indentation: boolean
  }
  suggestOnTriggerCharacters: boolean
  quickSuggestions: boolean
  parameterHints: boolean
  autoSave: boolean
  tabSize: number
  insertSpaces: boolean
  models: {
    [key: string]: boolean
  }
  // チャット設定
  currentProvider: string
  currentModel: string
}

interface SettingsProps {
  isOpen?: boolean
  onClose?: () => void
  settings?: EditorSettings
  onSettingsChange?: (settings: EditorSettings) => void
  className?: string
}

const defaultSettings: EditorSettings = {
  theme: "vs-dark",
  appTheme: "dark",
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  lineNumbers: "on",
  wordWrap: "on",
  minimap: false,
  bracketPairColorization: true,
  guides: {
    bracketPairs: true,
    indentation: true
  },
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: true,
  autoSave: true,
  tabSize: 2,
  insertSpaces: true,
  models: {
    // デフォルトで有効にするモデル（page.tsxのデフォルトと一致）
    "gemini-2.0-flash-lite": true,
    "gemini-2.5-flash": true, 
    "gpt-4o-mini": true,
    "claude-3.5-haiku": true,
    "grok-3-mini": true,
    
    // その他のモデルはデフォルトで無効
    "claude-4-sonnet": false,
    "claude-3.7-sonnet": false,
    "claude-4-opus": false,
    "claude-3.5-sonnet": false,
    "gpt-4": false,
    "gpt-4-turbo": false,
    "gpt-4o": false,
    "gpt-4.5-preview": false,
    "gpt-3.5-turbo": false,
    "gemini-2.5-pro": false,
    "gemini-2.5-pro-max": false,
    "gemini-2.5-flash-preview-04-17": false,
    "gemini-2.5-pro-exp-03-25": false,
    "gemini-2.5-pro-preview-06-05": false,
    "grok-2": false,
    "grok-3": false,
    "grok-4": false,
    "o1": false,
    "o1-mini": false,
    "o1-preview": false,
    "o3": false,
    "o3-mini": false,
    "o3-pro": false,
    "o4-mini": false,
    "deepseek-r1": false,
    "deepseek-r1-0528": false,
    "deepseek-v3": false,
    "deepseek-v3.1": false,
    "kimi-k2-instruct": false,
    "cursor-small": false,
    "qwen2.5:1.5b": false,
    "llama3.1:8b": false,
    "orca-mini:3b": false
  },
  // チャット設定のデフォルト
  currentProvider: "google",
  currentModel: "gemini-2.0-flash-lite"
}

const fontFamilies = [
  { value: "'JetBrains Mono', 'Fira Code', monospace", label: "JetBrains Mono", description: "開発者向けフォント" },
  { value: "'Fira Code', monospace", label: "Fira Code", description: "リガチャ対応フォント" },
  { value: "'Source Code Pro', monospace", label: "Source Code Pro", description: "Adobe製フォント" },
  { value: "'Consolas', monospace", label: "Consolas", description: "Windows標準フォント" },
  { value: "'Courier New', monospace", label: "Courier New", description: "クラシックな等幅フォント" }
]

const themes = [
  { value: "vs-dark", label: "Dark", icon: Moon, description: "ダークテーマ" },
  { value: "vs-light", label: "Light", icon: Sun, description: "ライトテーマ" },
  { value: "hc-black", label: "High Contrast", icon: Monitor, description: "高コントラスト" }
]

// 共通のモデル定義を使用
const availableModels = AVAILABLE_MODELS_ARRAY

export function Settings({ isOpen, onClose, settings, onSettingsChange, className }: SettingsProps) {
  const [currentSettings, setCurrentSettings] = useState<EditorSettings>(settings || defaultSettings)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("editor")
  const [modelSearchQuery, setModelSearchQuery] = useState("")
  const { theme: appTheme, changeTheme } = useTheme()

  useEffect(() => {
    setCurrentSettings(settings || defaultSettings)
  }, [settings])

  const handleSettingChange = (key: keyof EditorSettings, value: any) => {
    let newSettings = { ...currentSettings, [key]: value }
    
    // プロバイダーが変更された場合、適切な最初のモデルを選択
    if (key === 'currentProvider') {
      const providerMapping: Record<string, string> = {
        'google': 'Google',
        'openai': 'OpenAI',
        'anthropic': 'Anthropic',
        'xai': 'xAI',
        'deepseek': 'DeepSeek',
        'ollama': 'Ollama'
      }
      const expectedProvider = providerMapping[value]
      
      // 新しいプロバイダーで利用可能な最初のモデルを選択
      const availableModel = Object.entries(AVAILABLE_MODELS).find(([modelId, model]) => 
        model.provider === expectedProvider && newSettings.models[modelId]
      )
      
      if (availableModel) {
        newSettings.currentModel = availableModel[0]
      }
    }
    
    setCurrentSettings(newSettings)
    onSettingsChange?.(newSettings)
    
    // アプリケーションテーマが変更された場合、即座に適用
    if (key === 'appTheme') {
      changeTheme(value)
    }
    
    // チャット設定が変更された場合、チャット機能に通知
    if (key === 'currentProvider' || key === 'currentModel') {
      window.dispatchEvent(new CustomEvent('armis-chat-model-changed', {
        detail: { provider: newSettings.currentProvider, model: newSettings.currentModel }
      }))
      
      // localStorageも即座に更新
      localStorage.setItem('armis-editor-settings', JSON.stringify(newSettings))
      
      console.log(`Chat model changed: ${newSettings.currentProvider}/${newSettings.currentModel}`)
    }
  }

  const handleGuidesChange = (key: keyof EditorSettings['guides'], value: boolean) => {
    const newSettings = {
      ...currentSettings,
      guides: { ...currentSettings.guides, [key]: value }
    }
    setCurrentSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const handleModelToggle = (modelId: string, enabled: boolean) => {
    const newSettings = {
      ...currentSettings,
      models: {
        ...currentSettings.models,
        [modelId]: enabled
      }
    }
    setCurrentSettings(newSettings)
    onSettingsChange?.(newSettings)
    
    // リアルタイム同期のためのカスタムイベントを発火
    window.dispatchEvent(new CustomEvent('armis-settings-changed', {
      detail: { models: newSettings.models }
    }))
    
    // localStorageも即座に更新
    localStorage.setItem('armis-editor-settings', JSON.stringify(newSettings))
    
    console.log(`Model ${modelId} ${enabled ? 'enabled' : 'disabled'}, triggering sync`)
  }

  const resetToDefaults = () => {
    setCurrentSettings(defaultSettings)
    onSettingsChange?.(defaultSettings)
    
    // デフォルト設定に戻したときも同期イベントを発火
    window.dispatchEvent(new CustomEvent('armis-settings-changed', {
      detail: { models: defaultSettings.models }
    }))
    
    localStorage.setItem('armis-editor-settings', JSON.stringify(defaultSettings))
    console.log('Settings reset to defaults, triggering sync')
  }

  const saveSettings = () => {
    localStorage.setItem('armis-editor-settings', JSON.stringify(currentSettings))
    onClose?.()
  }

  const filteredModels = availableModels.filter(model =>
    model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    model.provider.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(modelSearchQuery.toLowerCase())
  )

  const modelsByCategory = getModelsByCategory()

  // アイコンとして使用される場合
  if (!isOpen && className) {
    return <SettingsIcon className={className} />
  }

  // ダイアログとして使用される場合
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Settings className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">設定</h2>
              <p className="text-sm text-zinc-400">エディターとAIモデルの設定を管理</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="text-xs border-zinc-600 hover:bg-zinc-800"
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              デフォルトに戻す
            </Button>
            <Button
              onClick={saveSettings}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-3 w-3 mr-2" />
              保存
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-zinc-800"
            >
              ×
            </Button>
          </div>
        </div>

        {/* 検索 */}
        <div className="p-6 border-b border-zinc-700/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="設定を検索..."
              className="pl-12 bg-zinc-800/50 border-zinc-600 text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 flex min-h-0">
          {/* サイドバー */}
          <div className="w-80 border-r border-zinc-700/50 bg-zinc-900/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full bg-zinc-900/50 border-b border-zinc-700/50 rounded-none p-1">
                <TabsTrigger value="editor" className="flex-1 text-xs data-[state=active]:bg-blue-600">
                  <CodeIcon className="h-3 w-3 mr-2" />
                  エディター
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex-1 text-xs data-[state=active]:bg-blue-600">
                  <PaletteIcon className="h-3 w-3 mr-2" />
                  外観
                </TabsTrigger>
                <TabsTrigger value="keyboard" className="flex-1 text-xs data-[state=active]:bg-blue-600">
                  <KeyboardIcon className="h-3 w-3 mr-2" />
                  キーボード
                </TabsTrigger>
                <TabsTrigger value="models" className="flex-1 text-xs data-[state=active]:bg-blue-600">
                  <Brain className="h-3 w-3 mr-2" />
                  モデル
                </TabsTrigger>
                <TabsTrigger value="ollama" className="flex-1 text-xs data-[state=active]:bg-blue-600">
                  <Cpu className="h-3 w-3 mr-2" />
                  Ollama
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-full">
                <TabsContent value="editor" className="p-6">
                  <div className="space-y-6">
                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Type className="h-4 w-4 mr-2 text-blue-400" />
                          フォント設定
                        </CardTitle>
                        <CardDescription>エディターのフォントとテキスト表示を設定</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-zinc-300">フォントサイズ</Label>
                          <Input
                            type="number"
                            value={currentSettings.fontSize}
                            onChange={(e) => handleSettingChange("fontSize", parseInt(e.target.value))}
                            className="mt-2 bg-zinc-800/50 border-zinc-600 text-zinc-200"
                            min="8"
                            max="32"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-zinc-300">フォントファミリー</Label>
                          <Select
                            value={currentSettings.fontFamily}
                            onValueChange={(value) => handleSettingChange("fontFamily", value)}
                          >
                            <SelectTrigger className="mt-2 bg-zinc-800/50 border-zinc-600 text-zinc-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-600">
                              {fontFamilies.map(font => (
                                <SelectItem key={font.value} value={font.value}>
                                  <div>
                                    <div className="font-medium">{font.label}</div>
                                    <div className="text-xs text-zinc-400">{font.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Layers className="h-4 w-4 mr-2 text-green-400" />
                          エディター設定
                        </CardTitle>
                        <CardDescription>エディターの動作と表示を設定</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-zinc-300">タブサイズ</Label>
                          <Input
                            type="number"
                            value={currentSettings.tabSize}
                            onChange={(e) => handleSettingChange("tabSize", parseInt(e.target.value))}
                            className="mt-2 bg-zinc-800/50 border-zinc-600 text-zinc-200"
                            min="1"
                            max="8"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">スペースでインデント</Label>
                            <p className="text-xs text-zinc-400">タブの代わりにスペースを使用</p>
                          </div>
                          <Switch
                            checked={currentSettings.insertSpaces}
                            onCheckedChange={(checked) => handleSettingChange("insertSpaces", checked)}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-zinc-300">行番号</Label>
                          <Select
                            value={currentSettings.lineNumbers}
                            onValueChange={(value) => handleSettingChange("lineNumbers", value)}
                          >
                            <SelectTrigger className="mt-2 bg-zinc-800/50 border-zinc-600 text-zinc-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-600">
                              <SelectItem value="on">表示</SelectItem>
                              <SelectItem value="off">非表示</SelectItem>
                              <SelectItem value="relative">相対番号</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-zinc-300">ワードラップ</Label>
                          <Select
                            value={currentSettings.wordWrap}
                            onValueChange={(value) => handleSettingChange("wordWrap", value)}
                          >
                            <SelectTrigger className="mt-2 bg-zinc-800/50 border-zinc-600 text-zinc-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-600">
                              <SelectItem value="on">有効</SelectItem>
                              <SelectItem value="off">無効</SelectItem>
                              <SelectItem value="wordWrapColumn">カラム指定</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-purple-400" />
                          表示設定
                        </CardTitle>
                        <CardDescription>エディターの視覚的要素を設定</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">ミニマップ</Label>
                            <p className="text-xs text-zinc-400">コードの全体像を表示</p>
                          </div>
                          <Switch
                            checked={currentSettings.minimap}
                            onCheckedChange={(checked) => handleSettingChange("minimap", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">括弧ペアの色分け</Label>
                            <p className="text-xs text-zinc-400">対応する括弧を色分け</p>
                          </div>
                          <Switch
                            checked={currentSettings.bracketPairColorization}
                            onCheckedChange={(checked) => handleSettingChange("bracketPairColorization", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">括弧ペアのガイド</Label>
                            <p className="text-xs text-zinc-400">対応する括弧にガイド線を表示</p>
                          </div>
                          <Switch
                            checked={currentSettings.guides.bracketPairs}
                            onCheckedChange={(checked) => handleGuidesChange("bracketPairs", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">インデントガイド</Label>
                            <p className="text-xs text-zinc-400">インデントレベルにガイド線を表示</p>
                          </div>
                          <Switch
                            checked={currentSettings.guides.indentation}
                            onCheckedChange={(checked) => handleGuidesChange("indentation", checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <ZapIcon className="h-4 w-4 mr-2 text-yellow-400" />
                          自動化設定
                        </CardTitle>
                        <CardDescription>エディターの自動機能を設定</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">自動保存</Label>
                            <p className="text-xs text-zinc-400">変更を自動的に保存</p>
                          </div>
                          <Switch
                            checked={currentSettings.autoSave}
                            onCheckedChange={(checked) => handleSettingChange("autoSave", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">クイックサジェスト</Label>
                            <p className="text-xs text-zinc-400">入力時に候補を表示</p>
                          </div>
                          <Switch
                            checked={currentSettings.quickSuggestions}
                            onCheckedChange={(checked) => handleSettingChange("quickSuggestions", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">パラメータヒント</Label>
                            <p className="text-xs text-zinc-400">関数のパラメータを表示</p>
                          </div>
                          <Switch
                            checked={currentSettings.parameterHints}
                            onCheckedChange={(checked) => handleSettingChange("parameterHints", checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="p-6">
                  <div className="space-y-6">
                    {/* アプリケーションテーマ設定 */}
                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Monitor className="h-4 w-4 mr-2 text-blue-400" />
                          アプリケーションテーマ
                        </CardTitle>
                        <CardDescription>アプリケーション全体のテーマを選択</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { value: "light", label: "ライト", icon: Sun, description: "明るいテーマ" },
                            { value: "dark", label: "ダーク", icon: Moon, description: "暗いテーマ" },
                            { value: "system", label: "システム", icon: Monitor, description: "システム設定に従う" }
                          ].map(theme => {
                            const Icon = theme.icon
                            return (
                              <div
                                key={theme.value}
                                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                                  currentSettings.appTheme === theme.value
                                    ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400'
                                    : 'hover:bg-zinc-700/50 border border-transparent text-zinc-300'
                                }`}
                                onClick={() => handleSettingChange("appTheme", theme.value)}
                              >
                                <Icon className="h-5 w-5" />
                                <div className="flex-1">
                                  <div className="font-medium">{theme.label}</div>
                                  <div className="text-xs text-zinc-400">{theme.description}</div>
                                </div>
                                {currentSettings.appTheme === theme.value && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* エディターテーマ設定 */}
                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <PaletteIcon className="h-4 w-4 mr-2 text-purple-400" />
                          エディターテーマ
                        </CardTitle>
                        <CardDescription>エディターのテーマとカラースキームを選択</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {themes.map(theme => {
                            const Icon = theme.icon
                            return (
                              <div
                                key={theme.value}
                                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                                  currentSettings.theme === theme.value
                                    ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400'
                                    : 'hover:bg-zinc-700/50 border border-transparent text-zinc-300'
                                }`}
                                onClick={() => handleSettingChange("theme", theme.value)}
                              >
                                <Icon className="h-5 w-5" />
                                <div className="flex-1">
                                  <div className="font-medium">{theme.label}</div>
                                  <div className="text-xs text-zinc-400">{theme.description}</div>
                                </div>
                                {currentSettings.theme === theme.value && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="keyboard" className="p-6">
                  <div className="space-y-6">
                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <KeyboardIcon className="h-4 w-4 mr-2 text-orange-400" />
                          キーボードショートカット
                        </CardTitle>
                        <CardDescription>エディターで使用できるキーボードショートカット</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center p-2 rounded bg-zinc-700/30">
                            <span className="text-zinc-300">コマンドパレット</span>
                            <Badge variant="secondary" className="font-mono text-xs">Cmd/Ctrl + Shift + P</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-zinc-700/30">
                            <span className="text-zinc-300">クイックオープン</span>
                            <Badge variant="secondary" className="font-mono text-xs">Cmd/Ctrl + P</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-zinc-700/30">
                            <span className="text-zinc-300">検索</span>
                            <Badge variant="secondary" className="font-mono text-xs">Cmd/Ctrl + F</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-zinc-700/30">
                            <span className="text-zinc-300">置換</span>
                            <Badge variant="secondary" className="font-mono text-xs">Cmd/Ctrl + H</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-zinc-700/30">
                            <span className="text-zinc-300">保存</span>
                            <Badge variant="secondary" className="font-mono text-xs">Cmd/Ctrl + S</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-zinc-700/30">
                            <span className="text-zinc-300">新規ファイル</span>
                            <Badge variant="secondary" className="font-mono text-xs">Cmd/Ctrl + N</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-zinc-700/30">
                            <span className="text-zinc-300">ターミナル</span>
                            <Badge variant="secondary" className="font-mono text-xs">Ctrl + `</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-zinc-700/30">
                            <span className="text-zinc-300">設定</span>
                            <Badge variant="secondary" className="font-mono text-xs">Cmd/Ctrl + ,</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="models" className="p-6">
                  <div className="space-y-6">
                    {/* 現在のチャットモデル選択 */}
                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
                          チャットで使用するモデル
                        </CardTitle>
                        <CardDescription>現在チャットで使用されているAIモデルを選択</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-zinc-300">プロバイダー</Label>
                          <Select
                            value={currentSettings.currentProvider}
                            onValueChange={(value) => handleSettingChange("currentProvider", value)}
                          >
                            <SelectTrigger className="mt-2 bg-zinc-800/50 border-zinc-600 text-zinc-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-600">
                              <SelectItem value="google">
                                <div className="flex items-center space-x-2">
                                  <Globe className="h-4 w-4" />
                                  <span>Google (Gemini)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="openai">
                                <div className="flex items-center space-x-2">
                                  <Sparkles className="h-4 w-4" />
                                  <span>OpenAI (GPT)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="anthropic">
                                <div className="flex items-center space-x-2">
                                  <Brain className="h-4 w-4" />
                                  <span>Anthropic (Claude)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="xai">
                                <div className="flex items-center space-x-2">
                                  <Zap className="h-4 w-4" />
                                  <span>xAI (Grok)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="deepseek">
                                <div className="flex items-center space-x-2">
                                  <Cpu className="h-4 w-4" />
                                  <span>DeepSeek</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="ollama">
                                <div className="flex items-center space-x-2">
                                  <Monitor className="h-4 w-4" />
                                  <span>Ollama (ローカル)</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-zinc-300">モデル</Label>
                          <Select
                            value={currentSettings.currentModel}
                            onValueChange={(value) => handleSettingChange("currentModel", value)}
                          >
                            <SelectTrigger className="mt-2 bg-zinc-800/50 border-zinc-600 text-zinc-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-600">
                              {Object.entries(AVAILABLE_MODELS)
                                .filter(([modelId, model]) => {
                                  // 現在のプロバイダーに対応するモデルのみ表示
                                  const providerMapping: Record<string, string> = {
                                    'google': 'Google',
                                    'openai': 'OpenAI',
                                    'anthropic': 'Anthropic',
                                    'xai': 'xAI',
                                    'deepseek': 'DeepSeek',
                                    'ollama': 'Ollama'
                                  }
                                  const expectedProvider = providerMapping[currentSettings.currentProvider]
                                  return model.provider === expectedProvider && currentSettings.models[modelId]
                                })
                                .map(([modelId, model]) => {
                                  const Icon = model.icon
                                  return (
                                    <SelectItem key={modelId} value={modelId}>
                                      <div className="flex items-center space-x-2">
                                        <Icon className="h-4 w-4" />
                                        <span>{model.name}</span>
                                        <Badge variant="outline" className="text-xs ml-2">
                                          {model.category}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Brain className="h-4 w-4 mr-2 text-green-400" />
                          AIモデル検索
                        </CardTitle>
                        <CardDescription>利用可能なAIモデルを検索して有効化</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            placeholder="モデルを検索..."
                            className="pl-10 bg-zinc-800/50 border-zinc-600 text-zinc-200 placeholder:text-zinc-500"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      {Object.entries(modelsByCategory).map(([category, models]) => {
                        // 検索クエリでフィルタリング
                        const filteredModels = models.filter(model =>
                          model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                          model.provider.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                          model.description.toLowerCase().includes(modelSearchQuery.toLowerCase())
                        )
                        
                        // フィルタリングされたモデルがない場合は表示しない
                        if (filteredModels.length === 0) return null
                        
                        return (
                          <Card key={category} className="bg-zinc-800/50 border-zinc-700/50">
                            <CardHeader>
                              <CardTitle className="text-sm flex items-center">
                                <Bot className="h-4 w-4 mr-2 text-blue-400" />
                                {category}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {filteredModels.map(model => {
                                  const Icon = model.icon
                                  return (
                                    <div
                                      key={model.id}
                                      className="flex items-center justify-between p-3 bg-zinc-700/30 rounded-lg border border-zinc-600/50 hover:bg-zinc-700/50 transition-colors"
                                    >
                                      <div className="flex items-center space-x-3 flex-1">
                                        <Icon className="h-4 w-4 text-zinc-400" />
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-zinc-200">
                                              {model.name}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                              {model.provider}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-zinc-400 mt-1">
                                            {model.description}
                                          </p>
                                        </div>
                                      </div>
                                      <Switch
                                        checked={currentSettings.models[model.id] || false}
                                        onCheckedChange={(checked) => handleModelToggle(model.id, checked)}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ollama" className="p-6">
                  <div className="space-y-6">
                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Cpu className="h-4 w-4 mr-2 text-blue-400" />
                          Ollama設定
                        </CardTitle>
                        <CardDescription>ローカルOllamaサーバーの設定を管理</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-zinc-300">Ollamaホスト</Label>
                          <Input
                            value="http://localhost:11434"
                            disabled
                            className="mt-2 bg-zinc-800/50 border-zinc-600 text-zinc-400"
                          />
                          <p className="text-xs text-zinc-400 mt-1">
                            デフォルトのOllamaサーバーアドレス
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">自動サーバー起動</Label>
                            <p className="text-xs text-zinc-400">Ollamaサーバーを自動的に起動</p>
                          </div>
                          <Switch
                            checked={true}
                            disabled
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-zinc-300">モデル管理</Label>
                            <p className="text-xs text-zinc-400">Ollamaモデルの管理機能を有効化</p>
                          </div>
                          <Switch
                            checked={true}
                            disabled
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-800/50 border-zinc-700/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Bot className="h-4 w-4 mr-2 text-green-400" />
                          推奨モデル
                        </CardTitle>
                        <CardDescription>よく使用されるOllamaモデルの一覧</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[
                            { name: 'llama3.1:8b', description: 'Llama3.1 8B - バランスの取れた性能' },
                            { name: 'mistral:7b', description: 'Mistral 7B - 高性能オープンソース' },
                            { name: 'gemma3:2b', description: 'Gemma3 2B - Google製軽量モデル' },
                            { name: 'codellama:7b', description: 'Code Llama 7B - コード生成特化' },
                            { name: 'phi3:mini', description: 'Phi3 Mini - Microsoft製軽量モデル' },
                            { name: 'qwen2.5:1.5b', description: 'Qwen2.5 1.5B - 軽量で高速' }
                          ].map((model) => (
                            <div key={model.name} className="flex items-center justify-between p-2 rounded bg-zinc-900/50">
                              <div>
                                <div className="text-sm font-medium text-zinc-200">{model.name}</div>
                                <div className="text-xs text-zinc-400">{model.description}</div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                推奨
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* プレビュー */}
          <div className="flex-1 p-6">
            <div className="mb-4">
              <Label className="text-sm font-medium text-zinc-300">
                {activeTab === "models" ? "有効なモデル" : "プレビュー"}
              </Label>
            </div>
            {activeTab === "models" ? (
              <Card className="bg-zinc-800/50 border-zinc-700/50">
                <CardContent className="p-4">
                  <div className="text-zinc-400 mb-3 text-sm">// 有効なAIモデル</div>
                  <div className="space-y-2">
                    {Object.entries(currentSettings.models)
                      .filter(([_, enabled]) => enabled)
                      .map(([modelId, _]) => {
                        const model = AVAILABLE_MODELS[modelId]
                        return model ? (
                          <div key={modelId} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-zinc-200">{model.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                        ) : null
                      })}
                    {Object.entries(currentSettings.models).filter(([_, enabled]) => enabled).length === 0 && (
                      <div className="text-zinc-500 text-sm">有効なモデルがありません</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-800/50 border-zinc-700/50">
                <CardContent className="p-4">
                  <div className="text-zinc-400 mb-3 text-sm">// エディター設定のプレビュー</div>
                  <div 
                    className="font-mono text-sm rounded bg-zinc-900/50 p-4 border border-zinc-600/50"
                    style={{ 
                      fontSize: `${currentSettings.fontSize}px`,
                      fontFamily: currentSettings.fontFamily,
                      color: currentSettings.theme === 'vs-light' ? '#000' : '#fff'
                    }}
                  >
                    <div className="mb-2">
                      <span className="text-zinc-500">{currentSettings.lineNumbers === 'on' ? '1' : ''}</span>
                      <span className="ml-2">function example() {'{'}</span>
                    </div>
                    <div className="mb-2 ml-4">
                      <span className="text-zinc-500">{currentSettings.lineNumbers === 'on' ? '2' : ''}</span>
                      <span className="ml-2">const message = "Hello, World!";</span>
                    </div>
                    <div className="mb-2 ml-4">
                      <span className="text-zinc-500">{currentSettings.lineNumbers === 'on' ? '3' : ''}</span>
                      <span className="ml-2">console.log(message);</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">{currentSettings.lineNumbers === 'on' ? '4' : ''}</span>
                      <span className="ml-2">{'}'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 