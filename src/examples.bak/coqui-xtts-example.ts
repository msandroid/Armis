import { createCoquiXTTSService } from '../services/tts/coqui-xtts-service'
import { TTSManager } from '../services/tts/tts-manager'

/**
 * Coqui XTTS-v2 TTS Service 使用例
 */

// 基本的な音声合成の例
async function basicSynthesisExample() {
  console.log('🎤 Basic XTTS-v2 Synthesis Example')
  
  try {
    // XTTS-v2サービスの初期化
    const xttsService = createCoquiXTTSService({
      pythonPath: 'python3',
      modelsDir: './models/coqui-xtts',
      autoSetup: true
    })

    // 基本的な音声合成
    const result = await xttsService.synthesize('Hello, this is a test of XTTS-v2 synthesis.', {
      speaker: {
        voiceName: 'p225',
        language: 'en'
      },
      speed: 1.0
    })

    console.log('✅ Synthesis completed:', {
      format: result.format,
      sampleRate: result.sampleRate,
      duration: result.duration
    })

    // 音声データの再生
    await playAudio(result.audioData)
    
  } catch (error) {
    console.error('❌ Basic synthesis failed:', error)
  }
}

// 多言語音声合成の例
async function multilingualSynthesisExample() {
  console.log('🌍 Multilingual XTTS-v2 Synthesis Example')
  
  try {
    const xttsService = createCoquiXTTSService()
    
    const languages = [
      { text: 'Hello, how are you?', lang: 'en', voice: 'p225' },
      { text: 'こんにちは、お元気ですか？', lang: 'ja', voice: 'p227' },
      { text: '你好，你好吗？', lang: 'zh-cn', voice: 'p226' },
      { text: '안녕하세요, 잘 지내세요?', lang: 'ko', voice: 'p228' }
    ]

    for (const { text, lang, voice } of languages) {
      console.log(`🎤 Synthesizing in ${lang}: ${text}`)
      
      const result = await xttsService.synthesize(text, {
        speaker: {
          voiceName: voice,
          language: lang
        },
        speed: 1.0
      })

      console.log(`✅ ${lang} synthesis completed`)
      await playAudio(result.audioData)
      
      // 音声間の間隔
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
  } catch (error) {
    console.error('❌ Multilingual synthesis failed:', error)
  }
}

// 異なる音声での合成例
async function differentVoicesExample() {
  console.log('🎭 Different Voices XTTS-v2 Example')
  
  try {
    const xttsService = createCoquiXTTSService()
    
    const voices = [
      { id: 'p225', name: 'Female Voice 1', text: 'This is a female voice speaking.' },
      { id: 'p226', name: 'Male Voice 1', text: 'This is a male voice speaking.' },
      { id: 'p227', name: 'Female Voice 2', text: 'This is another female voice.' },
      { id: 'p228', name: 'Male Voice 2', text: 'This is another male voice.' }
    ]

    for (const { id, name, text } of voices) {
      console.log(`🎤 Using ${name} (${id})`)
      
      const result = await xttsService.synthesize(text, {
        speaker: {
          voiceName: id,
          language: 'en'
        },
        speed: 1.0
      })

      console.log(`✅ ${name} synthesis completed`)
      await playAudio(result.audioData)
      
      // 音声間の間隔
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
  } catch (error) {
    console.error('❌ Different voices synthesis failed:', error)
  }
}

// 速度調整の例
async function speedControlExample() {
  console.log('⚡ Speed Control XTTS-v2 Example')
  
  try {
    const xttsService = createCoquiXTTSService()
    
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5]
    const text = 'This is a test of different speech speeds.'

    for (const speed of speeds) {
      console.log(`🎤 Synthesizing at ${speed}x speed`)
      
      const result = await xttsService.synthesize(text, {
        speaker: {
          voiceName: 'p225',
          language: 'en'
        },
        speed: speed
      })

      console.log(`✅ ${speed}x speed synthesis completed`)
      await playAudio(result.audioData)
      
      // 音声間の間隔
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
  } catch (error) {
    console.error('❌ Speed control synthesis failed:', error)
  }
}

// TTSManagerでの使用例
async function ttsManagerExample() {
  console.log('🎛️ TTSManager with XTTS-v2 Example')
  
  try {
    // TTSManagerでXTTS-v2をプライマリサービスとして設定
    const ttsManager = new TTSManager({
      primaryService: 'coqui-xtts',
      enableFallback: true,
      coquiXTTSConfig: {
        pythonPath: 'python3',
        modelsDir: './models/coqui-xtts',
        autoSetup: true
      }
    })

    // 利用可能なサービスを確認
    const availableServices = ttsManager.getAvailableServices()
    console.log('Available TTS services:', availableServices)

    // 音声合成
    const result = await ttsManager.synthesize('This is a test using TTSManager with XTTS-v2.', {
      speaker: {
        voiceName: 'p225',
        language: 'en'
      },
      speed: 1.0
    })

    console.log('✅ TTSManager synthesis completed')
    await playAudio(result.audioData)
    
  } catch (error) {
    console.error('❌ TTSManager synthesis failed:', error)
  }
}

// 利用可能な音声一覧の取得例
async function listVoicesExample() {
  console.log('📋 List Available Voices Example')
  
  try {
    const xttsService = createCoquiXTTSService()
    
    const speakers = await xttsService.getAvailableSpeakers()
    console.log('Available speakers:', speakers)

    const formats = xttsService.getSupportedFormats()
    console.log('Supported formats:', formats)

    const languages = xttsService.getSupportedLanguages()
    console.log('Supported languages:', languages)
    
  } catch (error) {
    console.error('❌ List voices failed:', error)
  }
}

// 音声データを再生するヘルパー関数
async function playAudio(audioData: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioBlob = new Blob([audioData], { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        resolve()
      }
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl)
        reject(error)
      }
      
      audio.play().catch(reject)
      
    } catch (error) {
      reject(error)
    }
  })
}

// メイン実行関数
export async function runCoquiXTTSSExamples() {
  console.log('🚀 Starting Coqui XTTS-v2 Examples')
  
  try {
    // 基本的な合成例
    await basicSynthesisExample()
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 多言語合成例
    await multilingualSynthesisExample()
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 異なる音声例
    await differentVoicesExample()
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 速度調整例
    await speedControlExample()
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // TTSManager例
    await ttsManagerExample()
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 音声一覧取得例
    await listVoicesExample()
    
    console.log('✅ All XTTS-v2 examples completed successfully!')
    
  } catch (error) {
    console.error('❌ XTTS-v2 examples failed:', error)
  }
}

// 個別の例を実行する関数
export {
  basicSynthesisExample,
  multilingualSynthesisExample,
  differentVoicesExample,
  speedControlExample,
  ttsManagerExample,
  listVoicesExample
}
