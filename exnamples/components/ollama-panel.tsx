'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  Package, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Play,
  Server
} from 'lucide-react'
import { OllamaStatus } from './ollama-status'
import { OllamaModelManager } from './ollama-model-manager'
import { OllamaChat } from './ollama-chat'
import { useOllama } from '@/hooks/use-ollama'

export function OllamaPanel() {
  const { isConnected, error } = useOllama()
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Ollama</CardTitle>
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Running
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Stopped
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('status')}
              className="flex items-center gap-1"
            >
              <Server className="h-4 w-4" />
              Status
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive" className="mx-4 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* タブコンテンツ */}
      <CardContent className="flex-1 p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Status
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 px-4 pb-4">
            <TabsContent value="chat" className="h-full">
              <Card className="h-full">
                <OllamaChat />
              </Card>
            </TabsContent>

            <TabsContent value="models" className="h-full">
              <Card className="h-full">
                <CardContent className="p-6">
                  <OllamaModelManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status" className="h-full">
              <Card className="h-full">
                <CardContent className="p-6">
                  <OllamaStatus />
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
                      <div className="space-y-2 text-sm">
                        <p>1. Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ollama.ai</a></p>
                        <p>2. Pull a model: <code className="bg-muted px-2 py-1 rounded">ollama pull llama3.1:8b</code></p>
                        <p>3. Start the server: <code className="bg-muted px-2 py-1 rounded">ollama serve</code></p>
                        <p>4. Begin chatting in the Chat tab</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Popular Models</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'llama3.1:8b',
                          'mistral:7b',
                          'gemma:2b',
                          'codellama:7b',
                          'phi3:3.8b',
                          'qwen2.5:7b'
                        ].map((model) => (
                          <Button
                            key={model}
                            variant="outline"
                            size="sm"
                            className="justify-start text-xs"
                            onClick={() => {
                              setActiveTab('models')
                              // TODO: モデルプルダイアログを開く
                            }}
                          >
                            {model}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </div>
  )
} 