import { createGeminiTTSService } from '../services/tts'
import type { TTSOptions } from '../types/tts'

async function main() {
  console.log('🎤 Gemini TTS Example')
  console.log('=====================')

  // TTSサービスの初期化
  const ttsService = createGeminiTTSService({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
    defaultVoice: 'Kore',
    defaultLanguage: 'ja-JP'
  })

  if (!ttsService.isAvailable()) {
    console.error('❌ TTS service is not available. Please set GOOGLE_GENAI_API_KEY environment variable.')
    return
  }

  console.log('✅ TTS service initialized successfully')

  // 利用可能な音声を取得
  const speakers = await ttsService.getAvailableSpeakers()
  console.log(`📢 Available speakers: ${speakers.length}`)
  
  // 日本語音声のみ表示
  const japaneseSpeakers = speakers.filter(s => s.language === 'ja-JP')
  console.log('🇯🇵 Japanese speakers:')
  japaneseSpeakers.forEach(speaker => {
    console.log(`  - ${speaker.name}: ${speaker.description}`)
  })

  // サポートされている言語を表示
  const languages = ttsService.getSupportedLanguages()
  console.log(`🌍 Supported languages: ${languages.length}`)

  // 基本的なテキスト読み上げ
  console.log('\n🔊 Basic TTS synthesis...')
  try {
    const result = await ttsService.synthesize('こんにちは、世界！今日は素晴らしい一日ですね。')
    console.log(`✅ Audio generated: ${result.audioData.byteLength} bytes`)
    console.log(`📊 Format: ${result.format}, Sample Rate: ${result.sampleRate}Hz, Channels: ${result.channels}`)
    
    // ファイルに保存
    await ttsService.saveToFile(result.audioData, 'output-basic.wav')
  } catch (error) {
    console.error('❌ Basic TTS failed:', error)
  }

  // スタイル付きのテキスト読み上げ
  console.log('\n🎭 Styled TTS synthesis...')
  try {
    const styledOptions: TTSOptions = {
      speaker: {
        voiceName: 'Kore',
        style: 'cheerfully',
        language: 'ja-JP'
      }
    }
    
    const styledResult = await ttsService.synthesize('お疲れ様でした！明日も頑張りましょう！', styledOptions)
    console.log(`✅ Styled audio generated: ${styledResult.audioData.byteLength} bytes`)
    
    await ttsService.saveToFile(styledResult.audioData, 'output-styled.wav')
  } catch (error) {
    console.error('❌ Styled TTS failed:', error)
  }

  // 英語の音声でテスト
  console.log('\n🇺🇸 English TTS synthesis...')
  try {
    const englishOptions: TTSOptions = {
      speaker: {
        voiceName: 'Autonoe',
        style: 'brightly',
        language: 'en-US'
      }
    }
    
    const englishResult = await ttsService.synthesize('Hello, world! This is a test of the Gemini TTS system.', englishOptions)
    console.log(`✅ English audio generated: ${englishResult.audioData.byteLength} bytes`)
    
    await ttsService.saveToFile(englishResult.audioData, 'output-english.wav')
  } catch (error) {
    console.error('❌ English TTS failed:', error)
  }

  // 複数の音声で同じテキストをテスト
  console.log('\n🎵 Multiple voices test...')
  const testText = 'これは複数の音声でのテストです。'
  const testVoices = ['Kore', 'Irrhoe', 'Erinome']
  
  for (const voiceName of testVoices) {
    try {
      const options: TTSOptions = {
        speaker: {
          voiceName,
          language: 'ja-JP'
        }
      }
      
      const result = await ttsService.synthesize(testText, options)
      console.log(`✅ ${voiceName}: ${result.audioData.byteLength} bytes`)
      
      await ttsService.saveToFile(result.audioData, `output-${voiceName.toLowerCase()}.wav`)
    } catch (error) {
      console.error(`❌ ${voiceName} failed:`, error)
    }
  }

  console.log('\n🎉 TTS example completed!')
  console.log('📁 Check the generated .wav files in the current directory.')
}

// エラーハンドリング
main().catch(error => {
  console.error('❌ Example failed:', error)
  process.exit(1)
})
