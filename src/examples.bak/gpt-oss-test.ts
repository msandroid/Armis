import { LlamaCppService } from '@/services/llm/llama-cpp-service'

async function testGptOss20B() {
  console.log('🚀 Testing GPT-OSS-20B Model...\n')

  try {
    // LlamaCppServiceの初期化（gpt-oss-20B用の最適化設定）
    const llamaCppService = new LlamaCppService({
      modelPath: './models/unsloth/gpt-oss-20b-GGUF/gpt-oss-20b-F16.gguf',
      temperature: 0.7,
      maxTokens: 2048,
      contextSize: 8192, // gpt-oss-20Bの大きなコンテキストサイズ
      threads: 8, // より多くのスレッド
      gpuLayers: 0, // CPU推論（GPUがある場合は調整可能）
      verbose: true
    })

    console.log('📥 Initializing LlamaCpp Service...')
    await llamaCppService.initialize()
    console.log('✅ LlamaCpp Service initialized successfully\n')

    // 基本的なテキスト生成テスト
    console.log('🧪 Testing basic text generation...')
    const response = await llamaCppService.generateResponse("こんにちは！あなたは何ができますか？")
    console.log('📝 Response:', response.text)
    console.log('✅ Basic text generation test passed\n')

    // チャット形式でのテスト
    console.log('💬 Testing chat format...')
    const messages = [
      { 
        role: 'system', 
        content: 'Reasoning: high\nあなたは強力な推論能力を持つAIアシスタントです。' 
      },
      { role: 'user', content: '1+1は何ですか？理由も含めて説明してください。' }
    ]
    
    const chatResponse = await llamaCppService.chat(messages)
    console.log('💭 Chat Response:', chatResponse.text)
    console.log('✅ Chat format test passed\n')

    // 推論能力のテスト
    console.log('🧠 Testing reasoning capabilities...')
    const reasoningPrompt = `
以下の問題を解決してください：

太郎は5個のりんごを持っています。花子は3個のりんごを持っています。
二人がりんごを合わせると、全部で何個になりますか？

ステップバイステップで考えてください。
`
    
    const reasoningResponse = await llamaCppService.generateResponse(reasoningPrompt)
    console.log('🤔 Reasoning Response:', reasoningResponse.text)
    console.log('✅ Reasoning test passed\n')

    console.log('🎉 All tests passed! GPT-OSS-20B is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
  }
}

// テスト実行
testGptOss20B().catch(console.error)
