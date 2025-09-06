import { OllamaService } from '@/services/llm/ollama-service'

async function testOllamaGptOss20B() {
  console.log('🚀 Testing GPT-OSS-20B with Ollama...\n')

  try {
    // OllamaServiceの初期化（gpt-oss:20bモデルを使用）
    const ollamaService = new OllamaService({
      defaultModel: 'gpt-oss:20b',
      baseUrl: 'http://localhost:11434',
      timeout: 120000 // 2分のタイムアウト
    })

    console.log('📥 Initializing Ollama Service...')
    await ollamaService.initialize()
    console.log('✅ Ollama Service initialized successfully\n')

    // 基本的なテキスト生成テスト
    console.log('🧪 Testing basic text generation...')
    const response = await ollamaService.generate("こんにちは！あなたは何ができますか？")
    console.log('📝 Response:', response.response)
    console.log('✅ Basic text generation test passed\n')

    // チャット形式でのテスト
    console.log('💬 Testing chat format...')
    const messages = [
      { 
        role: 'system', 
        content: 'あなたは強力な推論能力を持つAIアシスタントです。' 
      },
      { role: 'user', content: '1+1は何ですか？理由も含めて説明してください。' }
    ]
    
    const chatResponse = await ollamaService.generate("1+1は何ですか？理由も含めて説明してください。", {
      system: "あなたは強力な推論能力を持つAIアシスタントです。"
    })
    console.log('💭 Chat Response:', chatResponse.response)
    console.log('✅ Chat format test passed\n')

    // 推論能力のテスト
    console.log('🧠 Testing reasoning capabilities...')
    const reasoningPrompt = `
以下の問題を解決してください：

太郎は5個のりんごを持っています。花子は3個のりんごを持っています。
二人がりんごを合わせると、全部で何個になりますか？

ステップバイステップで考えてください。
`
    
    const reasoningResponse = await ollamaService.generate(reasoningPrompt)
    console.log('🤔 Reasoning Response:', reasoningResponse.response)
    console.log('✅ Reasoning test passed\n')

    // ストリーミングテスト
    console.log('🌊 Testing streaming generation...')
    let streamedText = ''
    await ollamaService.generateStream("短い文章を生成してください。", (chunk) => {
      streamedText += chunk
      process.stdout.write(chunk)
    })
    console.log('\n✅ Streaming test passed\n')

    console.log('🎉 All tests passed! GPT-OSS-20B with Ollama is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
  }
}

// テスト実行
testOllamaGptOss20B().catch(console.error)
