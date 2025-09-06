import { Qwen2_5OmniService } from '@/services/llm/qwen2.5-omni-service'

/**
 * Qwen2.5-Omni モデルの使用例
 * 
 * このスクリプトは、Qwen2.5-Omniモデルを使用してマルチモーダルAI推論を行う方法を示します。
 * 
 * 前提条件:
 * 1. node-llama-cppパッケージがインストールされている
 * 2. Qwen2.5-Omni GGUFモデルファイルが./models/ディレクトリに配置されている
 * 3. Node.js環境で実行される（ブラウザでは動作しません）
 */

async function main() {
  console.log('🚀 Qwen2.5-Omni 使用例を開始します...')

  // Qwen2.5-Omniサービスの初期化
  const qwenOmniService = new Qwen2_5OmniService({
    modelPath: './models/unsloth/Qwen2.5-Omni-7B-GGUF/Qwen2.5-Omni-7B-Q4_K_M.gguf',
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
    console.log('📥 Qwen2.5-Omniサービスを初期化中...')
    await qwenOmniService.initialize()
    console.log('✅ Qwen2.5-Omniサービスが初期化されました')

    // 基本的なテキスト生成
    console.log('\n📝 基本的なテキスト生成テスト...')
    const basicResponse = await qwenOmniService.generateResponse(
      "Hello! I am Qwen2.5-Omni, a multimodal AI model. Can you tell me about your capabilities?"
    )
    console.log('🤖 応答:', basicResponse.text)
    console.log(`⏱️ 生成時間: ${basicResponse.duration}ms`)
    console.log(`🔢 トークン数: ${basicResponse.tokens}`)

    // マルチモーダル会話の例
    console.log('\n🖼️ マルチモーダル会話テスト...')
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
            text: 'Hello! I have an image and some audio. Can you help me understand what you see and hear?'
          },
          {
            type: 'image' as const,
            image: '/path/to/image.jpg'
          },
          {
            type: 'audio' as const,
            audio: '/path/to/audio.wav'
          }
        ]
      }
    ]

    const multimodalResponse = await qwenOmniService.generateMultimodalResponse(
      multimodalConversation,
      {
        returnAudio: false,
        speaker: 'Ethan',
        useAudioInVideo: true
      }
    )
    console.log('🤖 マルチモーダル応答:', multimodalResponse.text)
    console.log(`🎤 スピーカー: ${multimodalResponse.speaker}`)

    // 音声生成のテスト（現在はプレースホルダー）
    console.log('\n🎤 音声生成テスト...')
    const audioResponse = await qwenOmniService.generateAudio(
      "Hello! This is a test of audio generation with Qwen2.5-Omni.",
      'Chelsie'
    )
    if (audioResponse) {
      console.log('✅ 音声が生成されました')
    } else {
      console.log('⚠️ 音声生成は現在未実装です')
    }

    // 設定の変更
    console.log('\n⚙️ 設定変更テスト...')
    qwenOmniService.setSpeaker('Ethan')
    qwenOmniService.enableAudioOutput()
    
    const config = qwenOmniService.getConfig()
    console.log('📋 現在の設定:', {
      speaker: config.speaker,
      enableAudioOutput: config.enableAudioOutput,
      temperature: config.temperature,
      contextSize: config.contextSize
    })

    // 複雑な会話の例
    console.log('\n💬 複雑な会話テスト...')
    const complexConversation = [
      {
        role: 'system' as const,
        content: 'You are Qwen2.5-Omni, a helpful AI assistant with multimodal capabilities.'
      },
      {
        role: 'user' as const,
        content: 'Can you help me with a coding problem? I need to create a function that sorts an array of numbers.'
      },
      {
        role: 'assistant' as const,
        content: 'Of course! I can help you with coding problems. Here\'s a simple function to sort an array of numbers in JavaScript:'
      },
      {
        role: 'user' as const,
        content: 'Great! Can you also explain how the sorting algorithm works?'
      }
    ]

    const complexResponse = await qwenOmniService.generateMultimodalResponse(complexConversation)
    console.log('🤖 複雑な会話応答:', complexResponse.text)

    console.log('\n✅ Qwen2.5-Omni 使用例が完了しました！')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// 環境チェック関数
async function checkEnvironment() {
  console.log('🔍 Qwen2.5-Omni 環境チェック中...')
  
  try {
    // Node.js環境の確認
    if (typeof window !== 'undefined') {
      console.log('❌ ブラウザ環境では実行できません')
      return false
    }
    console.log('✅ Node.js環境を確認')

    // node-llama-cppの確認
    try {
      const nodeLlamaCpp = await import('node-llama-cpp')
      console.log('✅ node-llama-cpp package available')
    } catch (error) {
      console.log('❌ node-llama-cpp package not found')
      console.log('   Install with: npm install node-llama-cpp@3')
      return false
    }

    // ファイルシステムの確認
    const fs = await import('fs')
    const path = await import('path')
    console.log('✅ File system access available')

    // モデルファイルの確認
    const modelPath = './models/unsloth/Qwen2.5-Omni-7B-GGUF/Qwen2.5-Omni-7B-Q4_K_M.gguf'
    if (fs.existsSync(modelPath)) {
      console.log('✅ Qwen2.5-Omni model file found')
    } else {
      console.log('⚠️ Qwen2.5-Omni model file not found')
      console.log('   Please download from: https://huggingface.co/unsloth/Qwen2.5-Omni-7B-GGUF')
      console.log('   Expected path:', path.resolve(modelPath))
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
      main()
    } else {
      console.log('❌ Environment is not ready for Qwen2.5-Omni')
      process.exit(1)
    }
  })
}

export { main, checkEnvironment }
