import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Loader2, 
  Play, 
  Pause, 
  Square,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  Share2,
  Heart,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Layers,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

// Difyワークフロー設定
export interface DifyWorkflowConfig {
  id: string
  name: string
  description: string
  steps: DifyWorkflowStep[]
  variables: DifyVariable[]
  triggers: DifyTrigger[]
  status: 'active' | 'inactive' | 'draft'
  createdAt: string
  updatedAt: string
}

export interface DifyWorkflowStep {
  id: string
  name: string
  type: 'llm' | 'tool' | 'condition' | 'action'
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
}

export interface DifyVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  defaultValue?: any
}

export interface DifyTrigger {
  type: 'manual' | 'webhook' | 'schedule' | 'event'
  config: Record<string, any>
}

// Difyワークフロー実行状態
export interface DifyWorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  currentStep: string
  progress: number
  startTime: string
  endTime?: string
  result?: any
  error?: string
  logs: DifyExecutionLog[]
}

export interface DifyExecutionLog {
  timestamp: string
  step: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  data?: any
}

// Difyワークフローエディタプロパティ
interface DifyWorkflowEditorProps {
  workflow?: DifyWorkflowConfig
  onSave?: (workflow: DifyWorkflowConfig) => void
  onExecute?: (workflowId: string, variables: Record<string, any>) => void
  onDelete?: (workflowId: string) => void
}

export function DifyWorkflowEditor({ 
  workflow, 
  onSave, 
  onExecute, 
  onDelete 
}: DifyWorkflowEditorProps) {
  const [currentWorkflow, setCurrentWorkflow] = useState<DifyWorkflowConfig | null>(workflow || null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('design')
  const [execution, setExecution] = useState<DifyWorkflowExecution | null>(null)
  const [variables, setVariables] = useState<Record<string, any>>({})
  const [showPreview, setShowPreview] = useState(false)

  // 新規ワークフローの作成
  const createNewWorkflow = useCallback(() => {
    const newWorkflow: DifyWorkflowConfig = {
      id: `wf_${Date.now()}`,
      name: '新しいワークフロー',
      description: 'ワークフローの説明を入力してください',
      steps: [],
      variables: [],
      triggers: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCurrentWorkflow(newWorkflow)
    setIsEditing(true)
  }, [])

  // ワークフローの保存
  const handleSave = useCallback(() => {
    if (currentWorkflow && onSave) {
      const updatedWorkflow = {
        ...currentWorkflow,
        updatedAt: new Date().toISOString()
      }
      onSave(updatedWorkflow)
      setIsEditing(false)
    }
  }, [currentWorkflow, onSave])

  // ワークフローの実行
  const handleExecute = useCallback(() => {
    if (currentWorkflow && onExecute) {
      const executionId = `exec_${Date.now()}`
      const newExecution: DifyWorkflowExecution = {
        id: executionId,
        workflowId: currentWorkflow.id,
        status: 'running',
        currentStep: '',
        progress: 0,
        startTime: new Date().toISOString(),
        logs: []
      }
      setExecution(newExecution)
      onExecute(currentWorkflow.id, variables)
    }
  }, [currentWorkflow, onExecute, variables])

  // ステップの追加
  const addStep = useCallback((type: DifyWorkflowStep['type']) => {
    if (!currentWorkflow) return

    const newStep: DifyWorkflowStep = {
      id: `step_${Date.now()}`,
      name: `${type}ステップ`,
      type,
      config: {},
      position: { x: 100, y: 100 },
      connections: []
    }

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep]
    })
  }, [currentWorkflow])

  // 変数の追加
  const addVariable = useCallback(() => {
    if (!currentWorkflow) return

    const newVariable: DifyVariable = {
      name: `variable_${currentWorkflow.variables.length + 1}`,
      type: 'string',
      description: '新しい変数',
      required: false
    }

    setCurrentWorkflow({
      ...currentWorkflow,
      variables: [...currentWorkflow.variables, newVariable]
    })
  }, [currentWorkflow])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dify ワークフローエディタ</h2>
          <p className="text-gray-600">高度なワークフローを視覚的に設計・実行</p>
        </div>
        <div className="flex gap-2">
          {!currentWorkflow && (
            <Button onClick={createNewWorkflow}>
              <Zap className="h-4 w-4 mr-2" />
              新規ワークフロー
            </Button>
          )}
          {currentWorkflow && (
            <>
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                プレビュー
              </Button>
              <Button onClick={handleExecute} disabled={execution?.status === 'running'}>
                {execution?.status === 'running' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                実行
              </Button>
            </>
          )}
        </div>
      </div>

      {!currentWorkflow ? (
        /* ワークフロー選択画面 */
        <Card>
          <CardHeader>
            <CardTitle>ワークフローを選択または作成</CardTitle>
            <CardDescription>
              既存のワークフローを編集するか、新しいワークフローを作成してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4 border-dashed border-2 hover:border-primary cursor-pointer" onClick={createNewWorkflow}>
                <div className="text-center">
                  <Zap className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <h3 className="font-medium">新規ワークフロー</h3>
                  <p className="text-sm text-gray-500">ゼロから作成</p>
                </div>
              </Card>
              {/* テンプレートカード */}
              <Card className="p-4 hover:shadow-md cursor-pointer">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-medium">ドキュメント分析</h3>
                  <p className="text-sm text-gray-500">テンプレート</p>
                </div>
              </Card>
              <Card className="p-4 hover:shadow-md cursor-pointer">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <h3 className="font-medium">質問応答</h3>
                  <p className="text-sm text-gray-500">テンプレート</p>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ワークフローエディタ */
        <div className="space-y-6">
          {/* ワークフロー情報 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentWorkflow.name}
                        onChange={(e) => setCurrentWorkflow({
                          ...currentWorkflow,
                          name: e.target.value
                        })}
                        className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2"
                      />
                    ) : (
                      currentWorkflow.name
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isEditing ? (
                      <Textarea
                        value={currentWorkflow.description}
                        onChange={(e) => setCurrentWorkflow({
                          ...currentWorkflow,
                          description: e.target.value
                        })}
                        placeholder="ワークフローの説明"
                        className="mt-2"
                        rows={2}
                      />
                    ) : (
                      currentWorkflow.description
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={currentWorkflow.status === 'active' ? 'default' : 'secondary'}>
                    {currentWorkflow.status === 'active' ? 'アクティブ' : '非アクティブ'}
                  </Badge>
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSave}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        保存
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        キャンセル
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Settings className="h-4 w-4 mr-1" />
                      編集
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* メインエディタ */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* サイドバー */}
            <div className="lg:col-span-1 space-y-4">
              {/* ツールパレット */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">ツール</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addStep('llm')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    LLM
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addStep('tool')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    ツール
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addStep('condition')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    条件分岐
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addStep('action')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    アクション
                  </Button>
                </CardContent>
              </Card>

              {/* 変数パネル */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex justify-between items-center">
                    変数
                    <Button size="sm" variant="ghost" onClick={addVariable}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentWorkflow.variables.map((variable, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{variable.name}</div>
                          <div className="text-xs text-gray-500">{variable.type}</div>
                        </div>
                        <Badge variant={variable.required ? 'default' : 'secondary'} className="text-xs">
                          {variable.required ? '必須' : '任意'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* メインキャンバス */}
            <div className="lg:col-span-3">
              <Card className="min-h-[600px]">
                <CardHeader>
                  <CardTitle className="text-sm">ワークフローキャンバス</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentWorkflow.steps.length === 0 ? (
                    <div className="flex items-center justify-center h-80 text-gray-500">
                      <div className="text-center">
                        <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>ツールパレットからステップを追加してください</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative min-h-[500px] bg-gray-50 rounded-lg p-4">
                      {currentWorkflow.steps.map((step) => (
                        <div
                          key={step.id}
                          className="absolute bg-white border-2 border-gray-200 rounded-lg p-3 shadow-sm cursor-move"
                          style={{
                            left: step.position.x,
                            top: step.position.y,
                            minWidth: '150px'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {step.type === 'llm' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                            {step.type === 'tool' && <Zap className="h-4 w-4 text-green-500" />}
                            {step.type === 'condition' && <Target className="h-4 w-4 text-orange-500" />}
                            {step.type === 'action' && <TrendingUp className="h-4 w-4 text-purple-500" />}
                            <span className="font-medium text-sm">{step.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {step.type === 'llm' && '言語モデル処理'}
                            {step.type === 'tool' && 'ツール実行'}
                            {step.type === 'condition' && '条件判定'}
                            {step.type === 'action' && 'アクション実行'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 実行状態 */}
          {execution && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  実行状態
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">進行状況</span>
                    <Badge variant={
                      execution.status === 'completed' ? 'default' :
                      execution.status === 'failed' ? 'destructive' :
                      execution.status === 'running' ? 'secondary' : 'outline'
                    }>
                      {execution.status === 'completed' && '完了'}
                      {execution.status === 'failed' && '失敗'}
                      {execution.status === 'running' && '実行中'}
                      {execution.status === 'paused' && '一時停止'}
                    </Badge>
                  </div>
                  
                  <Progress value={execution.progress} className="w-full" />
                  
                  {execution.currentStep && (
                    <div className="text-sm text-gray-600">
                      現在のステップ: {execution.currentStep}
                    </div>
                  )}

                  {execution.logs.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">実行ログ</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {execution.logs.map((log, index) => (
                          <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{log.timestamp}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.level}
                              </Badge>
                            </div>
                            <div className="mt-1">{log.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">エラー</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">{execution.error}</p>
                    </div>
                  )}

                  {execution.result && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">結果</span>
                      </div>
                      <pre className="text-sm text-green-700 mt-1 whitespace-pre-wrap">
                        {JSON.stringify(execution.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* プレビューパネル */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  プレビュー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="design">設計</TabsTrigger>
                    <TabsTrigger value="code">コード</TabsTrigger>
                    <TabsTrigger value="test">テスト</TabsTrigger>
                  </TabsList>

                  <TabsContent value="design" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">ワークフロー概要</h4>
                        <div className="space-y-2 text-sm">
                          <div>ステップ数: {currentWorkflow.steps.length}</div>
                          <div>変数数: {currentWorkflow.variables.length}</div>
                          <div>トリガー数: {currentWorkflow.triggers.length}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">統計</h4>
                        <div className="space-y-2 text-sm">
                          <div>作成日: {new Date(currentWorkflow.createdAt).toLocaleDateString()}</div>
                          <div>更新日: {new Date(currentWorkflow.updatedAt).toLocaleDateString()}</div>
                          <div>ステータス: {currentWorkflow.status}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">JSON設定</h4>
                      <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(currentWorkflow, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="test" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">テスト実行</h4>
                      <div className="space-y-4">
                        {currentWorkflow.variables.map((variable, index) => (
                          <div key={index}>
                            <Label htmlFor={variable.name}>{variable.name}</Label>
                            <Textarea
                              id={variable.name}
                              placeholder={`${variable.description} (${variable.type})`}
                              value={variables[variable.name] || ''}
                              onChange={(e) => setVariables({
                                ...variables,
                                [variable.name]: e.target.value
                              })}
                              rows={2}
                            />
                          </div>
                        ))}
                        <Button onClick={handleExecute} disabled={execution?.status === 'running'}>
                          {execution?.status === 'running' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              実行中...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              テスト実行
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// Plusアイコンのコンポーネント
function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}
