import { OllamaService } from '@/services/llm/ollama-service'
import { LLMManager } from '@/services/llm/llm-manager'

// Ollamaサービスの基本的な使用例
export async function basicOllamaUsage() {
  console.log('=== Ollama Basic Usage Example ===')

  // 1. Ollamaサービスの初期化（gemma3:1bが自動ダウンロードされます）
  const ollamaService = new OllamaService({
    defaultModel: 'gemma3:1b',
    baseUrl: 'http://localhost:11434',
    timeout: 30000
  })

  try {
    // 2. サービスの初期化（gemma3:1bが存在しない場合は自動ダウンロード）
    console.log('🔄 Initializing Ollama service...')
    await ollamaService.initialize()
    console.log('✅ Ollama service initialized successfully')

    // 3. 利用可能なモデルを一覧表示
    const models = await ollamaService.listModels()
    console.log('📋 Available models:', models.map(m => m.name))

    // 4. 基本的なテキスト生成
    const response = await ollamaService.generate(
      'こんにちは！今日の天気について教えてください。',
      {
        options: {
          temperature: 0.7,
          num_predict: 100
        }
      }
    )
    console.log('🤖 Generated response:', response.response)

    // 5. ストリーミング生成
    console.log('🔄 Streaming generation...')
    await ollamaService.generateStream(
      '日本の文化について簡単に説明してください。',
      {
        options: {
          temperature: 0.8,
          num_predict: 150
        }
      },
      (chunk) => {
        process.stdout.write(chunk.response)
      }
    )

    // 6. チャット形式での生成
    const chatResponse = await ollamaService.chat([
      { role: 'system', content: 'あなたは親切なアシスタントです。' },
      { role: 'user', content: 'プログラミングについて教えてください。' }
    ])
    console.log('💬 Chat response:', chatResponse.response)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// モデル管理の例
export async function modelManagementExample() {
  console.log('=== Ollama Model Management Example ===')

  const ollamaService = new OllamaService()

  try {
    await ollamaService.initialize()

    // 1. 新しいモデルをダウンロード（進捗表示付き）
    console.log('📥 Pulling new model with progress tracking...')
    await ollamaService.pullModelWithProgress(
      'llama3.1:8b',
      (progress, message) => {
        console.log(`📊 ${message}`)
      }
    )
    console.log('✅ Model pulled successfully')

    // 2. モデルを切り替え
    await ollamaService.setDefaultModel('llama3.1:8b')
    console.log('🔄 Model switched to llama3.1:8b')

    // 3. 現在のモデル情報を取得
    const currentModel = ollamaService.getDefaultModel()
    console.log('📋 Current model:', currentModel)

    // 4. モデル情報を取得
    const modelInfo = await ollamaService.getModelInfo('llama3.1:8b')
    if (modelInfo) {
      console.log('📊 Model info:', {
        name: modelInfo.name,
        size: modelInfo.size,
        modified: modelInfo.modified_at
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// LLMマネージャーとの統合例
export async function llmManagerIntegrationExample() {
  console.log('=== LLM Manager Integration Example ===')

  // LLMマネージャーの初期化
  const llmManager = new LLMManager({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7,
    topP: 0.9,
    topK: 40
  })

  try {
    // 1. LLMマネージャーの初期化
    await llmManager.initialize()
    console.log('✅ LLM Manager initialized')

    // 2. Ollamaに切り替え
    await llmManager.switchToOllama()
    console.log('🔄 Switched to Ollama')

    // 3. 利用可能なモデルを一覧表示
    const models = await llmManager.listOllamaModels()
    console.log('📋 Available Ollama models:', models.map(m => m.name))

    // 4. モデルを切り替え
    await llmManager.setOllamaModel('gemma3:4b')
    console.log('🔄 Model switched to gemma3:4b')

    // 5. ユーザーリクエストの処理
    const response = await llmManager.processUserRequest(
      'AIの未来について教えてください。'
    )
    console.log('🤖 Response:', response)

    // 6. システム統計の取得
    const stats = llmManager.getSystemStats()
    console.log('📊 System stats:', {
      llmService: stats.llmService,
      ollamaModel: stats.ollamaModel,
      agents: stats.agents.length
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// 高度な使用例
export async function advancedOllamaUsage() {
  console.log('=== Advanced Ollama Usage Example ===')

  const ollamaService = new OllamaService()

  try {
    await ollamaService.initialize()

    // 1. 複数のモデルでの比較
    const models = ['gemma3:1b', 'gemma3:4b', 'llama3.1:8b']
    
    for (const model of models) {
      console.log(`\n🔍 Testing model: ${model}`)
      
      await ollamaService.setDefaultModel(model)
      
      const startTime = Date.now()
      const response = await ollamaService.generate(
        '以下の文章を要約してください：AI技術は急速に発展しており、私たちの生活を大きく変えています。',
        {
          options: {
            temperature: 0.3,
            num_predict: 100
          }
        }
      )
      const endTime = Date.now()
      
      console.log(`⏱️  Response time: ${endTime - startTime}ms`)
      console.log(`📝 Response: ${response.response}`)
      console.log(`📊 Tokens: ${response.eval_count || 'N/A'}`)
    }

    // 2. カスタムシステムプロンプト
    const customResponse = await ollamaService.generate(
      '今日のニュースについて教えてください。',
      {
        system: 'あなたはニュース専門のアナリストです。客観的で正確な情報を提供してください。',
        options: {
          temperature: 0.5,
          num_predict: 200
        }
      }
    )
    console.log('\n📰 Custom system prompt response:', customResponse.response)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// エラーハンドリングの例
export async function errorHandlingExample() {
  console.log('=== Error Handling Example ===')

  const ollamaService = new OllamaService()

  try {
    // 1. Ollamaが起動していない場合のエラーハンドリング
    await ollamaService.initialize()
  } catch (error) {
    if (error instanceof Error && error.message.includes('not running')) {
      console.log('⚠️  Ollama is not running. Please start Ollama first.')
      console.log('💡 Run: ollama serve')
      return
    }
    throw error
  }

  try {
    // 2. 存在しないモデルを指定した場合
    await ollamaService.setDefaultModel('non-existent-model')
  } catch (error) {
    console.log('⚠️  Model not found, attempting to pull...')
    try {
      await ollamaService.pullModel('non-existent-model')
    } catch (pullError) {
      console.log('❌ Failed to pull model:', pullError)
    }
  }

  try {
    // 3. ネットワークエラーの処理
    const response = await ollamaService.generate('Test message', {
      options: {
        num_predict: 10
      }
    })
    console.log('✅ Success:', response.response)
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('⚠️  Request timed out. Please check your network connection.')
    } else {
      console.log('❌ Unexpected error:', error)
    }
  }
}

// メイン実行関数
export async function runOllamaExamples() {
  console.log('🚀 Starting Ollama Examples...\n')

  try {
    await basicOllamaUsage()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await modelManagementExample()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await llmManagerIntegrationExample()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await advancedOllamaUsage()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await errorHandlingExample()
    
    console.log('\n✅ All examples completed successfully!')
  } catch (error) {
    console.error('❌ Example execution failed:', error)
  }
}

// 個別実行用の関数
export async function runBasicExample() {
  await basicOllamaUsage()
}

export async function runModelManagementExample() {
  await modelManagementExample()
}

export async function runIntegrationExample() {
  await llmManagerIntegrationExample()
}

export async function runAdvancedExample() {
  await advancedOllamaUsage()
}

export async function runErrorHandlingExample() {
  await errorHandlingExample()
}
