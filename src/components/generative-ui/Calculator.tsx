import React from 'react'
import { Calculator as CalculatorIcon, Copy, Check } from 'lucide-react'

interface CalculatorProps {
  expression: string
  result?: number
  error?: string
  calculationType: string
  timestamp: string
}

export const Calculator: React.FC<CalculatorProps> = ({
  expression,
  result,
  error,
  calculationType,
  timestamp
}) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    const textToCopy = error ? `Calculation: ${expression}\nError: ${error}` : `Calculation: ${expression}\nResult: ${result}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900 rounded-lg p-6 shadow-lg border border-orange-200 dark:border-orange-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Calculation Result
        </h2>
        <CalculatorIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
      </div>
      
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Calculation
          </div>
          <div className="text-gray-800 dark:text-gray-200 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono text-lg">
            {expression}
          </div>
        </div>
        
        {error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              Error
            </div>
            <div className="text-red-700 dark:text-red-300 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              {error}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Result
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200"
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
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
              {result}
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Calculation Type
              </div>
              <div className="text-gray-800 dark:text-gray-200">
                {calculationType === 'arithmetic' ? 'Arithmetic' : calculationType}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Execution Time
              </div>
              <div className="text-gray-800 dark:text-gray-200">
                {new Date(timestamp).toLocaleString('en-US')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
