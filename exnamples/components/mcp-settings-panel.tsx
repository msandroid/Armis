/**
 * MCP Settings Panel Component for Armis
 * Model Context Protocol サーバー管理UI
 */

"use client"

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Server, 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Brain,
  Database,
  Globe,
  Terminal,
  Code
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mcpClient, MCPServerConfig } from '@/lib/mcp-client'

interface MCPSettingsPanelProps {
  className?: string
  theme?: 'light' | 'dark'
  onServerStatusChange?: (serverName: string, status: 'connected' | 'disconnected' | 'error') => void
}

interface ServerTemplate {
  name: string
  description: string
  command: string
  args: string[]
  env?: Record<string, string>
  category: 'thinking' | 'data' | 'web' | 'code' | 'custom'
  icon: React.ReactNode
}

const SERVER_TEMPLATES: ServerTemplate[] = [
  {
    name: 'sequential-thinking',
    description: 'Sequential Thinking - 段階的思考プロセス管理',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequentialthinking'],
    category: 'thinking',
    icon: <Brain className="h-4 w-4" />
  },
  {
    name: 'filesystem',
    description: 'File System - ファイルシステムアクセス',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/files'],
    category: 'data',
    icon: <Database className="h-4 w-4" />
  },
  {
    name: 'web-search',
    description: 'Web Search - ウェブ検索機能',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-web-search'],
    env: { 'SEARCH_API_KEY': 'your_api_key_here' },
    category: 'web',
    icon: <Globe className="h-4 w-4" />
  },
  {
    name: 'github',
    description: 'GitHub - GitHub連携機能',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { 'GITHUB_PERSONAL_ACCESS_TOKEN': 'your_token_here' },
    category: 'code',
    icon: <Code className="h-4 w-4" />
  }
]

export function MCPSettingsPanel({
  className = '',
  theme = 'dark',
  onServerStatusChange
}: MCPSettingsPanelProps) {
  const [servers, setServers] = useState<MCPServerConfig[]>([])
  const [connectedServers, setConnectedServers] = useState<string[]>([])
  const [serverStatuses, setServerStatuses] = useState<Map<string, any>>(new Map())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newServerConfig, setNewServerConfig] = useState<Partial<MCPServerConfig>>({
    name: '',
    command: '',
    args: [],
    env: {}
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const isDark = theme === 'dark'
  const bgColor = isDark ? 'bg-zinc-900' : 'bg-white'
  const cardBg = isDark ? 'bg-zinc-800' : 'bg-gray-50'
  const textColor = isDark ? 'text-zinc-100' : 'text-gray-900'
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-600'
  const borderColor = isDark ? 'border-zinc-700' : 'border-gray-200'

  // 初期化
  useEffect(() => {
    loadSavedServers()
    refreshServerStatuses()
  }, [])

  // 保存されたサーバー設定を読み込み
  const loadSavedServers = () => {
    try {
      const saved = localStorage.getItem('armis-mcp-servers')
      if (saved) {
        const savedServers = JSON.parse(saved)
        setServers(savedServers)
      } else {
        // デフォルトでSequential Thinkingサーバーを追加
        const defaultServers = [SERVER_TEMPLATES[0]]
        setServers(defaultServers.map(template => ({
          name: template.name,
          command: template.command,
          args: template.args,
          env: template.env
        })))
      }
    } catch (error) {
      console.error('Failed to load saved MCP servers:', error)
    }
  }

  // サーバー設定を保存
  const saveServers = (updatedServers: MCPServerConfig[]) => {
    try {
      localStorage.setItem('armis-mcp-servers', JSON.stringify(updatedServers))
      setServers(updatedServers)
    } catch (error) {
      console.error('Failed to save MCP servers:', error)
    }
  }

  // サーバー状態を更新
  const refreshServerStatuses = async () => {
    setIsRefreshing(true)
    try {
      const connected = await mcpClient.getConnectedServers()
      setConnectedServers(connected)

      const statuses = new Map()
      for (const serverName of connected) {
        const status = await mcpClient.getServerStatus(serverName)
        statuses.set(serverName, status)
      }
      setServerStatuses(statuses)
    } catch (error) {
      console.error('Failed to refresh server statuses:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // サーバーに接続
  const connectServer = async (config: MCPServerConfig) => {
    try {
      const success = await mcpClient.connectToServer(config)
      if (success) {
        onServerStatusChange?.(config.name, 'connected')
      } else {
        onServerStatusChange?.(config.name, 'error')
      }
      await refreshServerStatuses()
    } catch (error) {
      console.error(`Failed to connect to server ${config.name}:`, error)
      onServerStatusChange?.(config.name, 'error')
    }
  }

  // サーバーから切断
  const disconnectServer = async (serverName: string) => {
    try {
      await mcpClient.disconnectServer(serverName)
      onServerStatusChange?.(serverName, 'disconnected')
      await refreshServerStatuses()
    } catch (error) {
      console.error(`Failed to disconnect from server ${serverName}:`, error)
    }
  }

  // サーバー追加
  const addServer = () => {
    if (!newServerConfig.name || !newServerConfig.command) return

    const config: MCPServerConfig = {
      name: newServerConfig.name,
      command: newServerConfig.command,
      args: newServerConfig.args || [],
      env: newServerConfig.env,
      cwd: newServerConfig.cwd
    }

    const updatedServers = [...servers, config]
    saveServers(updatedServers)
    setShowAddDialog(false)
    resetNewServerConfig()
  }

  // サーバー削除
  const removeServer = async (serverName: string) => {
    // 接続中の場合は先に切断
    if (connectedServers.includes(serverName)) {
      await disconnectServer(serverName)
    }

    const updatedServers = servers.filter(s => s.name !== serverName)
    saveServers(updatedServers)
  }

  // テンプレート適用
  const applyTemplate = (templateName: string) => {
    const template = SERVER_TEMPLATES.find(t => t.name === templateName)
    if (template) {
      setNewServerConfig({
        name: template.name,
        command: template.command,
        args: template.args,
        env: template.env
      })
      setSelectedTemplate(templateName)
    }
  }

  // 新規サーバー設定をリセット
  const resetNewServerConfig = () => {
    setNewServerConfig({
      name: '',
      command: '',
      args: [],
      env: {}
    })
    setSelectedTemplate('')
  }

  // サーバー状態アイコン取得
  const getServerStatusIcon = (serverName: string) => {
    if (connectedServers.includes(serverName)) {
      return <CheckCircle className="h-4 w-4 text-green-400" />
    }
    return <AlertCircle className="h-4 w-4 text-red-400" />
  }

  // カテゴリ別アイコン取得
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'thinking': return <Brain className="h-4 w-4" />
      case 'data': return <Database className="h-4 w-4" />
      case 'web': return <Globe className="h-4 w-4" />
      case 'code': return <Code className="h-4 w-4" />
      default: return <Server className="h-4 w-4" />
    }
  }

  return (
    <Card className={`${className} ${bgColor} ${textColor} ${borderColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>MCP Settings</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={refreshServerStatuses}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-3 w-3 mr-1" />
                  追加
                </Button>
              </DialogTrigger>
              <DialogContent className={`${bgColor} ${textColor}`}>
                <DialogHeader>
                  <DialogTitle>MCPサーバー追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">テンプレート</label>
                    <Select value={selectedTemplate} onValueChange={applyTemplate}>
                      <SelectTrigger className={cardBg}>
                        <SelectValue placeholder="テンプレートを選択..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVER_TEMPLATES.map((template) => (
                          <SelectItem key={template.name} value={template.name}>
                            <div className="flex items-center space-x-2">
                              {template.icon}
                              <span>{template.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">サーバー名</label>
                    <Input
                      value={newServerConfig.name || ''}
                      onChange={(e) => setNewServerConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="サーバー名を入力..."
                      className={cardBg}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">コマンド</label>
                    <Input
                      value={newServerConfig.command || ''}
                      onChange={(e) => setNewServerConfig(prev => ({ ...prev, command: e.target.value }))}
                      placeholder="npx, python, etc..."
                      className={cardBg}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">引数 (JSON配列)</label>
                    <Textarea
                      value={JSON.stringify(newServerConfig.args || [])}
                      onChange={(e) => {
                        try {
                          const args = JSON.parse(e.target.value)
                          setNewServerConfig(prev => ({ ...prev, args }))
                        } catch {
                          // 無効なJSONは無視
                        }
                      }}
                      placeholder='["-y", "@modelcontextprotocol/server-name"]'
                      className={cardBg}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">環境変数 (JSON)</label>
                    <Textarea
                      value={JSON.stringify(newServerConfig.env || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const env = JSON.parse(e.target.value)
                          setNewServerConfig(prev => ({ ...prev, env }))
                        } catch {
                          // 無効なJSONは無視
                        }
                      }}
                      placeholder='{"API_KEY": "your_key_here"}'
                      className={cardBg}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={() => setShowAddDialog(false)}
                      variant="outline"
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={addServer}
                      disabled={!newServerConfig.name || !newServerConfig.command}
                    >
                      追加
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {servers.length === 0 ? (
          <div className={`text-center py-6 ${textMuted}`}>
            <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>MCPサーバーが設定されていません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {servers.map((server) => {
              const isConnected = connectedServers.includes(server.name)
              const status = serverStatuses.get(server.name)
              const template = SERVER_TEMPLATES.find(t => t.name === server.name)

              return (
                <div
                  key={server.name}
                  className={`p-3 rounded-lg ${cardBg} ${borderColor} border`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {template ? template.icon : getCategoryIcon('custom')}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{server.name}</span>
                          {getServerStatusIcon(server.name)}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isConnected 
                                ? 'text-green-400 border-green-400' 
                                : 'text-red-400 border-red-400'
                            }`}
                          >
                            {isConnected ? '接続中' : '未接続'}
                          </Badge>
                        </div>
                        <div className={`text-xs ${textMuted} mt-1`}>
                          {server.command} {server.args?.join(' ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <Button
                          onClick={() => disconnectServer(server.name)}
                          size="sm"
                          variant="outline"
                          disabled={isRefreshing}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          切断
                        </Button>
                      ) : (
                        <Button
                          onClick={() => connectServer(server)}
                          size="sm"
                          disabled={isRefreshing}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          接続
                        </Button>
                      )}
                      <Button
                        onClick={() => removeServer(server.name)}
                        size="sm"
                        variant="outline"
                        className="text-red-400 hover:text-red-300"
                        disabled={isRefreshing}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* サーバー詳細情報 */}
                  {status && (
                    <div className="mt-2 pt-2 border-t border-zinc-700">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <Terminal className="h-3 w-3 text-blue-400" />
                          <span>PID: {status.process?.id || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {isConnected ? (
                            <Wifi className="h-3 w-3 text-green-400" />
                          ) : (
                            <WifiOff className="h-3 w-3 text-red-400" />
                          )}
                          <span>
                            {status.capabilities?.tools ? 'Tools' : ''}
                            {status.capabilities?.resources ? ' Resources' : ''}
                            {status.capabilities?.prompts ? ' Prompts' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 接続統計 */}
        <div className={`p-3 rounded-lg ${cardBg} mt-4`}>
          <div className="text-sm font-medium mb-2">接続統計</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{servers.length}</div>
              <div className={textMuted}>総サーバー数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{connectedServers.length}</div>
              <div className={textMuted}>接続中</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{servers.length - connectedServers.length}</div>
              <div className={textMuted}>未接続</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
