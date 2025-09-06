import { TaskExecutionInfo } from '@/components/chat/TaskExecutionDisplay'

// タスク実行表示機能の使用例
export const taskExecutionExamples = {
  // 基本的なタスク実行例
  basicTask: (): TaskExecutionInfo => ({
    id: 'example_1',
    taskType: 'analysis',
    title: 'データ分析タスク',
    description: 'ユーザーデータの詳細分析を実行中',
    progress: 45,
    status: 'running',
    startTime: new Date(Date.now() - 30000), // 30秒前から開始
    estimatedDuration: 60000, // 1分
    currentStep: 'データ前処理',
    totalSteps: 4,
    currentStepIndex: 1,
    metadata: {
      model: 'GPT-4',
      complexity: 'moderate',
      priority: 'medium',
      resources: ['Database', 'AI Model']
    }
  }),

  // 画像生成タスク例
  imageGenerationTask: (): TaskExecutionInfo => ({
    id: 'example_2',
    taskType: 'generation',
    title: '画像生成タスク',
    description: 'プロンプト「美しい夕日」に基づく画像生成中',
    progress: 75,
    status: 'running',
    startTime: new Date(Date.now() - 15000), // 15秒前から開始
    estimatedDuration: 30000, // 30秒
    currentStep: '画像の後処理',
    totalSteps: 3,
    currentStepIndex: 2,
    metadata: {
      model: 'DALL-E 3',
      complexity: 'simple',
      priority: 'low',
      resources: ['Image Generator', 'GPU']
    }
  }),

  // 複雑な分析タスク例
  complexAnalysisTask: (): TaskExecutionInfo => ({
    id: 'example_3',
    taskType: 'analysis',
    title: '複雑なデータ分析',
    description: '大規模データセットの深層学習分析を実行中',
    progress: 20,
    status: 'running',
    startTime: new Date(Date.now() - 120000), // 2分前から開始
    estimatedDuration: 300000, // 5分
    currentStep: 'モデルトレーニング',
    totalSteps: 6,
    currentStepIndex: 2,
    metadata: {
      model: 'Custom ML Model',
      complexity: 'complex',
      priority: 'high',
      resources: ['GPU Cluster', 'Big Data', 'ML Framework']
    }
  }),

  // 完了したタスク例
  completedTask: (): TaskExecutionInfo => ({
    id: 'example_4',
    taskType: 'processing',
    title: 'ファイル処理タスク',
    description: 'PDFファイルのテキスト抽出処理',
    progress: 100,
    status: 'completed',
    startTime: new Date(Date.now() - 45000), // 45秒前から開始
    estimatedDuration: 30000, // 30秒
    currentStep: '完了',
    totalSteps: 3,
    currentStepIndex: 2,
    metadata: {
      model: 'OCR Engine',
      complexity: 'simple',
      priority: 'low',
      resources: ['PDF Parser', 'OCR']
    }
  }),

  // エラーが発生したタスク例
  errorTask: (): TaskExecutionInfo => ({
    id: 'example_5',
    taskType: 'search',
    title: 'ウェブ検索タスク',
    description: 'リアルタイム情報の検索処理',
    progress: 60,
    status: 'error',
    startTime: new Date(Date.now() - 20000), // 20秒前から開始
    estimatedDuration: 15000, // 15秒
    currentStep: 'ネットワークエラー',
    totalSteps: 3,
    currentStepIndex: 2,
    metadata: {
      model: 'Search API',
      complexity: 'moderate',
      priority: 'medium',
      resources: ['Web API', 'Network']
    }
  }),

  // 待機中のタスク例
  pendingTask: (): TaskExecutionInfo => ({
    id: 'example_6',
    taskType: 'computation',
    title: '数値計算タスク',
    description: '複雑な数値計算の実行待機中',
    progress: 0,
    status: 'pending',
    startTime: new Date(),
    estimatedDuration: 45000, // 45秒
    currentStep: '待機中',
    totalSteps: 4,
    currentStepIndex: 0,
    metadata: {
      model: 'Computational Engine',
      complexity: 'complex',
      priority: 'high',
      resources: ['CPU', 'Memory']
    }
  })
}

// タスク実行のシミュレーション例
export const simulateTaskExecution = (
  addTask: (task: Omit<TaskExecutionInfo, 'id' | 'startTime'>) => string,
  updateTask: (id: string, updates: Partial<TaskExecutionInfo>) => void,
  completeTask: (id: string, success: boolean) => void
) => {
  // 画像生成タスクのシミュレーション
  const imageTaskId = addTask({
    taskType: 'generation',
    title: 'AI画像生成',
    description: 'プロンプト「未来都市の夜景」に基づく画像生成',
    status: 'pending',
    progress: 0,
    estimatedDuration: 25000,
    metadata: {
      model: 'Stable Diffusion',
      complexity: 'moderate',
      priority: 'medium',
      resources: ['GPU', 'Image Generator']
    }
  })

  // 進捗シミュレーション
  setTimeout(() => updateTask(imageTaskId, { status: 'running', progress: 10, currentStep: '初期化中' }), 500)
  setTimeout(() => updateTask(imageTaskId, { progress: 30, currentStep: 'プロンプト処理' }), 2000)
  setTimeout(() => updateTask(imageTaskId, { progress: 60, currentStep: '画像生成中' }), 5000)
  setTimeout(() => updateTask(imageTaskId, { progress: 90, currentStep: '後処理中' }), 8000)
  setTimeout(() => completeTask(imageTaskId, true), 10000)

  // データ分析タスクのシミュレーション
  const analysisTaskId = addTask({
    taskType: 'analysis',
    title: 'データ分析',
    description: 'ユーザー行動データのパターン分析',
    status: 'pending',
    progress: 0,
    estimatedDuration: 40000,
    metadata: {
      model: 'Analytics Engine',
      complexity: 'complex',
      priority: 'high',
      resources: ['Database', 'ML Model']
    }
  })

  setTimeout(() => updateTask(analysisTaskId, { status: 'running', progress: 15, currentStep: 'データ読み込み' }), 1000)
  setTimeout(() => updateTask(analysisTaskId, { progress: 40, currentStep: '前処理' }), 3000)
  setTimeout(() => updateTask(analysisTaskId, { progress: 70, currentStep: '分析実行' }), 6000)
  setTimeout(() => updateTask(analysisTaskId, { progress: 95, currentStep: '結果生成' }), 9000)
  setTimeout(() => completeTask(analysisTaskId, true), 12000)
}

// リアルタイムタスク更新のシミュレーション
export const simulateRealTimeTaskUpdates = (
  taskId: string,
  updateTask: (id: string, updates: Partial<TaskExecutionInfo>) => void
) => {
  let progress = 0
  const steps = [
    '初期化中',
    'データ読み込み',
    '処理実行',
    '結果生成',
    '完了'
  ]
  let stepIndex = 0

  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5 // 5-20%のランダムな進捗
    
    if (progress >= 100) {
      progress = 100
      clearInterval(interval)
      updateTask(taskId, {
        status: 'completed',
        progress: 100,
        currentStep: '完了',
        currentStepIndex: steps.length - 1
      })
    } else {
      if (progress > (stepIndex + 1) * 20) {
        stepIndex = Math.min(stepIndex + 1, steps.length - 2)
      }
      
      updateTask(taskId, {
        progress,
        currentStep: steps[stepIndex],
        currentStepIndex: stepIndex
      })
    }
  }, 1000) // 1秒ごとに更新

  return interval
}
