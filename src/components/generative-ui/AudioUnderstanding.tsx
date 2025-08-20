import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Volume2, Eye } from 'lucide-react'
import { GoogleDirectService, AudioVideoResponse } from '@/services/llm/google-direct-service'

interface AudioUnderstandingProps {
  googleService: GoogleDirectService
}

export function AudioUnderstanding({ googleService }: AudioUnderstandingProps) {
  const [audioData, setAudioData] = useState<string | null>(null)
  const [textPrompt, setTextPrompt] = useState('この音声の内容を詳しく説明してください。')
  const [analysis, setAnalysis] = useState<AudioVideoResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a']
    },
    multiple: false
  })

  const analyzeAudio = async () => {
    if (!audioData) {
      setError('音声をアップロードしてください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await googleService.analyzeAudio(audioData, textPrompt)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '音声分析中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeAudioOnly = async () => {
    if (!audioData) {
      setError('音声をアップロードしてください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await googleService.analyzeAudio(audioData)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '音声分析中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            音声理解・分析
          </CardTitle>
          <CardDescription>
            音声をアップロードして、AIによる音声理解と分析を体験できます
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
              <p className="text-blue-600">音声をここにドロップしてください</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  クリックして音声を選択、またはドラッグ&ドロップ
                </p>
                <p className="text-sm text-gray-500">
                  MP3, WAV, AAC, OGG, FLAC, M4A形式をサポート
                </p>
              </div>
            )}
          </div>

          {/* アップロードされた音声のプレビュー */}
          {audioData && (
            <div className="space-y-2">
              <Label>アップロードされた音声:</Label>
              <div className="relative">
                <audio
                  src={`data:audio/mpeg;base64,${audioData}`}
                  controls
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* テキストプロンプト入力 */}
          <div className="space-y-2">
            <Label htmlFor="text-prompt">分析プロンプト:</Label>
            <Textarea
              id="text-prompt"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="音声に対して何を分析してほしいか入力してください..."
              rows={3}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              onClick={analyzeAudio}
              disabled={!audioData || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              音声を分析（カスタムプロンプト）
            </Button>
            <Button
              onClick={analyzeAudioOnly}
              disabled={!audioData || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              音声を自動分析
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

      {/* 分析結果 */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>分析結果</CardTitle>
            <CardDescription>
              処理時間: {analysis.duration}ms | トークン数: {analysis.tokens}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">音声分析:</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{analysis.analysis}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">生成されたテキスト:</Label>
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
