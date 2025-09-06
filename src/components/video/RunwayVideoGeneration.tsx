import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { Video, Play, Download, RefreshCw, Settings } from 'lucide-react'
import { RunwayService, RunwayVideoRequest, RunwayVideoResponse } from '@/services/video/runway-service'

import { Slider } from '@/components/ui/slider'

interface RunwayVideoGenerationProps {
  apiKey: string
  onVideoGenerated?: (videoUrl: string) => void
}

export function RunwayVideoGeneration({ apiKey, onVideoGenerated }: RunwayVideoGenerationProps) {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>('16:9')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [guidanceScale, setGuidanceScale] = useState(7.5)
  const [numFrames, setNumFrames] = useState(120)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<RunwayVideoResponse | null>(null)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [availableModels, setAvailableModels] = useState<any[]>([])

  const runwayService = new RunwayService(apiKey)

  // 利用可能なモデルを取得
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await runwayService.getAvailableModels()
        setAvailableModels(models)
      } catch (error) {
        console.error('Failed to fetch available models:', error)
      }
    }

    if (apiKey) {
      fetchModels()
    }
  }, [apiKey])

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgress('Initializing video generation...')

    try {
      const request: RunwayVideoRequest = {
        prompt: prompt.trim(),
        duration,
        aspectRatio,
        quality,
        guidanceScale,
        numFrames,
      }

      const response = await runwayService.generateVideo(request)
      
      if (response.status === 'failed') {
        throw new Error(response.error || 'Failed to start video generation')
      }

      setProgress('Video generation started...')
      
      // ポーリングで進捗を監視
      const finalResult = await runwayService.pollVideoStatus(response.id, (status) => {
        setProgress(`Video status: ${status}`)
      })

      if (finalResult.status === 'completed' && finalResult.videoUrl) {
        setGeneratedVideo(finalResult)
        onVideoGenerated?.(finalResult.videoUrl)
        setProgress('Video generation completed!')
      } else {
        throw new Error(finalResult.error || 'Video generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setProgress('')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRetry = () => {
    setGeneratedVideo(null)
    setError(null)
    handleGenerateVideo()
  }

  const handleDownload = () => {
    if (generatedVideo?.videoUrl) {
      const link = document.createElement('a')
      link.href = generatedVideo.videoUrl
      link.download = `runway-video-${Date.now()}.mp4`
      link.click()
    }
  }

  const handlePlay = () => {
    if (generatedVideo?.videoUrl) {
      window.open(generatedVideo.videoUrl, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Runway ML Video Generation
          </CardTitle>
          <CardDescription>
            Generate high-quality videos using Runway ML's Gen-3 model
            {availableModels.length > 0 && (
              <span className="text-sm text-green-600 ml-2">
                ✓ {availableModels.length} models available
              </span>
            )}
            <div className="text-xs text-gray-500 mt-1">
              <a href="https://docs.dev.runwayml.com/guides/setup/" target="_blank" rel="noopener noreferrer" className="underline">
                Setup Guide
              </a>
              {' • '}
              <a href="https://docs.dev.runwayml.com/pricing/" target="_blank" rel="noopener noreferrer" className="underline">
                Pricing
              </a>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="video-prompt">Video Prompt</Label>
            <Textarea
              id="video-prompt"
              placeholder="Describe the video you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 seconds</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={(value: any) => setAspectRatio(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                  <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quality</Label>
              <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Fast)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="high">High (Best)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frames</Label>
              <Select value={numFrames.toString()} onValueChange={(value) => setNumFrames(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60 frames</SelectItem>
                  <SelectItem value="120">120 frames</SelectItem>
                  <SelectItem value="180">180 frames</SelectItem>
                  <SelectItem value="240">240 frames</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Advanced Settings
          </Button>

          {/* Advanced Settings */}
          {showAdvancedSettings && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/50">
              <div className="space-y-2">
                <Label>Guidance Scale: {guidanceScale}</Label>
                <Slider
                  value={[guidanceScale]}
                  onValueChange={(value) => setGuidanceScale(value[0])}
                  max={20}
                  min={1}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controls how closely the video follows the prompt (1.0 = creative, 20.0 = strict)
                </p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateVideo}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <CircleSpinner className="w-4 h-4 mr-2" />
                <span>Generating video</span>
                <JumpingDots className="ml-2" />
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>

          {/* Progress */}
          {isGenerating && progress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{progress}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Video */}
      {generatedVideo && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Video</CardTitle>
            <CardDescription>
              {generatedVideo.isSimulation ? 'Simulation Mode' : 'Runway ML Gen-3'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-md overflow-hidden">
              {generatedVideo.videoUrl && (
                <video
                  src={generatedVideo.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePlay} variant="outline" className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Duration: {generatedVideo.duration} seconds</p>
              <p>Aspect Ratio: {aspectRatio}</p>
              <p>Quality: {quality}</p>
              {showAdvancedSettings && (
                <>
                  <p>Guidance Scale: {guidanceScale}</p>
                  <p>Frames: {numFrames}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
