"use client"

import React from "react"
import { AlertCircle, RefreshCw, Settings } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TTSError {
  code: string
  message: string
  details?: string
  retryable?: boolean
}

interface TTSErrorHandlerProps {
  error: TTSError
  onRetry?: () => void
  onOpenSettings?: () => void
  className?: string
}

export function TTSErrorHandler({ 
  error, 
  onRetry, 
  onOpenSettings, 
  className = '' 
}: TTSErrorHandlerProps) {
  const getErrorIcon = () => {
    switch (error.code) {
      case 'NO_API_KEY':
      case 'AUTHENTICATION_FAILED':
        return <Settings className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getErrorTitle = () => {
    switch (error.code) {
      case 'NO_API_KEY':
        return 'APIキーが設定されていません'
      case 'AUTHENTICATION_FAILED':
        return '認証に失敗しました'
      case 'NETWORK_ERROR':
        return 'ネットワークエラー'
      case 'SERVICE_UNAVAILABLE':
        return 'TTSサービスが利用できません'
      case 'TEXT_TOO_LONG':
        return 'テキストが長すぎます'
      case 'UNSUPPORTED_LANGUAGE':
        return 'サポートされていない言語です'
      case 'RATE_LIMIT_EXCEEDED':
        return 'レート制限に達しました'
      default:
        return '音声合成エラー'
    }
  }

  const getErrorSolution = () => {
    switch (error.code) {
      case 'NO_API_KEY':
        return 'OpenAI APIキーを設定するか、ローカルTTSサーバーを起動してください。'
      case 'AUTHENTICATION_FAILED':
        return 'APIキーが正しいか確認してください。'
      case 'NETWORK_ERROR':
        return 'インターネット接続を確認してください。'
      case 'SERVICE_UNAVAILABLE':
        return 'しばらく時間をおいて再試行するか、別のTTSエンジンを使用してください。'
      case 'TEXT_TOO_LONG':
        return 'テキストを短くして再試行してください。'
      case 'UNSUPPORTED_LANGUAGE':
        return '対応している言語を選択してください。'
      case 'RATE_LIMIT_EXCEEDED':
        return 'しばらく時間をおいて再試行してください。'
      default:
        return '問題が続く場合は設定を確認してください。'
    }
  }

  return (
    <Alert className={className} variant="destructive">
      <div className="flex items-start space-x-2">
        {getErrorIcon()}
        <div className="flex-1 space-y-2">
          <AlertTitle>{getErrorTitle()}</AlertTitle>
          <AlertDescription>
            {error.message}
            <br />
            <span className="text-sm opacity-75">{getErrorSolution()}</span>
          </AlertDescription>
          
          {error.details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm opacity-75">
                詳細情報
              </summary>
              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                {error.details}
              </pre>
            </details>
          )}

          <div className="flex items-center space-x-2 mt-3">
            {error.retryable && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                再試行
              </Button>
            )}
            
            {(error.code === 'NO_API_KEY' || error.code === 'AUTHENTICATION_FAILED') && onOpenSettings && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenSettings}
                className="h-8"
              >
                <Settings className="h-3 w-3 mr-1" />
                設定
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  )
}

// TTS用の包括的なエラーハンドラー
export class TTSErrorManager {
  static parseError(error: unknown): TTSError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('api key') || message.includes('apikey')) {
        return {
          code: 'NO_API_KEY',
          message: 'APIキーが設定されていません',
          retryable: false
        }
      }
      
      if (message.includes('authentication') || message.includes('unauthorized')) {
        return {
          code: 'AUTHENTICATION_FAILED',
          message: 'API認証に失敗しました',
          retryable: false
        }
      }
      
      if (message.includes('network') || message.includes('fetch')) {
        return {
          code: 'NETWORK_ERROR',
          message: 'ネットワーク接続エラーが発生しました',
          retryable: true
        }
      }
      
      if (message.includes('too long') || message.includes('4096')) {
        return {
          code: 'TEXT_TOO_LONG',
          message: 'テキストが長すぎます（最大4096文字）',
          retryable: false
        }
      }
      
      if (message.includes('rate limit')) {
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'API使用量の制限に達しました',
          retryable: true
        }
      }
      
      if (message.includes('service unavailable') || message.includes('503')) {
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'TTSサービスが一時的に利用できません',
          retryable: true
        }
      }
      
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: error.stack,
        retryable: true
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: '予期しないエラーが発生しました',
      details: String(error),
      retryable: true
    }
  }
}

// TTS状態表示コンポーネント
interface TTSStatusIndicatorProps {
  status: 'idle' | 'synthesizing' | 'playing' | 'error'
  className?: string
}

export function TTSStatusIndicator({ status, className = '' }: TTSStatusIndicatorProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'synthesizing':
        return {
          text: '音声合成中...',
          color: 'text-blue-500',
          animation: 'animate-pulse'
        }
      case 'playing':
        return {
          text: '再生中',
          color: 'text-green-500',
          animation: 'animate-pulse'
        }
      case 'error':
        return {
          text: 'エラー',
          color: 'text-red-500',
          animation: ''
        }
      default:
        return {
          text: '待機中',
          color: 'text-muted-foreground',
          animation: ''
        }
    }
  }

  const { text, color, animation } = getStatusInfo()

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} ${animation}`} />
      <span className={`text-xs ${color}`}>{text}</span>
    </div>
  )
}
