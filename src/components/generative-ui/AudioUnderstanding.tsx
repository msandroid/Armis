import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, Volume2, Eye, FileText, Globe, Monitor } from 'lucide-react'
import { GoogleDirectService, AudioVideoResponse } from '@/services/llm/google-direct-service'
import { WhisperLocalService, STTResult } from '@/services/stt'
import { formatAudioDuration } from '@/utils/audio-utils'

interface AudioUnderstandingProps {
  googleService: GoogleDirectService
}

export function AudioUnderstanding({ googleService }: AudioUnderstandingProps) {
  const [audioData, setAudioData] = useState<string | null>(null)
  const [textPrompt, setTextPrompt] = useState('Please explain the content of this audio in detail.')
  const [analysis, setAnalysis] = useState<AudioVideoResponse | null>(null)
  const [transcription, setTranscription] = useState<STTResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<'cloud' | 'local'>('cloud')
  const [whisperService] = useState(() => {
    console.log('🎤 Getting WhisperLocalService instance for AudioUnderstanding')
    return WhisperLocalService.getInstance({
      modelPath: '/whisper/ggml-base.en.bin',
      language: 'ja',
      temperature: 0.0,
      maxTokens: 448
    })
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // Base64データからヘッダー部分を除去
        const base64Data = result.split(',')[1]
        setAudioData(base64Data)
        setError(null)
        // 新しい音声ファイルがアップロードされたら、前の結果をクリア
        setAnalysis(null)
        setTranscription(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // 現在の音声ファイルのMIMEタイプを取得
  const getCurrentAudioMimeType = useCallback((): string => {
    if (!audioData) return 'audio/mpeg'
    
    // 音声データからMIMEタイプを判定
    const audioDataWithHeader = `data:audio/mpeg;base64,${audioData}`
    const mimeType = audioDataWithHeader.split(';')[0].split(':')[1]
    return mimeType || 'audio/mpeg'
  }, [audioData])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a']
    },
    multiple: false
  })

  const analyzeAudio = async () => {
    if (!audioData) {
      setError('Please upload audio')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const mimeType = getCurrentAudioMimeType()
      const result = await googleService.analyzeAudio(audioData, textPrompt, mimeType)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during audio analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeAudioOnly = async () => {
    if (!audioData) {
      setError('Please upload audio')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const mimeType = getCurrentAudioMimeType()
      const result = await googleService.analyzeAudio(audioData, undefined, mimeType)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during audio analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const transcribeAudio = async () => {
    if (!audioData) {
      setError('Please upload audio')
      return
    }

    setIsTranscribing(true)
    setError(null)

    try {
      if (selectedService === 'local') {
        // ローカルWhisperサービスを使用
        const result = await whisperService.transcribe(audioData, {
          language: 'ja',
          temperature: 0.0
        })
        setTranscription(result)
      } else {
        // クラウドサービスを使用（既存の実装）
        const mimeType = getCurrentAudioMimeType()
        const result = await googleService.analyzeAudio(audioData, 'Please transcribe this audio.', mimeType)
        setTranscription({
          text: result.text,
          duration: result.duration,
          language: 'ja'
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during transcription')
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Understanding, Analysis & Transcription
          </CardTitle>
          <CardDescription>
            Upload audio to experience AI-powered audio understanding, analysis, and transcription
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
              <p className="text-blue-600">Drop audio here</p>
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

          {/* アップロードされた音声のプレビュー */}
          {audioData && (
            <div className="space-y-2">
              <Label>Uploaded Audio:</Label>
              <div className="aspect-square w-full max-w-64 bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950 dark:to-cyan-950 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-4 w-full">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <Volume2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      アップロード済み音声
                    </p>
                  </div>
                  <audio
                    src={`data:audio/mpeg;base64,${audioData}`}
                    controls
                    className="w-full max-w-48"
                  />
                </div>
              </div>
            </div>
          )}

          {/* サービス選択 */}
          <div className="space-y-2">
            <Label>Processing Service:</Label>
            <Select value={selectedService} onValueChange={(value: 'cloud' | 'local') => setSelectedService(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloud">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Cloud Service (Google AI)
                  </div>
                </SelectItem>
                <SelectItem value="local">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Local Whisper (Privacy-focused)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* テキストプロンプト入力 */}
          <div className="space-y-2">
            <Label htmlFor="text-prompt">Analysis Prompt:</Label>
            <Textarea
              id="text-prompt"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Enter what you want to analyze in the audio..."
              rows={3}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={analyzeAudio}
              disabled={!audioData || isLoading || isTranscribing}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Analyze Audio (Custom Prompt)
            </Button>
            <Button
              onClick={analyzeAudioOnly}
              disabled={!audioData || isLoading || isTranscribing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              Auto Analyze Audio
            </Button>
                          <Button
                onClick={transcribeAudio}
                disabled={!audioData || isLoading || isTranscribing}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Transcribe
                {selectedService === 'local' && <Monitor className="h-3 w-3" />}
              </Button>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 文字起こし結果 */}
      {transcription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcription Results
              {selectedService === 'local' && <Monitor className="h-4 w-4 text-green-600" />}
            </CardTitle>
            <CardDescription>
              Processing time: {transcription.duration}ms | 
              Language: {transcription.language || 'Unknown'} |
              Confidence: {transcription.confidence ? `${(transcription.confidence * 100).toFixed(1)}%` : 'Unknown'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Transcription Text:</Label>
                <div className="mt-2 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 whitespace-pre-wrap">{transcription.text}</p>
                </div>
              </div>
              {transcription.segments && transcription.segments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Segment Details:</Label>
                  <div className="mt-2 space-y-2">
                    {transcription.segments.map((segment, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">
                            {formatAudioDuration(segment.start)} - {formatAudioDuration(segment.end)}
                          </span>
                          {segment.confidence && (
                            <span className="text-xs text-gray-500">
                              Confidence: {(segment.confidence * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析結果 */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Processing time: {analysis.duration}ms | Tokens: {analysis.tokens}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Audio Analysis:</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{analysis.analysis}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Generated Text:</Label>
                <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 whitespace-pre-wrap">{analysis.text}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
