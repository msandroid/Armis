import { STTService, STTOptions, STTResult } from '../../types/stt'
import { WhisperLocalService, WhisperConfig } from './whisper-local-service'
import { WhisperNodeService, WhisperNodeConfig } from './whisper-node-service'
import { STTSettingsService } from './stt-settings-service'

export interface STTFactoryConfig {
  provider?: 'whisper-local' | 'whisper-node'
  whisperLocalConfig?: WhisperConfig
  whisperNodeConfig?: WhisperNodeConfig
}

/**
 * 環境に応じて適切なSTTサービスを選択するファクトリー関数
 */
export function createSTTService(config: STTFactoryConfig = {}): STTService {
  const settingsService = STTSettingsService.getInstance()
  const settings = settingsService.getSettings()

  // 設定で指定されたプロバイダーを優先
  const provider = config.provider || settings.provider

  // Node.js環境のチェック
  const isNodeEnvironment = typeof process !== 'undefined' && 
                           process.versions && 
                           process.versions.node !== undefined

  // プロバイダーに基づいてサービスを選択
  switch (provider) {
    case 'whisper-node':
      if (!isNodeEnvironment) {
        console.warn('WhisperNodeService is not available in browser environment. Falling back to WhisperLocalService.')
        return createWhisperLocalService(config.whisperLocalConfig, settings)
      }
      
      if (!config.whisperNodeConfig) {
        throw new Error('WhisperNodeConfig is required for WhisperNodeService')
      }
      
      return new WhisperNodeService(config.whisperNodeConfig)

    case 'whisper-cpp':
    case 'whisper-local':
    default:
      return createWhisperLocalService(config.whisperLocalConfig, settings)
  }
}

/**
 * WhisperLocalServiceを作成するヘルパー関数
 */
function createWhisperLocalService(
  config?: WhisperConfig, 
  settings?: any
): WhisperLocalService {
  const defaultConfig: WhisperConfig = {
    modelPath: `/whisper/models/ggml-${settings?.defaultModel || 'tiny-q5_1'}.bin`,
    language: settings?.language || 'ja',
    temperature: settings?.temperature || 0.0,
    maxTokens: settings?.maxTokens || 448
  }

  return new WhisperLocalService({
    ...defaultConfig,
    ...config
  })
}

/**
 * 利用可能なSTTサービスを取得
 */
export function getAvailableSTTServices(): Array<{
  name: string
  available: boolean
  description: string
}> {
  const isNodeEnvironment = typeof process !== 'undefined' && 
                           process.versions && 
                           process.versions.node !== undefined

  return [
    {
      name: 'whisper-local',
      available: typeof WebAssembly !== 'undefined',
      description: 'WebAssembly版のWhisper.cppを使用したローカル音声認識'
    },
    {
      name: 'whisper-node',
      available: isNodeEnvironment,
      description: 'Node.js環境でのWhisper.cppを使用した音声認識'
    }
  ]
}

/**
 * 推奨STTサービスを取得
 */
export function getRecommendedSTTService(): string {
  const isNodeEnvironment = typeof process !== 'undefined' && 
                           process.versions && 
                           process.versions.node !== undefined

  if (isNodeEnvironment) {
    return 'whisper-node'
  } else {
    return 'whisper-local'
  }
}
