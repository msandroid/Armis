import React from 'react'
import { Languages, Copy, Check } from 'lucide-react'

interface TranslationProps {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  confidence: number
}

export const Translation: React.FC<TranslationProps> = ({
  originalText,
  translatedText,
  sourceLanguage,
  targetLanguage,
  confidence
}) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-600 dark:text-green-400'
    if (conf >= 0.7) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.9) return 'High'
    if (conf >= 0.7) return 'Medium'
    return 'Low'
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900 dark:to-blue-900 rounded-lg p-6 shadow-lg border border-indigo-200 dark:border-indigo-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Translation Result
        </h2>
        <Languages className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
      
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Original Text ({sourceLanguage})
          </div>
          <div className="text-gray-800 dark:text-gray-200 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {originalText}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Translated Text ({targetLanguage})
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="text-gray-800 dark:text-gray-200 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
            {translatedText}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Source Language
              </div>
              <div className="text-gray-800 dark:text-gray-200">
                {sourceLanguage}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Target Language
              </div>
              <div className="text-gray-800 dark:text-gray-200">
                {targetLanguage}
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Translation Accuracy
            </div>
            <div className="flex items-center space-x-2">
              <div className={`font-semibold ${getConfidenceColor(confidence)}`}>
                {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    confidence >= 0.9 ? 'bg-green-500' : confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
