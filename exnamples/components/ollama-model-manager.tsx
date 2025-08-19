'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Package,
  HardDrive,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
}

interface ModelPullProgress {
  status: string
  completed: boolean
  error?: string
}

export function OllamaModelManager() {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isPullDialogOpen, setIsPullDialogOpen] = useState(false)
  const [pullProgress, setPullProgress] = useState<ModelPullProgress | null>(null)

  // モデル一覧を取得
  const fetchModels = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/ollama')
      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }
      
      const data = await response.json()
      setModels(data.models || [])
    } catch (err) {
      console.error('Failed to fetch models:', err)
      setError('モデルの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // モデルをプル
  const pullModel = async (modelName: string) => {
    try {
      setPullProgress({ status: 'Pulling model...', completed: false })
      setIsPullDialogOpen(false)
      
      const response = await fetch('/api/ollama/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to pull model')
      }

      setPullProgress({ status: 'Model pulled successfully', completed: true })
      toast.success(`Model ${modelName} pulled successfully`)
      
      // モデル一覧を更新
      await fetchModels()
    } catch (err) {
      console.error('Failed to pull model:', err)
      setPullProgress({ 
        status: 'Failed to pull model', 
        completed: true, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      })
      toast.error(`Failed to pull model: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // モデルを削除
  const deleteModel = async (modelName: string) => {
    try {
      const response = await fetch('/api/ollama/models', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete model')
      }

      toast.success(`Model ${modelName} deleted successfully`)
      
      // モデル一覧を更新
      await fetchModels()
    } catch (err) {
      console.error('Failed to delete model:', err)
      toast.error(`Failed to delete model: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // ファイルサイズを人間が読みやすい形式に変換
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // 日付を人間が読みやすい形式に変換
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 初期化時にモデル一覧を取得
  useEffect(() => {
    fetchModels()
  }, [])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ollama Models</h2>
          <p className="text-muted-foreground">
            Manage your local Ollama models
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchModels}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={isPullDialogOpen} onOpenChange={setIsPullDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Pull Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pull Ollama Model</DialogTitle>
                <DialogDescription>
                  Enter the name of the model you want to pull from Ollama library.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    placeholder="e.g., llama3.1:8b, mistral:7b"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Popular Models</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['llama3.1:8b', 'mistral:7b', 'gemma:2b', 'codellama:7b'].map((model) => (
                      <Button
                        key={model}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedModel(model)}
                        className="justify-start"
                      >
                        {model}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPullDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => pullModel(selectedModel)}
                  disabled={!selectedModel.trim()}
                >
                  Pull Model
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* プル進捗表示 */}
      {pullProgress && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>{pullProgress.status}</span>
                {pullProgress.completed && (
                  <Badge variant={pullProgress.error ? "destructive" : "default"}>
                    {pullProgress.error ? "Failed" : "Completed"}
                  </Badge>
                )}
              </div>
              {!pullProgress.completed && (
                <Progress value={undefined} className="w-full" />
              )}
              {pullProgress.error && (
                <p className="text-sm text-destructive">{pullProgress.error}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* モデル一覧 */}
      <div className="grid gap-4">
        {models.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No models found. Pull a model to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          models.map((model) => (
            <Card key={model.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge variant="secondary">
                      {model.details.parameter_size}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteModel(model.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <CardDescription className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(model.size)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(model.modified_at)}
                  </div>
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Format</Label>
                    <p>{model.details.format}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Family</Label>
                    <p>{model.details.family}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantization</Label>
                    <p>{model.details.quantization_level}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Digest</Label>
                    <p className="font-mono text-xs truncate">{model.digest}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ローディング状態 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading models...</span>
        </div>
      )}
    </div>
  )
} 