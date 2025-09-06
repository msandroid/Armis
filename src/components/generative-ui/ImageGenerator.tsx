import React from 'react'
import { Image, Download, ExternalLink, Palette } from 'lucide-react'

interface ImageGeneratorProps {
  prompt: string
  style: string
  size: {
    width: number
    height: number
  }
  imageUrl: string
  generatedAt: string
}

const getStyleLabel = (style: string): string => {
  switch (style) {
    case 'realistic':
      return 'Realistic'
    case 'artistic':
      return 'Artistic'
    case 'cartoon':
      return 'Cartoon'
    case 'abstract':
      return 'Abstract'
    default:
      return style
  }
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  prompt,
  style,
  size,
  imageUrl,
  generatedAt
}) => {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `generated-image-${Date.now()}.jpg`
    link.click()
  }

  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank')
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-lg p-6 shadow-lg border border-purple-200 dark:border-purple-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Generated Image
        </h2>
        <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4">
        <div className="mb-3">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Prompt
          </div>
          <div className="text-gray-800 dark:text-gray-200">
            {prompt}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Style
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              {getStyleLabel(style)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Size
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              {size.width} × {size.height}
            </div>
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Generated At
          </div>
          <div className="text-gray-800 dark:text-gray-200">
            {new Date(generatedAt).toLocaleString('en-US')}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4">
        <div className="relative group">
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full h-auto rounded-lg shadow-md transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://via.placeholder.com/512x512?text=画像生成中...'
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <button
                onClick={handleDownload}
                className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200"
                title="Download"
              >
                <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
        <button
          onClick={handleOpenInNewTab}
          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open in new tab</span>
        </button>
      </div>
    </div>
  )
}
