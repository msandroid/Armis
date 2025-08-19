'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, Upload, Eye, Settings, Info, Zap, Brain, 
  Scissors, Target, Globe, Sparkles, ChevronRight 
} from 'lucide-react'

interface AdvancedVisionInterfaceProps {
  className?: string
}

interface VisionResult {
  success: boolean
  task: string
  results: any[]
  originalImage: string
  annotatedImage?: string
  processingTime: number
  model: string
  confidence?: number
  imageSize: { width: number; height: number }
  error?: string
  customClasses?: string[]
}

export function AdvancedVisionInterface({ className }: AdvancedVisionInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedModelType, setSelectedModelType] = useState<string>('sam')
  const [selectedTask, setSelectedTask] = useState<string>('automatic')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [confidence, setConfidence] = useState([0.25])
  const [iouThreshold, setIouThreshold] = useState([0.45])
  const [maxDetections, setMaxDetections] = useState([300])
  const [returnAnnotatedImage, setReturnAnnotatedImage] = useState(true)
  const [useGpu, setUseGpu] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<VisionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  
  // 高度なパラメータ
  const [customClasses, setCustomClasses] = useState('')
  const [textPrompts, setTextPrompts] = useState('')
  const [pointsForSAM, setPointsForSAM] = useState('')
  const [boxesForSAM, setBoxesForSAM] = useState('')
  const [openVocabulary, setOpenVocabulary] = useState(false)
  const [ensembleMode, setEnsembleMode] = useState(false)
  const [pointsPerSide, setPointsPerSide] = useState([32])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 利用可能なモデル設定
  const modelConfig = {
    sam: {
      name: 'SAM (Segment Anything)',
      icon: Scissors,
      color: 'bg-blue-500',
      models: [
        { value: 'sam_vit_b', label: 'SAM ViT-B (Base)' },
        { value: 'sam_vit_l', label: 'SAM ViT-L (Large)' },
        { value: 'sam_vit_h', label: 'SAM ViT-H (Huge)' },
        { value: 'sam2_hiera_tiny', label: 'SAM2 Hiera Tiny' },
        { value: 'sam2_hiera_small', label: 'SAM2 Hiera Small' },
        { value: 'mobile_sam', label: 'MobileSAM (Mobile)' },
        { value: 'fastsam_s', label: 'FastSAM-S' },
        { value: 'fastsam_x', label: 'FastSAM-X' }
      ],
      tasks: [
        { value: 'automatic', label: '自動セグメンテーション' },
        { value: 'interactive', label: 'インタラクティブ' },
        { value: 'segment', label: '基本セグメンテーション' }
      ],
      description: '高精度セグメンテーション - 任意のオブジェクトを正確に分割'
    },
    yolo_nas: {
      name: 'YOLO-NAS',
      icon: Zap,
      color: 'bg-green-500',
      models: [
        { value: 'yolo_nas_s', label: 'YOLO-NAS Small' },
        { value: 'yolo_nas_m', label: 'YOLO-NAS Medium' },
        { value: 'yolo_nas_l', label: 'YOLO-NAS Large' }
      ],
      tasks: [{ value: 'detect', label: '物体検出' }],
      description: 'Neural Architecture Search最適化 - 高効率物体検出'
    },
    rt_detr: {
      name: 'RT-DETR',
      icon: Brain,
      color: 'bg-purple-500',
      models: [
        { value: 'ultralytics_rtdetr_l', label: 'RT-DETR Large' },
        { value: 'ultralytics_rtdetr_x', label: 'RT-DETR Extra Large' },
        { value: 'rtdetr_r50vd', label: 'RT-DETR ResNet50' },
        { value: 'rtdetr_r101vd', label: 'RT-DETR ResNet101' }
      ],
      tasks: [{ value: 'detect', label: '物体検出' }],
      description: 'リアルタイム検出Transformer - Transformer精度とリアルタイム性能'
    },
    yolo_world: {
      name: 'YOLO-World',
      icon: Globe,
      color: 'bg-orange-500',
      models: [
        { value: 'ultralytics_yolo_world_s', label: 'YOLO-World Small' },
        { value: 'ultralytics_yolo_world_m', label: 'YOLO-World Medium' },
        { value: 'ultralytics_yolo_world_l', label: 'YOLO-World Large' },
        { value: 'ultralytics_yolo_world_x', label: 'YOLO-World Extra Large' }
      ],
      tasks: [{ value: 'detect', label: 'オープンボキャブラリ検出' }],
      description: 'オープンボキャブラリ検出 - カスタムクラスで任意のオブジェクトを検出'
    },
    yoloe: {
      name: 'YOLOE',
      icon: Sparkles,
      color: 'bg-pink-500',
      models: [
        { value: 'yoloe_s', label: 'YOLOE Small' },
        { value: 'yoloe_m', label: 'YOLOE Medium' },
        { value: 'yoloe_l', label: 'YOLOE Large' },
        { value: 'yoloe_x', label: 'YOLOE Extra Large' },
        { value: 'yoloe_s_ov', label: 'YOLOE Small (Open Vocab)' },
        { value: 'yoloe_m_ov', label: 'YOLOE Medium (Open Vocab)' }
      ],
      tasks: [{ value: 'detect', label: '強化検出' }],
      description: 'リアルタイム強化検出 - アンサンブル処理による高精度検出'
    }
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setResult(null)
      setError(null)
    }
  }, [])

  const handleModelTypeChange = useCallback((modelType: string) => {
    setSelectedModelType(modelType)
    const config = modelConfig[modelType as keyof typeof modelConfig]
    setSelectedModel(config.models[0].value)
    setSelectedTask(config.tasks[0].value)
  }, [])

  const handleProcessImage = useCallback(async () => {
    if (!selectedFile) {
      setError('画像ファイルを選択してください')
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      // プログレスバーのアニメーション
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('model_type', selectedModelType)
      formData.append('task', selectedTask)
      formData.append('model', selectedModel)
      formData.append('confidence', confidence[0].toString())
      formData.append('iouThreshold', iouThreshold[0].toString())
      formData.append('maxDetections', maxDetections[0].toString())
      formData.append('returnAnnotatedImage', returnAnnotatedImage.toString())
      formData.append('useGpu', useGpu.toString())
      
      // 高度なパラメータ
      if (customClasses.trim()) {
        formData.append('classes', JSON.stringify(customClasses.split(',').map(c => c.trim())))
      }
      if (textPrompts.trim()) {
        formData.append('text_prompts', JSON.stringify(textPrompts.split(',').map(p => p.trim())))
      }
      if (pointsForSAM.trim() && selectedModelType === 'sam') {
        try {
          const points = JSON.parse(pointsForSAM)
          formData.append('points', JSON.stringify(points))
        } catch (error) {
          console.warn('Invalid points format:', pointsForSAM)
        }
      }
      if (boxesForSAM.trim() && selectedModelType === 'sam') {
        try {
          const boxes = JSON.parse(boxesForSAM)
          formData.append('boxes', JSON.stringify(boxes))
        } catch (error) {
          console.warn('Invalid boxes format:', boxesForSAM)
        }
      }
      
      formData.append('open_vocabulary', openVocabulary.toString())
      formData.append('ensemble_mode', ensembleMode.toString())
      formData.append('points_per_side', pointsPerSide[0].toString())

      const response = await fetch('/api/advanced-vision', {
        method: 'PUT',
        body: formData
      })

      const data = await response.json()

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(data.error || 'APIエラーが発生しました')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [
    selectedFile, selectedModelType, selectedTask, selectedModel, confidence, iouThreshold, 
    maxDetections, returnAnnotatedImage, useGpu, customClasses, textPrompts, 
    pointsForSAM, boxesForSAM, openVocabulary, ensembleMode, pointsPerSide
  ])

  const renderResults = () => {
    if (!result) return null

    const currentConfig = modelConfig[selectedModelType as keyof typeof modelConfig]
    const IconComponent = currentConfig.icon

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{currentConfig.name} 処理結果</h3>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {result.processingTime}ms
          </Badge>
        </div>

        {/* 注釈付き画像 */}
        {result.annotatedImage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                処理済み画像
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={result.annotatedImage} 
                alt="Processed result" 
                className="max-w-full h-auto rounded-lg border"
              />
            </CardContent>
          </Card>
        )}

        {/* 詳細結果 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">処理詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>モデルタイプ</Label>
                  <p className="font-medium">{currentConfig.name}</p>
                </div>
                <div>
                  <Label>モデル</Label>
                  <p className="font-medium">{result.model}</p>
                </div>
                <div>
                  <Label>タスク</Label>
                  <p className="font-medium">{result.task}</p>
                </div>
                <div>
                  <Label>画像サイズ</Label>
                  <p className="font-medium">{result.imageSize.width} × {result.imageSize.height}</p>
                </div>
                {result.confidence && (
                  <div>
                    <Label>信頼度閾値</Label>
                    <p className="font-medium">{result.confidence}</p>
                  </div>
                )}
              </div>

              {/* 結果の詳細表示 */}
              {Array.isArray(result.results) && result.results.length > 0 && (
                <div className="mt-4">
                  <Label className="text-base">
                    {selectedModelType === 'sam' ? 'セグメント' : '検出'} 結果 ({result.results.length}個)
                  </Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {result.results.slice(0, 10).map((item: any, index: number) => (
                      <div key={index} className="p-2 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {item.class || `Segment ${index + 1}`}
                          </span>
                          <Badge variant="outline">
                            {selectedModelType === 'sam' 
                              ? `IoU: ${(item.predicted_iou * 100).toFixed(1)}%`
                              : `${(item.confidence * 100).toFixed(1)}%`
                            }
                          </Badge>
                        </div>
                        {item.bbox && (
                          <p className="text-xs text-muted-foreground mt-1">
                            座標: [{item.bbox.map((n: number) => Math.round(n)).join(', ')}]
                          </p>
                        )}
                        {item.area && (
                          <p className="text-xs text-muted-foreground">
                            面積: {Math.round(item.area)} pixels
                          </p>
                        )}
                      </div>
                    ))}
                    {result.results.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... 他 {result.results.length - 10} 個
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 単一結果（分類など） */}
              {!Array.isArray(result.results) && result.results && (
                <div className="mt-4">
                  <Label className="text-base">分類結果</Label>
                  <div className="mt-2 p-3 border rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg">{result.results.class}</span>
                      <Badge className="text-base">
                        {(result.results.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* カスタムクラス情報 */}
              {result.customClasses && result.customClasses.length > 0 && (
                <div className="mt-4">
                  <Label className="text-base">使用されたカスタムクラス</Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {result.customClasses.map((cls, index) => (
                      <Badge key={index} variant="secondary">{cls}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentConfig = modelConfig[selectedModelType as keyof typeof modelConfig]
  const IconComponent = currentConfig.icon

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            高度なコンピュータビジョンシステム
          </CardTitle>
          <CardDescription>
            SAM、YOLO-NAS、RT-DETR、YOLO-World、YOLOEによる最先端の画像解析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                アップロード
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                設定
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                情報
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {/* ファイルアップロード */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">画像ファイルを選択</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="mt-2"
                  />
                </div>

                {previewUrl && (
                  <div className="space-y-2">
                    <Label>プレビュー</Label>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full h-64 object-contain border rounded-lg"
                    />
                  </div>
                )}

                {/* モデルタイプ選択 */}
                <div className="space-y-4">
                  <Label>モデルタイプ</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(modelConfig).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <div
                          key={key}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedModelType === key 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => handleModelTypeChange(key)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 rounded ${config.color} text-white`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{config.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* モデルとタスク選択 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>タスク</Label>
                    <Select value={selectedTask} onValueChange={setSelectedTask}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentConfig.tasks.map((task) => (
                          <SelectItem key={task.value} value={task.value}>
                            {task.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>モデル</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentConfig.models.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 処理ボタン */}
                <Button 
                  onClick={handleProcessImage} 
                  disabled={!selectedFile || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    <>
                      <IconComponent className="mr-2 h-4 w-4" />
                      画像を処理
                    </>
                  )}
                </Button>

                {/* プログレスバー */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>処理中...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              {/* 基本設定 */}
              <div className="space-y-6">
                {selectedModelType !== 'sam' && (
                  <>
                    <div>
                      <Label>信頼度閾値: {confidence[0]}</Label>
                      <Slider
                        value={confidence}
                        onValueChange={setConfidence}
                        max={1}
                        min={0.01}
                        step={0.01}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>IoU閾値: {iouThreshold[0]}</Label>
                      <Slider
                        value={iouThreshold}
                        onValueChange={setIouThreshold}
                        max={1}
                        min={0.01}
                        step={0.01}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>最大検出数: {maxDetections[0]}</Label>
                      <Slider
                        value={maxDetections}
                        onValueChange={setMaxDetections}
                        max={1000}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}

                {selectedModelType === 'sam' && (
                  <div>
                    <Label>ポイント密度: {pointsPerSide[0]}</Label>
                    <Slider
                      value={pointsPerSide}
                      onValueChange={setPointsPerSide}
                      max={64}
                      min={8}
                      step={8}
                      className="mt-2"
                    />
                  </div>
                )}

                <Separator />

                {/* 高度な設定 */}
                <div className="space-y-4">
                  <h4 className="font-medium">高度な設定</h4>
                  
                  {(selectedModelType === 'yolo_world' || selectedModelType === 'yoloe') && (
                    <>
                      <div>
                        <Label htmlFor="custom-classes">カスタムクラス (カンマ区切り)</Label>
                        <Input
                          id="custom-classes"
                          value={customClasses}
                          onChange={(e) => setCustomClasses(e.target.value)}
                          placeholder="例: car, person, dog, cat"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="text-prompts">テキストプロンプト (カンマ区切り)</Label>
                        <Input
                          id="text-prompts"
                          value={textPrompts}
                          onChange={(e) => setTextPrompts(e.target.value)}
                          placeholder="例: red car, walking person, small dog"
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}

                  {selectedModelType === 'sam' && selectedTask === 'interactive' && (
                    <>
                      <div>
                        <Label htmlFor="points-sam">インタラクティブポイント (JSON形式)</Label>
                        <Textarea
                          id="points-sam"
                          value={pointsForSAM}
                          onChange={(e) => setPointsForSAM(e.target.value)}
                          placeholder='[{"x": 100, "y": 100, "label": 1}]'
                          className="mt-2"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="boxes-sam">バウンディングボックス (JSON形式)</Label>
                        <Textarea
                          id="boxes-sam"
                          value={boxesForSAM}
                          onChange={(e) => setBoxesForSAM(e.target.value)}
                          placeholder='[[100, 100, 200, 200]]'
                          className="mt-2"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="annotated-image"
                      checked={returnAnnotatedImage}
                      onCheckedChange={setReturnAnnotatedImage}
                    />
                    <Label htmlFor="annotated-image">注釈付き画像を生成</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-gpu"
                      checked={useGpu}
                      onCheckedChange={setUseGpu}
                    />
                    <Label htmlFor="use-gpu">GPU推論を使用</Label>
                  </div>

                  {selectedModelType === 'yoloe' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="open-vocabulary"
                          checked={openVocabulary}
                          onCheckedChange={setOpenVocabulary}
                        />
                        <Label htmlFor="open-vocabulary">オープンボキャブラリモード</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="ensemble-mode"
                          checked={ensembleMode}
                          onCheckedChange={setEnsembleMode}
                        />
                        <Label htmlFor="ensemble-mode">アンサンブルモード</Label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-6">
                {/* モデル比較 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">モデル性能比較</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(modelConfig).map(([key, config]) => {
                        const Icon = config.icon
                        return (
                          <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded ${config.color} text-white`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-medium">{config.name}</h4>
                                <p className="text-sm text-muted-foreground">{config.description}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 使用例 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">適用例</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-1">🏥 医療画像解析</h4>
                          <p className="text-sm text-muted-foreground">SAMによる病変部位の精密セグメンテーション</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-1">🚗 自動運転</h4>
                          <p className="text-sm text-muted-foreground">RT-DETRによるリアルタイム物体検出</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-1">🏭 製造業QC</h4>
                          <p className="text-sm text-muted-foreground">YOLO-NASによる高速品質検査</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-1">🛒 小売分析</h4>
                          <p className="text-sm text-muted-foreground">YOLO-Worldによるカスタム商品検出</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-1">🎬 映像制作</h4>
                          <p className="text-sm text-muted-foreground">YOLOEによる高精度オブジェクト追跡</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-1">📱 スマートフォン</h4>
                          <p className="text-sm text-muted-foreground">MobileSAMによるモバイル最適化処理</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* エラー表示 */}
          {error && (
            <Alert className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 結果表示 */}
          {result && (
            <div className="mt-6">
              {renderResults()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
