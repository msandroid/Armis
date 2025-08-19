"use client"

import { useState, useRef, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Plus, 
  Scissors, 
  MoveVertical,
  Volume2,
  Maximize,
  ZoomIn,
  ZoomOut,
  Clock,
  FileVideo,
  Image as ImageIcon,
  Music,
  Type
} from "lucide-react"

interface VideoClip {
  id: string
  name: string
  startTime: number
  endTime: number
  type: 'video' | 'image' | 'audio' | 'text'
  thumbnail?: string
}

interface VideoTimelineEditorProps {
  selectedAsset?: string | null
  onAssetSelect?: (asset: string) => void
}

export function VideoTimelineEditor({ selectedAsset, onAssetSelect }: VideoTimelineEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
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

  const videoRef = useRef<HTMLVideoElement>(null)

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
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSliderChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSkip = (direction: 'back' | 'forward') => {
    const skipTime = 10
    const newTime = direction === 'back' 
      ? Math.max(0, currentTime - skipTime)
      : Math.min(duration, currentTime + skipTime)
    setCurrentTime(newTime)
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
    <div className="flex h-screen w-full bg-black">
      {/* メインビデオエリア */}
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full w-full">
          {selectedAsset ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src={selectedAsset}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-gray-400">
                <FileVideo className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">ビデオを選択してください</p>
                <p className="text-sm">左側のパネルからビデオファイルを選択</p>
              </div>
            </div>
          )}

          {/* ビデオコントロール */}
          <div className="absolute inset-x-0 bottom-0 flex h-16 items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-4">
            <Slider
              className="flex-1 mx-4 [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-red-500 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-red-500 [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:focus-visible]:scale-105 [&_[role=slider]:focus-visible]:transition-transform"
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleSliderChange}
              max={100}
              step={0.1}
            />
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleSkip('back')}>
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleSkip('forward')}>
                <SkipForward className="h-5 w-5" />
              </Button>
              <div className="text-sm text-white flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タイムラインパネル */}
      <div className="w-80 border-l border-gray-200 bg-gray-100 p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">タイムライン</h2>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={addClip}>
              <Plus className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <Scissors className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <MoveVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* クリップリスト */}
        <div className="space-y-2">
          {clips.map((clip) => (
            <Card key={clip.id} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 flex-shrink-0 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${getClipColor(clip.type)}`}>
                  {getClipIcon(clip.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {clip.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {clip.type}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Scissors className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoveVertical className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => deleteClip(clip.id)}
                  >
                    <span className="text-lg">×</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 追加コントロール */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">音量</span>
            <Volume2 className="h-4 w-4 text-gray-500" />
          </div>
          <Slider className="w-full" value={[volume * 100]} onValueChange={(value) => setVolume(value[0] / 100)} max={100} />
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ズーム</span>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500 w-12 text-center">{zoom}%</span>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
