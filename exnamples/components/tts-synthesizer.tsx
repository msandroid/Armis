"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Mic,
  Speaker,
  Languages,
  Gauge,
  Heart,
  Smile,
  Frown,
  Zap,
  Cloud,
  Cpu
} from 'lucide-react'
import { toast } from 'sonner'

interface TTSResult {
  success: boolean
  engine: string
  text: string
  audio_data?: string
  audio_length?: number
  timestamp?: number
  voice?: string
  model?: string
  language?: string
  error?: string
}

interface TTSSynthesizerProps {
  onAudioGenerated?: (audioData: string, metadata: any) => void
  className?: string
  showAdvancedOptions?: boolean
  defaultText?: string
}

interface EngineInfo {
  available: boolean
  description: string
  voices?: string[]
  languages?: string[]
  requires_api_key?: boolean
}

interface VoiceInfo {
  id: string
  name: string
  gender?: string
  language?: string
  emotion?: string
}

const SUPPORTED_LANGUAGES = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
]

const ENGINE_ICONS: Record<string, string> = {
  openai: '☁️',
  coqui: '🎯',
  tortoise: '🐢',
  espnet: '🎼',
  style_bert_vits2: '🎭',
  auto: '🔄'
}

const EMOTIONS = [
  { id: 'neutral', name: 'ニュートラル', icon: '😐' },
  { id: 'happy', name: '嬉しい', icon: '😊' },
  { id: 'sad', name: '悲しい', icon: '😢' },
  { id: 'angry', name: '怒り', icon: '😠' },
  { id: 'surprised', name: '驚き', icon: '😲' },
  { id: 'excited', name: '興奮', icon: '🤩' }
]

export function TTSSynthesizer({
  onAudioGenerated,
  className = '',
  showAdvancedOptions = true,
  defaultText = ''
}: TTSSynthesizerProps) {
  // 基本状態
  const [text, setText] = useState(defaultText)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [result, setResult] = useState<TTSResult | null>(null)

  // 音声設定
  const [engine, setEngine] = useState('auto')
  const [language, setLanguage] = useState('ja')
  const [voice, setVoice] = useState('alloy')
  const [speed, setSpeed] = useState([1.0])
  const [pitch, setPitch] = useState([0])
  const [emotion, setEmotion] = useState('neutral')
  const [speaker, setSpeaker] = useState('default')

  // API設定
  const [apiKey, setApiKey] = useState('')
  
  // エンジン・音声情報
  const [engines, setEngines] = useState<Record<string, EngineInfo>>({})
  const [voices, setVoices] = useState<VoiceInfo[]>([])
  const [serverStatus, setServerStatus] = useState<{
    openai: string
    unified_tts: string
  }>({ openai: 'unknown', unified_tts: 'unknown' })

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioDataRef = useRef<string | null>(null)

  // サーバー状態とエンジン情報を取得
  const fetchEngineInfo = useCallback(async () => {
    try {
      const [healthResponse, enginesResponse] = await Promise.all([
        fetch('/api/tts?action=health'),
        fetch('/api/tts?action=engines')
      ])
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setServerStatus(healthData.servers || { openai: 'available', unified_tts: 'unknown' })
      }
      
      if (enginesResponse.ok) {
        const enginesData = await enginesResponse.json()
        setEngines(enginesData.engines || {})
      }
    } catch (error) {
      console.error('Engine info fetch error:', error)
    }
  }, [])

  // 選択されたエンジンの音声一覧を取得
  const fetchVoices = useCallback(async (selectedEngine: string) => {
    try {
      const response = await fetch(`/api/tts?action=voices&engine=${selectedEngine}`)
      if (response.ok) {
        const data = await response.json()
        setVoices(data.voices || [])
        
        // デフォルト音声を設定
        if (data.voices && data.voices.length > 0) {
          setVoice(data.voices[0].id)
        }
      }
    } catch (error) {
      console.error('Voices fetch error:', error)
      setVoices([])
    }
  }, [])

  // 初期化
  useEffect(() => {
    fetchEngineInfo()
  }, [fetchEngineInfo])

  // エンジン変更時に音声一覧を更新
  useEffect(() => {
    if (engine && engine !== 'auto') {
      fetchVoices(engine)
    } else {
      // autoの場合はOpenAIの音声を表示
      fetchVoices('openai')
    }
  }, [engine, fetchVoices])

  // 音声合成実行
  const synthesizeAudio = async () => {
    if (!text.trim()) {
      toast.error('テキストを入力してください')
      return
    }

    if (text.length > 4096) {
      toast.error('テキストが長すぎます（最大4096文字）')
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      const requestBody: any = {
        text: text.trim(),
        engine,
        language,
        voice,
        speed: speed[0],
        format: 'mp3'
      }

      // OpenAI使用時はAPIキーが必要
      if (engine === 'openai' || (engine === 'auto' && apiKey)) {
        if (!apiKey) {
          toast.error('OpenAI APIキーが必要です')
          return
        }
        requestBody.apiKey = apiKey
      }

      // エンジン固有オプション
      if (engine === 'style_bert_vits2' || engine === 'coqui') {
        requestBody.emotion = emotion
        requestBody.speaker = speaker
      }

      if (pitch[0] !== 0) {
        requestBody.pitch = pitch[0]
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(data)
        audioDataRef.current = data.audio_data
        
        // 音声データをBlob URLに変換
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audio_data), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl
        }

        onAudioGenerated?.(data.audio_data, {
          engine: data.engine,
          voice: data.voice,
          language,
          text: text.trim(),
          timestamp: data.timestamp
        })

        toast.success(`音声合成が完了しました (${data.engine})`)
      } else {
        throw new Error(data.error || '音声合成に失敗しました')
      }

    } catch (error) {
      console.error('TTS error:', error)
      toast.error(error instanceof Error ? error.message : '音声合成に失敗しました')
      setResult({
        success: false,
        engine,
        text: text.trim(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 音声再生
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // 音声停止
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  // 音声ダウンロード
  const downloadAudio = () => {
    if (audioDataRef.current) {
      const audioBlob = new Blob([
        Uint8Array.from(atob(audioDataRef.current), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(audioBlob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `tts_${engine}_${Date.now()}.mp3`
      a.click()
      
      URL.revokeObjectURL(url)
    }
  }

  // 言語に応じたフラグ取得
  const getLanguageFlag = (langCode: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === langCode)?.flag || '🌐'
  }

  // エンジンステータスの色
  const getEngineStatusColor = (engineId: string) => {
    const engineInfo = engines[engineId]
    if (!engineInfo) return 'text-gray-400'
    return engineInfo.available ? 'text-green-500' : 'text-red-500'
  }

  return (
    <Card className={`w-full max-w-4xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          音声合成システム
          <div className="flex gap-2 ml-auto">
            <Badge variant={serverStatus.openai === 'available' ? 'default' : 'secondary'}>
              <Cloud className="h-3 w-3 mr-1" />
              OpenAI: {serverStatus.openai}
            </Badge>
            <Badge variant={serverStatus.unified_tts === 'running' ? 'default' : 'secondary'}>
              <Cpu className="h-3 w-3 mr-1" />
              Local: {serverStatus.unified_tts}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* テキスト入力 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">合成テキスト</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="音声合成したいテキストを入力してください..."
            className="min-h-24 resize-none"
            maxLength={4096}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{text.length} / 4096 文字</span>
          </div>
        </div>

        {/* 基本設定 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* エンジン選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">エンジン</label>
            <Select value={engine} onValueChange={setEngine}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <span>🔄</span>
                    <div>
                      <div>自動選択</div>
                      <div className="text-xs text-muted-foreground">最適なエンジンを選択</div>
                    </div>
                  </div>
                </SelectItem>
                {Object.entries(engines).map(([id, info]) => (
                  <SelectItem key={id} value={id} disabled={!info.available}>
                    <div className="flex items-center gap-2">
                      <span>{ENGINE_ICONS[id] || '🎵'}</span>
                      <div>
                        <div className={getEngineStatusColor(id)}>{id}</div>
                        <div className="text-xs text-muted-foreground">{info.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 言語選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Languages className="h-3 w-3" />
              言語
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 音声選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Speaker className="h-3 w-3" />
              音声
            </label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voices.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    <div>
                      <div>{v.name}</div>
                      {v.gender && (
                        <div className="text-xs text-muted-foreground">
                          {v.gender} | {v.language}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 高度な設定 */}
        {showAdvancedOptions && (
          <div className="space-y-4">
            <Separator />
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              高度な設定
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 話速調整 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  話速: {speed[0]}x
                </label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x (遅い)</span>
                  <span>2.0x (速い)</span>
                </div>
              </div>

              {/* ピッチ調整 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  ピッチ: {pitch[0] > 0 ? '+' : ''}{pitch[0]}
                </label>
                <Slider
                  value={pitch}
                  onValueChange={setPitch}
                  min={-50}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-50 (低い)</span>
                  <span>+50 (高い)</span>
                </div>
              </div>

              {/* 感情選択（Style-Bert-VITS2用） */}
              {(engine === 'style_bert_vits2' || engine === 'auto') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    感情
                  </label>
                  <Select value={emotion} onValueChange={setEmotion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOTIONS.map(em => (
                        <SelectItem key={em.id} value={em.id}>
                          <div className="flex items-center gap-2">
                            <span>{em.icon}</span>
                            <span>{em.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* OpenAI APIキー */}
              {(engine === 'openai' || engine === 'auto') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">OpenAI APIキー</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 音声合成実行 */}
        <div className="space-y-4">
          <Separator />
          <Button 
            onClick={synthesizeAudio} 
            disabled={isGenerating || !text.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                音声合成中...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                音声合成実行
              </>
            )}
          </Button>
        </div>

        {/* 結果表示 */}
        {result && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  {result.success ? '音声合成完了' : '音声合成失敗'}
                </h4>
                <div className="flex gap-2">
                  {result.success && (
                    <>
                      <Badge variant="outline">
                        {ENGINE_ICONS[result.engine]} {result.engine}
                      </Badge>
                      <Badge variant="outline">
                        {getLanguageFlag(result.language || language)} {result.language || language}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {result.success ? (
                <div className="space-y-3">
                  {/* 音声プレーヤー */}
                  <div className="flex items-center gap-3">
                    {!isPlaying ? (
                      <Button onClick={playAudio} size="sm" variant="outline" className="gap-2">
                        <Play className="h-3 w-3" />
                        再生
                      </Button>
                    ) : (
                      <Button onClick={pauseAudio} size="sm" variant="outline" className="gap-2">
                        <Pause className="h-3 w-3" />
                        停止
                      </Button>
                    )}
                    <Button onClick={downloadAudio} size="sm" variant="outline" className="gap-2">
                      <Download className="h-3 w-3" />
                      ダウンロード
                    </Button>
                    {result.audio_length && (
                      <span className="text-xs text-muted-foreground">
                        {(result.audio_length / 1024).toFixed(1)}KB
                      </span>
                    )}
                  </div>

                  {/* 音声プレーヤー */}
                  <audio
                    ref={audioRef}
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    controls
                    className="w-full"
                  />

                  {/* メタデータ */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>エンジン: {result.engine}</div>
                    <div>音声: {result.voice}</div>
                    {result.timestamp && (
                      <div className="col-span-2">
                        作成: {new Date(result.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{result.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}