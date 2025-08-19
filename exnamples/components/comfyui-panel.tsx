'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Square, 
  Download, 
  Upload, 
  Save, 
  Loader2,
  Image as ImageIcon,
  Settings,
  Zap,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface ComfyUINode {
  id: string
  type: string
  inputs: Record<string, any>
  outputs: Record<string, any>
  position: { x: number; y: number }
}

interface ComfyUIWorkflow {
  nodes: Record<string, ComfyUINode>
  connections: Record<string, any>
}

interface ComfyUIStatus {
  isRunning: boolean
  port: number
}

export function ComfyUIPanel() {
  const [status, setStatus] = useState<ComfyUIStatus>({ isRunning: false, port: 8188 })
  const [isLoading, setIsLoading] = useState(false)
  const [workflow, setWorkflow] = useState<ComfyUIWorkflow>({ nodes: {}, connections: {} })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [templates, setTemplates] = useState<any>({})
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // ComfyUIサーバーの状態を監視
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/comfyui?action=status')
        const data = await response.json()
        setStatus(data)
      } catch (error) {
        console.error('ComfyUIステータス確認エラー:', error)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // テンプレート読み込み
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/templates/comfyui-workflows.json')
        const data = await response.json()
        setTemplates(data.templates)
      } catch (error) {
        console.error('テンプレート読み込みエラー:', error)
      }
    }

    loadTemplates()
  }, [])

  // サーバー起動
  const startServer = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/comfyui?action=start')
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setStatus(prev => ({ ...prev, isRunning: true }))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('サーバー起動に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // サーバー停止
  const stopServer = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/comfyui?action=stop')
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setStatus(prev => ({ ...prev, isRunning: false }))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('サーバー停止に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // ワークフロー実行
  const executeWorkflow = async () => {
    if (!status.isRunning) {
      toast.error('ComfyUIサーバーが起動していません')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/comfyui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'queue',
          workflow: workflow
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('ワークフローを実行しました')
        // 生成された画像を監視
        monitorGeneratedImages()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('ワークフロー実行に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 生成された画像を監視
  const monitorGeneratedImages = async () => {
    // WebSocketでリアルタイム更新を監視
    const ws = new WebSocket(`ws://localhost:${status.port}/ws`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'executed' && data.data?.output?.images) {
        const images = data.data.output.images
        setGeneratedImages(prev => [...prev, ...images])
        toast.success(`${images.length}枚の画像が生成されました`)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocketエラー:', error)
    }
  }

  // ノード追加
  const addNode = (type: string) => {
    const newNodeId = `node_${Date.now()}`
    const newNode: ComfyUINode = {
      id: newNodeId,
      type,
      inputs: {},
      outputs: {},
      position: { x: Math.random() * 400, y: Math.random() * 300 }
    }

    setWorkflow(prev => ({
      ...prev,
      nodes: { ...prev.nodes, [newNodeId]: newNode }
    }))
  }

  // ノード削除
  const removeNode = (nodeId: string) => {
    setWorkflow(prev => {
      const newNodes = { ...prev.nodes }
      delete newNodes[nodeId]
      return { ...prev, nodes: newNodes }
    })
  }

  // ワークフロー保存
  const saveWorkflow = () => {
    const dataStr = JSON.stringify(workflow, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'comfyui-workflow.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('ワークフローを保存しました')
  }

  // ワークフロー読み込み
  const loadWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const loadedWorkflow = JSON.parse(e.target?.result as string)
        setWorkflow(loadedWorkflow)
        toast.success('ワークフローを読み込みました')
      } catch (error) {
        toast.error('ワークフローの読み込みに失敗しました')
      }
    }
    reader.readAsText(file)
  }

  // テンプレート読み込み
  const loadTemplate = (templateKey: string) => {
    const template = templates[templateKey]
    if (template) {
      setWorkflow(template.workflow)
      toast.success(`${template.name}テンプレートを読み込みました`)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            ComfyUI
          </CardTitle>
          <CardDescription>
            AI画像生成のためのノードベースエディタ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge variant={status.isRunning ? "default" : "secondary"}>
              {status.isRunning ? "実行中" : "停止中"}
            </Badge>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={startServer}
                disabled={status.isRunning || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                起動
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={stopServer}
                disabled={!status.isRunning || isLoading}
              >
                <Square className="h-4 w-4" />
                停止
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="editor" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor">エディタ</TabsTrigger>
          <TabsTrigger value="nodes">ノード</TabsTrigger>
          <TabsTrigger value="templates">テンプレート</TabsTrigger>
          <TabsTrigger value="output">出力</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="flex-1">
          <div className="border rounded-lg p-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Button size="sm" onClick={executeWorkflow} disabled={!status.isRunning || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                実行
              </Button>
              <Button size="sm" variant="outline" onClick={saveWorkflow}>
                <Save className="h-4 w-4" />
                保存
              </Button>
              <Button size="sm" variant="outline" asChild>
                <label>
                  <Upload className="h-4 w-4" />
                  読み込み
                  <input
                    type="file"
                    accept=".json"
                    onChange={loadWorkflow}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>

            <div className="relative border rounded-lg bg-gray-50 h-full">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="border rounded cursor-crosshair"
              />
              
              {/* ノード表示エリア */}
              <div className="absolute inset-0 pointer-events-none">
                {Object.entries(workflow.nodes).map(([nodeId, node]) => (
                  <div
                    key={nodeId}
                    className="absolute bg-white border rounded-lg p-3 shadow-sm pointer-events-auto"
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      minWidth: '200px'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{node.type}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeNode(nodeId)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(node.inputs).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Label className="text-xs">{key}:</Label>
                          <Input
                            size={1}
                            value={value}
                            onChange={(e) => {
                              setWorkflow(prev => ({
                                ...prev,
                                nodes: {
                                  ...prev.nodes,
                                  [nodeId]: {
                                    ...node,
                                    inputs: { ...node.inputs, [key]: e.target.value }
                                  }
                                }
                              }))
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="flex-1">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 gap-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">画像生成</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addNode('CheckpointLoaderSimple')}
                      className="w-full justify-start"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      モデル読み込み
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addNode('CLIPTextEncode')}
                      className="w-full justify-start"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      テキストエンコード
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addNode('KSampler')}
                      className="w-full justify-start"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      サンプラー
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addNode('VAEDecode')}
                      className="w-full justify-start"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      VAEデコード
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addNode('SaveImage')}
                      className="w-full justify-start"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      画像保存
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">キャンバス幅</Label>
                      <Input
                        type="number"
                        value={canvasSize.width}
                        onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">キャンバス高さ</Label>
                      <Input
                        type="number"
                        value={canvasSize.height}
                        onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">ワークフローテンプレート</h3>
              <div className="grid gap-4">
                {Object.entries(templates).map(([key, template]: [string, any]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadTemplate(key)}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        テンプレートを読み込み
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="output" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">生成された画像</h3>
                <Button size="sm" variant="outline" onClick={() => setGeneratedImages([])}>
                  クリア
                </Button>
              </div>
              
              {generatedImages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>生成された画像がありません</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((image, index) => (
                    <Card key={index}>
                      <CardContent className="p-2">
                        <img
                          src={image}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-auto rounded"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">
                            {new Date().toLocaleString()}
                          </span>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
} 