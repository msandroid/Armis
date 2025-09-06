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

  // Fixed color palette
  const colors = [
    'rgba(255, 0, 0, 0.6)',    // Red
    'rgba(0, 255, 0, 0.6)',    // Green
    'rgba(0, 0, 255, 0.6)',    // Blue
    'rgba(255, 255, 0, 0.6)',  // Yellow
    'rgba(255, 0, 255, 0.6)',  // Magenta
    'rgba(0, 255, 255, 0.6)',  // Cyan
    'rgba(255, 128, 0, 0.6)',  // Orange
    'rgba(128, 0, 255, 0.6)',  // Purple
  ]

  // Toggle mask visibility
  const toggleMaskVisibility = (index: number) => {
    const newVisibleMasks = new Set(visibleMasks)
    if (newVisibleMasks.has(index)) {
      newVisibleMasks.delete(index)
    } else {
      newVisibleMasks.add(index)
    }
    setVisibleMasks(newVisibleMasks)
  }

  // Show/hide all masks
  const toggleAllMasks = () => {
    if (visibleMasks.size === segmentation.length) {
      setVisibleMasks(new Set())
    } else {
      setVisibleMasks(new Set(segmentation.map((_, i) => i)))
    }
  }

  // Draw segmentation masks
  useEffect(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !image.complete) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match image
    canvas.width = image.width
    canvas.height = image.height

    // Draw background image
    ctx.drawImage(image, 0, 0)

    // Draw segmentation masks
    segmentation.forEach((seg, index) => {
      if (!visibleMasks.has(index)) return

      const { box_2d, mask } = seg
      const [y0, x0, y1, x1] = box_2d.map(coord => coord / 1000) // Convert normalized coordinates to actual coordinates

      // Create mask image
      const maskImg = new Image()
      maskImg.onload = () => {
        // Process mask in temporary canvas
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) return

        tempCanvas.width = maskImg.width
        tempCanvas.height = maskImg.height

        // Draw mask image
        tempCtx.drawImage(maskImg, 0, 0)

        // Get mask data
        const imageData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)
        const data = imageData.data

        // Calculate mask position and size
        const maskX = x0 * image.width
        const maskY = y0 * image.height
        const maskWidth = (x1 - x0) * image.width
        const maskHeight = (y1 - y0) * image.height

        // Draw colored mask
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'

        // Create color overlay
        const overlayCanvas = document.createElement('canvas')
        const overlayCtx = overlayCanvas.getContext('2d')
        if (!overlayCtx) return

        overlayCanvas.width = maskImg.width
        overlayCanvas.height = maskImg.height

        // Create color mask based on transparency
        const overlayData = overlayCtx.createImageData(maskImg.width, maskImg.height)
        const color = colors[index % colors.length]
        const [r, g, b] = color.match(/\d+/g)?.map(Number) || [255, 0, 0]

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] // Alpha channel
          if (alpha > 128) { // If threshold is exceeded, it's a mask area
            overlayData.data[i] = r     // Red
            overlayData.data[i + 1] = g // Green
            overlayData.data[i + 2] = b // Blue
            overlayData.data[i + 3] = 150 // Alpha
          } else {
            overlayData.data[i + 3] = 0 // Transparent
          }
        }

        overlayCtx.putImageData(overlayData, 0, 0)

        // Draw on main canvas
        ctx.drawImage(overlayCanvas, maskX, maskY, maskWidth, maskHeight)

        // Draw border for selected mask
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

  // Download canvas image
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
      {/* Control Panel */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleAllMasks}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>{visibleMasks.size === segmentation.length ? 'Hide All' : 'Show All'}</span>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {visibleMasks.size} / {segmentation.length} masks displayed
          </span>
        </div>
        <button
          onClick={downloadImage}
          className="flex items-center space-x-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Image</span>
        </button>
      </div>

      {/* Segmentation Display Area */}
      <div className="relative">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Segmentation target image"
          className="w-full h-auto rounded-lg"
          style={{ display: 'none' }}
          onLoad={() => {
            // Update canvas after image loading is complete
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

      {/* Mask List */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-800 dark:text-gray-200">
          Segmentation Masks
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
                  title={visibleMasks.has(index) ? 'Hide mask' : 'Show mask'}
                >
                  {visibleMasks.has(index) ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Position: [{seg.box_2d.join(', ')}]
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
