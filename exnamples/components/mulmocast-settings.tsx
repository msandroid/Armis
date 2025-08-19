"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  FolderOpen,
  Terminal
} from 'lucide-react'
import { MulmocastConfig } from '@/lib/mulmocast'

interface MulmocastSettingsProps {
  config: MulmocastConfig
  onConfigChange: (config: MulmocastConfig) => void
  onClose: () => void
}

export function MulmocastSettings({ config, onConfigChange, onClose }: MulmocastSettingsProps) {
  const [localConfig, setLocalConfig] = useState<MulmocastConfig>(config)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const handleConfigChange = (key: keyof MulmocastConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onConfigChange(localConfig)
    onClose()
  }

  const handleTestCLI = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/mulmocast/test')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleBrowseOutputDir = () => {
    // ブラウザ環境ではファイル選択ダイアログを開く
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        const path = files[0].webkitRelativePath.split('/')[0]
        handleConfigChange('outputDir', `./${path}`)
      }
    }
    input.click()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Mulmocast Settings
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本設定 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Mulmocast</Label>
            <Switch
              id="enabled"
              checked={localConfig.enabled}
              onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serverUrl">Server URL</Label>
            <Input
              id="serverUrl"
              value={localConfig.serverUrl || ''}
              onChange={(e) => handleConfigChange('serverUrl', e.target.value)}
              placeholder="ws://localhost:8080"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={localConfig.apiKey || ''}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              placeholder="Enter your API key"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoConnect">Auto Connect</Label>
            <Switch
              id="autoConnect"
              checked={localConfig.autoConnect}
              onCheckedChange={(checked) => handleConfigChange('autoConnect', checked)}
            />
          </div>
        </div>

        {/* 出力設定 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Output Settings</h3>
          
          <div className="space-y-2">
            <Label htmlFor="outputDir">Output Directory</Label>
            <div className="flex gap-2">
              <Input
                id="outputDir"
                value={localConfig.outputDir || ''}
                onChange={(e) => handleConfigChange('outputDir', e.target.value)}
                placeholder="./output"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleBrowseOutputDir}
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultLang">Default Language</Label>
            <Select
              value={localConfig.defaultLang || 'ja'}
              onValueChange={(value) => handleConfigChange('defaultLang', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CLI設定 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">CLI Settings</h3>
          
          <div className="space-y-2">
            <Label htmlFor="cliPath">CLI Path</Label>
            <Input
              id="cliPath"
              value={localConfig.cliPath || ''}
              onChange={(e) => handleConfigChange('cliPath', e.target.value)}
              placeholder="npx mulmo (default)"
            />
          </div>

          <Button
            onClick={handleTestCLI}
            disabled={isTesting}
            className="w-full flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            {isTesting ? 'Testing...' : 'Test CLI'}
          </Button>

          {testResult && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                {testResult.available ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">CLI Test Result</span>
              </div>
              <div className="text-xs space-y-1">
                <p><strong>Available:</strong> {testResult.available ? 'Yes' : 'No'}</p>
                {testResult.version && <p><strong>Version:</strong> {testResult.version}</p>}
                {testResult.error && <p><strong>Error:</strong> {testResult.error}</p>}
                <p><strong>Message:</strong> {testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 