"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Video, 
  Send, 
  MessageSquare, 
  Play, 
  Pause, 
  Square, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useMulmocast } from '@/hooks/use-mulmocast'
import { MulmocastMessage } from '@/lib/mulmocast'
import { motion } from "motion/react"
import { JumpingDots } from "@/components/ui/jumping-dots"

interface MulmocastIntegrationProps {
  aiResponse?: string
  onSendToMulmocast: (content: string, type: 'script' | 'storyboard' | 'command') => void
  onReceiveFromMulmocast: (message: MulmocastMessage) => void
  isConnected?: boolean
}

interface VideoProject {
  id: string
  title: string
  status: 'idle' | 'processing' | 'completed' | 'error'
  progress: number
  createdAt: Date
  updatedAt: Date
}

export function MulmocastIntegration({ 
  aiResponse, 
  onSendToMulmocast, 
  onReceiveFromMulmocast,
  isConnected = false 
}: MulmocastIntegrationProps) {
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [lastAiResponse, setLastAiResponse] = useState<string>('')

  const {
    client,
    isConnected: mulmocastConnected,
    messages: mulmocastMessages,
    sendMessage,
    connect,
    disconnect
  } = useMulmocast({
    enabled: true,
    serverUrl: 'ws://localhost:8080',
    autoConnect: true
  })

  // AIレスポンスが更新されたら保存
  useEffect(() => {
    if (aiResponse && aiResponse !== lastAiResponse) {
      setLastAiResponse(aiResponse)
    }
  }, [aiResponse, lastAiResponse])

  // mulmocastからのメッセージを処理
  useEffect(() => {
    if (mulmocastMessages.length > 0) {
      const latestMessage = mulmocastMessages[mulmocastMessages.length - 1]
      onReceiveFromMulmocast(latestMessage)
      
      // プロジェクトの進捗を更新
      if (latestMessage.content.includes('progress')) {
        updateProjectProgress(latestMessage)
      }
    }
  }, [mulmocastMessages, onReceiveFromMulmocast])

  const updateProjectProgress = useCallback((message: MulmocastMessage) => {
    try {
      const progressData = JSON.parse(message.content)
      if (progressData.projectId && progressData.progress !== undefined) {
        setProjects(prev => prev.map(project => 
          project.id === progressData.projectId 
            ? { ...project, progress: progressData.progress, status: progressData.status || project.status }
            : project
        ))
      }
    } catch (error) {
      console.error('Failed to parse progress message:', error)
    }
  }, [])

  const createVideoProject = useCallback(async (content: string, type: 'script' | 'storyboard' | 'command') => {
    const projectId = Date.now().toString()
    const newProject: VideoProject = {
      id: projectId,
      title: `Video Project ${projects.length + 1}`,
      status: 'idle',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setProjects(prev => [...prev, newProject])
    setActiveProject(newProject)

    // mulmocastに送信
    const mulmocastContent = {
      type,
      content,
      projectId,
      timestamp: new Date().toISOString()
    }

    await sendMessage(JSON.stringify(mulmocastContent), 'command')
    onSendToMulmocast(content, type)
  }, [projects.length, sendMessage, onSendToMulmocast])

  const handleSendToMulmocast = useCallback(async () => {
    if (!lastAiResponse.trim()) {
      return
    }

    // 動画制作用のプロンプトテンプレートを適用
    const videoScript = `動画制作指示: ${lastAiResponse}\n\nこの内容を基に動画を制作してください。`
    
    await createVideoProject(videoScript, 'script')
  }, [lastAiResponse, createVideoProject])

  const handleGenerateStoryboard = useCallback(async () => {
    if (!lastAiResponse.trim()) {
      return
    }

    const storyboardPrompt = `ストーリーボード生成: ${lastAiResponse}\n\nこの内容を基にストーリーボードを生成してください。`
    
    await createVideoProject(storyboardPrompt, 'storyboard')
  }, [lastAiResponse, createVideoProject])

  const getStatusIcon = (status: VideoProject['status']) => {
    switch (status) {
      case 'idle':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'processing':
        return <JumpingDots size="xxs" color="#3b82f6" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: VideoProject['status']) => {
    switch (status) {
      case 'idle':
        return '待機中'
      case 'processing':
        return '処理中'
      case 'completed':
        return '完了'
      case 'error':
        return 'エラー'
      default:
        return '不明'
    }
  }

  return (
    <div className="space-y-4">
      {/* 接続状態 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Video className="h-4 w-4" />
            <span>Mulmocast連携</span>
            <Badge variant={mulmocastConnected ? "default" : "secondary"}>
              {mulmocastConnected ? '接続中' : '未接続'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 接続ボタン */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => mulmocastConnected ? disconnect() : connect()}
              variant={mulmocastConnected ? "outline" : "default"}
            >
              {mulmocastConnected ? '切断' : '接続'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* 設定パネル */}
          {showSettings && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="text-sm">
                <strong>サーバーURL:</strong> ws://localhost:8080
              </div>
              <div className="text-sm">
                <strong>接続状態:</strong> {mulmocastConnected ? '接続済み' : '未接続'}
              </div>
              <div className="text-sm">
                <strong>メッセージ数:</strong> {mulmocastMessages.length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AIレスポンスから動画制作 */}
      {lastAiResponse && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">AIレスポンスから動画制作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600 max-h-20 overflow-y-auto">
              {lastAiResponse.substring(0, 200)}...
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleSendToMulmocast}
                disabled={!mulmocastConnected}
              >
                <Send className="h-4 w-4 mr-1" />
                動画制作開始
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateStoryboard}
                disabled={!mulmocastConnected}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                ストーリーボード生成
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* プロジェクト一覧 */}
      {projects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">動画制作プロジェクト</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-3 rounded-lg border ${
                    project.id === activeProject?.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(project.status)}
                      <div>
                        <div className="text-sm font-medium">{project.title}</div>
                        <div className="text-xs text-gray-500">
                          {getStatusText(project.status)} - {project.progress}%
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {project.createdAt.toLocaleTimeString()}
                    </div>
                  </div>
                  {project.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最新のmulmocastメッセージ */}
      {mulmocastMessages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">最新のMulmocastメッセージ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mulmocastMessages.slice(-3).map((message, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{message.sender}</span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-700">{message.content}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 