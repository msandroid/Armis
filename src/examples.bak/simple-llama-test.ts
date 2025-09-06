import { getLlama } from 'node-llama-cpp'

async function testSimpleLlama() {
  console.log('🚀 Testing Simple Llama Setup...\n')

  try {
    // 1. Llamaインスタンスの作成
    console.log('📥 Creating Llama instance...')
    const llama = await getLlama()
    console.log('✅ Llama instance created\n')

    // 2. システム情報の表示
    console.log('💻 System Information:')
    console.log('Build Type:', llama.buildType)
    console.log('CPU Math Cores:', llama.cpuMathCores)
    console.log('Max Threads:', llama.maxThreads)
    console.log('GPU Support:', llama.supportsGpuOffloading)
    console.log('')

    // 3. モデルの読み込み
    console.log('📁 Loading model...')
    const modelPath = './models/unsloth/gpt-oss-20b-GGUF/gpt-oss-20b-F16.gguf'
    
    // ファイルの存在確認
    const fs = await import('fs')
    if (!fs.existsSync(modelPath)) {
      console.error(`❌ Model file not found: ${modelPath}`)
      return
    }
    
    console.log('✅ Model file exists')
    
    // モデルの読み込みを試行
    try {
      const model = await llama.loadModel(modelPath)
      console.log('✅ Model loaded successfully')
      console.log('Model type:', typeof model)
      
      // モデルのメソッドを確認
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(model))
      console.log('Available methods:', methods.slice(0, 10)) // 最初の10個のみ表示
      
    } catch (error) {
      console.error('❌ Failed to load model:', error)
      console.error('Error details:', error instanceof Error ? error.message : error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
  }
}

// テスト実行
testSimpleLlama().catch(console.error)
