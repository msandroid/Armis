import { WhisperServiceFactory } from '../services/stt/whisper-service-factory'
import { STTService } from '../types/stt'
import path from 'path'

/**
 * WhisperServiceFactoryのテスト
 */
async function testWhisperServiceFactory() {
  console.log('=== WhisperServiceFactory Test ===')
  
  try {
    // 1. 利用可能なサービスをテスト
    console.log('\n1. Testing available services...')
    const availableServices = await WhisperServiceFactory.testAvailableServices()
    console.log('Available services:', availableServices)
    
    // 2. 自動選択でサービスを作成
    console.log('\n2. Creating service with auto-selection...')
    const autoService = await WhisperServiceFactory.createWhisperService()
    console.log('Auto-selected service type:', autoService.constructor.name)
    
    // 3. Node.js版を優先して作成
    console.log('\n3. Creating service with Node.js preference...')
    const nodeService = await WhisperServiceFactory.createWhisperServiceWithFallback('node')
    console.log('Node.js service created:', nodeService.constructor.name)
    
    // 4. 実際の音声認識をテスト
    console.log('\n4. Testing actual transcription...')
    const testAudioFile = path.join(process.cwd(), 'whisper.cpp/samples/jfk.wav')
    
    if (nodeService.isAvailable()) {
      console.log('✅ Node.js service is available')
      
      // ファイルをArrayBufferに変換
      const fs = await import('fs')
      const audioData = fs.readFileSync(testAudioFile)
      
      const result = await nodeService.transcribe(audioData, {
        language: 'en'
      })
      
      console.log('📝 Transcription result:')
      console.log('Text:', result.text)
      console.log('Language:', result.language)
      console.log('Confidence:', result.confidence)
      console.log('Duration:', result.duration)
    } else {
      console.log('❌ Node.js service is not available')
    }
    
    // 5. Local版を優先して作成（フォールバックテスト）
    console.log('\n5. Testing fallback to Local service...')
    try {
      const localService = await WhisperServiceFactory.createWhisperServiceWithFallback('local')
      console.log('Local service created:', localService.constructor.name)
    } catch (error) {
      console.log('❌ Local service fallback failed:', error)
    }
    
  } catch (error) {
    console.error('❌ WhisperServiceFactory test failed:', error)
  }
}

/**
 * 環境情報を表示
 */
async function showEnvironmentInfo() {
  console.log('\n=== Environment Information ===')
  console.log('Node.js version:', process.version)
  console.log('Platform:', process.platform)
  console.log('Architecture:', process.arch)
  console.log('Current working directory:', process.cwd())
  
  // whisper.cppの存在確認
  const fs = await import('fs')
  const whisperPath = path.join(process.cwd(), 'whisper.cpp/build/bin/whisper-cli')
  const modelPath = path.join(process.cwd(), 'whisper.cpp/models/ggml-tiny.bin')
  
  console.log('Whisper CLI exists:', fs.existsSync(whisperPath))
  console.log('Whisper model exists:', fs.existsSync(modelPath))
}

// メイン実行
async function main() {
  showEnvironmentInfo()
  await testWhisperServiceFactory()
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { testWhisperServiceFactory, showEnvironmentInfo }
