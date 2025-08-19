'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useTTS } from '../hooks/use-tts'
import { TTS_VOICES, TTS_MODELS, TTS_FORMATS } from '../types/tts'
import { 
  Play, 
  Pause, 
  Stop, 
  Volume2, 
  Settings, 
  Download, 
  Copy,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Mic,
  MicOff,
  FileAudio,
  User,
  Users
} from 'lucide-react'

interface TTSVoiceClonerProps {
  initialConfig?: {
    voice?: string
    model?: string
    speed?: number
    format?: string
    apiKey?: string
  }
  onResult?: (result: any) => void
  onError?: (error: string) => void
  showSettings?: boolean
  compact?: boolean
}

export function TTSVoiceCloner({
  initialConfig = {},
  onResult,
  onError,
  showSettings = true,
  compact = false
}: TTSVoiceClonerProps) {
  const [text, setText] = useState('')
  const [apiKey, setApiKey] = useState(initialConfig.apiKey || '')
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [promptAudioFile, setPromptAudioFile] = useState<File | null>(null)
  const [promptAudioBase64, setPromptAudioBase64] = useState<string>('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [recordingUrl, setRecordingUrl] = useState<string>('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const tts = useTTS({
    voice: initialConfig.voice || 'alloy',
    model: initialConfig.model || 'tts-1',
    speed: initialConfig.speed || 1.0,
    format: initialConfig.format || 'mp3',
    apiKey,
    debug: true
  })

  // 音声ファイルをBase64に変換
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  // ファイルアップロード処理
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const base64 = await convertFileToBase64(file)
      setPromptAudioFile(file)
      setPromptAudioBase64(base64)
    } catch (error) {
      onError?.('ファイルの変換に失敗しました')
    }
  }, [convertFileToBase64, onError])

  // 音声録音開始
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setRecordingBlob(blob)
        const url = URL.createObjectURL(blob)
        setRecordingUrl(url)
        
        // Base64に変換
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          setPromptAudioBase64(base64)
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      onError?.('マイクへのアクセスに失敗しました')
    }
  }, [onError])

  // 音声録音停止
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }, [isRecording])

  const handleSynthesize = useCallback(async () => {
    if (!text.trim()) {
      onError?.('テキストを入力してください')
      return
    }

    if (!apiKey) {
      onError?.('APIキーを入力してください')
      return
    }

    try {
      // 音声クローニングの場合は特別なパラメータを追加
      const config: any = {
        voice: tts.getConfig().voice,
        model: tts.getConfig().model,
        speed: tts.getConfig().speed,
        format: tts.getConfig().format,
        apiKey
      }

      if (promptAudioBase64) {
        config.prompt_audio_base64 = promptAudioBase64
        if (promptText) {
          config.prompt_text = promptText
        }
      }

      const result = await tts.synthesize(text)
      onResult?.(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '音声合成に失敗しました'
      onError?.(errorMessage)
    }
  }, [text, apiKey, tts, promptAudioBase64, promptText, onResult, onError])

  const handlePlay = useCallback(async () => {
    if (!tts.result?.audio) {
      onError?.('再生する音声がありません')
      return
    }

    try {
      await tts.play(tts.result.audio)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '音声再生に失敗しました'
      onError?.(errorMessage)
    }
  }, [tts, onError])

  const handleDownload = useCallback(() => {
    if (!tts.result?.audio) return

    const binaryString = atob(tts.result.audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: `audio/${tts.result.format}` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tts_cloned_${Date.now()}.${tts.result.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [tts.result])

  const handleCopyText = useCallback(() => {
    if (!tts.result?.text) return
    navigator.clipboard.writeText(tts.result.text)
  }, [tts.result])

  const getStatusIcon = () => {
    switch (tts.status.status) {
      case 'synthesizing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'playing':
        return <Volume2 className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (tts.status.status) {
      case 'synthesizing':
        return '音声合成中...'
      case 'playing':
        return '再生中'
      case 'error':
        return 'エラー'
      default:
        return '待機中'
    }
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">テキスト</TabsTrigger>
              <TabsTrigger value="voice">音声クローニング</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              <Textarea
                placeholder="音声合成するテキストを入力..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
            </TabsContent>
            
            <TabsContent value="voice" className="space-y-4">
              <div className="space-y-2">
                <Label>音声ファイル</Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>音声説明（オプション）</Label>
                <Textarea
                  placeholder="音声の特徴を説明..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button
              onClick={handleSynthesize}
              disabled={!text.trim() || !apiKey || tts.status.status === 'synthesizing'}
              size="sm"
              className="flex-1"
            >
              {tts.status.status === 'synthesizing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            {tts.result && (
              <Button onClick={handlePlay} size="sm" variant="outline">
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {tts.status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tts.status.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* メイン合成エリア */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            音声クローニング
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* テキスト入力 */}
          <div className="space-y-2">
            <Label htmlFor="tts-text">合成テキスト</Label>
            <Textarea
              id="tts-text"
              placeholder="音声合成するテキストを入力してください（最大4096文字）..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={4096}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{text.length}/4096 文字</span>
              <span>{text.split(/\s+/).filter(word => word.length > 0).length} 単語</span>
            </div>
          </div>

          {/* APIキー入力 */}
          <div className="space-y-2">
            <Label htmlFor="tts-api-key">APIキー</Label>
            <Input
              id="tts-api-key"
              type="password"
              placeholder="sk-... または Spark APIキー"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          {/* 音声クローニング設定 */}
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                ファイル
              </TabsTrigger>
              <TabsTrigger value="record" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                録音
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileAudio className="h-4 w-4" />
                説明
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label>音声ファイル</Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
                {promptAudioFile && (
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <FileAudio className="h-4 w-4 inline mr-2" />
                    {promptAudioFile.name} ({(promptAudioFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="record" className="space-y-4">
              <div className="space-y-2">
                <Label>音声録音</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? 'destructive' : 'default'}
                    className="flex-1"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        録音停止
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        録音開始
                      </>
                    )}
                  </Button>
                </div>
                {recordingUrl && (
                  <div className="p-2 bg-gray-50 rounded">
                    <audio controls src={recordingUrl} className="w-full" />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label>音声説明</Label>
                <Textarea
                  placeholder="音声の特徴を説明してください（例：明るい女性の声、低い男性の声など）..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* 基本設定 */}
          {showSettings && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>音声タイプ</Label>
                <Select
                  value={tts.getConfig().voice}
                  onValueChange={(value) => tts.updateConfig({ voice: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TTS_VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>モデル</Label>
                <Select
                  value={tts.getConfig().model}
                  onValueChange={(value) => tts.updateConfig({ model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TTS_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>出力形式</Label>
                <Select
                  value={tts.getConfig().format}
                  onValueChange={(value) => tts.updateConfig({ format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TTS_FORMATS.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
                        {format.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 詳細設定 */}
          {showAdvancedSettings && (
            <div className="space-y-4">
              <Separator />
              <div className="space-y-2">
                <Label>再生速度: {tts.getConfig().speed}x</Label>
                <Slider
                  value={[tts.getConfig().speed]}
                  onValueChange={([value]) => tts.updateConfig({ speed: value })}
                  min={0.25}
                  max={4.0}
                  step={0.25}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* 操作ボタン */}
          <div className="flex gap-2">
            <Button
              onClick={handleSynthesize}
              disabled={!text.trim() || !apiKey || tts.status.status === 'synthesizing'}
              className="flex-1"
            >
              {tts.status.status === 'synthesizing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  音声クローニング中...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  音声クローニング
                </>
              )}
            </Button>

            {tts.result && (
              <>
                <Button onClick={handlePlay} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  再生
                </Button>
                <Button onClick={tts.stop} variant="outline">
                  <Stop className="h-4 w-4 mr-2" />
                  停止
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </Button>
              </>
            )}
          </div>

          {/* 詳細設定トグル */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showAdvancedSettings ? '詳細設定を隠す' : '詳細設定を表示'}
          </Button>
        </CardContent>
      </Card>

      {/* 状態表示 */}
      <Card>
        <CardHeader>
          <CardTitle>状態</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
            <Badge variant={tts.status.isSupported ? 'default' : 'destructive'}>
              {tts.status.isSupported ? 'サポート' : '非サポート'}
            </Badge>
          </div>

          {tts.status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tts.status.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 結果表示 */}
      {tts.result && (
        <Card>
          <CardHeader>
            <CardTitle>クローニング結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>テキスト</Label>
                <Button onClick={handleCopyText} variant="ghost" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  コピー
                </Button>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{tts.result.text}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-500">音声タイプ</Label>
                <p>{tts.result.voice}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">モデル</Label>
                <p>{tts.result.model}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">形式</Label>
                <p>{tts.result.format.toUpperCase()}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">サイズ</Label>
                <p>{(tts.result.duration / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              合成時刻: {new Date(tts.result.timestamp).toLocaleString('ja-JP')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
