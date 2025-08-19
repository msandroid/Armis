import React, { useState } from 'react'
import { GenerativeUIChat } from '@/components/generative-ui/GenerativeUIChat'
import { generativeUIService } from '@/services/generative-ui/generative-ui-service'
import { AIProviderConfig } from '@/types/ai-sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function GenerativeUIExample() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [providerConfig, setProviderConfig] = useState<AIProviderConfig | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4o')

  const handleConfigureProvider = async () => {
    if (!apiKey.trim()) {
      alert('APIキーを入力してください')
      return
    }

    const config: AIProviderConfig = {
      providerId: selectedProvider,
      modelId: selectedModel,
      apiKey: apiKey,
      temperature: 0.7,
      maxOutputTokens: 4096
    }

    try {
      await generativeUIService.configureProvider(config)
      setProviderConfig(config)
      setIsConfigured(true)
      console.log('Generative UI provider configured successfully')
    } catch (error) {
      console.error('Failed to configure provider:', error)
      alert('プロバイダーの設定に失敗しました')
    }
  }

  const examplePrompts = [
    {
      title: '天気情報',
      prompt: '東京の天気を教えてください',
      description: '天気ツールを使用して東京の天気情報を取得します'
    },
    {
      title: '株価情報',
      prompt: 'Appleの株価を教えてください',
      description: '株価ツールを使用してAAPLの株価情報を取得します'
    },
    {
      title: '画像生成',
      prompt: '美しい夕日を背景にした山の風景を生成してください',
      description: '画像生成ツールを使用して風景画像を作成します'
    },
    {
      title: '翻訳',
      prompt: '「Hello, how are you?」を日本語に翻訳してください',
      description: '翻訳ツールを使用して英語を日本語に翻訳します'
    },
    {
      title: '計算',
      prompt: '2 + 2 * 3 を計算してください',
      description: '計算ツールを使用して数式を計算します'
    },
    {
      title: '検索',
      prompt: 'AI技術の最新動向について検索してください',
      description: '検索ツールを使用してAI技術の情報を検索します'
    }
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Generative UI デモ
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI SDKのGenerative User Interfaces機能を使用して、AIが動的にUIを生成するチャットインターフェースです。
        </p>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">チャット</TabsTrigger>
          <TabsTrigger value="setup">設定</TabsTrigger>
          <TabsTrigger value="examples">使用例</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generative UI チャット</CardTitle>
              <CardDescription>
                AIが適切なツールを選択して、動的にUIコンポーネントを生成します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <GenerativeUIChat />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AIプロバイダー設定</CardTitle>
              <CardDescription>
                Generative UIを使用するためにAIプロバイダーを設定してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">プロバイダー</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="プロバイダーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="model">モデル</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="モデルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProvider === 'openai' && (
                        <>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        </>
                      )}
                      {selectedProvider === 'anthropic' && (
                        <>
                          <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="claude-3.5-haiku">Claude 3.5 Haiku</SelectItem>
                        </>
                      )}
                      {selectedProvider === 'google' && (
                        <>
                          <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</SelectItem>
                          <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="apiKey">APIキー</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="APIキーを入力してください"
                />
              </div>

              <Button onClick={handleConfigureProvider} disabled={!apiKey.trim()}>
                プロバイダーを設定
              </Button>

              {isConfigured && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    ✅ プロバイダーが正常に設定されました
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>使用例</CardTitle>
              <CardDescription>
                以下のプロンプトを試して、Generative UIの機能を体験してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examplePrompts.map((example, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="text-lg">{example.title}</CardTitle>
                      <CardDescription>{example.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                        <code className="text-sm text-gray-700 dark:text-gray-300">
                          {example.prompt}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // チャットタブに切り替えてプロンプトを設定
                          const event = new CustomEvent('setChatPrompt', {
                            detail: { prompt: example.prompt }
                          })
                          window.dispatchEvent(event)
                        }}
                      >
                        このプロンプトを試す
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
