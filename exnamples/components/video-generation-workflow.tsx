"use client"

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  ChefHat, 
  Video, 
  FileText, 
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { YouTubeVideoAnalyzer } from './youtube-video-analyzer'
import { MulmocastIntegration } from './mulmocast-integration'
import { cookpadRecipeFetcher, CookpadRecipe } from '@/lib/cookpad-recipe-fetcher'
import { useMulmocastAI } from '@/hooks/use-mulmocast-ai'
import { motion } from "motion/react"
import { JumpingDots } from "@/components/ui/jumping-dots"

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

interface VideoGenerationWorkflowProps {
  onVideoGenerated: (videoData: any) => void
}

export function VideoGenerationWorkflow({ onVideoGenerated }: VideoGenerationWorkflowProps) {
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null)
  const [recipe, setRecipe] = useState<CookpadRecipe | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState<'analyze' | 'recipe' | 'generate' | 'complete'>('analyze')
  const [error, setError] = useState<string | null>(null)

  const {
    isConnected: mulmocastConnected,
    isProcessing: mulmocastProcessing,
    sendToMulmocast,
    generateVideoScript
  } = useMulmocastAI()

  const handleVideoAnalyzed = useCallback((analysis: VideoAnalysis) => {
    setVideoAnalysis(analysis)
    setCurrentStep('recipe')
    setError(null)
  }, [])

  const handleRecipeSelected = useCallback(async (recipeUrl: string) => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const fetchedRecipe = await cookpadRecipeFetcher.fetchRecipe(recipeUrl)
      setRecipe(fetchedRecipe)
      setCurrentStep('generate')
      
      // 動画生成プロンプトを作成
      const videoPrompt = cookpadRecipeFetcher.generateVideoPrompt(fetchedRecipe, videoAnalysis!)
      
      // mulmocastに送信
      await sendToMulmocast(videoPrompt, 'script')
      
      setCurrentStep('complete')
      onVideoGenerated({
        videoAnalysis,
        recipe: fetchedRecipe,
        prompt: videoPrompt
      })
      
    } catch (error) {
      setError('レシピの取得に失敗しました')
      console.error('Recipe fetch error:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [videoAnalysis, sendToMulmocast, onVideoGenerated])

  const getStepIcon = (step: string, isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    if (isActive) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
    }
    
    switch (step) {
      case 'analyze':
        return <Video className="h-5 w-5 text-gray-400" />
      case 'recipe':
        return <ChefHat className="h-5 w-5 text-gray-400" />
      case 'generate':
        return <Sparkles className="h-5 w-5 text-gray-400" />
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Play className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepStatus = (step: string) => {
    const stepOrder = ['analyze', 'recipe', 'generate', 'complete']
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(step)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="space-y-6">
      {/* ワークフロー進捗 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5" />
            <span>動画生成ワークフロー</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {[
              { key: 'analyze', label: '動画分析' },
              { key: 'recipe', label: 'レシピ選択' },
              { key: 'generate', label: '動画生成' },
              { key: 'complete', label: '完了' }
            ].map((step, index) => {
              const status = getStepStatus(step.key)
              const isActive = status === 'active'
              const isCompleted = status === 'completed'
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex items-center space-x-2">
                    {getStepIcon(step.key, isActive, isCompleted)}
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                </div>
              )
            })}
          </div>
          
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ステップ1: YouTube動画分析 */}
      {currentStep === 'analyze' && (
        <YouTubeVideoAnalyzer
          onVideoAnalyzed={handleVideoAnalyzed}
          onRecipeSelected={handleRecipeSelected}
        />
      )}

      {/* ステップ2: レシピ選択 */}
      {currentStep === 'recipe' && videoAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
              <span>レシピ選択</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">参考動画の分析結果</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div><strong>タイトル:</strong> {videoAnalysis.title}</div>
                <div><strong>スタイル:</strong> {videoAnalysis.style}</div>
                <div><strong>ペーシング:</strong> {videoAnalysis.pacing}</div>
                <div><strong>トーン:</strong> {videoAnalysis.tone}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">クックパッドレシピURL</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="https://cookpad.com/jp/recipes/..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRecipeSelected(e.currentTarget.value)
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="cookpad"]') as HTMLInputElement
                    if (input?.value) {
                      handleRecipeSelected(input.value)
                    }
                  }}
                  disabled={isGenerating}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChefHat className="h-4 w-4" />
                  )}
                  レシピ選択
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ステップ3: 動画生成 */}
      {currentStep === 'generate' && recipe && videoAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>動画生成中</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">参考動画</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div><strong>タイトル:</strong> {videoAnalysis.title}</div>
                  <div><strong>スタイル:</strong> {videoAnalysis.style}</div>
                  <div><strong>視覚要素:</strong> {videoAnalysis.visualElements.join(', ')}</div>
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-medium text-orange-900 mb-2">選択レシピ</h3>
                <div className="space-y-1 text-sm text-orange-800">
                  <div><strong>タイトル:</strong> {recipe.title}</div>
                  <div><strong>材料数:</strong> {recipe.ingredients.length}個</div>
                  <div><strong>手順数:</strong> {recipe.steps.length}ステップ</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <JumpingDots size="lg" color="#9333ea" className="mx-auto mb-4" />
                <p className="text-sm text-gray-600">動画を生成中...</p>
                <p className="text-xs text-gray-500 mt-2">mulmocastで動画制作を実行しています</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ステップ4: 完了 */}
      {currentStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>動画生成完了</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">動画生成が完了しました</span>
              </div>
              <p className="text-sm text-green-800">
                参考動画のスタイルを基に、クックパッドレシピの動画が生成されました。
                mulmocastで動画制作プロセスが開始されています。
              </p>
            </div>
            
            {recipe && (
              <div className="space-y-2">
                <h3 className="font-medium">生成された動画の詳細</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>レシピ:</strong> {recipe.title}
                  </div>
                  <div>
                    <strong>材料数:</strong> {recipe.ingredients.length}個
                  </div>
                  <div>
                    <strong>手順数:</strong> {recipe.steps.length}ステップ
                  </div>
                  <div>
                    <strong>調理時間:</strong> {recipe.cookingTime}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mulmocast連携パネル */}
      {mulmocastConnected && (
        <MulmocastIntegration
          aiResponse={videoAnalysis ? JSON.stringify(videoAnalysis, null, 2) : ''}
          onSendToMulmocast={async (content, type) => {
            try {
              await sendToMulmocast(content, type)
            } catch (error) {
              console.error('Failed to send to mulmocast:', error)
              setError('Mulmocastへの送信に失敗しました')
            }
          }}
          onReceiveFromMulmocast={(message) => {
            console.log('Received from mulmocast:', message)
          }}
          isConnected={mulmocastConnected}
        />
      )}
    </div>
  )
} 