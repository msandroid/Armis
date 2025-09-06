import { createInworldTTSService } from '../services/tts/inworld-tts-service'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function testInworldTTS() {
  console.log('=== Inworld AI TTS Example ===')

  // Inworld AI APIキーを環境変数から取得
  const apiKey = process.env.INWORLD_API_KEY || process.env.VITE_INWORLD_API_KEY
  
  if (!apiKey) {
    console.error('❌ INWORLD_API_KEY environment variable is not set')
    console.log('Please set your Inworld AI API key:')
    console.log('export INWORLD_API_KEY=your_api_key_here')
    return
  }

  // Inworld TTSサービスを作成
  const ttsService = createInworldTTSService({
    apiKey: apiKey,
    model: 'inworld-tts-1',
    defaultVoice: 'Ashley',
    defaultLanguage: 'en'
  })

  // サービスが利用可能かチェック
  if (!ttsService.isAvailable()) {
    console.error('❌ Inworld TTS service is not available')
    return
  }

  console.log('✅ Inworld TTS service is available')

  // 利用可能な音声を取得
  try {
    const speakers = await ttsService.getAvailableSpeakers()
    console.log('Available voices:', speakers.map(s => `${s.name} (${s.voiceName})`))
  } catch (error) {
    console.error('Failed to get available speakers:', error)
  }

  // 音声合成をテスト
  const testTexts = [
    'Hello, this is a test of the Inworld AI text-to-speech system.',
    'こんにちは、これはInworld AIの音声合成システムのテストです。',
    'The quick brown fox jumps over the lazy dog.'
  ]

  for (let i = 0; i < testTexts.length; i++) {
    const text = testTexts[i]
    console.log(`\n🎤 Synthesizing: "${text}"`)

    try {
      const startTime = Date.now()
      
      const result = await ttsService.synthesize(text, {
        speaker: {
          voiceName: 'Ashley',
          language: 'en'
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

      // オーディオファイルを保存
      const outputPath = join(__dirname, `../../output/inworld-tts-test-${i + 1}.wav`)
      
      // ArrayBufferをBufferに変換
      const buffer = Buffer.from(result.audioData)
      writeFileSync(outputPath, buffer)
      
      console.log(`💾 Audio saved to: ${outputPath}`)

    } catch (error) {
      console.error(`❌ Synthesis failed:`, error)
    }
  }

  // サポートされている形式と言語を表示
  console.log('\n📋 Supported formats:', ttsService.getSupportedFormats())
  console.log('🌍 Supported languages:', ttsService.getSupportedLanguages())
}

// スクリプトを実行
if (require.main === module) {
  testInworldTTS().catch(console.error)
}

export { testInworldTTS }
