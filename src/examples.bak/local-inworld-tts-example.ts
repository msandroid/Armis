import { createLocalInworldTTSService } from '../services/tts/local-inworld-tts-service'

async function testLocalInworldTTS() {
  console.log('=== Local Inworld TTS Example ===')
  
  // Electron環境かどうかをチェック
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI
  if (!isElectron) {
    console.error('❌ This example requires Electron environment')
    console.log('Please run this in Electron: npm run electron:dev')
    return
  }
  
  console.log('✅ Running in Electron environment')
  
  const ttsService = createLocalInworldTTSService({
    pythonPath: 'python3',
    modelsDir: './models/inworld-tts-local',
    autoSetup: true,
    model: 'tts-1',
    defaultVoice: 'tts-1',
    defaultLanguage: 'en-US'
  })

  // サービスが利用可能かチェック
  const status = await (ttsService as any).getSetupStatus()
  console.log('Setup status:', status)
  
  if (!ttsService.isAvailable()) {
    console.error('❌ Local TTS service is not available')
    console.log('This might be due to:')
    console.log('1. Python not installed')
    console.log('2. Setup not completed')
    console.log('3. Models not downloaded')
    return
  }
  
  console.log('✅ Local TTS service is available')

  try {
    const speakers = await ttsService.getAvailableSpeakers()
    console.log('Available voices:', speakers.map(s => `${s.name} (${s.voiceName})`))
  } catch (error) {
    console.error('Failed to get available speakers:', error)
  }

  const testTexts = [
    'Hello, this is a test of the local Inworld TTS system.',
    'こんにちは、これはローカルInworld TTSシステムのテストです。',
    'The quick brown fox jumps over the lazy dog.'
  ]

  for (let i = 0; i < testTexts.length; i++) {
    const text = testTexts[i]
    console.log(`\n🎤 Synthesizing: "${text}"`)
    
    try {
      const startTime = Date.now()
      const result = await ttsService.synthesize(text, {
        speaker: {
          voiceName: 'tts-1',
          language: 'en-US'
        },
        format: 'wav',
        sampleRate: 24000,
        speed: 1.0
      })
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`✅ Synthesis completed in ${duration}ms`)
      console.log(`   Format: ${result.format}`)
      console.log(`   Sample Rate: ${result.sampleRate}Hz`)
      console.log(`   Audio Data Size: ${(result.audioData.byteLength / 1024).toFixed(2)}KB`)
      
      // 音声データをBase64文字列として保存（デバッグ用）
      const uint8Array = new Uint8Array(result.audioData)
      const binaryString = Array.from(uint8Array)
        .map(byte => String.fromCharCode(byte))
        .join('')
      const base64Audio = btoa(binaryString)
      
      console.log(`   Base64 Audio (first 100 chars): ${base64Audio.substring(0, 100)}...`)
      
    } catch (error) {
      console.error(`❌ Synthesis failed:`, error)
    }
  }

  console.log('\n📋 Supported formats:', ttsService.getSupportedFormats())
  console.log('🌍 Supported languages:', ttsService.getSupportedLanguages())
}

if (require.main === module) {
  testLocalInworldTTS().catch(console.error)
}

export { testLocalInworldTTS }
