'use client'

import { useOllama } from '@/hooks/use-ollama'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

export function OllamaStatus() {
  const { isConnected, error, fetchModels, isLoading } = useOllama()

  const checkConnection = () => {
    fetchModels()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
          {isConnected ? (
            <>
              <CheckCircle className="h-3 w-3" />
              接続済み
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              未接続
            </>
          )}
        </Badge>
        
        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          再接続
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!isConnected && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ollamaサーバーが起動していません。
            <br />
            以下のコマンドでOllamaを起動してください：
            <code className="block mt-2 p-2 bg-muted rounded text-sm">
              ollama serve
            </code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 