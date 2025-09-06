import { 
  TextExtractionChain, 
  createTextExtractionChain,
  TextExtractionAgent,
  createTextExtractionAgent
} from '../services/tts'

/**
 * 本文抽出機能の使用例
 * 
 * この例では、ユーザーが提供したヴァイキングのテキストを使用して、
 * 指示文を除いた本文部分のみを抽出する機能をデモンストレーションします。
 */

// サンプルテキスト（ユーザーが提供したもの）
const sampleText = `ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。
通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。
各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。
上記の文章を音声にしてください。`

/**
 * TextExtractionChainの使用例
 */
export async function demonstrateTextExtractionChain(apiKey: string) {
  console.log('=== TextExtractionChain Demo ===')
  
  try {
    // TextExtractionChainを作成
    const extractionChain = createTextExtractionChain({
      modelType: 'openai',
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
      apiKey: apiKey
    })

    // 初期化
    await extractionChain.initialize()
    console.log('✅ TextExtractionChain initialized')

    // 本文抽出を実行
    console.log('\n📝 Processing text...')
    const result = await extractionChain.extractMainText(sampleText)
    
    console.log('\n📊 Extraction Results:')
    console.log('Main Text:', result.mainText)
    console.log('Confidence:', result.confidence)
    console.log('Reasoning:', result.reasoning)
    console.log('Has Instructions:', result.hasInstructions)
    console.log('Instruction Type:', result.instructionType)

    return result

  } catch (error) {
    console.error('❌ TextExtractionChain demo failed:', error)
    throw error
  }
}

/**
 * TextExtractionAgentの使用例
 */
export async function demonstrateTextExtractionAgent(apiKey: string) {
  console.log('\n=== TextExtractionAgent Demo ===')
  
  try {
    // TextExtractionAgentを作成
    const extractionAgent = createTextExtractionAgent({
      modelType: 'openai',
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
      apiKey: apiKey,
      maxIterations: 3,
      verbose: true
    })

    // 初期化
    await extractionAgent.initialize()
    console.log('✅ TextExtractionAgent initialized')

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

    return result

  } catch (error) {
    console.error('❌ TextExtractionAgent demo failed:', error)
    throw error
  }
}

/**
 * バッチ処理の例
 */
export async function demonstrateBatchProcessing(apiKey: string) {
  console.log('\n=== Batch Processing Demo ===')
  
  const texts = [
    'こんにちは、世界。この文章を音声にしてください。',
    '今日は良い天気ですね。音声化をお願いします。',
    'これは単純なテキストです。',
    '複雑な説明文が含まれています。この部分を音声で読み上げてください。'
  ]

  try {
    const extractionChain = createTextExtractionChain({
      modelType: 'openai',
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
      apiKey: apiKey
    })

    await extractionChain.initialize()
    console.log('✅ Batch processing initialized')

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
    console.error('❌ Batch processing demo failed:', error)
    throw error
  }
}

/**
 * 統合デモ
 */
export async function runTextExtractionDemo(apiKey: string) {
  console.log('🚀 Starting Text Extraction Demo...\n')
  
  try {
    // 1. TextExtractionChainのデモ
    await demonstrateTextExtractionChain(apiKey)
    
    // 2. TextExtractionAgentのデモ
    await demonstrateTextExtractionAgent(apiKey)
    
    // 3. バッチ処理のデモ
    await demonstrateBatchProcessing(apiKey)
    
    console.log('\n✅ All demos completed successfully!')
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
    throw error
  }
}

// 使用例（コメントアウト）
/*
// APIキーを設定してデモを実行
const apiKey = 'your-openai-api-key'
runTextExtractionDemo(apiKey).catch(console.error)
*/
