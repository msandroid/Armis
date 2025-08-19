'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  RefreshCw, 
  ExternalLink, 
  Settings, 
  Play, 
  Square, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Monitor,
  Maximize,
  Minimize,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'

interface ComfyUIServerStatus {
  isRunning: boolean
  url: string
  version?: string
  lastCheck: Date
  error?: string
}

interface ComfyUIWebInterfaceProps {
  defaultUrl?: string
  autoStart?: boolean
  className?: string
}

export function ComfyUIWebInterface({
  defaultUrl = 'http://localhost:8188',
  autoStart = false,
  className = ''
}: ComfyUIWebInterfaceProps) {
  // サーバー状態管理
  const [serverStatus, setServerStatus] = useState<ComfyUIServerStatus>({
    isRunning: false,
    url: defaultUrl,
    lastCheck: new Date()
  })
  
  // UI状態管理
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [customUrl, setCustomUrl] = useState(defaultUrl)
  const [iframeKey, setIframeKey] = useState(0)
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout>()

  // ComfyUIサーバーの状態をチェック
  const checkServerStatus = useCallback(async (url: string = serverStatus.url) => {
    try {
      setIsLoading(true)
      
      // まずAPIエンドポイントで確認
      const response = await fetch('/api/comfyui?action=status')
      const data = await response.json()
      
      if (data.success && data.isRunning) {
        setServerStatus({
          isRunning: true,
          url: data.url || url,
          version: data.version,
          lastCheck: new Date()
        })
        return true
      }
      
      // 直接URLにアクセスして確認
      const directResponse = await fetch(`${url}/system_stats`, {
        method: 'GET',
        mode: 'no-cors'
      })
      
      setServerStatus({
        isRunning: true,
        url,
        lastCheck: new Date()
      })
      return true
      
    } catch (error) {
      console.error('ComfyUI server check failed:', error)
      setServerStatus(prev => ({
        ...prev,
        isRunning: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Connection failed'
      }))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [serverStatus.url])

  // ComfyUIサーバーを起動
  const startComfyUIServer = async () => {
    try {
      setIsLoading(true)
      toast.info('ComfyUIサーバーを起動しています...')
      
      const response = await fetch('/api/comfyui?action=start', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('ComfyUIサーバーが起動しました')
        // 少し待ってからステータスチェック
        setTimeout(() => checkServerStatus(), 2000)
      } else {
        throw new Error(data.error || 'サーバー起動に失敗しました')
      }
    } catch (error) {
      console.error('Failed to start ComfyUI server:', error)
      toast.error(error instanceof Error ? error.message : 'サーバー起動に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // ComfyUIサーバーを停止
  const stopComfyUIServer = async () => {
    try {
      setIsLoading(true)
      toast.info('ComfyUIサーバーを停止しています...')
      
      const response = await fetch('/api/comfyui?action=stop', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('ComfyUIサーバーが停止しました')
        setServerStatus(prev => ({
          ...prev,
          isRunning: false,
          lastCheck: new Date()
        }))
      } else {
        throw new Error(data.error || 'サーバー停止に失敗しました')
      }
    } catch (error) {
      console.error('Failed to stop ComfyUI server:', error)
      toast.error(error instanceof Error ? error.message : 'サーバー停止に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // URLを変更
  const changeUrl = () => {
    if (customUrl !== serverStatus.url) {
      setServerStatus(prev => ({ ...prev, url: customUrl }))
      setIframeKey(prev => prev + 1) // iframeを再読み込み
      checkServerStatus(customUrl)
    }
  }

  // iframeを再読み込み
  const reloadIframe = () => {
    setIframeKey(prev => prev + 1)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  // フルスクリーン切り替え
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // 外部ブラウザで開く
  const openInBrowser = () => {
    window.open(serverStatus.url, '_blank')
  }

  // 初期化とクリーンアップ
  useEffect(() => {
    // 初期チェック
    checkServerStatus()
    
    if (autoStart) {
      startComfyUIServer()
    }
    
    // 定期的なステータスチェック
    checkIntervalRef.current = setInterval(() => {
      checkServerStatus()
    }, 30000) // 30秒ごと
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [checkServerStatus, autoStart])

  // URLが変更された時の処理
  useEffect(() => {
    setCustomUrl(serverStatus.url)
  }, [serverStatus.url])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6" />
          <h2 className="text-2xl font-bold">ComfyUI Web Interface</h2>
          <Badge variant={serverStatus.isRunning ? 'default' : 'destructive'}>
            {serverStatus.isRunning ? '実行中' : '停止中'}
          </Badge>
          {serverStatus.version && (
            <Badge variant="outline">
              v{serverStatus.version}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkServerStatus()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            更新
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={openInBrowser}
            disabled={!serverStatus.isRunning}
          >
            <ExternalLink className="h-4 w-4" />
            外部で開く
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            {isFullscreen ? '縮小' : '拡大'}
          </Button>
        </div>
      </div>

      {/* サーバー状態とコントロール */}
      <Tabs defaultValue="interface" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interface">インターフェース</TabsTrigger>
          <TabsTrigger value="server">サーバー管理</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        {/* メインインターフェース */}
        <TabsContent value="interface" className="space-y-4">
          {!serverStatus.isRunning ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">ComfyUIサーバーが起動していません</h3>
                  <p className="text-muted-foreground">
                    ComfyUIを使用するには、まずサーバーを起動してください。
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={startComfyUIServer} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          起動中...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          サーバー起動
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => checkServerStatus()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      状態確認
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className={isFullscreen ? 'fixed inset-0 z-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    ComfyUI Interface
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={reloadIframe}
                    >
                      <RotateCcw className="h-4 w-4" />
                      再読み込み
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={serverStatus.url}
                  className={`w-full border-0 ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'}`}
                  title="ComfyUI Interface"
                  onLoad={() => {
                    toast.success('ComfyUIインターフェースが読み込まれました')
                  }}
                  onError={() => {
                    toast.error('ComfyUIインターフェースの読み込みに失敗しました')
                  }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* サーバー管理 */}
        <TabsContent value="server" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>サーバー状態</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">状態</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {serverStatus.isRunning ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {serverStatus.isRunning ? '実行中' : '停止中'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">最終確認</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {serverStatus.lastCheck.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">URL</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {serverStatus.url}
                </p>
              </div>
              
              {serverStatus.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {serverStatus.error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                {serverStatus.isRunning ? (
                  <Button
                    variant="destructive"
                    onClick={stopComfyUIServer}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    サーバー停止
                  </Button>
                ) : (
                  <Button
                    onClick={startComfyUIServer}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    サーバー起動
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => checkServerStatus()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  状態確認
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 設定 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>接続設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="custom-url">ComfyUI URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="custom-url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="http://localhost:8188"
                  />
                  <Button onClick={changeUrl} variant="outline">
                    適用
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ComfyUIサーバーのURLを指定してください
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">よく使用されるURL</Label>
                <div className="space-y-1">
                  {[
                    'http://localhost:8188',
                    'http://127.0.0.1:8188',
                    'http://localhost:8189'
                  ].map((url) => (
                    <Button
                      key={url}
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8 w-full"
                      onClick={() => {
                        setCustomUrl(url)
                        setServerStatus(prev => ({ ...prev, url }))
                        setIframeKey(prev => prev + 1)
                      }}
                    >
                      {url}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
