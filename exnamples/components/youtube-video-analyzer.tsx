"use client"

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Youtube, 
  Play, 
  Clock, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  Download,
  Copy,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface VideoAnalysis {
  title: string
  description: string
  duration: string
  views: string
  likes: string
  comments: string
  category: string
  tags: string[]
  style: 'educational' | 'entertainment' | 'tutorial' | 'review' | 'lifestyle'
  targetAudience: string
  visualElements: string[]
  audioElements: string[]
  pacing: 'slow' | 'medium' | 'fast'
  tone: 'formal' | 'casual' | 'enthusiastic' | 'calm'
}

interface YouTubeVideoAnalyzerProps {
  onVideoAnalyzed: (analysis: VideoAnalysis) => void
  onRecipeSelected: (recipeUrl: string) => void
}

export function YouTubeVideoAnalyzer({ onVideoAnalyzed, onRecipeSelected }: YouTubeVideoAnalyzerProps) {
  const [videoUrl, setVideoUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recipeUrl, setRecipeUrl] = useState('')

  const extractVideoId = useCallback((url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }, [])

  const analyzeVideo = useCallback(async (url: string) => {
    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('有効なYouTube動画URLを入力してください')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // 実際のYouTube APIを使用する場合は、ここでAPIキーを使用
      // 現在はモックデータを使用
      const mockAnalysis: VideoAnalysis = {
        title: '絶品餃子の作り方 - 簡単で美味しい手作り餃子レシピ',
        description: '家庭で簡単に作れる絶品餃子のレシピを紹介します。材料の選び方から包み方、焼き方まで詳しく解説します。',
        duration: '8:45',
        views: '125,000',
        likes: '2,340',
        comments: '156',
        category: '料理・レシピ',
        tags: ['餃子', 'レシピ', '料理', '手作り', '簡単'],
        style: 'tutorial',
        targetAudience: '料理初心者〜中級者',
        visualElements: ['材料の紹介', '手順の詳細', '完成品の紹介', 'テロップ'],
        audioElements: ['BGM', 'ナレーション', '効果音'],
        pacing: 'medium',
        tone: 'casual'
      }

      setAnalysis(mockAnalysis)
      onVideoAnalyzed(mockAnalysis)
    } catch (error) {
      setError('動画の分析に失敗しました')
      console.error('Video analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [extractVideoId, onVideoAnalyzed])

  const handleAnalyze = useCallback(() => {
    if (!videoUrl.trim()) {
      setError('YouTube動画URLを入力してください')
      return
    }
    analyzeVideo(videoUrl)
  }, [videoUrl, analyzeVideo])

  const handleRecipeSubmit = useCallback(() => {
    if (!recipeUrl.trim()) {
      setError('クックパッドのレシピURLを入力してください')
      return
    }
    onRecipeSelected(recipeUrl)
  }, [recipeUrl, onRecipeSelected])

  const getStyleIcon = (style: VideoAnalysis['style']) => {
    switch (style) {
      case 'educational':
        return <MessageSquare className="h-4 w-4" />
      case 'entertainment':
        return <Play className="h-4 w-4" />
      case 'tutorial':
        return <Download className="h-4 w-4" />
      case 'review':
        return <Eye className="h-4 w-4" />
      case 'lifestyle':
        return <ThumbsUp className="h-4 w-4" />
      default:
        return <Play className="h-4 w-4" />
    }
  }

  const getPacingColor = (pacing: VideoAnalysis['pacing']) => {
    switch (pacing) {
      case 'slow':
        return 'bg-blue-100 text-blue-800'
      case 'medium':
        return 'bg-green-100 text-green-800'
      case 'fast':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* YouTube動画URL入力 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Youtube className="h-5 w-5 text-red-600" />
            <span>YouTube動画分析</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">YouTube動画URL</label>
            <div className="flex space-x-2">
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1"
                disabled={isAnalyzing}
              />
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !videoUrl.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                分析
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分析結果 */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>動画分析結果</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-lg">{analysis.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{analysis.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{analysis.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{analysis.views}回視聴</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{analysis.likes}いいね</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{analysis.comments}コメント</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStyleIcon(analysis.style)}
                  <span className="text-sm font-medium">スタイル: {analysis.style}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">対象: {analysis.targetAudience}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPacingColor(analysis.pacing)}>
                    ペーシング: {analysis.pacing}
                  </Badge>
                  <Badge variant="outline">
                    トーン: {analysis.tone}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">タグ</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">視覚要素</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.visualElements.map((element, index) => (
                      <li key={index}>• {element}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">音声要素</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.audioElements.map((element, index) => (
                      <li key={index}>• {element}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* クックパッドレシピURL入力 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5 text-orange-600" />
            <span>クックパッドレシピ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">クックパッドレシピURL</label>
            <div className="flex space-x-2">
              <Input
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
                placeholder="https://cookpad.com/jp/recipes/..."
                className="flex-1"
              />
              <Button
                onClick={handleRecipeSubmit}
                disabled={!recipeUrl.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                レシピ選択
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 