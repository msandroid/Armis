import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, Volume2, FileText, Monitor, Copy, Check, Download } from 'lucide-react'
import { WhisperLocalService, STTResult } from '@/services/stt'
import { formatAudioDuration, formatAudioFileSize } from '@/utils/audio-utils'

interface AudioTranscriptionProps {
  className?: string
}

export function AudioTranscription({ className = '' }: AudioTranscriptionProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [transcription, setTranscription] = useState<STTResult | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('ja')
  const [selectedModel, setSelectedModel] = useState('base')
  
  const [whisperService] = useState(() => {
    console.log('🎤 Getting WhisperLocalService instance for AudioTranscription')
    return WhisperLocalService.getInstance({
      modelPath: `/whisper/ggml-${selectedModel}.${selectedLanguage === 'ja' ? 'ja' : 'en'}.bin`,
      language: selectedLanguage,
      temperature: 0.0,
      maxTokens: 448
    })
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setAudioFile(file)
      setError(null)
      setTranscription(null)
      setCopied(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a']
    },
    multiple: false
  })

  const transcribeAudio = async () => {
    if (!audioFile) return

    setIsTranscribing(true)
    setError(null)
    setTranscription(null)
    setCopied(false)

    try {
      // サービス設定を更新
      whisperService.updateConfig({
        modelPath: `/whisper/ggml-${selectedModel}.${selectedLanguage === 'ja' ? 'ja' : 'en'}.bin`,
        language: selectedLanguage
      })

      // 文字起こし実行
      const result = await whisperService.transcribeFile(audioFile, {
        language: selectedLanguage,
        temperature: 0.0
      })
      
      setTranscription(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '文字起こし中にエラーが発生しました')
    } finally {
      setIsTranscribing(false)
    }
  }

  const copyToClipboard = async () => {
    if (!transcription) return

    try {
      await navigator.clipboard.writeText(transcription.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const downloadTranscription = () => {
    if (!transcription || !audioFile) return

    const blob = new Blob([transcription.text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${audioFile.name.replace(/\.[^/.]+$/, '')}_transcription.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Transcription
          </CardTitle>
          <CardDescription>
            Upload audio files and get accurate transcriptions using AI technology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 音声アップロードエリア */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop audio files here</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Click to select audio or drag & drop
                </p>
                <p className="text-sm text-gray-500">
                  Supports MP3, WAV, AAC, OGG, FLAC, M4A formats
                </p>
              </div>
            )}
          </div>

          {/* アップロードされた音声の情報 */}
          {audioFile && (
            <div className="space-y-2">
              <Label>Uploaded Audio:</Label>
              <div className="aspect-square w-full max-w-64 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-4 w-full">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Volume2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {audioFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatAudioFileSize(audioFile.size)} | {audioFile.type}
                    </p>
                  </div>
                  <audio
                    src={URL.createObjectURL(audioFile)}
                    controls
                    className="w-full max-w-48"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiny">Tiny (39MB)</SelectItem>
                  <SelectItem value="base">Base (74MB)</SelectItem>
                  <SelectItem value="small">Small (244MB)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 文字起こしボタン */}
          <Button
            onClick={transcribeAudio}
            disabled={!audioFile || isTranscribing}
            className="w-full flex items-center gap-2"
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Transcribe Audio
            <Monitor className="h-4 w-4" />
          </Button>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 文字起こし結果 */}
          {transcription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcription Results
                  <Monitor className="h-4 w-4 text-green-600" />
                </CardTitle>
                <CardDescription>
                  Processing Time: {transcription.duration}ms | 
                  Language: {transcription.language || 'Unknown'} |
                  Confidence: {transcription.confidence ? `${(transcription.confidence * 100).toFixed(1)}%` : 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 結果テキスト */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Transcription Text</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                          className="h-8 px-2"
                        >
                          {copied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadTranscription}
                          className="h-8 px-2"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={transcription.text}
                      readOnly
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* セグメント詳細 */}
                  {transcription.segments && transcription.segments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Segment Details</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {transcription.segments.map((segment, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                            <Badge variant="outline" className="text-xs">
                              {formatAudioDuration(segment.start)} - {formatAudioDuration(segment.end)}
                            </Badge>
                            <span className="text-sm flex-1">{segment.text}</span>
                            {segment.confidence && (
                              <Badge variant="secondary" className="text-xs">
                                {(segment.confidence * 100).toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
