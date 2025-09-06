import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Image, Sparkles, Download, Copy, RefreshCw, Settings } from 'lucide-react'
import { GeminiImageService, ImageGenerationRequest, ImageGenerationResponse } from '@/services/llm/gemini-image-service'
import { PromptEnhancementStatus } from './PromptEnhancementStatus'

interface GeminiImageGeneratorProps {
  geminiImageService: GeminiImageService
}

export function GeminiImageGenerator({ geminiImageService }: GeminiImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-preview-image-generation')
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '3:4' | '16:9' | '9:16'>('1:1')
  const [quality, setQuality] = useState<'draft' | 'standard' | 'hd'>('standard')
  const [style, setStyle] = useState<'photorealistic' | 'artistic' | 'cartoon' | 'abstract'>('photorealistic')
  const [safetyFilter, setSafetyFilter] = useState<'block_some' | 'block_most' | 'block_few' | 'block_none'>('block_some')
  const [personGeneration, setPersonGeneration] = useState<'dont_allow' | 'allow_adult' | 'allow_all'>('dont_allow')
  const [imageCount, setImageCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<ImageGenerationResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<Record<string, any>>({})
  const [diagnosticReport, setDiagnosticReport] = useState<string>('')
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  useEffect(() => {
    // 利用可能なモデルを取得
    try {
      const models = geminiImageService.getAvailableModels()
      setAvailableModels(models)
    } catch (error) {
      console.error('Failed to get available models:', error)
    }
  }, [geminiImageService])

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('プロンプトを入力してください')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const request: ImageGenerationRequest = {
        prompt: prompt.trim(),
        model: selectedModel,
        aspectRatio,
        quality,
        style,
        safetyFilter,
        personGeneration
      }

      let response: ImageGenerationResponse

      if (imageCount === 1) {
        response = await geminiImageService.generateImage(request)
      } else {
        response = await geminiImageService.generateMultipleImages(request, imageCount)
      }

      setGeneratedImages(prev => [response, ...prev])
      console.log('画像生成完了:', response)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像生成中にエラーが発生しました'
      setError(errorMessage)
      console.error('画像生成エラー:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${imageData}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyImageToClipboard = async (imageData: string) => {
    try {
      const response = await fetch(`data:image/png;base64,${imageData}`)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])
      console.log('画像をクリップボードにコピーしました')
    } catch (error) {
      console.error('クリップボードへのコピーに失敗:', error)
    }
  }

  const generateDiagnosticReport = async () => {
    try {
      const report = await geminiImageService.generateDiagnosticReport()
      setDiagnosticReport(report)
      setShowDiagnostic(true)
    } catch (error) {
      console.error('診断レポート生成エラー:', error)
      setError('診断レポートの生成に失敗しました')
    }
  }

  const getModelInfo = (modelName: string) => {
    return availableModels[modelName] || null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Gemini Image Generation
            <Badge variant="secondary" className="ml-2">
              Powered by Imagen
            </Badge>
          </CardTitle>
          <CardDescription>
            GoogleのImagenモデルを使用して高品質な画像を生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* プロンプト入力 */}
          <div className="space-y-2">
            <Label htmlFor="prompt">画像生成プロンプト:</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="生成したい画像の詳細な説明を入力してください..."
              rows={3}
            />
          </div>

          {/* 設定オプション */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* モデル選択 */}
            <div className="space-y-2">
              <Label htmlFor="model">モデル:</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableModels).map(([key, model]) => (
                    <SelectItem key={key} value={key}>
                      {model.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getModelInfo(selectedModel) && (
                <p className="text-xs text-muted-foreground">
                  {getModelInfo(selectedModel).description}
                </p>
              )}
            </div>

            {/* アスペクト比 */}
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">アスペクト比:</Label>
              <Select value={aspectRatio} onValueChange={(value: any) => setAspectRatio(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (正方形)</SelectItem>
                  <SelectItem value="4:3">4:3 (横長)</SelectItem>
                  <SelectItem value="3:4">3:4 (縦長)</SelectItem>
                  <SelectItem value="16:9">16:9 (ワイド)</SelectItem>
                  <SelectItem value="9:16">9:16 (ポートレート)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 品質 */}
            <div className="space-y-2">
              <Label htmlFor="quality">品質:</Label>
              <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (高速)</SelectItem>
                  <SelectItem value="standard">Standard (標準)</SelectItem>
                  <SelectItem value="hd">HD (高品質)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* スタイル */}
            <div className="space-y-2">
              <Label htmlFor="style">スタイル:</Label>
              <Select value={style} onValueChange={(value: any) => setStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photorealistic">Photorealistic (写実的)</SelectItem>
                  <SelectItem value="artistic">Artistic (芸術的)</SelectItem>
                  <SelectItem value="cartoon">Cartoon (アニメ風)</SelectItem>
                  <SelectItem value="abstract">Abstract (抽象的)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 安全フィルター */}
            <div className="space-y-2">
              <Label htmlFor="safety-filter">安全フィルター:</Label>
              <Select value={safetyFilter} onValueChange={(value: any) => setSafetyFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block_some">Block Some (一部ブロック)</SelectItem>
                  <SelectItem value="block_most">Block Most (大部分ブロック)</SelectItem>
                  <SelectItem value="block_few">Block Few (少数ブロック)</SelectItem>
                  <SelectItem value="block_none">Block None (ブロックなし)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 人物生成 */}
            <div className="space-y-2">
              <Label htmlFor="person-generation">人物生成:</Label>
              <Select value={personGeneration} onValueChange={(value: any) => setPersonGeneration(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dont_allow">Don't Allow (許可しない)</SelectItem>
                  <SelectItem value="allow_adult">Allow Adult (成人のみ)</SelectItem>
                  <SelectItem value="allow_all">Allow All (すべて許可)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 画像枚数 */}
            <div className="space-y-2">
              <Label htmlFor="image-count">生成枚数:</Label>
              <Select value={imageCount.toString()} onValueChange={(value) => setImageCount(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1枚</SelectItem>
                  <SelectItem value="2">2枚</SelectItem>
                  <SelectItem value="3">3枚</SelectItem>
                  <SelectItem value="4">4枚</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 診断ボタン */}
          <Button
            variant="outline"
            onClick={generateDiagnosticReport}
            className="w-full flex items-center gap-2 mb-2"
          >
            <Settings className="h-4 w-4" />
            診断レポート生成
          </Button>

          {/* 生成ボタン */}
          <Button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                画像を生成
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* プロンプト補完エージェントの状態表示 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            プロンプト補完エージェント
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PromptEnhancementStatus
            isEnabled={geminiImageService.isPromptEnhancementEnabled()}
            isAvailable={true}
            modelName="LangChain Agent"
            features={{
              qualityEvaluation: true,
              styleTransfer: true,
              multiLanguage: true
            }}
            onToggle={(enabled) => {
              geminiImageService.togglePromptEnhancement(enabled)
            }}
          />
        </CardContent>
      </Card>

      {/* 診断レポートの表示 */}
      {showDiagnostic && diagnosticReport && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                診断レポート
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiagnostic(false)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              {diagnosticReport}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 生成された画像の表示 */}
      {generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              生成された画像
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedImages.map((response, responseIndex) => (
                <div key={responseIndex} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">プロンプト: {response.prompt}</h4>
                      <p className="text-sm text-muted-foreground">
                        モデル: {response.model} | 
                        サイズ: {response.metadata.width}x{response.metadata.height} | 
                        品質: {response.metadata.quality} | 
                        スタイル: {response.metadata.style} |
                        生成日時: {new Date(response.metadata.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPrompt(response.prompt)
                        setSelectedModel(response.model)
                        setQuality(response.metadata.quality as any)
                        setStyle(response.metadata.style as any)
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      設定を復元
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {response.images.map((imageData, imageIndex) => (
                      <div key={imageIndex} className="space-y-2">
                        <div className="relative group">
                          <img
                            src={`data:image/png;base64,${imageData}`}
                            alt={`Generated image ${imageIndex + 1}`}
                            className="w-full h-auto rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => downloadImage(imageData, `generated-image-${Date.now()}-${imageIndex + 1}.png`)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => copyImageToClipboard(imageData)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {responseIndex < generatedImages.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
