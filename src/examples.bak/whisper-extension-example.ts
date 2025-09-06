import { initializeWhisperExtensionService, getWhisperExtensionService } from '../services/extension-host/whisper-extension-service'
import { STTOptions } from '../types/stt'
import path from 'path'

/**
 * VSCodium拡張としてのwhisper.cpp実行例
 * Extension Host側での実行をシミュレート
 */
async function runWhisperExtensionExample() {
  console.log('=== Whisper Extension Example ===')
  
  try {
    // Extension Host側のサービスを初期化
    console.log('🚀 Initializing WhisperExtensionService...')
    const whisperService = await initializeWhisperExtensionService()
    
    console.log('✅ WhisperExtensionService initialized')
    console.log('Supported formats:', whisperService.getSupportedFormats())
    console.log('Available models:', await whisperService.getAvailableModels())
    
    // テスト用の音声ファイル
    const testAudioFile = path.join(process.cwd(), 'whisper.cpp/samples/jfk.wav')
    
    // 基本的な音声認識
    console.log('\n🎤 Testing basic transcription...')
    const result = await whisperService.transcribeFile(testAudioFile, {
      language: 'en'
    })
    
    console.log('📝 Basic transcription result:')
    console.log('Text:', result.text)
    console.log('Language:', result.language)
    console.log('Confidence:', result.confidence)
    
    // バッチ処理のテスト
    console.log('\n📦 Testing batch transcription...')
    const audioFiles = [
      testAudioFile,
      // 他の音声ファイルがあれば追加
    ]
    
    const batchResults = await whisperService.transcribeBatch(audioFiles, {
      language: 'en'
    })
    
    console.log('📊 Batch transcription results:')
    batchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.text.substring(0, 50)}...`)
    })
    
    // リアルタイム処理のテスト（ファイル監視）
    console.log('\n👀 Testing real-time transcription...')
    const watchDir = path.join(process.cwd(), 'temp/audio-watch')
    
    await whisperService.startRealtimeTranscription(
      watchDir,
      (filePath, result) => {
        console.log(`🎵 Real-time transcription: ${path.basename(filePath)}`)
        console.log(`📝 Result: ${result.text}`)
      },
      (filePath, error) => {
        console.error(`❌ Real-time error: ${path.basename(filePath)} - ${error.message}`)
      }
    )
    
    console.log(`📁 Watching directory: ${watchDir}`)
    console.log('💡 Drop audio files here for real-time transcription...')
    console.log('Press Ctrl+C to stop...')
    
  } catch (error) {
    console.error('❌ WhisperExtensionService error:', error)
  }
}

/**
 * 設定変更のテスト
 */
async function testConfigurationUpdate() {
  console.log('\n=== Configuration Update Test ===')
  
  try {
    const whisperService = getWhisperExtensionService()
    
    // 設定を更新
    console.log('🔧 Updating configuration...')
    whisperService.updateConfig({
      language: 'ja',
      outputFormat: 'json'
    })
    
    // 更新された設定でテスト
    const testAudioFile = path.join(process.cwd(), 'whisper.cpp/samples/jfk.wav')
    const result = await whisperService.transcribeFile(testAudioFile)
    
    console.log('📝 Updated configuration result:')
    console.log('Text:', result.text)
    console.log('Language:', result.language)
    
  } catch (error) {
    console.error('❌ Configuration update error:', error)
  }
}

/**
 * エラーハンドリングのテスト
 */
async function testErrorHandling() {
  console.log('\n=== Error Handling Test ===')
  
  try {
    const whisperService = getWhisperExtensionService()
    
    // 存在しないファイルでテスト
    const nonExistentFile = path.join(process.cwd(), 'non-existent.wav')
    
    console.log('🧪 Testing with non-existent file...')
    try {
      await whisperService.transcribeFile(nonExistentFile)
    } catch (error) {
      console.log('✅ Error properly caught:', error instanceof Error ? error.message : error)
    }
    
    // 無効な音声ファイルでテスト
    const invalidFile = path.join(process.cwd(), 'package.json') // テキストファイル
    
    console.log('🧪 Testing with invalid audio file...')
    try {
      await whisperService.transcribeFile(invalidFile)
    } catch (error) {
      console.log('✅ Error properly caught:', error instanceof Error ? error.message : error)
    }
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error)
  }
}

// メイン実行
async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'basic'

  switch (mode) {
    case 'basic':
      await runWhisperExtensionExample()
      break
    case 'config':
      await testConfigurationUpdate()
      break
    case 'error':
      await testErrorHandling()
      break
    case 'all':
      await runWhisperExtensionExample()
      await testConfigurationUpdate()
      await testErrorHandling()
      break
    default:
      console.log('Usage: npm run whisper:extension-test [basic|config|error|all]')
      console.log('  basic: 基本的な拡張機能テスト')
      console.log('  config: 設定変更テスト')
      console.log('  error: エラーハンドリングテスト')
      console.log('  all: 全てのテストを実行')
  }
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { 
  runWhisperExtensionExample, 
  testConfigurationUpdate, 
  testErrorHandling 
}
