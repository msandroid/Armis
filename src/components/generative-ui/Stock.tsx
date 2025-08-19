import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react'

interface StockProps {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  high: number
  low: number
}

const formatNumber = (num: number): string => {
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T'
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B'
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M'
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K'
  }
  return num.toFixed(2)
}

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export const Stock: React.FC<StockProps> = ({
  symbol,
  price,
  change,
  changePercent,
  volume,
  marketCap,
  high,
  low
}) => {
  const isPositive = change >= 0
  const isNegative = change < 0

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {symbol} 株価情報
        </h2>
        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">現在価格</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {formatCurrency(price)}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">変動</span>
          </div>
          <div className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{formatCurrency(change)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">出来高</span>
          </div>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {formatNumber(volume)}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">時価総額</span>
          </div>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {formatCurrency(marketCap)}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          今日の範囲
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              最高値
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(high)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              最安値
            </div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(low)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
