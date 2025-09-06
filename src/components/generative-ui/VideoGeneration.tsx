import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { Video, Play, Download, RefreshCw } from 'lucide-react'
import { VeoService, VeoVideoRequest, VeoVideoResponse } from '@/services/video/veo-service'
import { RunwayService, RunwayVideoRequest, RunwayVideoResponse } from '@/services/video/runway-service'

interface VideoGenerationProps {
  apiKey: string
  runwayApiKey?: string
  onVideoGenerated?: (videoUrl: string) => void
}

export function VideoGeneration({ apiKey, runwayApiKey, onVideoGenerated }: VideoGenerationProps) {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [videoProvider, setVideoProvider] = useState<'veo' | 'runway'>('veo')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<VeoVideoResponse | RunwayVideoResponse | null>(null)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const veoService = new VeoService(apiKey)
  const runwayService = runwayApiKey ? new RunwayService(runwayApiKey) : null

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    if (videoProvider === 'runway' && !runwayService) {
      setError('Runway ML API key is required for Runway video generation')
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgress('Initializing video generation...')

    try {
      if (videoProvider === 'veo') {
        const request: VeoVideoRequest = {
          prompt: prompt.trim(),
          duration,
          aspectRatio,
          quality,
        }

        const response = await veoService.generateVideo(request)
        
        if (response.status === 'failed') {
          throw new Error(response.error || 'Failed to start video generation')
        }

        setProgress('Video generation started...')
        
        // ポーリングで進捗を監視
        const finalResult = await veoService.pollVideoStatus(response.id, (status) => {
          setProgress(`Video status: ${status}`)
        })

        if (finalResult.status === 'completed' && finalResult.videoUrl) {
          setGeneratedVideo(finalResult)
          onVideoGenerated?.(finalResult.videoUrl)
          setProgress('Video generation completed!')
        } else {
          throw new Error(finalResult.error || 'Video generation failed')
        }
      } else {
        // Runway ML
        const request: RunwayVideoRequest = {
          prompt: prompt.trim(),
          duration,
          aspectRatio: aspectRatio as any, // Runway supports more aspect ratios
          quality,
          guidanceScale: 7.5,
          numFrames: 120,
        }

        const response = await runwayService!.generateVideo(request)
        
        if (response.status === 'failed') {
          throw new Error(response.error || 'Failed to start video generation')
        }

        setProgress('Video generation started...')
        
        // ポーリングで進捗を監視
        const finalResult = await runwayService!.pollVideoStatus(response.id, (status) => {
          setProgress(`Video status: ${status}`)
        })

        if (finalResult.status === 'completed' && finalResult.videoUrl) {
          setGeneratedVideo(finalResult)
          onVideoGenerated?.(finalResult.videoUrl)
          setProgress('Video generation completed!')
        } else {
          throw new Error(finalResult.error || 'Video generation failed')
        }
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
    setProgress('')
  }

  const handleDownload = () => {
    if (generatedVideo?.videoUrl) {
      const link = document.createElement('a')
      link.href = generatedVideo.videoUrl
      link.download = `veo-video-${generatedVideo.id}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Generation with Veo
        </CardTitle>
        <CardDescription>
          Generate high-quality videos using AI with Veo
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label>Video Generation Provider</Label>
          <Select value={videoProvider} onValueChange={(value: 'veo' | 'runway') => setVideoProvider(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="veo">Veo (Google)</SelectItem>
              <SelectItem value="runway" disabled={!runwayApiKey}>
                Runway ML Gen-3 {!runwayApiKey && '(API Key Required)'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="video-prompt">Video Prompt</Label>
          <Textarea
            id="video-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            rows={3}
            disabled={isGenerating}
          />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Select value={aspectRatio} onValueChange={(value: '16:9' | '9:16' | '1:1') => setAspectRatio(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quality</Label>
            <Select value={quality} onValueChange={(value: 'low' | 'medium' | 'high') => setQuality(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Progress Display */}
        {isGenerating && progress && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CircleSpinner size="sm" />
              <span className="text-blue-700 text-sm">{progress}</span>
            </div>
          </div>
        )}

        {/* Generated Video Display */}
        {generatedVideo && generatedVideo.videoUrl && (
          <div className="space-y-3">
            <div className="relative aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center p-8">
                <Video className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Video Generation Simulation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is a simulation of Veo video generation. The actual video would be generated based on your prompt.
                </p>
                <div className="bg-white rounded-lg p-4 text-left">
                  <h4 className="font-medium mb-2">Generated Video Details:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Duration: {generatedVideo.duration} seconds</li>
                    <li>• Aspect Ratio: {aspectRatio}</li>
                    <li>• Quality: {quality}</li>
                    <li>• Status: {generatedVideo.status}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download (Simulation)
              </Button>
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateVideo}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <CircleSpinner size="sm" className="mr-2" />
                Generating Video
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
