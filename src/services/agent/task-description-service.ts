import { OllamaService } from '@/services/llm/ollama-service'
import { TaskExecutionInfo } from '@/components/chat/TaskExecutionDisplay'

export interface TaskDescription {
  title: string
  description: string
  status: string
}

export class TaskDescriptionService {
  private ollamaService: OllamaService
  private isInitialized = false

  constructor() {
    this.ollamaService = new OllamaService({
      defaultModel: 'gemma3:1b',
      baseUrl: 'http://localhost:11434'
    })
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.ollamaService.initialize()
      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize Ollama service for task description:', error)
      // フォールバック: 初期化に失敗しても基本的な機能は動作する
    }
  }

  // タスク情報を簡潔な文章に変換
  generateTaskDescription(task: TaskExecutionInfo): string {
    const { taskType, title, description, status, progress, currentStep } = task

    // タスクタイプに基づく基本説明
    const typeDescriptions = {
      analysis: 'Analyzing',
      generation: 'Generating',
      processing: 'Processing',
      search: 'Searching',
      computation: 'Computing',
      optimization: 'Optimizing',
      learning: 'Learning',
      custom: 'Executing custom task'
    }

    const baseDescription = typeDescriptions[taskType] || 'Executing task'

    // 進捗情報を追加
    let progressText = ''
    if (progress !== undefined) {
      progressText = ` (${progress}% complete)`
    }

    // 現在のステップ情報を追加
    let stepText = ''
    if (currentStep) {
      stepText = ` - ${currentStep}`
    }

    // ステータスに基づく説明
    const statusDescriptions = {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      error: 'Error'
    }

    const statusText = statusDescriptions[status] || status

    // 最終的な説明文を構築
    let finalDescription = `${baseDescription}${progressText}${stepText}`
    
    if (status === 'completed') {
      finalDescription = 'Task completed'
    } else if (status === 'error') {
      finalDescription = 'Task encountered an error'
    }

    return finalDescription
  }

  // Ollamaのgemma 3:1bを使用してタスクタイトルを生成
  async generateTaskTitle(task: TaskExecutionInfo): Promise<string> {
    if (!this.isInitialized) {
      // フォールバック: 基本的なタイトル生成
      return this.generateFallbackTitle(task)
    }

    try {
      const prompt = `Based on the following task information, generate a concise and clear title (within 15 characters) in English.

Task Type: ${task.taskType}
Description: ${task.description}
Current Step: ${task.currentStep || 'None'}
Progress: ${task.progress || 0}%

Please return the title in the following format:
Title: [Generated Title]`

      const response = await this.ollamaService.generate(prompt, {
        options: {
          temperature: 0.7,
          num_predict: 100
        }
      })

      // レスポンスからタイトルを抽出
      const titleMatch = response.response.match(/Title:\s*(.+)/)
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim()
      }

      // 抽出に失敗した場合はフォールバック
      return this.generateFallbackTitle(task)
    } catch (error) {
      console.warn('Failed to generate task title with Ollama:', error)
      return this.generateFallbackTitle(task)
    }
  }

  // フォールバック用のタイトル生成
  private generateFallbackTitle(task: TaskExecutionInfo): string {
    const { taskType, description } = task

    // タスクタイプに基づく基本タイトル
    const typeTitles = {
      analysis: 'Analysis',
      generation: 'Generation',
      processing: 'Processing',
      search: 'Search',
      computation: 'Computation',
      optimization: 'Optimization',
      learning: 'Learning',
      custom: 'Task'
    }

    const baseTitle = typeTitles[taskType] || 'Task'

    // 説明からキーワードを抽出
    const keywords = description.match(/[「『]([^」』]+)[」』]/g)
    if (keywords && keywords.length > 0) {
      const keyword = keywords[0].replace(/[「『」』]/g, '')
      if (keyword.length <= 10) {
        return `${baseTitle}: ${keyword}`
      }
    }

    return baseTitle
  }

  // タスクの完全な説明を生成
  async generateFullTaskDescription(task: TaskExecutionInfo): Promise<TaskDescription> {
    const description = this.generateTaskDescription(task)
    const title = await this.generateTaskTitle(task)

    return {
      title,
      description,
      status: task.status
    }
  }
}
