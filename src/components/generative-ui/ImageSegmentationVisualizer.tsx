import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Download, Layers } from 'lucide-react'

interface SegmentationMask {
  label: string
  box_2d: number[]
  mask: string
}

interface ImageSegmentationVisualizerProps {
  imageUrl: string
  segmentation: SegmentationMask[]
  className?: string
}

export function ImageSegmentationVisualizer({ 
  imageUrl, 
  segmentation, 
  className = '' 
}: ImageSegmentationVisualizerProps) {
  const [visibleMasks, setVisibleMasks] = useState<Set<number>>(new Set(segmentation.map((_, i) => i)))
  const [selectedMask, setSelectedMask] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // 固定色パレット
  const colors = [
    'rgba(255, 0, 0, 0.6)',    // 赤
    'rgba(0, 255, 0, 0.6)',    // 緑
    'rgba(0, 0, 255, 0.6)',    // 青
    'rgba(255, 255, 0, 0.6)',  // 黄
    'rgba(255, 0, 255, 0.6)',  // マゼンタ
    'rgba(0, 255, 255, 0.6)',  // シアン
    'rgba(255, 128, 0, 0.6)',  // オレンジ
    'rgba(128, 0, 255, 0.6)',  // 紫
  ]

  // マスクの表示/非表示を切り替え
  const toggleMaskVisibility = (index: number) => {
    const newVisibleMasks = new Set(visibleMasks)
    if (newVisibleMasks.has(index)) {
      newVisibleMasks.delete(index)
    } else {
      newVisibleMasks.add(index)
    }
    setVisibleMasks(newVisibleMasks)
  }

  // すべてのマスクを表示/非表示
  const toggleAllMasks = () => {
    if (visibleMasks.size === segmentation.length) {
      setVisibleMasks(new Set())
    } else {
      setVisibleMasks(new Set(segmentation.map((_, i) => i)))
    }
  }

  // セグメンテーションマスクを描画
  useEffect(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !image.complete) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // キャンバスサイズを画像に合わせる
    canvas.width = image.width
    canvas.height = image.height

    // 背景画像を描画
    ctx.drawImage(image, 0, 0)

    // セグメンテーションマスクを描画
    segmentation.forEach((seg, index) => {
      if (!visibleMasks.has(index)) return

      const { box_2d, mask } = seg
      const [y0, x0, y1, x1] = box_2d.map(coord => coord / 1000) // 正規化座標から実座標へ

      // マスク画像を作成
      const maskImg = new Image()
      maskImg.onload = () => {
        // 一時キャンバスでマスクを処理
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) return

        tempCanvas.width = maskImg.width
        tempCanvas.height = maskImg.height

        // マスク画像を描画
        tempCtx.drawImage(maskImg, 0, 0)

        // マスクデータを取得
        const imageData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)
        const data = imageData.data

        // マスクの位置とサイズを計算
        const maskX = x0 * image.width
        const maskY = y0 * image.height
        const maskWidth = (x1 - x0) * image.width
        const maskHeight = (y1 - y0) * image.height

        // 色付きマスクを描画
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'

        // カラーオーバーレイを作成
        const overlayCanvas = document.createElement('canvas')
        const overlayCtx = overlayCanvas.getContext('2d')
        if (!overlayCtx) return

        overlayCanvas.width = maskImg.width
        overlayCanvas.height = maskImg.height

        // 透明度に基づいてカラーマスクを作成
        const overlayData = overlayCtx.createImageData(maskImg.width, maskImg.height)
        const color = colors[index % colors.length]
        const [r, g, b] = color.match(/\d+/g)?.map(Number) || [255, 0, 0]

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] // アルファチャンネル
          if (alpha > 128) { // 閾値を超える場合はマスク領域
            overlayData.data[i] = r     // 赤
            overlayData.data[i + 1] = g // 緑
            overlayData.data[i + 2] = b // 青
            overlayData.data[i + 3] = 150 // アルファ
          } else {
            overlayData.data[i + 3] = 0 // 透明
          }
        }

        overlayCtx.putImageData(overlayData, 0, 0)

        // メインキャンバスに描画
        ctx.drawImage(overlayCanvas, maskX, maskY, maskWidth, maskHeight)

        // 選択されたマスクにはボーダーを描画
        if (selectedMask === index) {
          ctx.strokeStyle = color.replace('0.6', '1.0')
          ctx.lineWidth = 3
          ctx.strokeRect(maskX, maskY, maskWidth, maskHeight)
        }

        ctx.restore()
      }
      maskImg.src = mask
    })
  }, [segmentation, visibleMasks, selectedMask, imageUrl])

  // キャンバスの画像をダウンロード
  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'segmentation_result.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* コントロールパネル */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleAllMasks}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>{visibleMasks.size === segmentation.length ? 'すべて非表示' : 'すべて表示'}</span>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {visibleMasks.size} / {segmentation.length} マスクを表示中
          </span>
        </div>
        <button
          onClick={downloadImage}
          className="flex items-center space-x-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>画像をダウンロード</span>
        </button>
      </div>

      {/* セグメンテーション表示エリア */}
      <div className="relative">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="セグメンテーション対象画像"
          className="w-full h-auto rounded-lg"
          style={{ display: 'none' }}
          onLoad={() => {
            // 画像読み込み完了後にキャンバスを更新
            const event = new Event('imageLoaded')
            window.dispatchEvent(event)
          }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
          style={{ maxHeight: '500px', objectFit: 'contain' }}
        />
      </div>

      {/* マスクリスト */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-800 dark:text-gray-200">
          セグメンテーションマスク
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {segmentation.map((seg, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedMask === index
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedMask(selectedMask === index ? null : index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {seg.label}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMaskVisibility(index)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title={visibleMasks.has(index) ? 'マスクを非表示' : 'マスクを表示'}
                >
                  {visibleMasks.has(index) ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                位置: [{seg.box_2d.join(', ')}]
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
