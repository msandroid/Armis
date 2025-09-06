import { checkEnvironment } from './llama-cpp-text-extraction-example'

/**
 * llama.cpp環境チェック
 * 
 * このスクリプトは、llama.cpp本文抽出機能が動作する環境かどうかを確認します。
 */

async function main() {
  console.log('🔍 LlamaCpp Environment Check\n')
  
  // 1. 環境チェック
  const env = checkEnvironment()
  
  if (!env.isNode) {
    console.log('❌ LlamaCpp functionality requires Node.js environment')
    console.log('   This feature is not available in browser environment')
    return
  }
  
  console.log('✅ Node.js environment detected')
  
  // 2. 必要なパッケージの確認
  console.log('\n📦 Checking required packages...')
  
  try {
    // node-llama-cppの確認
    const nodeLlamaCpp = await import('node-llama-cpp')
    console.log('✅ node-llama-cpp package available')
  } catch (error) {
    console.log('❌ node-llama-cpp package not found')
    console.log('   Install with: npm install node-llama-cpp@3')
    return
  }
  
  try {
    // @langchain/communityの確認
    const { ChatLlamaCpp } = await import('@langchain/community/chat_models/llama_cpp')
    console.log('✅ @langchain/community package available')
  } catch (error) {
    console.log('❌ @langchain/community package not found')
    console.log('   Install with: npm install @langchain/community')
    return
  }
  
  // 3. モデルファイルの確認
  console.log('\n📁 Checking model files...')
  
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const modelsDir = './models'
    if (!fs.existsSync(modelsDir)) {
      console.log('❌ Models directory not found')
      console.log('   Create directory: mkdir models')
      console.log('   Download GGUF model files to ./models/')
      return
    }
    
    console.log('✅ Models directory found')
    
    const files = fs.readdirSync(modelsDir)
    const ggufFiles = files.filter(file => file.endsWith('.gguf'))
    
    if (ggufFiles.length === 0) {
      console.log('❌ No GGUF model files found')
      console.log('   Download GGUF model files to ./models/')
      console.log('   Recommended models:')
      console.log('     - llama-2-7b-chat.gguf')
      console.log('     - llama-2-13b-chat.gguf')
      console.log('     - mistral-7b-instruct-v0.2.gguf')
      console.log('     - qwen2-7b-instruct.gguf')
      return
    }
    
    console.log('✅ GGUF model files found:')
    ggufFiles.forEach(file => {
      const filePath = path.join(modelsDir, file)
      const stats = fs.statSync(filePath)
      const sizeMB = Math.round(stats.size / (1024 * 1024))
      console.log(`   - ${file} (${sizeMB} MB)`)
    })
    
  } catch (error) {
    console.log('❌ Error checking model files:', error)
    return
  }
  
  // 4. システム要件の確認
  console.log('\n💻 Checking system requirements...')
  
  try {
    const os = await import('os')
    
    const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024))
    const freeMemory = Math.round(os.freemem() / (1024 * 1024 * 1024))
    const cpuCores = os.cpus().length
    
    console.log(`✅ System Info:`)
    console.log(`   Total Memory: ${totalMemory} GB`)
    console.log(`   Free Memory: ${freeMemory} GB`)
    console.log(`   CPU Cores: ${cpuCores}`)
    
    if (totalMemory < 8) {
      console.log('⚠️  Warning: Less than 8GB RAM detected')
      console.log('   LlamaCpp may run slowly or fail with large models')
    }
    
    if (freeMemory < 4) {
      console.log('⚠️  Warning: Less than 4GB free RAM detected')
      console.log('   Consider closing other applications')
    }
    
  } catch (error) {
    console.log('❌ Error checking system requirements:', error)
  }
  
  // 5. 推奨設定
  console.log('\n⚙️  Recommended Configuration:')
  console.log('   For 7B models:')
  console.log('     - threads: 4-8')
  console.log('     - contextSize: 4096')
  console.log('     - gpuLayers: 0 (CPU only)')
  console.log('')
  console.log('   For 13B+ models:')
  console.log('     - threads: 8-16')
  console.log('     - contextSize: 8192')
  console.log('     - gpuLayers: 0 (CPU only)')
  console.log('     - Consider GPU acceleration if available')
  
  console.log('\n✅ Environment check completed!')
  console.log('   LlamaCpp text extraction should work in this environment')
}

// メイン実行
main().catch(console.error)
