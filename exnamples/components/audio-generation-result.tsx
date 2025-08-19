"use client"

import React, { useState, useRef } from "react"
import { Download, Play, Pause, Volume2, Clock, FileAudio, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { downloadAudioFile, TTSGenerationResult } from "@/lib/chat-tts-processor"
import { cn } from "@/lib/utils"

interface AudioGenerationResultProps {
  result: TTSGenerationResult
  className?: string
  onPlay?: () => void
  onPause?: () => void
}

export function AudioGenerationResult({ 
  result, 
  className = '',
  onPlay,
  onPause
}: AudioGenerationResultProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayPause = () => {
    if (!audioRef.current || !result.audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      onPause?.()
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      onPlay?.()
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleDownload = () => {
    if (result.audioData && result.fileName) {
      downloadAudioFile(result.audioData, result.fileName)
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!result.success) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">音声生成に失敗しました</span>
          </div>
          <p className="text-sm text-red-500 mt-2">{result.error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>音声ファイルが生成されました</span>
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              <FileAudio className="h-3 w-3 mr-1" />
              MP3
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* 音声プレイヤー */}
          {result.audioUrl && (
            <>
              <audio
                ref={audioRef}
                src={result.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
              />

              <div className="space-y-3">
                {/* 再生コントロール */}
                <div className="flex items-center space-x-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePlayPause}
                        className="h-8 w-8 p-0"
                      >
                        {isPlaying ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isPlaying ? "一時停止" : "再生"}
                    </TooltipContent>
                  </Tooltip>

                  <div className="flex-1 space-y-1">
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>ダウンロード</TooltipContent>
                  </Tooltip>
                </div>

                {/* ファイル情報 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>生成時刻: {new Date().toLocaleTimeString()}</span>
                  </div>
                  {result.fileName && (
                    <span>{result.fileName}</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ダウンロードのみの場合 */}
          {!result.audioUrl && result.audioData && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <Volume2 className="h-4 w-4" />
                <span>音声ファイルが準備できました</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                ダウンロード
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// 音声生成中の状態を表示するコンポーネント
interface AudioGenerationLoadingProps {
  text?: string
  className?: string
}

export function AudioGenerationLoading({ 
  text = "音声を生成しています...", 
  className = '' 
}: AudioGenerationLoadingProps) {
  return (
    <Card className={cn("border-blue-200 bg-blue-50", className)}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-medium text-blue-900">{text}</p>
            <p className="text-xs text-blue-700">しばらくお待ちください...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
