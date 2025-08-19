"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Volume2, 
  Maximize, 
  ZoomIn, 
  ZoomOut,
  Clock,
  FileVideo,
  Image as ImageIcon,
  Music,
  Type,
  Plus,
  MoveVertical,
  Trash2
} from "lucide-react"

interface VideoClip {
  id: string
  name: string
  startTime: number
  endTime: number
  type: 'video' | 'image' | 'audio' | 'text'
  thumbnail?: string
}

interface VideoEditorProps {
  selectedAsset: string | null
  currentTime: number
  isPlaying: boolean
  onPlayPause: () => void
  onTimeUpdate?: (time: number) => void
}

export function VideoEditor({ 
  selectedAsset, 
  currentTime, 
  isPlaying, 
  onPlayPause,
  onTimeUpdate 
}: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [clips, setClips] = useState<VideoClip[]>([
    {
      id: '1',
      name: 'Clip 1',
      startTime: 0,
      endTime: 10,
      type: 'video'
    },
    {
      id: '2',
      name: 'Clip 2',
      startTime: 10,
      endTime: 20,
      type: 'image'
    },
    {
      id: '3',
      name: 'Clip 3',
      startTime: 20,
      endTime: 30,
      type: 'audio'
    }
  ])

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime
    }
  }, [currentTime])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      onTimeUpdate?.(newTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSliderChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    onTimeUpdate?.(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSkip = (direction: 'back' | 'forward') => {
    const skipTime = 10
    const newTime = direction === 'back' 
      ? Math.max(0, currentTime - skipTime)
      : Math.min(duration, currentTime + skipTime)
    onTimeUpdate?.(newTime)
  }

  const addClip = () => {
    const newClip: VideoClip = {
      id: Date.now().toString(),
      name: `Clip ${clips.length + 1}`,
      startTime: currentTime,
      endTime: currentTime + 10,
      type: 'video'
    }
    setClips([...clips, newClip])
  }

  const deleteClip = (clipId: string) => {
    setClips(clips.filter(clip => clip.id !== clipId))
  }

  const getClipIcon = (type: VideoClip['type']) => {
    switch (type) {
      case 'video':
        return <FileVideo className="h-4 w-4" />
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      case 'text':
        return <Type className="h-4 w-4" />
      default:
        return <FileVideo className="h-4 w-4" />
    }
  }

  const getClipColor = (type: VideoClip['type']) => {
    switch (type) {
      case 'video':
        return 'bg-blue-500/20 border-blue-500 text-blue-300'
      case 'image':
        return 'bg-green-500/20 border-green-500 text-green-300'
      case 'audio':
        return 'bg-purple-500/20 border-purple-500 text-purple-300'
      case 'text':
        return 'bg-orange-500/20 border-orange-500 text-orange-300'
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-300'
    }
  }

  return (
    <div className="flex h-full bg-black">
      {/* メインビデオエリア */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center relative">
          {selectedAsset ? (
            <video
              ref={videoRef}
              className="max-h-full max-w-full"
              src={selectedAsset}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => onPlayPause()}
              onPause={() => onPlayPause()}
            />
          ) : (
            <div className="text-zinc-500 text-center">
              <FileVideo className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">ビデオを選択してください</p>
              <p className="text-sm">左側のパネルからビデオファイルを選択</p>
            </div>
          )}
        </div>

        {/* ビデオコントロール */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-white" onClick={() => handleSkip('back')}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-white" onClick={onPlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-white" onClick={() => handleSkip('forward')}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-300">{formatTime(currentTime)}</span>
              <Slider 
                className="w-64" 
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]} 
                onValueChange={handleSliderChange}
                max={100} 
                step={0.1} 
              />
              <span className="text-xs text-zinc-300">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-white">
                <Scissors className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-white">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-white" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-zinc-300 w-12 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-white" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-white">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 音量コントロール */}
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-zinc-400" />
            <Slider className="w-32" value={[volume * 100]} onValueChange={(value) => setVolume(value[0] / 100)} max={100} />
          </div>
        </div>
      </div>

      {/* タイムラインパネル */}
      <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">タイムライン</h2>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="text-zinc-300 hover:text-white" onClick={addClip}>
              <Plus className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-zinc-300 hover:text-white">
              <Scissors className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-zinc-300 hover:text-white">
              <MoveVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* クリップリスト */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {clips.map((clip) => (
            <Card key={clip.id} className="p-3 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 flex-shrink-0 rounded-md bg-zinc-800 flex items-center justify-center ${getClipColor(clip.type)}`}>
                  {getClipIcon(clip.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-zinc-100 truncate">
                    {clip.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
                      {clip.type}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-300">
                    <Scissors className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-300">
                    <MoveVertical className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-red-400 hover:text-red-300"
                    onClick={() => deleteClip(clip.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
