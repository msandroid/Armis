import { STTService } from '../../types/stt'
import { WhisperLocalService } from './whisper-local-service'
import { WhisperNodeService } from './whisper-node-service'
import path from 'path'

/**
 * 環境に応じて適切なWhisperサービスを選択するファクトリー
 */
export class WhisperServiceFactory {
  /**
   * 利用可能なWhisperサービスを取得
   */
  static async createWhisperService(): Promise<STTService> {
    // ブラウザ環境かどうかをチェック
    const isBrowserEnvironment = typeof window !== 'undefined' && 
                                typeof document !== 'undefined'

    if (isBrowserEnvironment) {
      console.log('🌐 Browser environment detected, using WhisperLocalService')
      return WhisperLocalService.getInstance({
        modelPath: '/whisper/models/ggml-tiny-q5_1.bin',
        language: 'ja',
        temperature: 0.0,
        maxTokens: 448
      })
    } else {
      // Node.js環境
      console.log('🖥️  Node.js environment detected, using WhisperNodeService')
      return new WhisperNodeService({
        whisperPath: path.join(process.cwd(), 'whisper.cpp/build/bin/whisper-cli'),
        modelPath: path.join(process.cwd(), 'whisper.cpp/models/ggml-tiny.bin'),
        language: 'ja',
        outputFormat: 'txt'
      })
    }
  }

  /**
   * 特定のサービスを強制的に使用
   */
  static async createWhisperServiceWithFallback(
    preferredService: 'node' | 'local' = 'node'
  ): Promise<STTService> {
    try {
      if (preferredService === 'node') {
        console.log('🎯 Attempting to use WhisperNodeService...')
        const nodeService = new WhisperNodeService({
          whisperPath: path.join(process.cwd(), 'whisper.cpp/build/bin/whisper-cli'),
          modelPath: path.join(process.cwd(), 'whisper.cpp/models/ggml-tiny.bin'),
          language: 'ja',
          outputFormat: 'txt'
        })

        // Node.js環境で利用可能かチェック
        if (nodeService.isAvailable()) {
          console.log('✅ WhisperNodeService is available')
          return nodeService
        } else {
          throw new Error('WhisperNodeService is not available')
        }
      } else {
                 console.log('🎯 Attempting to use WhisperLocalService...')
         const localService = new WhisperLocalService({
           modelPath: '/whisper/ggml-tiny.bin',
           language: 'ja',
           temperature: 0.0,
           maxTokens: 448
         })

        // 初期化を試行
        await localService.initialize()
        console.log('✅ WhisperLocalService initialized successfully')
        return localService
      }
    } catch (error) {
      console.warn(`⚠️  Failed to initialize preferred service (${preferredService}):`, error)
      
      // フォールバック
      if (preferredService === 'node') {
        console.log('🔄 Falling back to WhisperLocalService...')
        const localService = new WhisperLocalService({
          modelPath: '/whisper/ggml-tiny.bin',
          language: 'ja',
          temperature: 0.0,
          maxTokens: 448
        })
        
        try {
          await localService.initialize()
          console.log('✅ WhisperLocalService fallback successful')
          return localService
        } catch (fallbackError) {
          console.error('❌ Both services failed:', fallbackError)
          throw new Error(`All Whisper services failed: ${error instanceof Error ? error.message : 'Unknown error'}, ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
        }
      } else {
        console.log('🔄 Falling back to WhisperNodeService...')
        const nodeService = new WhisperNodeService({
          whisperPath: path.join(process.cwd(), 'whisper.cpp/build/bin/whisper-cli'),
          modelPath: path.join(process.cwd(), 'whisper.cpp/models/ggml-tiny.bin'),
          language: 'ja',
          outputFormat: 'txt'
        })
        
        if (nodeService.isAvailable()) {
          console.log('✅ WhisperNodeService fallback successful')
          return nodeService
        } else {
          console.error('❌ Both services failed')
          throw new Error(`All Whisper services failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
  }

  /**
   * 利用可能なサービスをテスト
   */
  static async testAvailableServices(): Promise<{
    nodeService: boolean
    localService: boolean
    recommended: 'node' | 'local' | 'none'
  }> {
    const results = {
      nodeService: false,
      localService: false,
      recommended: 'none' as 'node' | 'local' | 'none'
    }

    // Node.jsサービステスト
    try {
      const nodeService = new WhisperNodeService({
        whisperPath: path.join(process.cwd(), 'whisper.cpp/build/bin/whisper-cli'),
        modelPath: path.join(process.cwd(), 'whisper.cpp/models/ggml-tiny.bin'),
        language: 'ja',
        outputFormat: 'txt'
      })
      
      if (nodeService.isAvailable()) {
        results.nodeService = true
        console.log('✅ WhisperNodeService is available')
      }
    } catch (error) {
      console.log('❌ WhisperNodeService is not available:', error)
    }

    // Localサービステスト
    try {
      const localService = new WhisperLocalService({
        modelPath: '/whisper/ggml-tiny.bin',
        language: 'ja',
        temperature: 0.0,
        maxTokens: 448
      })
      
      await localService.initialize()
      results.localService = true
      console.log('✅ WhisperLocalService is available')
    } catch (error) {
      console.log('❌ WhisperLocalService is not available:', error)
    }

    // 推奨サービスを決定
    if (results.nodeService) {
      results.recommended = 'node'
    } else if (results.localService) {
      results.recommended = 'local'
    }

    return results
  }
}
