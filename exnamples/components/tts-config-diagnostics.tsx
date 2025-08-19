"use client"

import React, { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Settings, Play, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  checkTTSConfig, 
  setTTSAPIKey, 
  getTTSAPIKey,
  getTTSDiagnostics,
  type TTSConfigStatus 
} from "@/lib/tts-config-helper"

interface TTSConfigDiagnosticsProps {
  className?: string
  onConfigUpdated?: () => void
}

export function TTSConfigDiagnostics({ 
  className = '',
  onConfigUpdated 
}: TTSConfigDiagnosticsProps) {
  const [config, setConfig] = useState<TTSConfigStatus | null>(null)
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openaiKey, setOpenaiKey] = useState("")
  const [showKeyInput, setShowKeyInput] = useState(false)

  // 設定を確認
  const checkConfig = async () => {
    setIsLoading(true)
    try {
      const configStatus = await checkTTSConfig()
      const diagnosticsInfo = await getTTSDiagnostics()
      
      setConfig(configStatus)
      setDiagnostics(diagnosticsInfo)
      
      // 既存のAPIキーを取得
      const existingKey = getTTSAPIKey('openai')
      if (existingKey) {
        setOpenaiKey(existingKey)
      }
    } catch (error) {
      console.error('設定確認エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkConfig()
  }, [])

  const handleSaveAPIKey = () => {
    if (openaiKey.trim()) {
      setTTSAPIKey('openai', openaiKey.trim())
      setShowKeyInput(false)
      checkConfig() // 設定を再確認
      onConfigUpdated?.()
    }
  }

  const handleTestTTS = async () => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: "TTS機能のテストです。",
          engine: 'auto'
        })
      })

      if (response.ok) {
        alert('TTS機能が正常に動作しています！')
      } else {
        const error = await response.json()
        alert(`TTSテスト失敗: ${error.error}`)
      }
    } catch (error) {
      alert(`TTSテストエラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>設定を確認中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>設定確認エラー</AlertTitle>
            <AlertDescription>
              設定の確認中にエラーが発生しました。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 設定状況サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>TTS設定状況</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 設定項目 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              {config.hasOpenAIKey ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>OpenAI APIキー</span>
              <Badge variant={config.hasOpenAIKey ? "default" : "destructive"}>
                {config.hasOpenAIKey ? "設定済み" : "未設定"}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {config.hasLocalTTSServer ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>ローカルTTSサーバー</span>
              <Badge variant={config.hasLocalTTSServer ? "default" : "destructive"}>
                {config.hasLocalTTSServer ? "起動中" : "停止中"}
              </Badge>
            </div>
          </div>

          {/* 推奨エンジン */}
          <div className="flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span>推奨エンジン:</span>
            <Badge variant="outline">{config.recommendedEngine}</Badge>
          </div>

          {/* 利用可能エンジン */}
          {config.availableEngines.length > 0 && (
            <div>
              <span className="text-sm font-medium">利用可能エンジン:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {config.availableEngines.map(engine => (
                  <Badge key={engine} variant="secondary" className="text-xs">
                    {engine}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {config.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>設定エラー</AlertTitle>
          <AlertDescription>{config.error}</AlertDescription>
        </Alert>
      )}

      {/* 推奨事項 */}
      {diagnostics?.recommendations && diagnostics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">推奨事項</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {diagnostics.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* APIキー設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">OpenAI APIキー設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config.hasOpenAIKey ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                OpenAI APIキーを設定すると、高品質な音声合成が可能になります。
              </p>
              
              {showKeyInput ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="openai-key">OpenAI APIキー</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveAPIKey} size="sm">
                      保存
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowKeyInput(false)} 
                      size="sm"
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowKeyInput(true)} 
                  variant="outline" 
                  size="sm"
                >
                  APIキーを設定
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">APIキーが設定されています</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowKeyInput(true)}
              >
                変更
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 設定手順 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">設定手順</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">1. OpenAI APIキー設定</h4>
              <p className="text-muted-foreground">
                .env.local ファイルに NEXT_PUBLIC_OPENAI_API_KEY=your_key を追加
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium">2. ローカルTTSサーバー起動</h4>
              <p className="text-muted-foreground">
                ターミナルで npm run tts:start を実行
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium">3. 動作確認</h4>
              <p className="text-muted-foreground">
                下のボタンでTTS機能をテストしてください
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex space-x-2">
        <Button onClick={checkConfig} variant="outline">
          <RefreshCw className="h-4 w-4 mr-1" />
          再確認
        </Button>
        
        <Button onClick={handleTestTTS}>
          <Play className="h-4 w-4 mr-1" />
          TTSテスト
        </Button>
      </div>
    </div>
  )
}
