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
import { Loader2, Upload, Download, Eye, Settings, Info } from 'lucide-react'
import { YOLOAgentResult } from '@/lib/mulmocast/types/agent'

interface YOLODetectionInterfaceProps {
  className?: string
}

interface DetectionResult extends YOLOAgentResult {
  annotatedImage?: string
}

export function YOLODetectionInterface({ className }: YOLODetectionInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTask, setSelectedTask] = useState<'detect' | 'segment' | 'classify' | 'pose'>('detect')
  const [selectedModel, setSelectedModel] = useState('yolo11n')
  const [confidence, setConfidence] = useState([0.25])
  const [iouThreshold, setIouThreshold] = useState([0.45])
  const [maxDetections, setMaxDetections] = useState([300])
  const [returnAnnotatedImage, setReturnAnnotatedImage] = useState(true)
  const [useGpu, setUseGpu] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 利用可能なモデル
  const availableModels = {
    detect: [
      { value: 'yolo11n', label: 'YOLO11 Nano (最軽量)' },
      { value: 'yolo11s', label: 'YOLO11 Small' },
      { value: 'yolo11m', label: 'YOLO11 Medium' },
      { value: 'yolo11l', label: 'YOLO11 Large' },
      { value: 'yolo11x', label: 'YOLO11 XLarge (最高精度)' },
      { value: 'yolov8n', label: 'YOLOv8 Nano' },
      { value: 'yolov8s', label: 'YOLOv8 Small' },
      { value: 'yolov8m', label: 'YOLOv8 Medium' },
      { value: 'yolov10n', label: 'YOLOv10 Nano' },
      { value: 'yolov10s', label: 'YOLOv10 Small' }
    ],
    segment: [
      { value: 'yolo11n-seg', label: 'YOLO11 Nano Segmentation' },
      { value: 'yolo11s-seg', label: 'YOLO11 Small Segmentation' },
      { value: 'yolo11m-seg', label: 'YOLO11 Medium Segmentation' },
      { value: 'yolo11l-seg', label: 'YOLO11 Large Segmentation' },
      { value: 'yolo11x-seg', label: 'YOLO11 XLarge Segmentation' }
    ],
    classify: [
      { value: 'yolo11n-cls', label: 'YOLO11 Nano Classification' },
      { value: 'yolo11s-cls', label: 'YOLO11 Small Classification' },
      { value: 'yolo11m-cls', label: 'YOLO11 Medium Classification' },
      { value: 'yolo11l-cls', label: 'YOLO11 Large Classification' },
      { value: 'yolo11x-cls', label: 'YOLO11 XLarge Classification' }
    ],
    pose: [
      { value: 'yolo11n-pose', label: 'YOLO11 Nano Pose' },
      { value: 'yolo11s-pose', label: 'YOLO11 Small Pose' },
      { value: 'yolo11m-pose', label: 'YOLO11 Medium Pose' },
      { value: 'yolo11l-pose', label: 'YOLO11 Large Pose' },
      { value: 'yolo11x-pose', label: 'YOLO11 XLarge Pose' }
    ]
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

  const handleTaskChange = useCallback((task: string) => {
    setSelectedTask(task as 'detect' | 'segment' | 'classify' | 'pose')
    // タスクが変更されたときにデフォルトモデルを設定
    const defaultModels = {
      detect: 'yolo11n',
      segment: 'yolo11n-seg',
      classify: 'yolo11n-cls',
      pose: 'yolo11n-pose'
    }
    setSelectedModel(defaultModels[task as keyof typeof defaultModels])
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
      }, 200)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('task', selectedTask)
      formData.append('model', selectedModel)
      formData.append('confidence', confidence[0].toString())
      formData.append('iouThreshold', iouThreshold[0].toString())
      formData.append('maxDetections', maxDetections[0].toString())
      formData.append('returnAnnotatedImage', returnAnnotatedImage.toString())
      formData.append('useGpu', useGpu.toString())

      const response = await fetch('/api/yolo', {
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
  }, [selectedFile, selectedTask, selectedModel, confidence, iouThreshold, maxDetections, returnAnnotatedImage, useGpu])

  const renderResults = () => {
    if (!result) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">処理結果</h3>
          <Badge variant="secondary">
            {result.processingTime}ms
          </Badge>
        </div>

        {/* 注釈付き画像 */}
        {result.annotatedImage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">注釈付き画像</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={result.annotatedImage} 
                alt="Annotated result" 
                className="max-w-full h-auto rounded-lg border"
              />
            </CardContent>
          </Card>
        )}

        {/* 検出結果 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">検出詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>タスク</Label>
                  <p className="font-medium">{result.task}</p>
                </div>
                <div>
                  <Label>モデル</Label>
                  <p className="font-medium">{result.model}</p>
                </div>
                <div>
                  <Label>信頼度閾値</Label>
                  <p className="font-medium">{result.confidence}</p>
                </div>
                <div>
                  <Label>画像サイズ</Label>
                  <p className="font-medium">{result.imageSize.width} × {result.imageSize.height}</p>
                </div>
              </div>

              {/* 検出オブジェクト */}
              {Array.isArray(result.results) && result.results.length > 0 && (
                <div className="mt-4">
                  <Label className="text-base">検出されたオブジェクト ({result.results.length}個)</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {result.results.map((item: any, index: number) => (
                      <div key={index} className="p-2 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.class}</span>
                          <Badge variant="outline">
                            {(item.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        {item.bbox && (
                          <p className="text-xs text-muted-foreground mt-1">
                            座標: [{item.bbox.map((n: number) => Math.round(n)).join(', ')}]
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 分類結果 */}
              {result.task === 'classify' && !Array.isArray(result.results) && (
                <div className="mt-4">
                  <Label className="text-base">分類結果</Label>
                  <div className="mt-2 space-y-2">
                    <div className="p-3 border rounded-lg bg-primary/5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-lg">{(result.results as any).class}</span>
                        <Badge className="text-base">
                          {((result.results as any).confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    {(result.results as any).top5 && (
                      <div className="space-y-1">
                        <Label className="text-sm">トップ5予測</Label>
                        {(result.results as any).top5.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm p-2 border rounded">
                            <span>{item.class}</span>
                            <span>{(item.confidence * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            YOLO11 物体検出・認識システム
          </CardTitle>
          <CardDescription>
            最新のYOLO11系モデルを使用した高精度な物体検出、セグメンテーション、分類、ポーズ推定
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

                {/* タスク選択 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>タスク</Label>
                    <Select value={selectedTask} onValueChange={handleTaskChange}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="detect">物体検出</SelectItem>
                        <SelectItem value="segment">セグメンテーション</SelectItem>
                        <SelectItem value="classify">分類</SelectItem>
                        <SelectItem value="pose">ポーズ推定</SelectItem>
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
                        {availableModels[selectedTask].map((model) => (
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
                      <Eye className="mr-2 h-4 w-4" />
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
              {/* 詳細設定 */}
              <div className="space-y-6">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    この値より高い信頼度の検出結果のみ表示されます
                  </p>
                </div>

                {selectedTask !== 'classify' && (
                  <>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        重複検出の除去に使用されるIoU閾値
                      </p>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        1つの画像で検出するオブジェクトの最大数
                      </p>
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
                  <Label htmlFor="use-gpu">GPU推論を使用（CUDA必須）</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">サポートされているタスク</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid gap-3">
                      <div>
                        <Badge className="mb-2">物体検出</Badge>
                        <p className="text-sm text-muted-foreground">
                          画像内のオブジェクトを検出し、バウンディングボックスで囲みます
                        </p>
                      </div>
                      <div>
                        <Badge className="mb-2">セグメンテーション</Badge>
                        <p className="text-sm text-muted-foreground">
                          オブジェクトの正確な輪郭をピクセル単位で検出します
                        </p>
                      </div>
                      <div>
                        <Badge className="mb-2">分類</Badge>
                        <p className="text-sm text-muted-foreground">
                          画像全体を事前定義されたクラスに分類します
                        </p>
                      </div>
                      <div>
                        <Badge className="mb-2">ポーズ推定</Badge>
                        <p className="text-sm text-muted-foreground">
                          人物の関節点とスケルトンを検出します
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">モデル情報</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>YOLO11:</strong> 最新のYOLOシリーズ。最高の精度と速度バランス</p>
                      <p><strong>YOLOv8:</strong> 安定した性能の汎用モデル</p>
                      <p><strong>YOLOv10:</strong> NMS-freeアーキテクチャによる高速推論</p>
                      <p className="text-muted-foreground mt-3">
                        ※ n=Nano（軽量）、s=Small、m=Medium、l=Large、x=Extra Large（高精度）
                      </p>
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
