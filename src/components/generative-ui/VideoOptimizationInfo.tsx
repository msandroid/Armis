import { useState, useEffect } from 'react'
import { Info, AlertTriangle, CheckCircle, Settings, Download } from 'lucide-react'
import { 
  VideoInfo, 
  getVideoInfo, 
  needsOptimization, 
  getOptimizationRecommendations,
  calculateQualityScore,
  formatDuration,
  formatFileSize,
  calculateAspectRatio,
  isSupportedFormat
} from '@/utils/video-utils'

interface VideoOptimizationInfoProps {
  file: File
  onOptimize?: (settings: any) => void
}

export function VideoOptimizationInfo({ file, onOptimize }: VideoOptimizationInfoProps) {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const analyzeVideo = async () => {
      try {
        setLoading(true)
        const info = await getVideoInfo(file)
        setVideoInfo(info)
      } catch (err) {
        setError(err instanceof Error ? err.message : '動画の分析に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    analyzeVideo()
  }, [file])

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-blue-700 dark:text-blue-300">動画を分析中...</span>
        </div>
      </div>
    )
  }

  if (error || !videoInfo) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-300">
            {error || '動画情報の取得に失敗しました'}
          </span>
        </div>
      </div>
    )
  }

  const qualityScore = calculateQualityScore(videoInfo)
  const recommendations = getOptimizationRecommendations(videoInfo)
  const needsOpt = needsOptimization(videoInfo)
  const aspectRatio = calculateAspectRatio(videoInfo.width, videoInfo.height)
  const isSupported = isSupportedFormat(videoInfo.format)

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      {/* 基本情報 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
          <Info className="w-4 h-4 mr-1" />
          Video Information
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>Resolution: {videoInfo.width} × {videoInfo.height}</div>
          <div>Aspect Ratio: {aspectRatio}</div>
          <div>Duration: {formatDuration(videoInfo.duration)}</div>
          <div>File Size: {formatFileSize(videoInfo.size)}</div>
          <div>Format: {videoInfo.format}</div>
          <div>Quality Score: {qualityScore}/100</div>
        </div>
      </div>

      {/* 品質評価 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Quality Evaluation</span>
          <div className="flex items-center space-x-1">
            {qualityScore >= 80 ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : qualityScore >= 60 ? (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs font-medium ${
              qualityScore >= 80 ? 'text-green-600 dark:text-green-400' :
              qualityScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              qualityScore >= 80 ? 'bg-green-500' :
              qualityScore >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${qualityScore}%` }}
          />
        </div>
      </div>

      {/* フォーマット互換性 */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Format Compatibility</span>
          {isSupported ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          isSupported 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {isSupported 
            ? 'This format is playable in browsers' 
            : 'This format may not be playable in some browsers'
          }
        </div>
      </div>

      {/* 最適化推奨事項 */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
            <Settings className="w-4 h-4 mr-1" />
            Optimization Recommendations
          </h3>
          <ul className="space-y-1">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                <AlertTriangle className="w-3 h-3 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" />
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 最適化ボタン */}
      {needsOpt && onOptimize && (
        <div className="pt-2">
          <button
            onClick={() => onOptimize({
              maxWidth: Math.min(videoInfo.width, 1920),
              maxHeight: Math.min(videoInfo.height, 1080),
              quality: 'medium'
            })}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Optimize Video</span>
          </button>
        </div>
      )}

      {/* パフォーマンスヒント */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <div className="font-medium mb-1">Performance Tips:</div>
            <ul className="space-y-1">
              <li>• Large videos are automatically optimized</li>
              <li>• Quality is adjusted based on network conditions</li>
              <li>• You can operate using keyboard shortcuts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
