import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Video, Eye } from 'lucide-react'
import { GoogleDirectService, AudioVideoResponse } from '@/services/llm/google-direct-service'

interface VideoUnderstandingProps {
  googleService: GoogleDirectService
}

export function VideoUnderstanding({ googleService }: VideoUnderstandingProps) {
  const [videoData, setVideoData] = useState<string | null>(null)
  const [textPrompt, setTextPrompt] = useState('Please explain the content of this video in detail.')
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
        setVideoData(base64Data)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    },
    multiple: false
  })

  const analyzeVideo = async () => {
    if (!videoData) {
      setError('Please upload a video')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await googleService.analyzeVideo(videoData, textPrompt)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during video analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeVideoOnly = async () => {
    if (!videoData) {
      setError('Please upload a video')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await googleService.analyzeVideo(videoData)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during video analysis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Understanding & Analysis
          </CardTitle>
          <CardDescription>
            Upload a video to experience AI-powered video understanding and analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ビデオアップロードエリア */}
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
              <p className="text-blue-600">Drop video here</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Click to select video or drag & drop
                </p>
                <p className="text-sm text-gray-500">
                  Supports MP4, AVI, MOV, WMV, FLV, WebM formats
                </p>
              </div>
            )}
          </div>

          {/* アップロードされたビデオのプレビュー */}
          {videoData && (
            <div className="space-y-2">
              <Label>Uploaded Video:</Label>
              <div className="relative">
                <video
                  src={`data:video/mp4;base64,${videoData}`}
                  controls
                  className="max-w-full h-auto max-h-64 rounded-lg border"
                />
              </div>
            </div>
          )}

          {/* テキストプロンプト入力 */}
          <div className="space-y-2">
            <Label htmlFor="text-prompt">Analysis Prompt:</Label>
            <Textarea
              id="text-prompt"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Enter what you want to analyze in the video..."
              rows={3}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              onClick={analyzeVideo}
              disabled={!videoData || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Analyze Video (Custom Prompt)
            </Button>
            <Button
              onClick={analyzeVideoOnly}
              disabled={!videoData || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              Auto Analyze Video
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
                      <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            Processing time: {analysis.duration}ms | Tokens: {analysis.tokens}
          </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Video Analysis:</Label>
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
