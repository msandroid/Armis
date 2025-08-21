import { useState, useCallback } from 'react'
import { Image as ImageIcon, Loader2, X, Eye, Download, Search, Layers, Tag, MessageSquare, Zap } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { GoogleDirectService, ImageAnalysisResponse } from '@/services/llm/google-direct-service'
import { ImageSegmentationVisualizer } from './ImageSegmentationVisualizer'

interface ImageAnalyzerProps {
  googleService: GoogleDirectService
}

type AnalysisMode = 'general' | 'caption' | 'objects' | 'classification' | 'qa' | 'segmentation'

export function ImageAnalyzer({ googleService }: ImageAnalyzerProps) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ImageAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('general')
  const [customQuestion, setCustomQuestion] = useState('')
  const [captionStyle, setCaptionStyle] = useState<'descriptive' | 'concise' | 'creative'>('descriptive')
  const [targetObjects, setTargetObjects] = useState('')
  const [categories, setCategories] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      console.log('=== 画像ファイルドロップ ===')
      console.log('ファイル名:', file.name)
      console.log('ファイルサイズ:', file.size, 'bytes')
      console.log('MIMEタイプ:', file.type)

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const base64Data = result.split(',')[1]
        setImageData(base64Data)
        console.log('Base64データ長:', base64Data.length)
      }
      reader.readAsDataURL(file)
      
      // リセット
      setAnalysis(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif']
    },
    multiple: false
  })

  const analyzeImage = async () => {
    if (!imageData || !imageFile) return

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      console.log('=== 画像分析開始 ===')
      console.log('分析モード:', analysisMode)
      
      let response: ImageAnalysisResponse

      switch (analysisMode) {
        case 'general':
          response = await googleService.analyzeImage(
            imageData,
            "この画像について詳しく分析してください。内容、オブジェクト、色、構成、雰囲気などを含めて説明してください。",
            imageFile.type
          )
          break
          
        case 'caption':
          response = await googleService.generateImageCaption(
            imageData,
            captionStyle,
            imageFile.type
          )
          break
          
        case 'objects':
          const objectList = targetObjects ? targetObjects.split(',').map(s => s.trim()) : undefined
          response = await googleService.detectObjectsInImage(
            imageData,
            imageFile.type,
            objectList
          )
          break
          
        case 'classification':
          const categoryList = categories ? categories.split(',').map(s => s.trim()) : undefined
          response = await googleService.classifyImage(
            imageData,
            categoryList,
            imageFile.type
          )
          break
          
        case 'qa':
          if (!customQuestion.trim()) {
            throw new Error('質問を入力してください')
          }
          response = await googleService.answerVisualQuestion(
            imageData,
            customQuestion,
            imageFile.type
          )
          break
          
        case 'segmentation':
          const segmentObjects = targetObjects ? targetObjects.split(',').map(s => s.trim()) : ['主要なオブジェクト']
          response = await googleService.segmentImage(
            imageData,
            segmentObjects,
            imageFile.type
          )
          break
          
        default:
          throw new Error('不明な分析モードです')
      }

      console.log('画像分析レスポンス:', response)
      setAnalysis(response)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像分析でエラーが発生しました'
      setError(errorMessage)
      console.error('画像分析エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearImage = () => {
    setImageData(null)
    setImageFile(null)
    setAnalysis(null)
    setError(null)
  }

  const analysisOptions = [
    { mode: 'general' as AnalysisMode, icon: Eye, label: '総合分析', description: '画像の包括的な分析' },
    { mode: 'caption' as AnalysisMode, icon: MessageSquare, label: 'キャプション生成', description: '画像の説明文を生成' },
    { mode: 'objects' as AnalysisMode, icon: Search, label: 'オブジェクト検出', description: 'オブジェクトと位置を検出' },
    { mode: 'classification' as AnalysisMode, icon: Tag, label: '画像分類', description: '画像をカテゴリに分類' },
    { mode: 'qa' as AnalysisMode, icon: MessageSquare, label: '質問応答', description: '画像について質問' },
    { mode: 'segmentation' as AnalysisMode, icon: Layers, label: 'セグメンテーション', description: 'オブジェクトを分割して抽出' }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          画像理解 (Gemini Vision API)
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          高度な画像分析、オブジェクト検出、セグメンテーション機能
        </p>
      </div>

      {/* 画像アップロード領域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
      >
        <input {...getInputProps()} />
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 dark:text-blue-400">画像をここにドロップしてください...</p>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              画像をドラッグ&ドロップするか、クリックして選択してください
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              対応形式: JPG, PNG, WebP, HEIC, HEIF (最大50MB)
            </p>
          </div>
        )}
      </div>

      {/* 分析モード選択 */}
      {imageData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            分析モードを選択
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {analysisOptions.map(({ mode, icon: Icon, label, description }) => (
              <button
                key={mode}
                onClick={() => setAnalysisMode(mode)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  analysisMode === mode
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className={`w-5 h-5 ${analysisMode === mode ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${analysisMode === mode ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'}`}>
                    {label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              </button>
            ))}
          </div>

          {/* モード別の設定 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {analysisMode === 'caption' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  キャプションスタイル
                </label>
                <select
                  value={captionStyle}
                  onChange={(e) => setCaptionStyle(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                  title="キャプションスタイル選択"
                >
                  <option value="descriptive">詳細（色、形、配置など詳しく）</option>
                  <option value="concise">簡潔（重要な要素のみ）</option>
                  <option value="creative">創造的（物語性のある表現）</option>
                </select>
              </div>
            )}

            {(analysisMode === 'objects' || analysisMode === 'segmentation') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  対象オブジェクト（カンマ区切り、空白で全オブジェクト）
                </label>
                <input
                  type="text"
                  value={targetObjects}
                  onChange={(e) => setTargetObjects(e.target.value)}
                  placeholder="例: 人, 車, 猫, テーブル"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
            )}

            {analysisMode === 'classification' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  分類カテゴリ（カンマ区切り、空白で自動分類）
                </label>
                <input
                  type="text"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="例: 動物, 風景, 人物, 建物"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
            )}

            {analysisMode === 'qa' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  質問を入力してください
                </label>
                <textarea
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="例: この画像に写っている人は何をしていますか？"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* アップロードされた画像のプレビュー */}
      {imageData && imageFile && (
        <div className="relative">
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  {imageFile.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(imageFile.size / 1024 / 1024).toFixed(2)} MB • {imageFile.type}
                </p>
              </div>
              <button
                onClick={clearImage}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="画像を削除"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative">
              <img
                src={`data:${imageFile.type};base64,${imageData}`}
                alt="アップロードされた画像"
                className="w-full max-h-64 object-contain rounded-lg bg-white"
              />
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={analyzeImage}
                disabled={loading || (analysisMode === 'qa' && !customQuestion.trim())}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>分析中...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>画像を分析</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="text-sm text-red-800 dark:text-red-200">
            エラー: {error}
          </div>
        </div>
      )}

      {/* 分析結果 */}
      {analysis && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              分析結果
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {analysis.duration}ms • {analysis.tokens} tokens
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(analysis.text)}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                title="結果をコピー"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {analysis.text}
              </div>
            </div>

            {/* オブジェクト検出結果 */}
            {analysis.objects && analysis.objects.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  検出されたオブジェクト
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysis.objects.map((obj, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {obj.label}
                        </span>
                        {obj.confidence && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {obj.confidence}%
                          </span>
                        )}
                      </div>
                      {obj.box_2d && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          位置: [{obj.box_2d.join(', ')}]
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* セグメンテーション結果 */}
            {analysis.segmentation && analysis.segmentation.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
                  セグメンテーション結果
                </h4>
                <ImageSegmentationVisualizer
                  imageUrl={`data:${imageFile?.type};base64,${imageData}`}
                  segmentation={analysis.segmentation}
                  className="mb-4"
                />
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300">
                    セグメント詳細
                  </h5>
                  {analysis.segmentation.map((seg, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {seg.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        バウンディングボックス: [{seg.box_2d.join(', ')}]
                      </div>
                      {seg.mask && (
                        <div className="mt-2">
                          <img
                            src={seg.mask}
                            alt={`${seg.label} マスク`}
                            className="max-w-32 h-auto border rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}