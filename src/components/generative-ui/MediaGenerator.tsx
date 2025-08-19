import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Image, Video, Sparkles, AlertCircle } from 'lucide-react'
import { GoogleDirectService } from '@/services/llm/google-direct-service'

interface MediaGeneratorProps {
  googleService: GoogleDirectService
}

export function MediaGenerator({ googleService }: MediaGeneratorProps) {
  const [imagePrompt, setImagePrompt] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('画像生成のプロンプトを入力してください')
      return
    }

    setIsGeneratingImage(true)
    setError(null)

    try {
      await googleService.generateImages(imagePrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像生成中にエラーが発生しました')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const generateVideo = async () => {
    if (!videoPrompt.trim()) {
      setError('ビデオ生成のプロンプトを入力してください')
      return
    }

    setIsGeneratingVideo(true)
    setError(null)

    try {
      await googleService.generateVideo(videoPrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ビデオ生成中にエラーが発生しました')
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 画像生成セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            画像生成
            <Badge variant="secondary" className="ml-2">
              開発中
            </Badge>
          </CardTitle>
          <CardDescription>
            AIを使用してテキストプロンプトから画像を生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-prompt">画像生成プロンプト:</Label>
            <Textarea
              id="image-prompt"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="生成したい画像の詳細な説明を入力してください..."
              rows={3}
            />
          </div>
          <Button
            onClick={generateImage}
            disabled={isGeneratingImage || !imagePrompt.trim()}
            className="flex items-center gap-2"
          >
            {isGeneratingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            画像を生成
          </Button>
        </CardContent>
      </Card>

      {/* ビデオ生成セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            ビデオ生成
            <Badge variant="secondary" className="ml-2">
              開発中
            </Badge>
          </CardTitle>
          <CardDescription>
            AIを使用してテキストプロンプトからビデオを生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-prompt">ビデオ生成プロンプト:</Label>
            <Textarea
              id="video-prompt"
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="生成したいビデオの詳細な説明を入力してください..."
              rows={3}
            />
          </div>
          <Button
            onClick={generateVideo}
            disabled={isGeneratingVideo || !videoPrompt.trim()}
            className="flex items-center gap-2"
          >
            {isGeneratingVideo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            ビデオを生成
          </Button>
        </CardContent>
      </Card>

      {/* 機能説明 */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            機能について
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-amber-700">
            <p>
              <strong>画像生成・ビデオ生成機能</strong>は現在開発中です。
            </p>
            <p>
              Google GenAI SDKの最新バージョンでこれらの機能が利用可能になった際に、
              自動的に有効になります。
            </p>
            <p className="text-sm">
              現在利用可能な機能：
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>画像理解・分析（マルチモーダル）</li>
              <li>テキスト生成</li>
              <li>ストリーミング応答</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* エラーメッセージ */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
