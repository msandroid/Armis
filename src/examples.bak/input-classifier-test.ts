import { InputClassifier } from '@/services/agent/input-classifier'

async function testInputClassifier() {
  console.log('=== Input Classifier Test ===\n')
  
  const classifier = new InputClassifier()
  
  // テストケース
  const testCases = [
    // 英語の挨拶・雑談
    'hi',
    'hello',
    'how are you',
    'thanks',
    'good morning',
    'nice weather',
    
    // 日本語の挨拶・雑談
    'こんにちは',
    'おはよう',
    'ありがとう',
    'お疲れ様',
    '天気がいいですね',
    '調子はどう',
    
    // 中国語の挨拶・雑談
    '你好',
    '早上好',
    '谢谢',
    '天气不错',
    
    // 韓国語の挨拶・雑談
    '안녕하세요',
    '감사합니다',
    '좋은 아침',
    
    // スペイン語の挨拶・雑談
    'hola',
    'buenos días',
    'gracias',
    
    // フランス語の挨拶・雑談
    'bonjour',
    'merci',
    'beau temps',
    
    // ドイツ語の挨拶・雑談
    'hallo',
    'danke',
    'schönes wetter',
    
    // 短い雑談
    'ok',
    'yes',
    'no',
    'wow',
    'はい',
    'いいえ',
    'うん',
    'わあ',
    
    // タスク要求（エージェントにルーティングされるべき）
    'コードをリファクタリングしてください',
    'refactor this code',
    'ファイルを処理してください',
    'process this file',
    'データを分析してください',
    'analyze this data',
    '文章を書いてください',
    'write an article',
    
    // 質問（エージェントにルーティングされるべき）
    'What is TypeScript?',
    'TypeScriptとは何ですか？',
    'How do I use React?',
    'Reactの使い方を教えてください',
    
    // コマンド（エージェントにルーティングされるべき）
    'run npm install',
    'npm installを実行してください',
    'start the server',
    'サーバーを開始してください'
  ]
  
  for (const testInput of testCases) {
    console.log(`Input: "${testInput}"`)
    const result = classifier.classifyInput(testInput)
    
    console.log(`  Language: ${result.language}`)
    console.log(`  Category: ${result.category}`)
    console.log(`  Should Route to Agent: ${result.shouldRouteToAgent}`)
    console.log(`  Suggested Agent: ${result.suggestedAgent || 'None'}`)
    console.log(`  Confidence: ${result.confidence}`)
    console.log(`  Reasoning: ${result.reasoning}`)
    console.log(`  Complexity: ${result.complexity}`)
    console.log('')
  }
  
  console.log('=== Test Summary ===')
  const results = testCases.map(input => classifier.classifyInput(input))
  
  const casualCount = results.filter(r => !r.shouldRouteToAgent).length
  const agentCount = results.filter(r => r.shouldRouteToAgent).length
  
  console.log(`Total inputs: ${testCases.length}`)
  console.log(`Casual inputs (no agent routing): ${casualCount}`)
  console.log(`Task inputs (agent routing): ${agentCount}`)
  console.log(`Casual filter rate: ${(casualCount / testCases.length * 100).toFixed(1)}%`)
  
  // 言語別の統計
  const languageStats = results.reduce((acc, result) => {
    acc[result.language] = (acc[result.language] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\nLanguage distribution:')
  Object.entries(languageStats).forEach(([lang, count]) => {
    console.log(`  ${lang}: ${count}`)
  })
  
  // カテゴリ別の統計
  const categoryStats = results.reduce((acc, result) => {
    acc[result.category] = (acc[result.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\nCategory distribution:')
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`)
  })
}

// テスト実行
testInputClassifier().catch(console.error)

export { testInputClassifier }
