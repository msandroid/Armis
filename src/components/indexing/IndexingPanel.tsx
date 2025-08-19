import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Database, 
  Play, 
  Square, 
  RefreshCw, 
  FileText, 
  Code, 
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IndexManager, IndexingProgress, IndexingOptions, IndexStats } from '@/services/indexing/index-manager'

interface IndexingPanelProps {
  className?: string
}

export const IndexingPanel: React.FC<IndexingPanelProps> = ({ className }) => {
  const [indexManager] = useState(() => new IndexManager())
  const [isInitialized, setIsInitialized] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [progress, setProgress] = useState<IndexingProgress | null>(null)
  const [stats, setStats] = useState<IndexStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Configuration state
  const [rootPath, setRootPath] = useState(process.cwd())
  const [includePatterns, setIncludePatterns] = useState('**/*.{ts,tsx,js,jsx}')
  const [excludePatterns, setExcludePatterns] = useState('**/node_modules/**,**/.git/**')
  const [maxFileSize, setMaxFileSize] = useState(10 * 1024 * 1024) // 10MB
  const [autoWatch, setAutoWatch] = useState(false)

  useEffect(() => {
    initializeIndexManager()
  }, [])

  const initializeIndexManager = async () => {
    try {
      await indexManager.initialize()
      setIsInitialized(true)
      await loadStats()
    } catch (error) {
      console.error('Failed to initialize index manager:', error)
      setError('Failed to initialize index manager')
    }
  }

  const loadStats = async () => {
    try {
      const indexStats = await indexManager.getIndexStats()
      setStats(indexStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleStartIndexing = async () => {
    if (isIndexing) return

    setError(null)
    setIsIndexing(true)
    setProgress(null)

    try {
      const patterns = includePatterns.split(',').map(p => p.trim()).filter(Boolean)
      const excludes = excludePatterns.split(',').map(p => p.trim()).filter(Boolean)

      const options: IndexingOptions = {
        rootPath,
        includePatterns: patterns,
        excludePatterns: excludes,
        maxFileSize,
        onProgress: (progress) => {
          setProgress(progress)
          if (progress.stage === 'complete') {
            setIsIndexing(false)
            loadStats()
          }
        }
      }

      await indexManager.createIndex(options)
    } catch (error) {
      console.error('Indexing failed:', error)
      setError(error instanceof Error ? error.message : 'Indexing failed')
      setIsIndexing(false)
    }
  }

  const handleStopIndexing = () => {
    // Note: This would require implementing a cancellation mechanism in IndexManager
    setIsIndexing(false)
    setProgress(null)
  }

  const handleClearIndex = async () => {
    try {
      await indexManager.clearIndex()
      await loadStats()
    } catch (error) {
      console.error('Failed to clear index:', error)
      setError('Failed to clear index')
    }
  }

  const getProgressPercentage = () => {
    if (!progress) return 0
    return (progress.current / progress.total) * 100
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'scanning':
        return <FileText className="w-4 h-4" />
      case 'parsing':
        return <Code className="w-4 h-4" />
      case 'embedding':
        return <Zap className="w-4 h-4" />
      case 'storing':
        return <Database className="w-4 h-4" />
      case 'complete':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'scanning':
        return 'text-blue-500'
      case 'parsing':
        return 'text-green-500'
      case 'embedding':
        return 'text-yellow-500'
      case 'storing':
        return 'text-purple-500'
      case 'complete':
        return 'text-green-600'
      default:
        return 'text-gray-500'
    }
  }

  if (!isInitialized) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Initializing index manager...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Indexing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Codebase Indexing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rootPath">Root Path</Label>
              <Input
                id="rootPath"
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
                placeholder="Project root path"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={Math.round(maxFileSize / (1024 * 1024))}
                onChange={(e) => setMaxFileSize(parseInt(e.target.value) * 1024 * 1024)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="includePatterns">Include Patterns</Label>
            <Input
              id="includePatterns"
              value={includePatterns}
              onChange={(e) => setIncludePatterns(e.target.value)}
              placeholder="**/*.{ts,tsx,js,jsx}"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated glob patterns for files to include
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excludePatterns">Exclude Patterns</Label>
            <Input
              id="excludePatterns"
              value={excludePatterns}
              onChange={(e) => setExcludePatterns(e.target.value)}
              placeholder="**/node_modules/**,**/.git/**"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated glob patterns for files to exclude
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="autoWatch"
              checked={autoWatch}
              onCheckedChange={setAutoWatch}
            />
            <Label htmlFor="autoWatch">Auto-watch for file changes</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleStartIndexing}
              disabled={isIndexing}
              className="flex items-center gap-2"
            >
              {isIndexing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isIndexing ? 'Indexing...' : 'Start Indexing'}
            </Button>

            {isIndexing && (
              <Button
                onClick={handleStopIndexing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
            )}

            <Button
              onClick={handleClearIndex}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Index
            </Button>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn("flex items-center gap-1", getStageColor(progress.stage))}>
                  {getStageIcon(progress.stage)}
                  <span className="text-sm font-medium capitalize">{progress.stage}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              <p className="text-sm text-muted-foreground">{progress.message}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Index Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalSymbols}</div>
                <div className="text-sm text-muted-foreground">Symbols</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalChunks}</div>
                <div className="text-sm text-muted-foreground">Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {stats.lastIndexed.toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">Last Indexed</div>
              </div>
            </div>

            {/* Languages */}
            {Object.keys(stats.languages).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Languages</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.languages).map(([lang, count]) => (
                    <Badge key={lang} variant="secondary">
                      {lang}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Symbol Types */}
            {Object.keys(stats.symbolTypes).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Symbol Types</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.symbolTypes).map(([type, count]) => (
                    <Badge key={type} variant="outline">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
