import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Loader2, AlertCircle } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  className?: string
  onRemove?: () => void
  showRemoveButton?: boolean
  poster?: string
  subtitles?: Array<{
    src: string
    label: string
    srcLang: string
    default?: boolean
  }>
}

export function VideoPlayer({ 
  src, 
  className = '', 
  onRemove, 
  showRemoveButton = false,
  poster,
  subtitles = []
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [networkQuality, setNetworkQuality] = useState<'good' | 'poor' | 'unknown'>('unknown')

  // ネットワーク品質の監視
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const bufferedPercent = (bufferedEnd / duration) * 100
        setBuffered(bufferedPercent)
        
        // ネットワーク品質の判定
        if (bufferedPercent < 10) {
          setNetworkQuality('poor')
        } else if (bufferedPercent > 50) {
          setNetworkQuality('good')
        }
      }
    }

    video.addEventListener('progress', handleProgress)
    return () => video.removeEventListener('progress', handleProgress)
  }, [duration])

  // フルスクリーン状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          adjustVolume(0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          adjustVolume(-0.1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = (e: Event) => {
      setIsLoading(false)
      setHasError(true)
      console.error('Video error:', e)
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlayThrough = () => setIsLoading(false)

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplaythrough', handleCanPlayThrough)

    // サムネイル生成
    const generateThumbnail = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            setThumbnail(canvas.toDataURL())
          }
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error)
        }
      }
    }

    video.addEventListener('loadeddata', generateThumbnail)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('loadeddata', generateThumbnail)
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(error => {
          console.error('Failed to play video:', error)
          setHasError(true)
        })
      }
    }
  }, [isPlaying, hasError])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [])

  const adjustVolume = useCallback((delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta))
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [volume])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [])

  const seek = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [currentTime, duration])

  const toggleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen().catch(error => {
          console.error('Failed to enter fullscreen:', error)
        })
      }
    }
  }, [])

  const restart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(error => {
        console.error('Failed to restart video:', error)
      })
    }
  }, [])

  const formatTime = useCallback((time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={`relative bg-gray-800 rounded-lg flex items-center justify-center ${className}`} 
        style={{ minHeight: '200px' }}
        role="alert"
        aria-label="Video loading error"
      >
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <div className="text-lg font-semibold mb-2">Failed to load video</div>
          <div className="text-sm text-gray-400 mb-4">Please check the video file</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
        {showRemoveButton && onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            title="Remove video"
            aria-label="Remove video"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`}
      role="application"
      aria-label="動画プレーヤー"
      tabIndex={0}
    >
      {/* ローディング表示 */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center z-10">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <div className="text-sm">Loading video...</div>
            {networkQuality === 'poor' && (
              <div className="text-xs text-yellow-400 mt-1">
                Unstable network connection
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* サムネイル表示（再生前） */}
      {!isPlaying && (thumbnail || poster) && !isLoading && (
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-lg" 
          style={{ backgroundImage: `url(${poster || thumbnail})` }}
        >
          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              title="Play"
              aria-label="Play"
            >
              <Play className="w-8 h-8 ml-1" />
            </button>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-auto rounded-lg focus:outline-none"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={togglePlay}
        preload="metadata"
        playsInline
        aria-label="動画コンテンツ"
      >
        {subtitles.map((subtitle, index) => (
          <track
            key={index}
            src={subtitle.src}
            kind="subtitles"
            srcLang={subtitle.srcLang}
            label={subtitle.label}
            default={subtitle.default}
          />
        ))}
        Your browser does not support video playback.
      </video>
      
      {/* カスタムコントロール */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        role="toolbar"
        aria-label="Video controls"
      >
        {/* プログレスバー */}
        <div className="mb-2 relative">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer video-slider relative z-10"
            title="Seek position"
            aria-label="Seek position"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #6b7280 ${(currentTime / (duration || 1)) * 100}%, #6b7280 100%)`
            }}
          />
          {/* バッファリング表示 */}
          {buffered > 0 && (
            <div 
              className="absolute top-0 left-0 h-1 bg-gray-400 rounded-lg pointer-events-none"
              style={{ width: `${buffered}%` }}
            />
          )}
        </div>
        
        {/* コントロールボタン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            
            <button
              onClick={restart}
              className="text-white hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
              title="Play from beginning"
              aria-label="Play from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
                title={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer video-slider"
                title="Volume adjustment"
                aria-label="Volume adjustment"
              />
            </div>
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* 削除ボタン */}
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          title="Remove video"
          aria-label="Remove video"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* キーボードショートカットヘルプ */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/70 text-white text-xs p-2 rounded-lg">
          <div>Space: Play/Pause</div>
          <div>←→: Skip 10 seconds</div>
          <div>↑↓: Volume adjustment</div>
          <div>F: Fullscreen</div>
          <div>M: Mute</div>
        </div>
      </div>
    </div>
  )
}
