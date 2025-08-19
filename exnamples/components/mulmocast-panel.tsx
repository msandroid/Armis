"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Video, 
  Mic, 
  Image, 
  FileText, 
  Settings, 
  Play, 
  Stop, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FolderOpen
} from 'lucide-react'
import { useMulmocast } from '@/hooks/use-mulmocast'
import { MulmocastProject, GenerateOptions, ScriptingOptions } from '@/lib/mulmocast'
import { motion, AnimatePresence } from 'framer-motion'

interface MulmocastPanelProps {
  className?: string
}

export function MulmocastPanel({ className }: MulmocastPanelProps) {
  const [projects, setProjects] = useState<MulmocastProject[]>([])
  const [selectedScript, setSelectedScript] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([])
  const [testResult, setTestResult] = useState<any>(null)

  const {
    client,
    isConnected,
    connect,
    disconnect
  } = useMulmocast()

  // 接続状態の監視
  useEffect(() => {
    if (client && isConnected) {
      // プロジェクトリストの更新
      const updateProjects = () => {
        const allProjects = client.getAllProjects()
        setProjects(allProjects)
      }

      updateProjects()
      const interval = setInterval(updateProjects, 2000)
      return () => clearInterval(interval)
    }
  }, [client, isConnected])

  // 利用可能なテンプレートの取得
  useEffect(() => {
    if (client && isConnected) {
      client.getAvailableTemplates().then(setAvailableTemplates)
    }
  }, [client, isConnected])

  // CLIテストの実行
  const testCLI = async () => {
    if (!client) return
    
    try {
      const result = await client.testCLI()
      setTestResult(result)
    } catch (error) {
      console.error('CLI test failed:', error)
    }
  }

  // 生成処理の実行
  const handleGenerate = async (type: 'audio' | 'images' | 'movie' | 'pdf', options?: GenerateOptions) => {
    if (!client || !selectedScript) return

    setIsGenerating(true)
    try {
      switch (type) {
        case 'audio':
          await client.generateAudio(selectedScript, options)
          break
        case 'images':
          await client.generateImages(selectedScript, options)
          break
        case 'movie':
          await client.generateMovie(selectedScript, options)
          break
        case 'pdf':
          await client.generatePDF(selectedScript, options)
          break
      }
    } catch (error) {
      console.error(`${type} generation failed:`, error)
    } finally {
      setIsGenerating(false)
    }
  }

  // スクリプト生成
  const handleScriptGeneration = async (options: ScriptingOptions) => {
    if (!client) return

    setIsGenerating(true)
    try {
      await client.generateScript(options)
    } catch (error) {
      console.error('Script generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // プロジェクトの削除
  const deleteProject = (projectId: string) => {
    if (client) {
      client.deleteProject(projectId)
    }
  }

  const getStatusIcon = (status: MulmocastProject['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: MulmocastProject['type']) => {
    switch (type) {
      case 'audio':
        return <Mic className="w-4 h-4" />
      case 'images':
        return <Image className="w-4 h-4" />
      case 'movie':
        return <Video className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'script':
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Mulmocast CLI
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={isConnected ? disconnect : connect}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Script File</label>
                  <input
                    type="text"
                    value={selectedScript}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    placeholder="Enter script file path"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleGenerate('audio')}
                    disabled={!isConnected || !selectedScript || isGenerating}
                    className="flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Generate Audio
                  </Button>
                  <Button
                    onClick={() => handleGenerate('images')}
                    disabled={!isConnected || !selectedScript || isGenerating}
                    className="flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Generate Images
                  </Button>
                  <Button
                    onClick={() => handleGenerate('movie')}
                    disabled={!isConnected || !selectedScript || isGenerating}
                    className="flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Generate Movie
                  </Button>
                  <Button
                    onClick={() => handleGenerate('pdf')}
                    disabled={!isConnected || !selectedScript || isGenerating}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Generate PDF
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <div className="space-y-2">
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500">No projects yet</p>
                ) : (
                  projects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(project.type)}
                          <span className="font-medium">{project.name}</span>
                          {getStatusIcon(project.status)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteProject(project.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <Progress value={project.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{project.status}</span>
                          <span>{project.progress}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Available Templates</h3>
                {availableTemplates.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading templates...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableTemplates.map((template) => (
                      <Badge key={template} variant="outline" className="justify-center">
                        {template}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <Button
                  onClick={testCLI}
                  disabled={!isConnected}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Test CLI
                </Button>

                {testResult && (
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                          {testResult.available ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium">CLI Test Result</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><strong>Available:</strong> {testResult.available ? 'Yes' : 'No'}</p>
                          {testResult.version && <p><strong>Version:</strong> {testResult.version}</p>}
                          {testResult.error && <p><strong>Error:</strong> {testResult.error}</p>}
                          <p><strong>Message:</strong> {testResult.message}</p>
                        </div>
                      </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 