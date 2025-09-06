import { TextExtractionChain } from '../services/tts/text-extraction-chain'

/**
 * 本文抽出機能のテスト
 * APIキーなしでも動作する基本的な機能をテスト
 */

// テスト用のテキスト
const testTexts = [
  {
    name: 'ヴァイキングの説明文',
    text: `ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。上記の文章を音声にしてください。`
  },
  {
    name: 'シンプルなTTS要求',
    text: 'こんにちは、世界。この文章を音声にしてください。'
  },
  {
    name: '指示文なしのテキスト',
    text: 'これは単純なテキストです。特に指示はありません。'
  },
  {
    name: '複雑な説明文',
    text: 'このように入力されたときにTTSに渡す文章の部分を適切に選べるようにしてください。なるほど！つまりタスクはこうですね：入力は「説明文や解説文などを含むテキスト」。出力は「TTS に渡すべき本文部分（音声化する文章）」を適切に抽出すること。'
  }
]

/**
 * フォールバック機能のテスト
 */
async function testFallbackExtraction() {
  console.log('🧪 Testing Fallback Extraction...\n')
  
  // APIキーなしでTextExtractionChainを作成
  const extractionChain = new TextExtractionChain({
    modelType: 'openai',
    modelName: 'gpt-3.5-turbo',
    temperature: 0.1
    // apiKey: なし（フォールバック機能をテスト）
  })

  for (const testCase of testTexts) {
    console.log(`📝 Testing: ${testCase.name}`)
    console.log(`Input: ${testCase.text.substring(0, 100)}...`)
    
    try {
      const result = await extractionChain.extractMainText(testCase.text)
      
      console.log(`✅ Result:`)
      console.log(`  Main Text: ${result.mainText.substring(0, 100)}...`)
      console.log(`  Confidence: ${result.confidence}`)
      console.log(`  Reasoning: ${result.reasoning}`)
      console.log(`  Has Instructions: ${result.hasInstructions}`)
      console.log(`  Instruction Type: ${result.instructionType || 'N/A'}`)
      console.log('')
      
    } catch (error) {
      console.error(`❌ Error: ${error}`)
      console.log('')
    }
  }
}

/**
 * 基本的なキーワード検出のテスト
 */
function testKeywordDetection() {
  console.log('🔍 Testing Keyword Detection...\n')
  
  const ttsKeywords = [
    '音声を作成', '音声で', '音声化', 'TTS', '音声合成',
    '音声を生成', '音声に変換', '音声で読み上げ',
    'audio', 'voice', 'speech', 'tts', '音声'
  ]

  for (const testCase of testTexts) {
    const lowerText = testCase.text.toLowerCase()
    const foundKeywords = ttsKeywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    )
    
    console.log(`📝 ${testCase.name}:`)
    console.log(`  Found Keywords: ${foundKeywords.length > 0 ? foundKeywords.join(', ') : 'None'}`)
    console.log(`  Has TTS Request: ${foundKeywords.length > 0}`)
    console.log('')
  }
}

/**
 * メインのテスト実行
 */
async function runTests() {
  console.log('🚀 Starting Text Extraction Tests...\n')
  
  try {
    // 1. キーワード検出テスト
    testKeywordDetection()
    
    // 2. フォールバック抽出テスト
    await testFallbackExtraction()
    
    console.log('✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// テストを実行
runTests().catch(console.error)
