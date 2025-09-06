import { Qwen2_5OmniService } from '@/services/llm/qwen2.5-omni-service'

/**
 * Qwen2.5-Omni 3B モデルの使用例
 * 
 * このファイルは、Qwen2.5-Omni-3B-GGUFモデルの基本的な使用方法を示します。
 * マルチモーダル機能（テキスト、画像、音声、動画）と音声生成機能を含みます。
 * 
 * 使用方法:
 * 1. モデルファイルをダウンロード: https://huggingface.co/unsloth/Qwen2.5-Omni-3B-GGUF
 * 2. このファイルを実行: npx tsx src/examples/qwen2.5-omni-3b-usage.ts
 */

async function main() {
  console.log('🚀 Qwen2.5-Omni 3B 使用例を開始します...')

  // Qwen2.5-Omni 3Bサービスの初期化
  const qwenOmniService = new Qwen2_5OmniService({
    modelPath: './models/unsloth/Qwen2.5-Omni-3B-GGUF/Qwen2.5-Omni-3B-Q4_K_M.gguf',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    contextSize: 32768,
    threads: 4,
    gpuLayers: 0,
    verbose: false,
    enableAudioOutput: false, // 音声出力は現在未実装
    speaker: 'Chelsie',
    useAudioInVideo: true
  })

  try {
    // サービスの初期化
    console.log('🔧 Qwen2.5-Omni 3B サービスを初期化中...')
    await qwenOmniService.initialize()
    console.log('✅ 初期化完了')

    // 基本的なテキスト生成
    console.log('\n📝 基本的なテキスト生成テスト...')
    const textResponse = await qwenOmniService.generateResponse(
      "Hello! I am Qwen2.5-Omni 3B. Can you tell me about your capabilities?"
    )
    console.log('📄 応答:', textResponse.text)
    console.log('⏱️ 処理時間:', textResponse.duration, 'ms')
    console.log('🔢 トークン数:', textResponse.tokens)

    // マルチモーダル会話の例
    console.log('\n🎭 マルチモーダル会話テスト...')
    const multimodalConversation = [
      {
        role: 'system' as const,
        content: [
          {
            type: 'text' as const,
            text: 'You are Qwen, a virtual human developed by the Qwen Team, Alibaba Group, capable of perceiving auditory and visual inputs, as well as generating text and speech.'
          }
        ]
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: 'What are your main features as a multimodal AI model?'
          }
        ]
      }
    ]

    const multimodalResponse = await qwenOmniService.generateMultimodalResponse(
      multimodalConversation,
      { returnAudio: false, speaker: 'Ethan' }
    )
    console.log('🎭 マルチモーダル応答:', multimodalResponse.text)
    console.log('⏱️ 処理時間:', multimodalResponse.duration, 'ms')

    // 音声生成のテスト（将来実装予定）
    console.log('\n🎤 音声生成テスト（将来実装予定）...')
    const audioResponse = await qwenOmniService.generateAudio(
      "Hello! This is a test of audio generation with Qwen2.5-Omni 3B.",
      'Chelsie'
    )
    if (audioResponse) {
      console.log('🎵 音声生成成功:', audioResponse.byteLength, 'bytes')
    } else {
      console.log('⚠️ 音声生成は現在未実装です')
    }

    // 設定の確認
    console.log('\n⚙️ 現在の設定:')
    const config = qwenOmniService.getConfig()
    console.log('📁 モデルパス:', config.modelPath)
    console.log('🌡️ 温度:', config.temperature)
    console.log('🔢 最大トークン数:', config.maxTokens)
    console.log('🎤 音声出力:', config.enableAudioOutput)
    console.log('🗣️ スピーカー:', config.speaker)

    // 準備状態の確認
    console.log('\n🔍 サービス準備状態:', qwenOmniService.isReady())

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// 環境チェック関数
async function checkEnvironment() {
  console.log('🔍 環境チェック中...')
  
  // Node.js環境の確認
  if (typeof window !== 'undefined') {
    console.log('⚠️ ブラウザ環境では実行できません')
    return false
  }

  // ファイルシステムの確認
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    // モデルファイルの確認
    const modelPath = './models/unsloth/Qwen2.5-Omni-3B-GGUF/Qwen2.5-Omni-3B-Q4_K_M.gguf'
    if (fs.existsSync(modelPath)) {
      console.log('✅ Qwen2.5-Omni 3B model file found')
    } else {
      console.log('⚠️ Qwen2.5-Omni 3B model file not found')
      console.log('   Please download from: https://huggingface.co/unsloth/Qwen2.5-Omni-3B-GGUF')
      console.log('   Expected path:', path.resolve(modelPath))
    }

    // ディレクトリの確認
    const modelDir = './models/unsloth/Qwen2.5-Omni-3B-GGUF'
    if (fs.existsSync(modelDir)) {
      console.log('✅ Model directory exists')
      const files = fs.readdirSync(modelDir)
      console.log('📁 Available files:', files)
    } else {
      console.log('⚠️ Model directory not found')
    }

    return true
  } catch (error) {
    console.error('❌ Environment check failed:', error)
    return false
  }
}

// メイン実行
if (require.main === module) {
  checkEnvironment().then((isReady) => {
    if (isReady) {
      main().catch(console.error)
    } else {
      console.log('❌ Environment is not ready for Qwen2.5-Omni 3B')
    }
  })
}

export { main, checkEnvironment }
