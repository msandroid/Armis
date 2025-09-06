import { OllamaService } from '@/services/llm/ollama-service'

async function testOllamaGemma() {
  console.log('🚀 Testing Gemma3:1b with Ollama...\n')

  try {
    // OllamaServiceの初期化（gemma3:1bモデルを使用）
    const ollamaService = new OllamaService({
      defaultModel: 'gemma3:1b',
      baseUrl: 'http://localhost:11434',
      timeout: 60000 // 1分のタイムアウト
    })

    console.log('📥 Initializing Ollama Service...')
    await ollamaService.initialize()
    console.log('✅ Ollama Service initialized successfully\n')

    // 基本的なテキスト生成テスト
    console.log('🧪 Testing basic text generation...')
    const response = await ollamaService.generate("こんにちは！")
    console.log('📝 Response:', response.response)
    console.log('✅ Basic text generation test passed\n')

    // チャット形式でのテスト
    console.log('💬 Testing chat format...')
    const chatResponse = await ollamaService.generate("1+1は何ですか？", {
      system: "あなたは親切なアシスタントです。"
    })
    console.log('💭 Chat Response:', chatResponse.response)
    console.log('✅ Chat format test passed\n')

    // 推論能力のテスト
    console.log('🧠 Testing reasoning capabilities...')
    const reasoningPrompt = `
以下の問題を解決してください：

太郎は5個のりんごを持っています。花子は3個のりんごを持っています。
二人がりんごを合わせると、全部で何個になりますか？
`
    
    const reasoningResponse = await ollamaService.generate(reasoningPrompt)
    console.log('🤔 Reasoning Response:', reasoningResponse.response)
    console.log('✅ Reasoning test passed\n')

    console.log('🎉 All tests passed! Gemma3:1b with Ollama is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
  }
}

// テスト実行
testOllamaGemma().catch(console.error)
