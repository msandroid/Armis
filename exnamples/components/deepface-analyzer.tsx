'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  Upload, 
  Camera, 
  Eye, 
  Users, 
  Database, 
  Activity,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { useToast } from './ui/use-toast'
import Image from 'next/image'

interface FaceAnalysisResult {
  region: {
    x: number
    y: number
    w: number
    h: number
  }
  age?: number
  gender?: {
    Woman: number
    Man: number
  }
  dominant_gender?: 'Woman' | 'Man'
  emotion?: {
    angry: number
    disgust: number
    fear: number
    happy: number
    sad: number
    surprise: number
    neutral: number
  }
  dominant_emotion?: string
  race?: {
    asian: number
    indian: number
    black: number
    white: number
    middle_eastern: number
    latino_hispanic: number
  }
  dominant_race?: string
  face_confidence?: number
}

interface VerificationResult {
  verified: boolean
  distance: number
  threshold: number
  model: string
  detector_backend: string
  similarity_metric: string
  processing_time: number
}

export function DeepFaceAnalyzer() {
  const [activeTab, setActiveTab] = useState('analyze')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImage2, setSelectedImage2] = useState<string | null>(null)
  const [analysisActions, setAnalysisActions] = useState(['age', 'gender', 'emotion', 'race'])
  const [detectionModel, setDetectionModel] = useState('retinaface')
  const [recognitionModel, setRecognitionModel] = useState('ArcFace')
  const [distanceMetric, setDistanceMetric] = useState('cosine')
  const [threshold, setThreshold] = useState(0.68)
  const [enforceDetection, setEnforceDetection] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef2 = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageUpload = useCallback((file: File, imageNumber: 1 | 2 = 1) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (imageNumber === 1) {
        setSelectedImage(result)
      } else {
        setSelectedImage2(result)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2 = 1) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, imageNumber)
    }
  }

  const analyzeFaces = async () => {
    if (!selectedImage) {
      toast({
        title: "エラー",
        description: "画像を選択してください",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const formData = new FormData()
      
      // Base64データをBlobに変換
      const response = await fetch(selectedImage)
      const blob = await response.blob()
      formData.append('image', blob, 'image.jpg')
      formData.append('actions', analysisActions.join(','))
      formData.append('detection_model', detectionModel)
      formData.append('enforce_detection', enforceDetection.toString())

      const apiResponse = await fetch('/api/deepface?action=analyze', {
        method: 'POST',
        body: formData
      })

      const data = await apiResponse.json()

      if (data.status === 'success') {
        setResults(data)
        toast({
          title: "分析完了",
          description: `${data.faces?.length || 0}個の顔を検出しました`,
        })
      } else {
        throw new Error(data.message || '分析に失敗しました')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : '分析に失敗しました',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyFaces = async () => {
    if (!selectedImage || !selectedImage2) {
      toast({
        title: "エラー",
        description: "2つの画像を選択してください",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const formData = new FormData()
      
      // 両方の画像をBlobに変換
      const response1 = await fetch(selectedImage)
      const blob1 = await response1.blob()
      const response2 = await fetch(selectedImage2)
      const blob2 = await response2.blob()
      
      formData.append('image1', blob1, 'image1.jpg')
      formData.append('image2', blob2, 'image2.jpg')
      formData.append('model_name', recognitionModel)
      formData.append('detector_backend', detectionModel)
      formData.append('distance_metric', distanceMetric)
      formData.append('threshold', threshold.toString())
      formData.append('enforce_detection', enforceDetection.toString())

      const apiResponse = await fetch('/api/deepface?action=verify', {
        method: 'POST',
        body: formData
      })

      const data = await apiResponse.json()

      if (data.status === 'success') {
        setResults(data)
        toast({
          title: "検証完了",
          description: data.verified ? "同一人物です" : "別人です",
        })
      } else {
        throw new Error(data.message || '検証に失敗しました')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : '検証に失敗しました',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const recognizeFaces = async () => {
    if (!selectedImage) {
      toast({
        title: "エラー",
        description: "画像を選択してください",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const formData = new FormData()
      
      const response = await fetch(selectedImage)
      const blob = await response.blob()
      formData.append('image', blob, 'image.jpg')
      formData.append('recognition_model', recognitionModel)
      formData.append('detection_model', detectionModel)
      formData.append('enforce_detection', enforceDetection.toString())

      const apiResponse = await fetch('/api/deepface?action=recognize', {
        method: 'POST',
        body: formData
      })

      const data = await apiResponse.json()

      if (data.status === 'success') {
        setResults(data)
        toast({
          title: "認識完了",
          description: `${data.faces?.length || 0}個の顔を認識しました`,
        })
      } else {
        throw new Error(data.message || '認識に失敗しました')
      }
    } catch (error) {
      console.error('Recognition error:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : '認識に失敗しました',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderAnalysisResults = (faces: FaceAnalysisResult[]) => {
    return (
      <div className="space-y-4">
        {faces.map((face, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">顔 {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">位置</Label>
                  <p className="text-sm text-gray-600">
                    x: {face.region.x}, y: {face.region.y}, 
                    w: {face.region.w}, h: {face.region.h}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">信頼度</Label>
                  <p className="text-sm text-gray-600">
                    {((face.face_confidence || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {face.age && (
                <div>
                  <Label className="text-sm font-medium">年齢</Label>
                  <p className="text-lg font-semibold">{Math.round(face.age)}歳</p>
                </div>
              )}

              {face.gender && (
                <div>
                  <Label className="text-sm font-medium">性別</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={face.dominant_gender === 'Woman' ? 'default' : 'secondary'}>
                      女性: {(face.gender.Woman * 100).toFixed(1)}%
                    </Badge>
                    <Badge variant={face.dominant_gender === 'Man' ? 'default' : 'secondary'}>
                      男性: {(face.gender.Man * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )}

              {face.emotion && (
                <div>
                  <Label className="text-sm font-medium">感情</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">支配的感情</span>
                      <Badge>{face.dominant_emotion}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(face.emotion).map(([emotion, score]) => (
                        <div key={emotion} className="flex justify-between">
                          <span>{emotion}</span>
                          <span>{(score * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {face.race && (
                <div>
                  <Label className="text-sm font-medium">人種</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">支配的人種</span>
                      <Badge>{face.dominant_race}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(face.race).map(([race, score]) => (
                        <div key={race} className="flex justify-between">
                          <span>{race}</span>
                          <span>{(score * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderVerificationResults = (result: VerificationResult) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.verified ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            検証結果
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">結果</Label>
              <p className={`text-lg font-semibold ${result.verified ? 'text-green-600' : 'text-red-600'}`}>
                {result.verified ? '同一人物' : '別人'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">信頼度</Label>
              <p className="text-lg font-semibold">
                {((1 - result.distance) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">距離</Label>
              <p className="text-sm text-gray-600">{result.distance.toFixed(4)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">閾値</Label>
              <p className="text-sm text-gray-600">{result.threshold}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">モデル</Label>
              <p className="text-sm text-gray-600">{result.model}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">処理時間</Label>
              <p className="text-sm text-gray-600">{result.processing_time.toFixed(2)}秒</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">DeepFace AI分析</h1>
        <p className="text-gray-600">高精度な顔認識・分析・検証システム</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            顔分析
          </TabsTrigger>
          <TabsTrigger value="verify" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            顔検証
          </TabsTrigger>
          <TabsTrigger value="recognize" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            顔認識
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>顔分析設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="detection-model">検出モデル</Label>
                  <Select value={detectionModel} onValueChange={setDetectionModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retinaface">RetinaFace</SelectItem>
                      <SelectItem value="mtcnn">MTCNN</SelectItem>
                      <SelectItem value="opencv">OpenCV</SelectItem>
                      <SelectItem value="ssd">SSD</SelectItem>
                      <SelectItem value="dlib">Dlib</SelectItem>
                      <SelectItem value="mediapipe">MediaPipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="enforce-detection"
                    checked={enforceDetection}
                    onCheckedChange={setEnforceDetection}
                  />
                  <Label htmlFor="enforce-detection">顔検出を強制</Label>
                </div>
              </div>

              <div>
                <Label>分析項目</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['age', 'gender', 'emotion', 'race'].map((action) => (
                    <div key={action} className="flex items-center space-x-2">
                      <Checkbox
                        id={action}
                        checked={analysisActions.includes(action)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAnalysisActions(prev => [...prev, action])
                          } else {
                            setAnalysisActions(prev => prev.filter(a => a !== action))
                          }
                        }}
                      />
                      <Label htmlFor={action}>
                        {action === 'age' && '年齢'}
                        {action === 'gender' && '性別'}
                        {action === 'emotion' && '感情'}
                        {action === 'race' && '人種'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  画像を選択
                </Button>
                <Button 
                  onClick={analyzeFaces} 
                  disabled={isLoading || !selectedImage}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  分析開始
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 1)}
                className="hidden"
              />

              {selectedImage && (
                <div className="mt-4">
                  <Label>選択された画像</Label>
                  <div className="mt-2 border rounded-lg p-4">
                    <Image
                      src={selectedImage}
                      alt="Selected image"
                      width={300}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>顔検証設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recognition-model">認識モデル</Label>
                  <Select value={recognitionModel} onValueChange={setRecognitionModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ArcFace">ArcFace</SelectItem>
                      <SelectItem value="Facenet">Facenet</SelectItem>
                      <SelectItem value="Facenet512">Facenet512</SelectItem>
                      <SelectItem value="VGG-Face">VGG-Face</SelectItem>
                      <SelectItem value="OpenFace">OpenFace</SelectItem>
                      <SelectItem value="DeepFace">DeepFace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="distance-metric">距離メトリック</Label>
                  <Select value={distanceMetric} onValueChange={setDistanceMetric}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cosine">Cosine</SelectItem>
                      <SelectItem value="euclidean">Euclidean</SelectItem>
                      <SelectItem value="euclidean_l2">Euclidean L2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="threshold">閾値: {threshold}</Label>
                <input
                  id="threshold"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    画像1を選択
                  </Button>
                  {selectedImage && (
                    <div className="mt-2">
                      <Image
                        src={selectedImage}
                        alt="Image 1"
                        width={200}
                        height={150}
                        className="rounded-lg object-cover w-full"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Button
                    onClick={() => fileInputRef2.current?.click()}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    画像2を選択
                  </Button>
                  {selectedImage2 && (
                    <div className="mt-2">
                      <Image
                        src={selectedImage2}
                        alt="Image 2"
                        width={200}
                        height={150}
                        className="rounded-lg object-cover w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={verifyFaces} 
                disabled={isLoading || !selectedImage || !selectedImage2}
                className="w-full flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                検証開始
              </Button>

              <input
                ref={fileInputRef2}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 2)}
                className="hidden"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recognize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>顔認識設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recognition-model-rec">認識モデル</Label>
                  <Select value={recognitionModel} onValueChange={setRecognitionModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ArcFace">ArcFace</SelectItem>
                      <SelectItem value="Facenet">Facenet</SelectItem>
                      <SelectItem value="Facenet512">Facenet512</SelectItem>
                      <SelectItem value="VGG-Face">VGG-Face</SelectItem>
                      <SelectItem value="OpenFace">OpenFace</SelectItem>
                      <SelectItem value="DeepFace">DeepFace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="detection-model-rec">検出モデル</Label>
                  <Select value={detectionModel} onValueChange={setDetectionModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retinaface">RetinaFace</SelectItem>
                      <SelectItem value="mtcnn">MTCNN</SelectItem>
                      <SelectItem value="opencv">OpenCV</SelectItem>
                      <SelectItem value="ssd">SSD</SelectItem>
                      <SelectItem value="dlib">Dlib</SelectItem>
                      <SelectItem value="mediapipe">MediaPipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  画像を選択
                </Button>
                <Button 
                  onClick={recognizeFaces} 
                  disabled={isLoading || !selectedImage}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  認識開始
                </Button>
              </div>

              {selectedImage && (
                <div className="mt-4">
                  <Label>選択された画像</Label>
                  <div className="mt-2 border rounded-lg p-4">
                    <Image
                      src={selectedImage}
                      alt="Selected image"
                      width={300}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 結果表示エリア */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>分析結果</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'analyze' && results.faces && renderAnalysisResults(results.faces)}
            {activeTab === 'verify' && renderVerificationResults(results)}
            {activeTab === 'recognize' && results.faces && (
              <div className="space-y-4">
                <p className="text-lg font-semibold">
                  {results.faces.length}個の顔を認識しました
                </p>
                <div className="space-y-2">
                  {results.faces.map((face: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>位置</Label>
                            <p className="text-sm text-gray-600">
                              x: {face.region.x}, y: {face.region.y}, 
                              w: {face.region.w}, h: {face.region.h}
                            </p>
                          </div>
                          <div>
                            <Label>信頼度</Label>
                            <p className="text-sm text-gray-600">
                              {((face.face_confidence || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        {face.embedding && (
                          <div className="mt-2">
                            <Label>特徴量次元数</Label>
                            <p className="text-sm text-gray-600">
                              {face.embedding.length}次元
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
