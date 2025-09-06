import { 
  LlamaCppTextExtractionChain, 
  createLlamaCppTextExtractionChain,
  LlamaCppTextExtractionAgent,
  createLlamaCppTextExtractionAgent
} from '../services/tts'

/**
 * llama.cppを使用した本文抽出機能の使用例
 * 
 * この例では、ローカルLLMを使用して本文抽出機能をデモンストレーションします。
 * バックエンド環境でのみ動作します。
 */

// サンプルテキスト（ユーザーが提供したもの）
const sampleText = `ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。
通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。
各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。
上記の文章を音声にしてください。`

/**
 * LlamaCppTextExtractionChainの使用例
 */
export async function demonstrateLlamaCppTextExtractionChain(modelPath: string) {
  console.log('=== LlamaCpp TextExtractionChain Demo ===')
  
  try {
    // LlamaCppTextExtractionChainを作成
    const extractionChain = createLlamaCppTextExtractionChain({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      verbose: true
    })

    // 初期化
    await extractionChain.initialize()
    console.log('✅ LlamaCpp TextExtractionChain initialized')

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

    return result

  } catch (error) {
    console.error('❌ LlamaCpp TextExtractionChain demo failed:', error)
    throw error
  }
}

/**
 * LlamaCppTextExtractionAgentの使用例
 */
export async function demonstrateLlamaCppTextExtractionAgent(modelPath: string) {
  console.log('\n=== LlamaCpp TextExtractionAgent Demo ===')
  
  try {
    // LlamaCppTextExtractionAgentを作成
    const extractionAgent = createLlamaCppTextExtractionAgent({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      verbose: true,
      maxIterations: 3
    })

    // 初期化
    await extractionAgent.initialize()
    console.log('✅ LlamaCpp TextExtractionAgent initialized')

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
    }

    return result

  } catch (error) {
    console.error('❌ LlamaCpp TextExtractionAgent demo failed:', error)
    throw error
  }
}

/**
 * バッチ処理の例
 */
export async function demonstrateLlamaCppBatchProcessing(modelPath: string) {
  console.log('\n=== LlamaCpp Batch Processing Demo ===')
  
  const texts = [
    'こんにちは、世界。この文章を音声にしてください。',
    '今日は良い天気ですね。音声化をお願いします。',
    'これは単純なテキストです。',
    '複雑な説明文が含まれています。この部分を音声で読み上げてください。'
  ]

  try {
    const extractionChain = createLlamaCppTextExtractionChain({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      verbose: false
    })

    await extractionChain.initialize()
    console.log('✅ LlamaCpp batch processing initialized')

    const results = await extractionChain.extractBatch(texts)
    
    console.log('\n📊 Batch Results:')
    results.forEach((result, index) => {
      console.log(`\n--- Text ${index + 1} ---`)
      console.log('Main Text:', result.mainText)
      console.log('Confidence:', result.confidence)
      console.log('Has Instructions:', result.hasInstructions)
    })

    return results

  } catch (error) {
    console.error('❌ LlamaCpp batch processing demo failed:', error)
    throw error
  }
}

/**
 * 統合デモ
 */
export async function runLlamaCppTextExtractionDemo(modelPath: string) {
  console.log('🚀 Starting LlamaCpp Text Extraction Demo...\n')
  
  try {
    // 1. LlamaCppTextExtractionChainのデモ
    await demonstrateLlamaCppTextExtractionChain(modelPath)
    
    // 2. LlamaCppTextExtractionAgentのデモ
    await demonstrateLlamaCppTextExtractionAgent(modelPath)
    
    // 3. バッチ処理のデモ
    await demonstrateLlamaCppBatchProcessing(modelPath)
    
    console.log('\n✅ All LlamaCpp demos completed successfully!')
    
  } catch (error) {
    console.error('❌ LlamaCpp demo failed:', error)
    throw error
  }
}

/**
 * 環境チェック
 */
export function checkEnvironment(): { isNode: boolean; isBrowser: boolean } {
  const isNode = typeof window === 'undefined'
  const isBrowser = typeof window !== 'undefined'
  
  console.log('🔍 Environment Check:')
  console.log('Node.js:', isNode)
  console.log('Browser:', isBrowser)
  
  if (!isNode) {
    console.warn('⚠️  LlamaCpp functionality is only available in Node.js environment')
  }
  
  return { isNode, isBrowser }
}

// 使用例（コメントアウト）
/*
// 環境チェック
checkEnvironment()

// モデルパスを設定してデモを実行
const modelPath = './models/llama-2-7b-chat.gguf'
runLlamaCppTextExtractionDemo(modelPath).catch(console.error)
*/
