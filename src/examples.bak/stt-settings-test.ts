import { STTSettingsService } from '../services/stt/stt-settings-service'

/**
 * STT設定のテストと修正
 */
async function testAndFixSTTSettings() {
  console.log('=== STT Settings Test and Fix ===')
  
  const sttService = STTSettingsService.getInstance()
  
  // 現在の設定を取得
  const currentSettings = sttService.getSettings()
  console.log('\n1. Current STT Settings:')
  console.log('Enabled:', currentSettings.enabled)
  console.log('Provider:', currentSettings.provider)
  console.log('Default Model:', currentSettings.defaultModel)
  console.log('Language:', currentSettings.language)
  console.log('Models:', currentSettings.models)
  
  // 有効化されたモデルを確認
  const enabledModels = sttService.getEnabledModels()
  console.log('\n2. Enabled Models:', enabledModels)
  
  // 利用可能なモデルを確認
  const availableModels = sttService.getAvailableModels()
  console.log('\n3. Available Models:')
  availableModels.forEach(model => {
    console.log(`- ${model.id}: ${model.name} (${model.category})`)
  })
  
  // 推奨モデルを確認
  const recommendedModels = sttService.getRecommendedModels()
  console.log('\n4. Recommended Models:')
  recommendedModels.forEach(model => {
    console.log(`- ${model.id}: ${model.name}`)
  })
  
  // 設定を修正
  console.log('\n5. Fixing STT Settings...')
  
  // STTを有効化
  if (!currentSettings.enabled) {
    console.log('✅ Enabling STT...')
    sttService.toggleEnabled()
  }
  
  // プロバイダーをwhisper-cppに設定
  if (currentSettings.provider !== 'whisper-cpp') {
    console.log('✅ Setting provider to whisper-cpp...')
    sttService.setProvider('whisper-cpp')
  }
  
  // 推奨モデルを有効化
  recommendedModels.forEach(model => {
    if (!sttService.isModelEnabled(model.id)) {
      console.log(`✅ Enabling recommended model: ${model.id}`)
      sttService.toggleModel(model.id)
    }
  })
  
  // デフォルトモデルを設定
  const defaultModel = 'tiny-q5_1'
  if (currentSettings.defaultModel !== defaultModel) {
    console.log(`✅ Setting default model to: ${defaultModel}`)
    sttService.setDefaultModel(defaultModel)
  }
  
  // 修正後の設定を確認
  const updatedSettings = sttService.getSettings()
  console.log('\n6. Updated STT Settings:')
  console.log('Enabled:', updatedSettings.enabled)
  console.log('Provider:', updatedSettings.provider)
  console.log('Default Model:', updatedSettings.defaultModel)
  console.log('Enabled Models:', sttService.getEnabledModels())
  
  // 設定が正しく適用されているかテスト
  console.log('\n7. Settings Validation:')
  console.log('STT Enabled:', sttService.isEnabled())
  console.log('Provider:', sttService.getProvider())
  console.log('Current Model:', sttService.getCurrentModel())
  console.log('Language:', sttService.getLanguage())
  
  // モデルのダウンロード状態をチェック
  console.log('\n8. Model Download Status:')
  const enabledModelIds = sttService.getEnabledModels()
  for (const modelId of enabledModelIds) {
    const isDownloaded = await sttService.checkModelDownloadStatus(modelId)
    console.log(`${modelId}: ${isDownloaded ? '✅ Downloaded' : '❌ Not Downloaded'}`)
  }
  
  console.log('\n✅ STT Settings test and fix completed!')
  
  return updatedSettings
}

/**
 * ブラウザ環境での設定確認
 */
function checkBrowserEnvironment() {
  console.log('\n=== Browser Environment Check ===')
  console.log('Window available:', typeof window !== 'undefined')
  console.log('Document available:', typeof document !== 'undefined')
  console.log('LocalStorage available:', typeof localStorage !== 'undefined')
  
  if (typeof localStorage !== 'undefined') {
    const sttSettings = localStorage.getItem('armis_stt_settings')
    console.log('STT Settings in localStorage:', sttSettings ? JSON.parse(sttSettings) : 'Not found')
  }
}

// メイン実行
async function main() {
  checkBrowserEnvironment()
  await testAndFixSTTSettings()
}

// 実行
if (typeof window !== 'undefined') {
  // ブラウザ環境
  main().catch(console.error)
} else {
  // Node.js環境
  console.log('This script is designed for browser environment')
}

export { testAndFixSTTSettings, checkBrowserEnvironment }
