'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Download, Play, Trash2, Info, FileVideo, Music } from 'lucide-react'

interface VideoInfo {
  title: string
  description: string
  duration: string
  author: string
  viewCount: string
  uploadDate: string
  thumbnail: string
  formats: any[]
}

interface DownloadResult {
  success: boolean
  filePath?: string
  videoInfo?: VideoInfo
  error?: string
}

export function YouTubeDownloader() {
  const [url, setUrl] = useState('')
  const [quality, setQuality] = useState('highest')
  const [format, setFormat] = useState('mp4')
  const [isLoading, setIsLoading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // 動画情報を取得
  const fetchVideoInfo = async () => {
    if (!url) return

    setIsLoading(true)
    setError(null)
    setVideoInfo(null)

    try {
      const response = await fetch(`/api/youtube/download?action=info&url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (data.success && data.videoDetails) {
        setVideoInfo(data.videoDetails)
      } else {
        setError(data.error || '動画情報の取得に失敗しました')
      }
    } catch (err) {
      setError('動画情報の取得中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 動画をダウンロード
  const downloadVideo = async () => {
    if (!url) return

    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      // プログレスをシミュレート
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch('/api/youtube/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          quality,
          format
        })
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (data.success) {
        setDownloadResult(data)
        setVideoInfo(data.videoInfo)
      } else {
        setError(data.error || 'ダウンロードに失敗しました')
      }
    } catch (err) {
      setError('ダウンロード中にエラーが発生しました')
    } finally {
      setIsLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  // 音声のみをダウンロード
  const downloadAudio = async () => {
    if (!url) return

    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch('/api/youtube/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          quality: 'audioonly',
          format: 'mp3'
        })
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (data.success) {
        setDownloadResult(data)
        setVideoInfo(data.videoInfo)
      } else {
        setError(data.error || '音声ダウンロードに失敗しました')
      }
    } catch (err) {
      setError('音声ダウンロード中にエラーが発生しました')
    } finally {
      setIsLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  // 時間をフォーマット
  const formatDuration = (seconds: string) => {
    const totalSeconds = parseInt(seconds)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            YouTube動画ダウンローダー
          </CardTitle>
          <CardDescription>
            YouTube動画をダウンロードして、エージェントが利用できるようにします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL入力 */}
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              YouTube URL
            </label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={fetchVideoInfo}
                disabled={!url || isLoading}
                variant="outline"
                size="sm"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 動画情報表示 */}
          {videoInfo && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  {videoInfo.thumbnail && (
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="h-20 w-32 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-sm">{videoInfo.title}</h3>
                    <p className="text-xs text-gray-600">{videoInfo.author}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{formatDuration(videoInfo.duration)}</span>
                      <span>•</span>
                      <span>{parseInt(videoInfo.viewCount).toLocaleString()}回視聴</span>
                      <span>•</span>
                      <span>{new Date(videoInfo.uploadDate).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ダウンロードオプション */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">品質</label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highest">最高品質</SelectItem>
                  <SelectItem value="lowest">最低品質</SelectItem>
                  <SelectItem value="audioonly">音声のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">フォーマット</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="mp3">MP3 (音声のみ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ダウンロードボタン */}
          <div className="flex gap-2">
            <Button
              onClick={downloadVideo}
              disabled={!url || isLoading}
              className="flex-1"
            >
              <FileVideo className="h-4 w-4 mr-2" />
              動画をダウンロード
            </Button>
            <Button
              onClick={downloadAudio}
              disabled={!url || isLoading}
              variant="outline"
            >
              <Music className="h-4 w-4 mr-2" />
              音声のみ
            </Button>
          </div>

          {/* プログレスバー */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>ダウンロード中...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ダウンロード結果 */}
          {downloadResult?.success && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Download className="h-4 w-4" />
                  <span className="font-medium">ダウンロード完了！</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  ファイル: {downloadResult.filePath}
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Play className="h-3 w-3 mr-1" />
                    エージェントが利用可能
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
