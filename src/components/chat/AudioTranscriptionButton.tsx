import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, FileText, Globe, Monitor, Volume2, Copy, Check } from 'lucide-react'
import { WhisperLocalService, STTResult } from '@/services/stt'
import { GeminiFileService } from '@/services/llm/gemini-file-service'
import { formatAudioDuration } from '@/utils/audio-utils'

interface AudioTranscriptionButtonProps {
  audioFile: File
  googleService: GeminiFileService
  onTranscriptionComplete: (text: string) => void
  className?: string
}

export const AudioTranscriptionButton: React.FC<AudioTranscriptionButtonProps> = ({
  audioFile,
  googleService,
  onTranscriptionComplete,
  className = ''
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<STTResult | null>(null)
  const [selectedService, setSelectedService] = useState<'cloud' | 'local'>('cloud')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const [whisperService] = useState(() => {
    console.log('🎤 Getting WhisperLocalService instance for AudioTranscriptionButton')
    return WhisperLocalService.getInstance({
      modelPath: '/whisper/ggml-base.en.bin',
      language: 'ja',
      temperature: 0.0,
      maxTokens: 448
    })
  })

  const transcribeAudio = async () => {
    setIsTranscribing(true)
    setError(null)
    setTranscription(null)

    try {
      // 音声ファイルをBase64に変換
      const base64Data = await fileToBase64(audioFile)
      
      if (selectedService === 'local') {
        // ローカルWhisperサービスを使用
        const result = await whisperService.transcribe(base64Data, {
          language: 'ja',
          temperature: 0.0
        })
        setTranscription(result)
        onTranscriptionComplete(result.text)
      } else {
        // クラウドサービスを使用
        const result = await googleService.chatAboutAudio(base64Data, 'この音声の内容を文字起こししてください。')
        const transcriptionResult: STTResult = {
          text: result.text,
          duration: 0, // GeminiFileServiceにはdurationプロパティがないため
          language: 'ja'
        }
        setTranscription(transcriptionResult)
        onTranscriptionComplete(result.text)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '文字起こし中にエラーが発生しました')
    } finally {
      setIsTranscribing(false)
    }
  }

  const copyToClipboard = async () => {
    if (transcription?.text) {
      try {
        await navigator.clipboard.writeText(transcription.text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* サービス選択 */}
      <div className="space-y-2">
        <Label>文字起こしサービス:</Label>
        <Select value={selectedService} onValueChange={(value: 'cloud' | 'local') => setSelectedService(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cloud">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                クラウドサービス（Google AI）
              </div>
            </SelectItem>
            <SelectItem value="local">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                ローカルWhisper（プライバシー重視）
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 文字起こしボタン */}
      <Button
        onClick={transcribeAudio}
        disabled={isTranscribing}
        className="w-full flex items-center gap-2"
        variant="secondary"
      >
        {isTranscribing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        音声を文字起こし
        {selectedService === 'local' && <Monitor className="h-3 w-3" />}
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
              文字起こし結果
              {selectedService === 'local' && <Monitor className="h-4 w-4 text-green-600" />}
            </CardTitle>
            <CardDescription>
              処理時間: {transcription.duration}ms | 
              言語: {transcription.language || '不明'} |
              信頼度: {transcription.confidence ? `${(transcription.confidence * 100).toFixed(1)}%` : '不明'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">文字起こしテキスト:</Label>
                <div className="mt-2 p-4 bg-green-50 rounded-lg relative">
                  <p className="text-green-800 whitespace-pre-wrap pr-12">{transcription.text}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {transcription.segments && transcription.segments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">セグメント詳細:</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {transcription.segments.map((segment, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">
                            {formatAudioDuration(segment.start)} - {formatAudioDuration(segment.end)}
                          </span>
                          {segment.confidence && (
                            <span className="text-xs text-gray-500">
                              信頼度: {(segment.confidence * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 text-sm">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
