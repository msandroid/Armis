import { initializeWhisperExtensionService, getWhisperExtensionService } from './whisper-extension-service'
import { STTResult, STTOptions } from '../../types/stt'
import * as vscode from 'vscode'

/**
 * VSCodium拡張のExtension Host側メインサービス
 * 
 * このサービスはExtension Host（Node.js環境）で動作し、
 * Webview UIからの要求を受け取って各種AI処理を実行します
 */
export class VSCodiumExtensionHost {
  private whisperService: any = null
  private isInitialized = false
  private context: vscode.ExtensionContext | null = null

  constructor(context?: vscode.ExtensionContext) {
    this.context = context || null
  }

  /**
   * 拡張機能を初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      console.log('🚀 Initializing VSCodiumExtensionHost...')

      // Whisperサービスを初期化
      this.whisperService = await initializeWhisperExtensionService()
      
      // コマンドを登録
      this.registerCommands()
      
      this.isInitialized = true
      console.log('✅ VSCodiumExtensionHost initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize VSCodiumExtensionHost:', error)
      throw error
    }
  }

  /**
   * VSCodiumコマンドを登録
   */
  private registerCommands(): void {
    if (!this.context) {
      console.warn('⚠️ Extension context not available, skipping command registration')
      return
    }

    // 音声認識コマンド
    const transcribeCommand = vscode.commands.registerCommand(
      'armis.transcribeAudio',
      async (filePath: string, options?: STTOptions) => {
        return await this.transcribeAudio(filePath, options)
      }
    )

    // バッチ音声認識コマンド
    const batchTranscribeCommand = vscode.commands.registerCommand(
      'armis.batchTranscribe',
      async (filePaths: string[], options?: STTOptions) => {
        return await this.batchTranscribe(filePaths, options)
      }
    )

    // リアルタイム音声認識コマンド
    const realtimeTranscribeCommand = vscode.commands.registerCommand(
      'armis.startRealtimeTranscription',
      async (watchDirectory: string) => {
        return await this.startRealtimeTranscription(watchDirectory)
      }
    )

    // 設定更新コマンド
    const updateConfigCommand = vscode.commands.registerCommand(
      'armis.updateWhisperConfig',
      async (config: any) => {
        return await this.updateWhisperConfig(config)
      }
    )

    // 利用可能なモデル取得コマンド
    const getModelsCommand = vscode.commands.registerCommand(
      'armis.getAvailableModels',
      async () => {
        return await this.getAvailableModels()
      }
    )

    // コマンドをコンテキストに登録
    this.context.subscriptions.push(
      transcribeCommand,
      batchTranscribeCommand,
      realtimeTranscribeCommand,
      updateConfigCommand,
      getModelsCommand
    )

    console.log('✅ VSCodium commands registered')
  }

  /**
   * 音声ファイルを文字起こし
   */
  async transcribeAudio(filePath: string, options?: STTOptions): Promise<STTResult> {
    await this.ensureInitialized()
    
    try {
      console.log(`🎤 Transcribing audio file: ${filePath}`)
      
      // ファイルの存在確認
      const fs = await import('fs')
      if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`)
      }

      const result = await this.whisperService.transcribeFile(filePath, options)
      
      // 結果を通知
      vscode.window.showInformationMessage(
        `Transcription completed: ${result.text.substring(0, 50)}...`
      )
      
      return result
    } catch (error) {
      console.error('❌ Transcription failed:', error)
      vscode.window.showErrorMessage(
        `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * 複数の音声ファイルを一括処理
   */
  async batchTranscribe(filePaths: string[], options?: STTOptions): Promise<STTResult[]> {
    await this.ensureInitialized()
    
    try {
      console.log(`📦 Batch transcribing ${filePaths.length} files`)
      
      const results = await this.whisperService.transcribeBatch(filePaths, options)
      
      // 結果を通知
      const successCount = results.filter(r => !r.error).length
      vscode.window.showInformationMessage(
        `Batch transcription completed: ${successCount}/${filePaths.length} files processed`
      )
      
      return results
    } catch (error) {
      console.error('❌ Batch transcription failed:', error)
      vscode.window.showErrorMessage(
        `Batch transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * リアルタイム音声認識を開始
   */
  async startRealtimeTranscription(watchDirectory: string): Promise<void> {
    await this.ensureInitialized()
    
    try {
      console.log(`👀 Starting real-time transcription for: ${watchDirectory}`)
      
      await this.whisperService.startRealtimeTranscription(
        watchDirectory,
        (filePath: string, result: STTResult) => {
          // 音声認識結果を通知
          const fileName = require('path').basename(filePath)
          vscode.window.showInformationMessage(
            `🎵 ${fileName}: ${result.text.substring(0, 50)}...`
          )
          
          // 結果をエディタに表示
          this.showTranscriptionResult(result)
        },
        (filePath: string, error: Error) => {
          // エラーを通知
          const fileName = require('path').basename(filePath)
          vscode.window.showErrorMessage(
            `❌ ${fileName}: ${error.message}`
          )
        }
      )
      
      vscode.window.showInformationMessage(
        `Real-time transcription started for: ${watchDirectory}`
      )
    } catch (error) {
      console.error('❌ Failed to start real-time transcription:', error)
      vscode.window.showErrorMessage(
        `Failed to start real-time transcription: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * Whisper設定を更新
   */
  async updateWhisperConfig(config: any): Promise<void> {
    await this.ensureInitialized()
    
    try {
      this.whisperService.updateConfig(config)
      
      vscode.window.showInformationMessage(
        'Whisper configuration updated successfully'
      )
    } catch (error) {
      console.error('❌ Failed to update Whisper config:', error)
      vscode.window.showErrorMessage(
        `Failed to update config: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * 利用可能なモデルを取得
   */
  async getAvailableModels(): Promise<string[]> {
    await this.ensureInitialized()
    
    try {
      const models = await this.whisperService.getAvailableModels()
      return models
    } catch (error) {
      console.error('❌ Failed to get available models:', error)
      throw error
    }
  }

  /**
   * 音声認識結果をエディタに表示
   */
  private showTranscriptionResult(result: STTResult): void {
    // 新しいテキストファイルを作成して結果を表示
    const content = `Transcription Result:
Language: ${result.language}
Confidence: ${result.confidence}
Duration: ${result.duration}ms

Text:
${result.text}

${result.segments && result.segments.length > 0 ? `
Segments:
${result.segments.map((segment: any, index: number) => 
  `${index + 1}. [${segment.start}ms - ${segment.end}ms] ${segment.text}`
).join('\n')}` : ''}
`

    vscode.workspace.openTextDocument({
      content,
      language: 'markdown'
    }).then(doc => {
      vscode.window.showTextDocument(doc)
    })
  }

  /**
   * 初期化状態を確認
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * 拡張機能を破棄
   */
  dispose(): void {
    console.log('🧹 Disposing VSCodiumExtensionHost...')
    this.isInitialized = false
    this.whisperService = null
  }
}

// シングルトンインスタンス
let extensionHost: VSCodiumExtensionHost | null = null

/**
 * VSCodiumExtensionHostのインスタンスを取得
 */
export function getVSCodiumExtensionHost(): VSCodiumExtensionHost {
  if (!extensionHost) {
    extensionHost = new VSCodiumExtensionHost()
  }
  return extensionHost
}

/**
 * VSCodiumExtensionHostを初期化
 */
export async function initializeVSCodiumExtensionHost(
  context?: vscode.ExtensionContext
): Promise<VSCodiumExtensionHost> {
  const host = getVSCodiumExtensionHost()
  if (context) {
    host['context'] = context
  }
  await host.initialize()
  return host
}
