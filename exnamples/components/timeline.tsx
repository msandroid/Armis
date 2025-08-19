"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  ChevronDown, 
  Video, 
  ImageIcon, 
  Music, 
  Type, 
  Plus,
  Scissors,
  MoveVertical,
  Trash2,
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from "lucide-react"

interface TimelineClip {
  id: string
  name: string
  startTime: number
  endTime: number
  type: 'video' | 'image' | 'audio' | 'text'
  track: number
  color: string
}

interface TimelineProps {
  currentTime: number
  onTimeUpdate: (time: number) => void
  isPlaying: boolean
  onPlayPause: () => void
  duration?: number
}

export function Timeline({ 
  currentTime, 
  onTimeUpdate, 
  isPlaying, 
  onPlayPause,
  duration = 90 
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [clips, setClips] = useState<TimelineClip[]>([
    {
      id: '1',
      name: 'intro.mp4',
      startTime: 0,
      endTime: 10,
      type: 'video',
      track: 0,
      color: 'bg-emerald-500'
    },
    {
      id: '2',
      name: 'slide1.png',
      startTime: 10,
      endTime: 20,
      type: 'image',
      track: 1,
      color: 'bg-blue-500'
    },
    {
      id: '3',
      name: 'narration.mp3',
      startTime: 0,
      endTime: 30,
      type: 'audio',
      track: 2,
      color: 'bg-purple-500'
    }
  ])
  const [zoom, setZoom] = useState(100)
  const [selectedClip, setSelectedClip] = useState<string | null>(null)

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const clickPosition = e.clientX - rect.left
      const percentage = clickPosition / rect.width
      const newTime = percentage * duration
      onTimeUpdate(newTime)
    }
  }

  const addClip = () => {
    const newClip: TimelineClip = {
      id: Date.now().toString(),
      name: `Clip ${clips.length + 1}`,
      startTime: currentTime,
      endTime: currentTime + 10,
      type: 'video',
      track: 0,
      color: 'bg-emerald-500'
    }
    setClips([...clips, newClip])
  }

  const deleteClip = (clipId: string) => {
    setClips(clips.filter(clip => clip.id !== clipId))
    if (selectedClip === clipId) {
      setSelectedClip(null)
    }
  }

  const getClipIcon = (type: TimelineClip['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-3.5 w-3.5" />
      case 'image':
        return <ImageIcon className="h-3.5 w-3.5" />
      case 'audio':
        return <Music className="h-3.5 w-3.5" />
      case 'text':
        return <Type className="h-3.5 w-3.5" />
      default:
        return <Video className="h-3.5 w-3.5" />
    }
  }

  const getTrackName = (trackIndex: number) => {
    const trackTypes = ['ビデオ', '画像', 'テキスト', '音声']
    return trackTypes[trackIndex] || `トラック ${trackIndex + 1}`
  }

  const getTrackIcon = (trackIndex: number) => {
    const icons = [Video, ImageIcon, Type, Music]
    const Icon = icons[trackIndex] || Video
    return <Icon className="h-3.5 w-3.5" />
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
    onTimeUpdate(newTime)
  }

  return (
    <div className="h-96 border-t border-zinc-800 bg-black flex flex-col">
      {/* タイムラインコントロール */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-zinc-300 hover:text-white">
            タイムライン
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-300 hover:text-white" onClick={() => handleSkip('back')}>
              <SkipBack className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-300 hover:text-white" onClick={onPlayPause}>
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-300 hover:text-white" onClick={() => handleSkip('forward')}>
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" className="h-7 text-xs border-zinc-700 text-zinc-300" onClick={addClip}>
            <Plus className="mr-1 h-3 w-3" />
            クリップ追加
          </Button>
        </div>
      </div>

      {/* タイムライン本体 */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* トラックラベル */}
          <div className="w-32 flex-shrink-0 border-r border-zinc-800">
            {Array.from({ length: 4 }).map((_, trackIndex) => (
              <div key={trackIndex} className="h-8 flex items-center px-2 border-b border-zinc-800 bg-zinc-900">
                {getTrackIcon(trackIndex)}
                <span className="text-xs text-zinc-300 ml-1">{getTrackName(trackIndex)}</span>
              </div>
            ))}
          </div>

          {/* タイムラインエリア */}
          <div ref={timelineRef} className="flex-1 relative bg-zinc-950" onClick={handleTimelineClick}>
            {/* 時間マーカー */}
            <div className="h-6 border-b border-zinc-800 flex">
              {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-zinc-800 text-xs text-zinc-500 pl-1">
                  {i * 10}s
                </div>
              ))}
            </div>

            {/* トラック */}
            {Array.from({ length: 4 }).map((_, trackIndex) => (
              <div key={trackIndex} className="h-8 border-b border-zinc-800 relative">
                {clips
                  .filter(clip => clip.track === trackIndex)
                  .map(clip => (
                    <div
                      key={clip.id}
                      className={`absolute top-1 h-6 border rounded-sm cursor-pointer transition-all ${
                        selectedClip === clip.id ? 'ring-2 ring-emerald-400' : ''
                      } ${clip.color}/20 border-current`}
                      style={{
                        left: `${(clip.startTime / duration) * 100}%`,
                        width: `${((clip.endTime - clip.startTime) / duration) * 100}%`
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedClip(clip.id)
                      }}
                    >
                      <div className="text-xs p-1 truncate text-current">
                        {clip.name}
                      </div>
                    </div>
                  ))}
              </div>
            ))}

            {/* 再生ヘッド */}
            <div
              className="absolute top-0 bottom-0 w-px bg-emerald-500 z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="w-3 h-3 bg-emerald-500 rounded-full -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 選択されたクリップの詳細 */}
      {selectedClip && (
        <div className="p-2 border-t border-zinc-800 bg-zinc-900">
          <Card className="p-3 bg-zinc-800 border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getClipIcon(clips.find(c => c.id === selectedClip)?.type || 'video')}
                <span className="text-sm font-medium text-zinc-100">
                  {clips.find(c => c.id === selectedClip)?.name}
                </span>
                <Badge variant="secondary" className="text-xs bg-zinc-700 text-zinc-300">
                  {clips.find(c => c.id === selectedClip)?.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-zinc-300">
                  <Scissors className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-zinc-300">
                  <MoveVertical className="h-3 w-3" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 text-red-400 hover:text-red-300"
                  onClick={() => deleteClip(selectedClip)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              {formatTime(clips.find(c => c.id === selectedClip)?.startTime || 0)} - {formatTime(clips.find(c => c.id === selectedClip)?.endTime || 0)}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
