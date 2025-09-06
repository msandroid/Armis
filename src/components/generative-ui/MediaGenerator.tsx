import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Image, Video, Sparkles, AlertCircle } from 'lucide-react'
import { GoogleDirectService } from '@/services/llm/google-direct-service'
import { GeminiImageService } from '@/services/llm/gemini-image-service'
import { GeminiImageGenerator } from './GeminiImageGenerator'
import { RunwayVideoGeneration } from '@/components/video/RunwayVideoGeneration'

interface MediaGeneratorProps {
  googleService: GoogleDirectService
  geminiImageService?: GeminiImageService
  runwayApiKey?: string
}

export function MediaGenerator({ googleService, geminiImageService, runwayApiKey }: MediaGeneratorProps) {
  const [imagePrompt, setImagePrompt] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('Please enter an image generation prompt')
      return
    }

    setIsGeneratingImage(true)
    setError(null)

    try {
      await googleService.generateImages(imagePrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during image generation')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const generateVideo = async () => {
    if (!videoPrompt.trim()) {
      setError('Please enter a video generation prompt')
      return
    }

    setIsGeneratingVideo(true)
    setError(null)

    try {
      await googleService.generateVideo(videoPrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during video generation')
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Gemini Image Generation */}
      {geminiImageService && (
        <GeminiImageGenerator geminiImageService={geminiImageService} />
      )}

      {/* 従来の画像生成セクション（開発中） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Legacy Image Generation
            <Badge variant="secondary" className="ml-2">
              In Development
            </Badge>
          </CardTitle>
          <CardDescription>
            Generate images from text prompts using AI (Legacy implementation)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-prompt">Image Generation Prompt:</Label>
            <Textarea
              id="image-prompt"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Enter a detailed description of the image you want to generate..."
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
            Generate Image
          </Button>
        </CardContent>
      </Card>

      {/* Runway ML Video Generation */}
      {runwayApiKey && (
        <RunwayVideoGeneration 
          apiKey={runwayApiKey} 
          onVideoGenerated={(videoUrl) => {
            console.log('Video generated:', videoUrl)
          }}
        />
      )}

      {/* ビデオ生成セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Generation
            <Badge variant="secondary" className="ml-2">
              In Development
            </Badge>
          </CardTitle>
          <CardDescription>
            Generate videos from text prompts using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-prompt">Video Generation Prompt:</Label>
            <Textarea
              id="video-prompt"
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Enter a detailed description of the video you want to generate..."
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
            Generate Video
          </Button>
        </CardContent>
      </Card>

      {/* 機能説明 */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            About Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-amber-700">
            <p>
              <strong>Image and video generation features</strong> are currently under development.
            </p>
            <p>
              These features will be automatically enabled when they become available in the latest version of Google GenAI SDK.
            </p>
            <p className="text-sm">
              Currently available features:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Image understanding and analysis (multimodal)</li>
              <li>Text generation</li>
              <li>Streaming responses</li>
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
