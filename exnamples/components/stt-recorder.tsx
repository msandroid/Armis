'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Square, Upload, Settings, Volume2, FileAudio } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { useSTT } from '../hooks/use-stt'
import type { STTConfig, AudioFile } from '../types/stt'
import { LanguageSelector } from './language-selector'
import { getLanguageByCode } from '../lib/stt-languages'

interface STTRecorderProps {
  /** 初期設定 */
  initialConfig?: Partial<STTConfig>
  /** 結果受信時のコールバック */
  onResult?: (transcript: string, confidence: number) => void
  /** エラー発生時のコールバック */
  onError?: (error: string) => void
  /** 設定表示フラグ */
  showSettings?: boolean
  /** コンパクトモード */
  compact?: boolean
  /** 自動開始 */
  autoStart?: boolean
  /** クラス名 */
  className?: string
}

export function STTRecorder({
  initialConfig = {},
  onResult,
  onError,
  showSettings = true,
  compact = false,
  autoStart = false,
  className
}: STTRecorderProps) {
  const [config, setConfig] = useState<Partial<STTConfig>>({
    provider: 'web-speech',
    language: 'ja-JP',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    autoStopTimeout: 30000,
    ...initialConfig
  })

  const [transcript, setTranscript] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    result,
    status,
    startListening,
    stopListening,
    transcribeFile,
    updateConfig,
    clearResult,
    clearError
  } = useSTT({
    ...config,
    autoStart,
    debug: true
  })

  // 結果更新時の処理
  React.useEffect(() => {
    if (result) {
      const newText = result.isFinal ? result.transcript : `${result.transcript}...`
      setTranscript(prev => {
        if (result.isFinal) {
          return prev + newText + ' '
        }
        // 中間結果の場合は最後の行を更新
        const lines = prev.split('\n')
        const lastLine = lines[lines.length - 1]
        if (lastLine.endsWith('...')) {
          lines[lines.length - 1] = newText
          return lines.join('\n')
        }
        return prev + newText
      })
      
      onResult?.(result.transcript, result.confidence)
    }
  }, [result, onResult])

  // エラー処理
  React.useEffect(() => {
    if (status.error) {
      onError?.(status.error)
    }
  }, [status.error, onError])

  const handleConfigChange = useCallback((key: keyof STTConfig, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    updateConfig(newConfig)
  }, [config, updateConfig])

  const handleStartStop = useCallback(async () => {
    if (status.status === 'listening') {
      stopListening()
    } else {
      try {
        await startListening()
      } catch (error) {
        console.error('音声認識開始エラー:', error)
      }
    }
  }, [status.status, startListening, stopListening])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const audioFile: AudioFile = {
        file,
        name: file.name,
        size: file.size,
        type: file.type
      }
      
      await transcribeFile(audioFile)
    } catch (error) {
      console.error('ファイル音声認識エラー:', error)
    }
  }, [transcribeFile])

  const handleClear = useCallback(() => {
    setTranscript('')
    clearResult()
    clearError()
  }, [clearResult, clearError])

  const getStatusColor = () => {
    switch (status.status) {
      case 'listening': return 'bg-green-500'
      case 'processing': return 'bg-blue-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status.status) {
      case 'listening': return '音声認識中'
      case 'processing': return '処理中'
      case 'error': return 'エラー'
      default: return '待機中'
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={handleStartStop}
          variant={status.status === 'listening' ? 'destructive' : 'default'}
          size="sm"
          disabled={!status.isSupported}
        >
          {status.status === 'listening' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Badge variant="outline" className={`${getStatusColor()} text-white`}>
          {getStatusText()}
        </Badge>
        {status.audioLevel !== undefined && status.status === 'listening' && (
          <div className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" />
            <Progress value={status.audioLevel * 100} className="w-12 h-2" />
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">音声認識 (STT)</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${getStatusColor()} text-white`}>
              {getStatusText()}
            </Badge>
            {showSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 設定パネル */}
        {showSettings && (
          <Collapsible open={showConfig} onOpenChange={setShowConfig}>
            <CollapsibleContent className="space-y-4 border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">プロバイダー</Label>
                  <Select
                    value={config.provider}
                    onValueChange={(value: any) => handleConfigChange('provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web-speech">Web Speech API</SelectItem>
                      <SelectItem value="openai-whisper">OpenAI Whisper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LanguageSelector
                    value={config.language || 'ja-JP'}
                    onValueChange={(value) => handleConfigChange('language', value)}
                    provider={config.provider === 'web-speech' ? 'web-speech' : 'openai-whisper'}
                    compact={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="continuous"
                    checked={config.continuous}
                    onCheckedChange={(checked) => handleConfigChange('continuous', checked)}
                  />
                  <Label htmlFor="continuous">継続認識</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="interimResults"
                    checked={config.interimResults}
                    onCheckedChange={(checked) => handleConfigChange('interimResults', checked)}
                  />
                  <Label htmlFor="interimResults">中間結果</Label>
                </div>
              </div>

              {config.provider === 'openai-whisper' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoDetectLanguage"
                    checked={config.autoDetectLanguage || false}
                    onCheckedChange={(checked) => handleConfigChange('autoDetectLanguage', checked)}
                  />
                  <Label htmlFor="autoDetectLanguage">言語自動検出</Label>
                </div>
              )}

              {config.provider === 'openai-whisper' && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">OpenAI API キー</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={config.apiKey || ''}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* 音声レベル表示 */}
        {status.audioLevel !== undefined && status.status === 'listening' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Label>音声レベル</Label>
            </div>
            <Progress value={status.audioLevel * 100} className="w-full" />
          </div>
        )}

        {/* コントロールボタン */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleStartStop}
            variant={status.status === 'listening' ? 'destructive' : 'default'}
            disabled={!status.isSupported}
            className="flex-1"
          >
            {status.status === 'listening' ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                停止
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                音声認識開始
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={status.status === 'listening' || status.status === 'processing'}
          >
            <FileAudio className="h-4 w-4 mr-2" />
            ファイル
          </Button>

          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!transcript && !result}
          >
            クリア
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="音声ファイルを選択"
          />
        </div>

        {/* エラー表示 */}
        {status.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{status.error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="mt-2 text-red-600 hover:text-red-700"
            >
              エラーを解除
            </Button>
          </div>
        )}

        {/* 認識結果表示 */}
        <div className="space-y-2">
          <Label htmlFor="transcript">認識結果</Label>
          <Textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="音声認識結果がここに表示されます..."
            className="min-h-[120px] resize-vertical"
          />
        </div>

        {/* 結果の詳細情報 */}
        {result && (
          <div className="text-xs text-gray-500 space-y-1">
            <div>信頼度: {(result.confidence * 100).toFixed(1)}%</div>
            <div>最終結果: {result.isFinal ? 'はい' : 'いいえ'}</div>
            {result.usedLanguage && (
              <div>
                使用言語: {getLanguageByCode(result.usedLanguage)?.nativeName || result.usedLanguage}
              </div>
            )}
            {result.detectedLanguage && result.detectedLanguage !== result.usedLanguage && (
              <div>
                検出言語: {getLanguageByCode(result.detectedLanguage)?.nativeName || result.detectedLanguage}
                {result.languageConfidence && (
                  <span> (信頼度: {(result.languageConfidence * 100).toFixed(1)}%)</span>
                )}
              </div>
            )}
            {result.textDirection && (
              <div>文字方向: {result.textDirection === 'rtl' ? '右から左' : '左から右'}</div>
            )}
            {result.segments && (
              <div>セグメント数: {result.segments.length}</div>
            )}
          </div>
        )}

        {/* サポート状況 */}
        {!status.isSupported && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              お使いのブラウザは音声認識機能をサポートしていません。
              Chrome、Safari、Edge等の最新ブラウザをご利用ください。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
