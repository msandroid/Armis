'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  Volume2, 
  Headphones, 
  FileAudio, 
  Settings, 
  Zap, 
  Download,
  Upload,
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { TTSSynthesizer } from '@/components/tts-synthesizer'
import { STTRecorder } from '@/components/stt-recorder'
import { VoiceRecorder } from '@/components/voice-recorder'
import { toast } from 'sonner'

interface AudioFile {
  id: string
  name: string
  type: 'audio' | 'transcript'
  data: string
  metadata: any
  createdAt: Date
}

interface AudioProcessingHubProps {
  onAudioGenerated?: (audioData: string, metadata: any) => void
  onTranscriptionComplete?: (transcript: string, confidence: number) => void
  onFileProcessed?: (file: AudioFile) => void
  className?: string
}

export function AudioProcessingHub({
  onAudioGenerated,
  onTranscriptionComplete,
  onFileProcessed,
  className = ''
}: AudioProcessingHubProps) {
  // 音声ファイル管理
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // サーバー状態
  const [serverStatus, setServerStatus] = useState<{
    tts: { status: string; engines: string[] }
    stt: { status: string; providers: string[] }
    lastCheck: Date | null
  }>({
    tts: { status: 'unknown', engines: [] },
    stt: { status: 'unknown', providers: [] },
    lastCheck: null
  })

  // サーバー状態チェック
  const checkServerStatus = useCallback(async () => {
    try {
      const [ttsResponse, sttResponse] = await Promise.all([
        fetch('/api/tts?action=health'),
        fetch('/api/stt?action=health')
      ])

      const ttsData = await ttsResponse.json()
      const sttData = await sttResponse.json()

      setServerStatus({
        tts: {
          status: ttsResponse.ok ? 'running' : 'error',
          engines: Object.keys(ttsData.engines || {})
        },
        stt: {
          status: sttResponse.ok ? 'running' : 'error',
          providers: Object.keys(sttData.providers || {})
        },
        lastCheck: new Date()
      })
    } catch (error) {
      console.error('Server status check failed:', error)
      setServerStatus(prev => ({
        ...prev,
        tts: { status: 'error', engines: [] },
        stt: { status: 'error', providers: [] },
        lastCheck: new Date()
      }))
    }
  }, [])

  // 初期化
  React.useEffect(() => {
    checkServerStatus()
    const interval = setInterval(checkServerStatus, 30000)
    return () => clearInterval(interval)
  }, [checkServerStatus])

  // TTS音声生成完了時の処理
  const handleAudioGenerated = useCallback((audioData: string, metadata: any) => {
    const audioFile: AudioFile = {
      id: `audio_${Date.now()}`,
      name: `tts_${metadata.engine}_${Date.now()}.mp3`,
      type: 'audio',
      data: audioData,
      metadata,
      createdAt: new Date()
    }

    setAudioFiles(prev => [audioFile, ...prev])
    onAudioGenerated?.(audioData, metadata)
    onFileProcessed?.(audioFile)
    
    toast.success('音声が生成されました')
  }, [onAudioGenerated, onFileProcessed])

  // STT転写完了時の処理
  const handleTranscriptionComplete = useCallback((transcript: string, confidence: number) => {
    const transcriptFile: AudioFile = {
      id: `transcript_${Date.now()}`,
      name: `transcript_${Date.now()}.txt`,
      type: 'transcript',
      data: transcript,
      metadata: { confidence, timestamp: Date.now() },
      createdAt: new Date()
    }

    setAudioFiles(prev => [transcriptFile, ...prev])
    onTranscriptionComplete?.(transcript, confidence)
    onFileProcessed?.(transcriptFile)
    
    toast.success('音声認識が完了しました')
  }, [onTranscriptionComplete, onFileProcessed])

  // ファイルダウンロード
  const downloadFile = (file: AudioFile) => {
    try {
      let blob: Blob
      let filename: string

      if (file.type === 'audio') {
        // Base64音声データをBlobに変換
        const audioData = atob(file.data)
        const audioArray = new Uint8Array(audioData.length)
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i)
        }
        blob = new Blob([audioArray], { type: 'audio/mpeg' })
        filename = file.name
      } else {
        // テキストデータをBlobに変換
        blob = new Blob([file.data], { type: 'text/plain' })
        filename = file.name
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('ファイルをダウンロードしました')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('ダウンロードに失敗しました')
    }
  }

  // ファイル削除
  const deleteFile = (fileId: string) => {
    setAudioFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success('ファイルを削除しました')
  }

  // 全ファイル削除
  const clearAllFiles = () => {
    setAudioFiles([])
    toast.success('全てのファイルを削除しました')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Headphones className="h-6 w-6" />
          <h2 className="text-2xl font-bold">音声処理ハブ</h2>
          <Badge variant="outline">
            {audioFiles.length}ファイル
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkServerStatus}
          >
            <RefreshCw className="h-4 w-4" />
            更新
          </Button>
          
          {audioFiles.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllFiles}
            >
              <Square className="h-4 w-4" />
              全削除
            </Button>
          )}
        </div>
      </div>

      {/* サーバー状態 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              TTS (音声合成)
              <Badge variant={serverStatus.tts.status === 'running' ? 'default' : 'destructive'}>
                {serverStatus.tts.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              利用可能エンジン: {serverStatus.tts.engines.join(', ') || '不明'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="h-4 w-4" />
              STT (音声認識)
              <Badge variant={serverStatus.stt.status === 'running' ? 'default' : 'destructive'}>
                {serverStatus.stt.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              利用可能プロバイダー: {serverStatus.stt.providers.join(', ') || '不明'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メイン処理エリア */}
      <Tabs defaultValue="tts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tts">音声合成 (TTS)</TabsTrigger>
          <TabsTrigger value="stt">音声認識 (STT)</TabsTrigger>
          <TabsTrigger value="files">ファイル管理</TabsTrigger>
        </TabsList>

        {/* TTS タブ */}
        <TabsContent value="tts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                音声合成 (Text-to-Speech)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serverStatus.tts.status === 'running' ? (
                <TTSSynthesizer
                  onAudioGenerated={handleAudioGenerated}
                  showAdvancedOptions={true}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    TTSサーバーが利用できません。サーバーの状態を確認してください。
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STT タブ */}
        <TabsContent value="stt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                音声認識 (Speech-to-Text)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serverStatus.stt.status === 'running' ? (
                <STTRecorder
                  onResult={handleTranscriptionComplete}
                  showSettings={true}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    STTサーバーが利用できません。サーバーの状態を確認してください。
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ファイル管理タブ */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" />
                処理済みファイル
                <Badge variant="outline">
                  {audioFiles.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audioFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">ファイルがありません</h3>
                  <p className="text-muted-foreground">
                    音声合成や音声認識を実行すると、ここにファイルが表示されます
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {audioFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {file.type === 'audio' ? (
                          <Volume2 className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <div className="font-medium text-sm">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {file.createdAt.toLocaleString()}
                            {file.type === 'transcript' && file.metadata.confidence && (
                              <span className="ml-2">
                                信頼度: {Math.round(file.metadata.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFile(file.id)}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 統計情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">統計情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">音声ファイル</div>
              <div className="text-2xl font-bold text-blue-500">
                {audioFiles.filter(f => f.type === 'audio').length}
              </div>
            </div>
            <div>
              <div className="font-medium">転写ファイル</div>
              <div className="text-2xl font-bold text-green-500">
                {audioFiles.filter(f => f.type === 'transcript').length}
              </div>
            </div>
            <div>
              <div className="font-medium">TTS状態</div>
              <div className={`text-2xl font-bold ${
                serverStatus.tts.status === 'running' ? 'text-green-500' : 'text-red-500'
              }`}>
                {serverStatus.tts.status === 'running' ? '正常' : 'エラー'}
              </div>
            </div>
            <div>
              <div className="font-medium">STT状態</div>
              <div className={`text-2xl font-bold ${
                serverStatus.stt.status === 'running' ? 'text-green-500' : 'text-red-500'
              }`}>
                {serverStatus.stt.status === 'running' ? '正常' : 'エラー'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
