import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HuggingFaceMlxLmService, HuggingFaceMlxLmModel } from '@/services/llm/huggingface-mlxlmservice'

interface HuggingFaceMlxLmModelsProps {
  llmManager: any
  onModelDownload?: (modelName: string) => void
}

export const HuggingFaceMlxLmModels: React.FC<HuggingFaceMlxLmModelsProps> = ({
  llmManager,
  onModelDownload
}) => {
  const [models, setModels] = useState<HuggingFaceMlxLmModel[]>([])
  const [trendingModels, setTrendingModels] = useState<HuggingFaceMlxLmModel[]>([])
  const [popularModels, setPopularModels] = useState<HuggingFaceMlxLmModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadModelName, setDownloadModelName] = useState('')
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'trending' | 'downloads' | 'likes' | 'updated'>('trending')
  const [selectedFamily, setSelectedFamily] = useState<string>('all')

  const huggingFaceService = new HuggingFaceMlxLmService()

  // モデルファミリーのリスト
  const modelFamilies = [
    { value: 'all', label: 'All Models' },
    { value: 'llama', label: 'Llama' },
    { value: 'gemma', label: 'Gemma' },
    { value: 'qwen', label: 'Qwen' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'phi', label: 'Phi' },
    { value: 'llava', label: 'LLaVA' },
    { value: 'codellama', label: 'CodeLlama' }
  ]

  useEffect(() => {
    loadModels()
  }, [sortBy, selectedFamily])

  const loadModels = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      let fetchedModels: HuggingFaceMlxLmModel[] = []

      if (selectedFamily === 'all') {
        // 全モデルを取得
        fetchedModels = await huggingFaceService.searchMlxLmModels({
          query: searchQuery,
          limit: 50,
          sort: sortBy,
          direction: 'desc'
        })
      } else {
        // 特定のファミリーのモデルを取得
        fetchedModels = await huggingFaceService.searchModelsByFamily(selectedFamily, 50)
      }

      setModels(fetchedModels)

      // トレンドと人気モデルも同時に取得
      const [trending, popular] = await Promise.all([
        huggingFaceService.getTrendingMlxLmModels(20),
        huggingFaceService.getPopularMlxLmModels(20)
      ])

      setTrendingModels(trending)
      setPopularModels(popular)

    } catch (error) {
      setError('モデルの読み込みに失敗しました。インターネット接続を確認してください。')
      console.error('Error loading models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadModels()
  }

  const handleModelDownload = async (modelName: string) => {
    setIsDownloading(true)
    setDownloadModelName(modelName)
    setDownloadProgress(0)
    setError('')
    
    try {
      // ここでMLX LMモデルのダウンロード処理を実装
      // 実際のダウンロード処理はllmManagerに依存
      console.log(`Downloading MLX LM model: ${modelName}`)
      
      // 成功時のコールバック
      if (onModelDownload) {
        onModelDownload(modelName)
      }
      
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadModelName('')
        setDownloadProgress(0)
      }, 1000)
    } catch (error) {
      setError(`モデルのダウンロードに失敗しました: ${modelName}`)
      console.error('Error downloading model:', error)
      setIsDownloading(false)
      setDownloadModelName('')
      setDownloadProgress(0)
    }
  }

  const formatFileSize = (bytes: number): string => {
    return huggingFaceService.formatFileSize(bytes)
  }

  const formatDate = (dateString: string): string => {
    return huggingFaceService.formatDate(dateString)
  }

  const formatDownloads = (downloads: number): string => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`
    } else if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}K`
    }
    return downloads.toString()
  }

  const renderModelCard = (model: HuggingFaceMlxLmModel) => (
    <Card key={model.id} className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate" title={model.name}>
              {model.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {model.description}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleModelDownload(model.name)}
            disabled={isDownloading}
            className="ml-2 flex-shrink-0"
          >
            {isDownloading && downloadModelName === model.name ? (
              <CircleSpinner size="sm" />
            ) : (
              "Download"
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {model.family && model.family !== 'unknown' && (
            <Badge variant="outline" className="text-xs">
              {model.family}
            </Badge>
          )}
          {model.parameter_size && model.parameter_size !== 'unknown' && (
            <Badge variant="outline" className="text-xs">
              {model.parameter_size}
            </Badge>
          )}
          {model.quantization && model.quantization !== 'unknown' && (
            <Badge variant="outline" className="text-xs">
              {model.quantization}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>📥 {formatDownloads(model.downloads)}</span>
            <span>❤️ {formatDownloads(model.likes)}</span>
            <span>👤 {model.author}</span>
          </div>
          <span>🕒 {formatDate(model.updated_at)}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {model.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {model.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{model.tags.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Hugging Face MLX LM Models</span>
            <Badge variant="outline">Live</Badge>
          </CardTitle>
          <CardDescription>
            Hugging FaceからMLX LM対応モデルを検索してダウンロードできます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="モデル名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <CircleSpinner size="sm" /> : "検索"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="downloads">Downloads</SelectItem>
                <SelectItem value="likes">Likes</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedFamily} onValueChange={setSelectedFamily}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelFamilies.map((family) => (
                  <SelectItem key={family.value} value={family.value}>
                    {family.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => huggingFaceService.clearCache()}
              variant="outline"
              size="sm"
            >
              Clear Cache
            </Button>
          </div>

          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">Search Results</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Search Results</h3>
                <span className="text-sm text-muted-foreground">
                  {models.length} models found
                </span>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <CircleSpinner size="lg" />
                  <span className="ml-2">Loading models...</span>
                </div>
              ) : models.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No models found. Try adjusting your search criteria.
                </p>
              ) : (
                <div className="grid gap-4">
                  {models.map(renderModelCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Trending Models</h3>
                <span className="text-sm text-muted-foreground">
                  {trendingModels.length} models
                </span>
              </div>
              
              <div className="grid gap-4">
                {trendingModels.map(renderModelCard)}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Popular Models</h3>
                <span className="text-sm text-muted-foreground">
                  {popularModels.length} models
                </span>
              </div>
              
              <div className="grid gap-4">
                {popularModels.map(renderModelCard)}
              </div>
            </TabsContent>
          </Tabs>

          {isDownloading && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {downloadModelName} をダウンロード中...
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(downloadProgress)}%
                  </span>
                </div>
                <Progress value={downloadProgress} className="w-full" />
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
