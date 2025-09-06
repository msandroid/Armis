import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Volume2, Play, Pause, Download, Loader2 } from 'lucide-react'
import { Badge } from '../ui/badge'
import { createTTSManager } from '../../services/tts'
import type { TTSSpeaker, TTSOptions } from '../../types/tts'

// WAVヘッダーを追加するヘルパー関数
function addWavHeader(pcmData: ArrayBuffer, sampleRate: number, channels: number, bitsPerSample: number): ArrayBuffer {
  const dataLength = pcmData.byteLength
  const headerLength = 44
  const totalLength = headerLength + dataLength
  
  const buffer = new ArrayBuffer(totalLength)
  const view = new DataView(buffer)
  
  // WAVヘッダーを書き込み
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  
  // RIFFヘッダー
  writeString(0, 'RIFF')
  view.setUint32(4, totalLength - 8, true) // ファイルサイズ - 8
  writeString(8, 'WAVE')
  
  // fmt チャンク
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // fmtチャンクサイズ
  view.setUint16(20, 1, true) // PCM形式
  view.setUint16(22, channels, true) // チャンネル数
  view.setUint32(24, sampleRate, true) // サンプルレート
  view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true) // バイトレート
  view.setUint16(32, channels * bitsPerSample / 8, true) // ブロックアライメント
  view.setUint16(34, bitsPerSample, true) // ビット深度
  
  // data チャンク
  writeString(36, 'data')
  view.setUint32(40, dataLength, true) // データサイズ
  
  // PCMデータをコピー
  const pcmView = new Uint8Array(pcmData)
  const bufferView = new Uint8Array(buffer)
  bufferView.set(pcmView, headerLength)
  
  return buffer
}

interface TTSPlayerProps {
  className?: string
  settings?: {
    enabled?: boolean
    provider?: string
    tts?: {
      defaultVoice?: string
      defaultLanguage?: string
      defaultStyle?: string
      apiKey?: string
    }
  }
  providerApiKeys?: Record<string, string>
}

export function TTSPlayer({ className, settings, providerApiKeys }: TTSPlayerProps) {
  const [text, setText] = useState('こんにちは、世界！今日は素晴らしい一日ですね。')
  const [selectedVoice, setSelectedVoice] = useState(settings?.tts?.defaultVoice || 'Kore')
  const [selectedLanguage, setSelectedLanguage] = useState(settings?.tts?.defaultLanguage || 'ja-JP')
  const [style, setStyle] = useState(settings?.tts?.defaultStyle || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [speakers, setSpeakers] = useState<TTSSpeaker[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ttsManagerRef = useRef<ReturnType<typeof createTTSManager> | null>(null)

  useEffect(() => {
    // TTSサービスの初期化
    const geminiApiKey = providerApiKeys?.['google'] || 
                         settings?.tts?.apiKey || 
                         (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GOOGLE_GENAI_API_KEY : undefined) ||
                         (typeof process !== 'undefined' ? process.env.GOOGLE_GENAI_API_KEY : undefined)

    const openaiApiKey = providerApiKeys?.['openai'] || 
                         (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_API_KEY : undefined) ||
                         (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined)

    const huggingfaceApiKey = providerApiKeys?.['huggingface'] || 
                              (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_HUGGINGFACE_API_KEY : undefined) ||
                              (typeof process !== 'undefined' ? process.env.HUGGINGFACE_API_KEY : undefined)

    const inworldApiKey = providerApiKeys?.['inworld'] || 
                          (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_INWORLD_API_KEY : undefined) ||
                          (typeof process !== 'undefined' ? process.env.INWORLD_API_KEY : undefined)

    ttsManagerRef.current = createTTSManager({
      primaryService: 'gemini',
      enableFallback: true,
      geminiApiKey: geminiApiKey,
      openaiApiKey: openaiApiKey,
      inworldApiKey: inworldApiKey,
      huggingfaceApiKey: huggingfaceApiKey
    })

    // 利用可能な音声を取得
    const loadSpeakers = async () => {
      try {
        if (ttsManagerRef.current?.isAnyServiceAvailable()) {
          const availableSpeakers = await ttsManagerRef.current.getAvailableSpeakers()
          setSpeakers(availableSpeakers)
        }
      } catch (error) {
        console.error('Failed to load speakers:', error)
        setError('音声の読み込みに失敗しました')
      }
    }

    loadSpeakers()
  }, [])

  const synthesizeText = async () => {
    if (!settings?.enabled) {
      setError('TTS機能が無効になっています。Settingsで有効にしてください。')
      return
    }

    // APIキーを取得
    const geminiApiKey = providerApiKeys?.['google'] || 
                         settings?.tts?.apiKey || 
                         (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GOOGLE_GENAI_API_KEY : undefined) ||
                         (typeof process !== 'undefined' ? process.env.GOOGLE_GENAI_API_KEY : undefined)

    const openaiApiKey = providerApiKeys?.['openai'] || 
                         (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_API_KEY : undefined) ||
                         (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined)

    const huggingfaceApiKey = providerApiKeys?.['huggingface'] || 
                              (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_HUGGINGFACE_API_KEY : undefined) ||
                              (typeof process !== 'undefined' ? process.env.HUGGINGFACE_API_KEY : undefined)

    if (!geminiApiKey && !openaiApiKey && !huggingfaceApiKey) {
      setError('TTSサービスが利用できません。Google、OpenAI、またはHugging Face APIキーを設定してください。')
      return
    }

    if (!ttsManagerRef.current?.isAnyServiceAvailable()) {
      setError('TTSサービスが利用できません。APIキーを設定してください。')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const options: TTSOptions = {
        speaker: {
          voiceName: selectedVoice,
          language: selectedLanguage,
          style: style || undefined
        }
      }

      const result = await ttsManagerRef.current.synthesize(text, options)
      
      // WAVヘッダーを追加してブラウザで再生可能な形式に変換
      const wavData = addWavHeader(result.audioData, 24000, 1, 16)
      const blob = new Blob([wavData], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      
      setAudioUrl(url)
      setIsLoading(false)
    } catch (error) {
      console.error('TTS synthesis failed:', error)
      setError(`音声生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsLoading(false)
    }
  }

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const downloadAudio = async () => {
    if (!audioUrl) return

    try {
      const response = await fetch(audioUrl)
      const blob = await response.blob()
      
      // ファイル名を生成（タイムスタンプ付き）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `tts-${selectedVoice.toLowerCase()}-${timestamp}.wav`
      
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      console.log('TTS音声をダウンロードしました:', filename)
    } catch (error) {
      console.error('Download failed:', error)
      setError('ダウンロードに失敗しました')
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleAudioPlay = () => {
    setIsPlaying(true)
  }

  const handleAudioPause = () => {
    setIsPlaying(false)
  }

  // 言語別の音声をフィルタリング
  const filteredSpeakers = speakers.filter(speaker => 
    !selectedLanguage || speaker.language === selectedLanguage
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          テキスト読み上げ (TTS)
          {!settings?.enabled && (
            <Badge variant="secondary" className="text-xs">
              無効
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Gemini APIを使用してテキストを音声に変換します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 言語選択 */}
        <div className="space-y-2">
          <Label htmlFor="language">言語</Label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="言語を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ja-JP">日本語 (日本)</SelectItem>
              <SelectItem value="en-US">英語 (米国)</SelectItem>
              <SelectItem value="ko-KR">韓国語 (韓国)</SelectItem>
              <SelectItem value="zh-CN">中国語 (簡体)</SelectItem>
              <SelectItem value="fr-FR">フランス語 (フランス)</SelectItem>
              <SelectItem value="de-DE">ドイツ語 (ドイツ)</SelectItem>
              <SelectItem value="es-ES">スペイン語 (スペイン)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 音声選択 */}
        <div className="space-y-2">
          <Label htmlFor="voice">音声</Label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger>
              <SelectValue placeholder="音声を選択" />
            </SelectTrigger>
            <SelectContent>
              {filteredSpeakers.map((speaker) => (
                <SelectItem key={speaker.id} value={speaker.voiceName}>
                  {speaker.name} - {speaker.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* スタイル設定 */}
        <div className="space-y-2">
          <Label htmlFor="style">スタイル (オプション)</Label>
          <Input
            id="style"
            placeholder="例: cheerfully, softly, excitedly"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
        </div>

        {/* テキスト入力 */}
        <div className="space-y-2">
          <Label htmlFor="text">テキスト</Label>
          <Textarea
            id="text"
            placeholder="読み上げたいテキストを入力してください"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* 操作ボタン */}
        <div className="flex gap-2">
          <Button 
            onClick={synthesizeText} 
            disabled={isLoading || !text.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                音声生成
              </>
            )}
          </Button>
        </div>

        {/* 音声プレイヤー */}
        {audioUrl && (
          <div className="space-y-2">
            <Label>音声プレイヤー</Label>
            <div className="aspect-square w-full max-w-64 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-4">
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                  <Volume2 className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    生成された音声
                  </p>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  onPlay={handleAudioPlay}
                  onPause={handleAudioPause}
                  className="w-full max-w-48"
                  controls
                />
                <div className="flex gap-2">
                  <Button
                    onClick={isPlaying ? pauseAudio : playAudio}
                    disabled={!audioUrl}
                    variant="outline"
                    size="sm"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        停止
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        再生
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={downloadAudio}
                    disabled={!audioUrl}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
