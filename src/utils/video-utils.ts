/**
 * 動画の最適化とパフォーマンス改善のためのユーティリティ関数
 * Next.jsの動画ガイドに基づいて実装
 */

export interface VideoInfo {
  duration: number
  width: number
  height: number
  size: number
  format: string
  bitrate?: number
  fps?: number
}

export interface VideoOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  maxBitrate?: number
  targetFPS?: number
  quality?: 'low' | 'medium' | 'high'
}

/**
 * 動画ファイルの情報を取得
 */
export async function getVideoInfo(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    
    video.onloadedmetadata = () => {
      const info: VideoInfo = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        format: file.type
      }
      
      URL.revokeObjectURL(url)
      resolve(info)
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('動画ファイルの読み込みに失敗しました'))
    }
    
    video.src = url
  })
}

/**
 * 動画の最適化が必要かどうかを判定
 */
export function needsOptimization(info: VideoInfo, options: VideoOptimizationOptions = {}): boolean {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maxBitrate = 5000000, // 5Mbps
    targetFPS = 30
  } = options

  // 解像度チェック
  if (info.width > maxWidth || info.height > maxHeight) {
    return true
  }

  // ファイルサイズチェック（概算）
  const estimatedBitrate = (info.size * 8) / info.duration
  if (estimatedBitrate > maxBitrate) {
    return true
  }

  // フォーマットチェック
  const supportedFormats = ['video/mp4', 'video/webm', 'video/ogg']
  if (!supportedFormats.includes(info.format)) {
    return true
  }

  return false
}

/**
 * 動画の最適化推奨事項を取得
 */
export function getOptimizationRecommendations(info: VideoInfo): string[] {
  const recommendations: string[] = []

  // 解像度の推奨
  if (info.width > 1920 || info.height > 1080) {
    recommendations.push('解像度を1920x1080以下に下げることを推奨します')
  }

  // ファイルサイズの推奨
  const sizeInMB = info.size / (1024 * 1024)
  if (sizeInMB > 50) {
    recommendations.push('ファイルサイズを50MB以下に圧縮することを推奨します')
  }

  // フォーマットの推奨
  if (info.format !== 'video/mp4') {
    recommendations.push('MP4形式への変換を推奨します（互換性向上）')
  }

  // 長さの推奨
  if (info.duration > 300) { // 5分以上
    recommendations.push('動画の長さを5分以下にすることを推奨します')
  }

  return recommendations
}

/**
 * ネットワーク条件に基づく動画品質の調整
 */
export function getOptimalVideoQuality(networkSpeed: number): 'low' | 'medium' | 'high' {
  if (networkSpeed < 1000000) { // 1Mbps未満
    return 'low'
  } else if (networkSpeed < 5000000) { // 5Mbps未満
    return 'medium'
  } else {
    return 'high'
  }
}

/**
 * 動画の圧縮率を計算
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  return ((originalSize - compressedSize) / originalSize) * 100
}

/**
 * 動画の再生に適したフォーマットかどうかを判定
 */
export function isSupportedFormat(format: string): boolean {
  const supportedFormats = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/3gpp'
  ]
  return supportedFormats.includes(format)
}

/**
 * 動画のアスペクト比を計算
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  const aspectWidth = width / divisor
  const aspectHeight = height / divisor
  
  return `${aspectWidth}:${aspectHeight}`
}

/**
 * 動画の再生時間を人間が読みやすい形式に変換
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 動画の品質スコアを計算
 */
export function calculateQualityScore(info: VideoInfo): number {
  let score = 100

  // 解像度による減点
  if (info.width < 640 || info.height < 480) {
    score -= 20
  } else if (info.width < 1280 || info.height < 720) {
    score -= 10
  }

  // ファイルサイズによる減点
  const sizeInMB = info.size / (1024 * 1024)
  if (sizeInMB > 100) {
    score -= 30
  } else if (sizeInMB > 50) {
    score -= 15
  }

  // フォーマットによる減点
  if (!isSupportedFormat(info.format)) {
    score -= 25
  }

  // 長さによる減点
  if (info.duration > 600) { // 10分以上
    score -= 20
  }

  return Math.max(0, score)
}

/**
 * 動画の最適化設定を生成
 */
export function generateOptimizationSettings(info: VideoInfo, networkQuality: 'low' | 'medium' | 'high'): VideoOptimizationOptions {
  const settings: VideoOptimizationOptions = {
    quality: networkQuality
  }

  // ネットワーク品質に基づく設定
  switch (networkQuality) {
    case 'low':
      settings.maxWidth = 640
      settings.maxHeight = 480
      settings.maxBitrate = 1000000 // 1Mbps
      settings.targetFPS = 24
      break
    case 'medium':
      settings.maxWidth = 1280
      settings.maxHeight = 720
      settings.maxBitrate = 3000000 // 3Mbps
      settings.targetFPS = 30
      break
    case 'high':
      settings.maxWidth = 1920
      settings.maxHeight = 1080
      settings.maxBitrate = 8000000 // 8Mbps
      settings.targetFPS = 60
      break
  }

  return settings
}

/**
 * 動画の読み込み進捗を監視
 */
export function createVideoProgressTracker(
  onProgress: (progress: number) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) {
  let loadedBytes = 0
  let totalBytes = 0

  return {
    setTotalBytes: (bytes: number) => {
      totalBytes = bytes
    },
    addLoadedBytes: (bytes: number) => {
      loadedBytes += bytes
      if (totalBytes > 0) {
        const progress = (loadedBytes / totalBytes) * 100
        onProgress(Math.min(progress, 100))
      }
    },
    complete: () => {
      onProgress(100)
      onComplete()
    },
    error: (error: Error) => {
      onError(error)
    }
  }
}
