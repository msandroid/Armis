'use client'

import { AlertTriangle, Wifi, Clock, Key, Server, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorInfo {
  message: string
  type: 'quota_exceeded' | 'rate_limit' | 'authentication' | 'network' | 'server' | 'unknown'
  retryAfter?: number
  canRetry: boolean
  fallbackUsed?: boolean
  fallbackProvider?: string
}

interface AIErrorHandlerProps {
  error: string | null
  errorInfo: ErrorInfo | null
  onRetry?: () => void
  onClearError?: () => void
  className?: string
}

const ERROR_ICONS = {
  quota_exceeded: Clock,
  rate_limit: Clock,
  authentication: Key,
  network: Wifi,
  server: Server,
  unknown: AlertTriangle
}

const ERROR_VARIANTS = {
  quota_exceeded: 'destructive' as const,
  rate_limit: 'default' as const,
  authentication: 'destructive' as const,
  network: 'default' as const,
  server: 'default' as const,
  unknown: 'destructive' as const
}

function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    return `${Math.ceil(seconds / 60)}分`
  } else {
    return `${Math.ceil(seconds / 3600)}時間`
  }
}

function getErrorTitle(type: ErrorInfo['type']): string {
  switch (type) {
    case 'quota_exceeded':
      return 'APIクォータ制限'
    case 'rate_limit':
      return 'レート制限'
    case 'authentication':
      return '認証エラー'
    case 'network':
      return 'ネットワークエラー'
    case 'server':
      return 'サーバーエラー'
    default:
      return 'エラーが発生しました'
  }
}

function getErrorAction(errorInfo: ErrorInfo): string {
  switch (errorInfo.type) {
    case 'quota_exceeded':
      return errorInfo.retryAfter 
        ? `${formatRetryTime(errorInfo.retryAfter)}後に再試行してください。`
        : 'しばらく時間をおいてから再試行してください。'
    case 'rate_limit':
      return errorInfo.retryAfter 
        ? `${formatRetryTime(errorInfo.retryAfter)}後に再試行してください。`
        : '少し待ってから再試行してください。'
    case 'authentication':
      return 'APIキーの設定を確認してください。'
    case 'network':
      return 'インターネット接続を確認してください。'
    case 'server':
      return 'しばらく待ってから再試行してください。'
    default:
      return '問題が続く場合は管理者にお問い合わせください。'
  }
}

export function AIErrorHandler({ 
  error, 
  errorInfo, 
  onRetry, 
  onClearError,
  className 
}: AIErrorHandlerProps) {
  if (!error || !errorInfo) {
    return null
  }

  const Icon = ERROR_ICONS[errorInfo.type]
  const variant = ERROR_VARIANTS[errorInfo.type]
  const title = getErrorTitle(errorInfo.type)
  const action = getErrorAction(errorInfo)

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {title}
        <div className="flex gap-2">
          {errorInfo.canRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-6 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              再試行
            </Button>
          )}
          {onClearError && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearError}
              className="h-6 text-xs"
            >
              ×
            </Button>
          )}
        </div>
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{errorInfo.message}</p>
        <p className="text-sm text-muted-foreground">{action}</p>
        
        {errorInfo.fallbackUsed && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <RefreshCw className="h-3 w-3" />
              <span className="text-xs font-medium">
                代替プロバイダー ({errorInfo.fallbackProvider}) を使用中
              </span>
            </div>
          </div>
        )}
        
        {errorInfo.type === 'quota_exceeded' && (
          <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
            <div className="text-orange-700 dark:text-orange-300 text-xs">
              <p className="font-medium">💡 ヒント:</p>
              <ul className="mt-1 space-y-1 ml-3">
                <li>• Google Cloud Console でクォータ制限を確認できます</li>
                <li>• 他のAIプロバイダーを追加して冗長性を確保することをお勧めします</li>
                <li>• リクエスト頻度を調整してクォータ消費を抑制できます</li>
              </ul>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
