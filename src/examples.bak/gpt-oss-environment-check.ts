import { checkGptOssEnvironment, showGptOssModelInfo } from './gpt-oss-text-extraction-example'

/**
 * gpt-oss環境チェック
 * 
 * このスクリプトは、gpt-ossモデルが動作する環境かどうかを確認します。
 * 
 * 参考: https://qiita.com/rairaii/items/e76beb749649dac26794
 */

async function main() {
  console.log('🔍 GptOss Environment Check\n')
  
  // 1. 環境チェック
  const env = checkGptOssEnvironment()
  
  if (!env.isNode) {
    console.log('❌ GptOss functionality requires Node.js environment')
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
      console.log('   Recommended gpt-oss models:')
      console.log('     - gpt-oss-20b-mxfp4.gguf (~15GB)')
      console.log('     - gpt-oss-20b-q4_0.gguf (~12GB)')
      console.log('     - gpt-oss-20b-q4_1.gguf (~13GB)')
      return
    }
    
    console.log('✅ GGUF model files found:')
    ggufFiles.forEach(file => {
      const filePath = path.join(modelsDir, file)
      const stats = fs.statSync(filePath)
      const sizeGB = Math.round(stats.size / (1024 * 1024 * 1024) * 100) / 100
      console.log(`   - ${file} (${sizeGB} GB)`)
    })
    
    // gpt-ossモデルの確認
    const gptOssFiles = ggufFiles.filter(file => file.includes('gpt-oss'))
    if (gptOssFiles.length === 0) {
      console.log('\n⚠️  No gpt-oss model files found')
      console.log('   For best performance, use gpt-oss models:')
      console.log('   - Download from: https://huggingface.co/ggml-org/gpt-oss-20b-GGUF')
      console.log('   - Recommended: gpt-oss-20b-mxfp4.gguf')
    } else {
      console.log('\n✅ GptOss model files found:')
      gptOssFiles.forEach(file => {
        console.log(`   - ${file}`)
      })
    }
    
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
    
    // gpt-oss-20bの推奨要件チェック
    if (totalMemory < 16) {
      console.log('⚠️  Warning: Less than 16GB RAM detected')
      console.log('   GptOss-20b requires at least 16GB RAM for optimal performance')
      console.log('   Consider using a smaller model or increasing RAM')
    }
    
    if (freeMemory < 8) {
      console.log('⚠️  Warning: Less than 8GB free RAM detected')
      console.log('   Consider closing other applications for better performance')
    }
    
    if (cpuCores < 4) {
      console.log('⚠️  Warning: Less than 4 CPU cores detected')
      console.log('   GptOss-20b may run slowly with limited CPU cores')
    }
    
  } catch (error) {
    console.log('❌ Error checking system requirements:', error)
  }
  
  // 5. gpt-ossモデル情報の表示
  showGptOssModelInfo()
  
  // 6. 推奨設定
  console.log('\n⚙️  Recommended Configuration for GptOss:')
  console.log('   Model: gpt-oss-20b-mxfp4.gguf')
  console.log('   Context Size: 8192')
  console.log('   Threads: 4-8 (depending on CPU cores)')
  console.log('   GPU Layers: 0 (CPU only) or higher for GPU acceleration')
  console.log('   Temperature: 0.1 (for consistent extraction)')
  console.log('   Reasoning Level: medium (balanced performance)')
  
  // 7. ダウンロード手順
  console.log('\n📥 Download Instructions:')
  console.log('1. Visit: https://huggingface.co/ggml-org/gpt-oss-20b-GGUF')
  console.log('2. Download: gpt-oss-20b-mxfp4.gguf (~15GB)')
  console.log('3. Place in: ./models/ directory')
  console.log('4. Run: npx tsx src/examples/gpt-oss-text-extraction-example.ts')
  
  // 8. 使用例
  console.log('\n💡 Usage Example:')
  console.log('```typescript')
  console.log('import { createGptOssTextExtractionChain } from "../services/tts"')
  console.log('')
  console.log('const chain = createGptOssTextExtractionChain({')
  console.log('  modelPath: "./models/gpt-oss-20b-mxfp4.gguf",')
  console.log('  temperature: 0.1,')
  console.log('  maxTokens: 2048,')
  console.log('  contextSize: 8192,')
  console.log('  threads: 4,')
  console.log('  gpuLayers: 0,')
  console.log('  reasoningLevel: "medium"')
  console.log('})')
  console.log('')
  console.log('await chain.initialize()')
  console.log('const result = await chain.extractMainText(inputText)')
  console.log('```')
  
  console.log('\n✅ GptOss environment check completed!')
  console.log('   GptOss text extraction should work in this environment')
}

// メイン実行
main().catch(console.error)
