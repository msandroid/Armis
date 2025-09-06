import { 
  GptOssTextExtractionChain, 
  createGptOssTextExtractionChain,
  GptOssTextExtractionAgent,
  createGptOssTextExtractionAgent
} from '../services/tts'

/**
 * gpt-ossモデルを使用した本文抽出機能の使用例
 * 
 * この例では、OpenAIのgpt-ossモデルを使用して本文抽出機能をデモンストレーションします。
 * バックエンド環境でのみ動作します。
 * 
 * 参考: https://qiita.com/rairaii/items/e76beb749649dac26794
 */

// サンプルテキスト（ユーザーが提供したもの）
const sampleText = `ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。
通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。
各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。
上記の文章を音声にしてください。`

/**
 * GptOssTextExtractionChainの使用例
 */
export async function demonstrateGptOssTextExtractionChain(modelPath: string) {
  console.log('=== GptOss TextExtractionChain Demo ===')
  
  try {
    // GptOssTextExtractionChainを作成
    const extractionChain = createGptOssTextExtractionChain({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 8192, // gpt-oss-20bは長いコンテキストをサポート
      threads: 4,
      gpuLayers: 0,
      verbose: true,
      reasoningLevel: 'medium'
    })

    // 初期化
    await extractionChain.initialize()
    console.log('✅ GptOss TextExtractionChain initialized')

    // 本文抽出を実行
    console.log('\n📝 Processing text...')
    const result = await extractionChain.extractMainText(sampleText)
    
    console.log('\n📊 Extraction Results:')
    console.log('Main Text:', result.mainText)
    console.log('Confidence:', result.confidence)
    console.log('Reasoning:', result.reasoning)
    console.log('Has Instructions:', result.hasInstructions)
    console.log('Instruction Type:', result.instructionType)

    // モデル情報を表示
    const modelInfo = extractionChain.getModelInfo()
    console.log('\n🔧 Model Info:')
    console.log('Model Path:', modelInfo.modelPath)
    console.log('Initialized:', modelInfo.isInitialized)
    console.log('Reasoning Level:', modelInfo.reasoningLevel)
    console.log('Model Type:', modelInfo.modelType)

    return result

  } catch (error) {
    console.error('❌ GptOss TextExtractionChain demo failed:', error)
    throw error
  }
}

/**
 * 推論レベルを変更した例
 */
export async function demonstrateReasoningLevels(modelPath: string) {
  console.log('\n=== GptOss Reasoning Levels Demo ===')
  
  try {
    const reasoningLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high']
    const results = []

    for (const level of reasoningLevels) {
      console.log(`\n🔍 Testing reasoning level: ${level}`)
      
      const extractionChain = createGptOssTextExtractionChain({
        modelPath: modelPath,
        temperature: 0.1,
        maxTokens: 2048,
        contextSize: 8192,
        threads: 4,
        gpuLayers: 0,
        verbose: false,
        reasoningLevel: level
      })

      await extractionChain.initialize()
      
      const startTime = Date.now()
      const result = await extractionChain.extractMainText(sampleText)
      const executionTime = Date.now() - startTime
      
      console.log(`✅ ${level} level result:`)
      console.log(`  Confidence: ${result.confidence}`)
      console.log(`  Execution Time: ${executionTime}ms`)
      console.log(`  Reasoning: ${result.reasoning.substring(0, 100)}...`)
      
      results.push({ level, result, executionTime })
    }

    return results

  } catch (error) {
    console.error('❌ Reasoning levels demo failed:', error)
    throw error
  }
}

/**
 * GptOssTextExtractionAgentの使用例
 */
export async function demonstrateGptOssTextExtractionAgent(modelPath: string) {
  console.log('\n=== GptOss TextExtractionAgent Demo ===')
  
  try {
    // GptOssTextExtractionAgentを作成
    const extractionAgent = createGptOssTextExtractionAgent({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 8192,
      threads: 4,
      gpuLayers: 0,
      verbose: true,
      maxIterations: 3,
      reasoningLevel: 'medium'
    })

    // 初期化
    await extractionAgent.initialize()
    console.log('✅ GptOss TextExtractionAgent initialized')

    // テキスト処理を実行
    console.log('\n📝 Processing text with agent...')
    const result = await extractionAgent.processText(sampleText)
    
    console.log('\n📊 Agent Results:')
    console.log('Extracted Text:', result.extractedText)
    console.log('Confidence:', result.confidence)
    console.log('Reasoning:', result.reasoning)
    console.log('Execution Time:', result.executionTime, 'ms')
    
    if (result.ttsResult) {
      console.log('TTS Result:', result.ttsResult)
    }

    if (result.modelInfo) {
      console.log('\n🔧 Model Info:')
      console.log('Model Path:', result.modelInfo.modelPath)
      console.log('Initialized:', result.modelInfo.isInitialized)
      console.log('Reasoning Level:', result.modelInfo.reasoningLevel)
      console.log('Model Type:', result.modelInfo.modelType)
    }

    return result

  } catch (error) {
    console.error('❌ GptOss TextExtractionAgent demo failed:', error)
    throw error
  }
}

/**
 * バッチ処理の例
 */
export async function demonstrateGptOssBatchProcessing(modelPath: string) {
  console.log('\n=== GptOss Batch Processing Demo ===')
  
  const texts = [
    'こんにちは、世界。この文章を音声にしてください。',
    '今日は良い天気ですね。音声化をお願いします。',
    'これは単純なテキストです。',
    '複雑な説明文が含まれています。この部分を音声で読み上げてください。'
  ]

  try {
    const extractionChain = createGptOssTextExtractionChain({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 8192,
      threads: 4,
      gpuLayers: 0,
      verbose: false,
      reasoningLevel: 'medium'
    })

    await extractionChain.initialize()
    console.log('✅ GptOss batch processing initialized')

    const startTime = Date.now()
    const results = await extractionChain.extractBatch(texts)
    const totalTime = Date.now() - startTime
    
    console.log('\n📊 Batch Results:')
    results.forEach((result, index) => {
      console.log(`\n--- Text ${index + 1} ---`)
      console.log('Main Text:', result.mainText)
      console.log('Confidence:', result.confidence)
      console.log('Has Instructions:', result.hasInstructions)
    })
    
    console.log(`\n⏱️  Total execution time: ${totalTime}ms`)
    console.log(`📈 Average time per text: ${Math.round(totalTime / texts.length)}ms`)

    return results

  } catch (error) {
    console.error('❌ GptOss batch processing demo failed:', error)
    throw error
  }
}

/**
 * 統合デモ
 */
export async function runGptOssTextExtractionDemo(modelPath: string) {
  console.log('🚀 Starting GptOss Text Extraction Demo...\n')
  
  try {
    // 1. GptOssTextExtractionChainのデモ
    await demonstrateGptOssTextExtractionChain(modelPath)
    
    // 2. 推論レベルの比較デモ
    await demonstrateReasoningLevels(modelPath)
    
    // 3. GptOssTextExtractionAgentのデモ
    await demonstrateGptOssTextExtractionAgent(modelPath)
    
    // 4. バッチ処理のデモ
    await demonstrateGptOssBatchProcessing(modelPath)
    
    console.log('\n✅ All GptOss demos completed successfully!')
    
  } catch (error) {
    console.error('❌ GptOss demo failed:', error)
    throw error
  }
}

/**
 * 環境チェック
 */
export function checkGptOssEnvironment(): { isNode: boolean; isBrowser: boolean } {
  const isNode = typeof window === 'undefined'
  const isBrowser = typeof window !== 'undefined'
  
  console.log('🔍 GptOss Environment Check:')
  console.log('Node.js:', isNode)
  console.log('Browser:', isBrowser)
  
  if (!isNode) {
    console.warn('⚠️  GptOss functionality is only available in Node.js environment')
  }
  
  return { isNode, isBrowser }
}

/**
 * gpt-ossモデルの情報を表示
 */
export function showGptOssModelInfo() {
  console.log('\n📋 GptOss Model Information:')
  console.log('Model: gpt-oss-20b (OpenAI)')
  console.log('Parameters: ~20 billion')
  console.log('File Size: ~15GB (GGUF quantized)')
  console.log('Context Length: 8192 tokens')
  console.log('License: Apache 2.0')
  console.log('Knowledge Cutoff: 2024-06')
  console.log('Recommended RAM: 16GB+')
  console.log('Special Features:')
  console.log('  - OpenAI社内モデル「o3-mini」と同等の性能')
  console.log('  - 推論レベル設定（low/medium/high）')
  console.log('  - 長いコンテキスト対応')
  console.log('  - 日本語と英語の両方に対応')
}

// 使用例（コメントアウト）
/*
// 環境チェック
checkGptOssEnvironment()
showGptOssModelInfo()

// モデルパスを設定してデモを実行
const modelPath = './models/gpt-oss-20b-mxfp4.gguf'
runGptOssTextExtractionDemo(modelPath).catch(console.error)
*/
