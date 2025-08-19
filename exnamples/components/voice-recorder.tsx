"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Download, 
  Upload,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Languages,
  Cpu,
  Cloud
} from 'lucide-react'
import { toast } from 'sonner'

interface TranscriptionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  timestamp: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
  language: string
  provider?: string
  model?: string
  duration?: number
}

interface VoiceRecorderProps {
  onTranscription?: (result: TranscriptionResult) => void
  onAudioData?: (audioBlob: Blob) => void
  className?: string
  showAdvancedOptions?: boolean
}

const SUPPORTED_LANGUAGES = [
  { code: 'ja', name: '日本語' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'tr', name: 'Türkçe' }
]

const WHISPER_MODELS = [
  { id: 'tiny', name: 'Tiny', description: '最軽量・最高速' },
  { id: 'base', name: 'Base', description: 'バランス重視（推奨）' },
  { id: 'small', name: 'Small', description: '高精度・軽量' },
  { id: 'medium', name: 'Medium', description: '高精度・中速' },
  { id: 'large', name: 'Large', description: '最高精度・低速' },
  { id: 'large-v2', name: 'Large v2', description: '最高精度（改良版）' },
  { id: 'large-v3', name: 'Large v3', description: '最高精度（最新版）' }
]

const PROVIDERS = [
  { id: 'auto', name: '自動選択', icon: '🔄', description: 'APIキーがあればOpenAI、なければローカル' },
  { id: 'local', name: 'ローカル', icon: '🔒', description: 'プライバシー重視・高速' },
  { id: 'openai', name: 'OpenAI', icon: '☁️', description: 'クラウド・高精度' }
]

export function VoiceRecorder({
  onTranscription,
  onAudioData,
  className = '',
  showAdvancedOptions = true
}: VoiceRecorderProps) {
  // 録音関連の状態
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  // 音声認識関連の状態
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null)
  const [language, setLanguage] = useState('ja')
  const [provider, setProvider] = useState('auto')
  const [model, setModel] = useState('base')
  const [withTimestamps, setWithTimestamps] = useState(false)
  const [apiKey, setApiKey] = useState('')

  // サーバー状態
  const [serverStatus, setServerStatus] = useState<{
    local: 'running' | 'stopped' | 'unknown'
    openai: 'available' | 'unavailable'
  }>({ local: 'unknown', openai: 'available' })

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // サーバー状態チェック
  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/stt?action=health')
      const data = await response.json()
      setServerStatus({
        local: data.providers?.local || 'unknown',
        openai: data.providers?.openai || 'available'
      })
    } catch (error) {
      console.error('サーバー状態チェックエラー:', error)
      setServerStatus({ local: 'unknown', openai: 'available' })
    }
  }, [])

  // 録音時間更新
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRecording, isPaused])

  // 音声レベル監視
  useEffect(() => {
    if (isRecording && analyserRef.current) {
      const updateAudioLevel = () => {
        const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount)
        analyserRef.current!.getByteFrequencyData(dataArray)
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average)
        
        if (isRecording) {
          requestAnimationFrame(updateAudioLevel)
        }
      }
      updateAudioLevel()
    }
  }, [isRecording])

  // 初期化時にサーバー状態チェック
  useEffect(() => {
    checkServerStatus()
  }, [checkServerStatus])

  // 録音開始
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      streamRef.current = stream

      // 音声レベル監視のセットアップ
      audioContextRef.current = new AudioContext()
      const analyser = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        onAudioData?.(audioBlob)
      }

      mediaRecorder.start(100) // 100ms間隔でデータを記録
      setIsRecording(true)
      setRecordingTime(0)
      toast.success('録音を開始しました')

    } catch (error) {
      console.error('録音開始エラー:', error)
      toast.error('マイクアクセスが拒否されました')
    }
  }

  // 録音停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      toast.success('録音を停止しました')
    }
  }

  // 録音一時停止/再開
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
      }
    }
  }

  // 再生
  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // 再生停止
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  // ダウンロード
  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `recording_${new Date().toISOString().slice(0, 19)}.webm`
      a.click()
    }
  }

  // ファイルアップロード
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioBlob(file)
      setAudioUrl(URL.createObjectURL(file))
      toast.success(`音声ファイル "${file.name}" をアップロードしました`)
    }
  }

  // 音声認識実行
  const transcribeAudio = async () => {
    if (!audioBlob) {
      toast.error('音声データがありません')
      return
    }

    setIsTranscribing(true)
    setTranscriptionResult(null)

    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('language', language)
      formData.append('provider', provider)
      formData.append('with_timestamps', withTimestamps.toString())

      if (provider === 'local') {
        formData.append('model', model)
      }

      if (provider === 'openai' && apiKey) {
        formData.append('apiKey', apiKey)
      }

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        const result: TranscriptionResult = {
          transcript: data.transcript,
          confidence: data.confidence || 1.0,
          isFinal: data.isFinal || true,
          timestamp: data.timestamp || Date.now(),
          segments: data.segments || [],
          language: data.language || language,
          provider: data.provider,
          model: data.model,
          duration: data.duration
        }

        setTranscriptionResult(result)
        onTranscription?.(result)
        toast.success('音声認識が完了しました')
      } else {
        throw new Error(data.error || '音声認識に失敗しました')
      }

    } catch (error) {
      console.error('音声認識エラー:', error)
      toast.error(error instanceof Error ? error.message : '音声認識に失敗しました')
    } finally {
      setIsTranscribing(false)
    }
  }

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 音声レベルの色
  const getAudioLevelColor = (level: number) => {
    if (level < 30) return 'bg-green-500'
    if (level < 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // プロバイダーアイコン
  const getProviderIcon = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId)
    return provider?.icon || '🔄'
  }

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          音声録音・認識
          <div className="flex gap-2 ml-auto">
            <Badge variant={serverStatus.local === 'running' ? 'default' : 'secondary'}>
              <Cpu className="h-3 w-3 mr-1" />
              ローカル: {serverStatus.local}
            </Badge>
            <Badge variant={serverStatus.openai === 'available' ? 'default' : 'secondary'}>
              <Cloud className="h-3 w-3 mr-1" />
              OpenAI: {serverStatus.openai}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 録音コントロール */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button onClick={startRecording} size="lg" className="gap-2">
                  <Mic className="h-4 w-4" />
                  録音開始
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={togglePause} 
                    variant="outline" 
                    size="lg" 
                    className="gap-2"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isPaused ? '再開' : '一時停止'}
                  </Button>
                  <Button 
                    onClick={stopRecording} 
                    variant="destructive" 
                    size="lg" 
                    className="gap-2"
                  >
                    <Square className="h-4 w-4" />
                    停止
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {audioLevel > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-100 ${getAudioLevelColor(audioLevel)}`}
                        style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="destructive">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(recordingTime)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* ファイルアップロード */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload">
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  ファイルアップロード
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* 音声プレビュー */}
        {audioUrl && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">録音プレビュー</h4>
              <div className="flex gap-2">
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
              </div>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              controls
              className="w-full"
            />
          </div>
        )}

        {/* 音声認識設定 */}
        {showAdvancedOptions && (
          <div className="space-y-4">
            <Separator />
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              音声認識設定
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* プロバイダー選択 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">プロバイダー</label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{p.icon}</span>
                          <div>
                            <div>{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.description}</div>
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
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ローカルモデル選択 */}
              {provider === 'local' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">モデル</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WHISPER_MODELS.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          <div>
                            <div>{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* OpenAI APIキー */}
              {provider === 'openai' && (
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

            {/* その他オプション */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={withTimestamps}
                  onChange={(e) => setWithTimestamps(e.target.checked)}
                />
                <span className="text-sm">タイムスタンプ付き</span>
              </label>
            </div>
          </div>
        )}

        {/* 音声認識実行 */}
        {audioBlob && (
          <div className="space-y-4">
            <Separator />
            <Button 
              onClick={transcribeAudio} 
              disabled={isTranscribing}
              className="w-full gap-2"
              size="lg"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  音声認識中...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  音声認識実行
                </>
              )}
            </Button>
          </div>
        )}

        {/* 認識結果 */}
        {transcriptionResult && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  認識結果
                </h4>
                <div className="flex gap-2">
                  {transcriptionResult.provider && (
                    <Badge variant="outline">
                      {getProviderIcon(transcriptionResult.provider)} {transcriptionResult.provider}
                    </Badge>
                  )}
                  {transcriptionResult.model && (
                    <Badge variant="outline">{transcriptionResult.model}</Badge>
                  )}
                  <Badge variant="outline">{transcriptionResult.language}</Badge>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm leading-relaxed">{transcriptionResult.transcript}</p>
              </div>

              {transcriptionResult.segments && transcriptionResult.segments.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground">タイムスタンプ付きセグメント</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {transcriptionResult.segments.map((segment, index) => (
                      <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                        <span className="font-mono text-muted-foreground">
                          {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s:
                        </span>
                        <span className="ml-2">{segment.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>認識時刻: {new Date(transcriptionResult.timestamp).toLocaleString()}</span>
                {transcriptionResult.duration && (
                  <span>音声長: {transcriptionResult.duration.toFixed(1)}秒</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
