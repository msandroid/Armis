import { FactCheckingService } from '../services/llm/fact-checking-service';

/**
 * Ollamaでのファクトチェック機能テスト
 */
async function testOllamaFactChecking() {
  console.log('🔍 Testing Ollama Fact Checking...\n');

  // テストケース
  const testCases = [
    {
      name: "正確な情報",
      text: "The Earth orbits around the Sun. The capital of Japan is Tokyo. Water boils at 100 degrees Celsius at sea level.",
      expectedFactual: true
    },
    {
      name: "不正確な情報",
      text: "The Earth is flat and the Sun orbits around it. The capital of Japan is Osaka. Water boils at 50 degrees Celsius at sea level.",
      expectedFactual: false
    },
    {
      name: "ハルシネーション",
      text: "In 2024, scientists discovered that humans can breathe underwater using special gills. The city of Atlantis was found off the coast of Greece.",
      expectedFactual: false
    }
  ];

  // Ollamaファクトチェックサービスの初期化
  const factChecker = new FactCheckingService({
    model: 'ollama',
    temperature: 0.1,
    maxTokens: 1000,
    includeSources: false,
    strictMode: false,
    ollamaModel: 'gemma3:1b',
    ollamaBaseUrl: 'http://localhost:11434'
  });

  console.log('📋 Testing with Ollama (gemma3:1b)...\n');

  for (const testCase of testCases) {
    console.log(`\n--- Test: ${testCase.name} ---`);
    console.log(`Text: ${testCase.text}`);
    
    try {
      const result = await factChecker.checkFacts(testCase.text);
      
      console.log(`✅ Factual: ${result.isFactual}`);
      console.log(`📊 Confidence: ${result.confidence}%`);
      console.log(`⚠️  Issues: ${result.issues.length > 0 ? result.issues.join(', ') : 'None'}`);
      console.log(`📝 Explanation: ${result.explanation.substring(0, 200)}...`);
      
      const testPassed = result.isFactual === testCase.expectedFactual;
      if (testPassed) {
        console.log(`✅ PASS - Expected: ${testCase.expectedFactual}, Got: ${result.isFactual}`);
      } else {
        console.log(`❌ FAIL - Expected: ${testCase.expectedFactual}, Got: ${result.isFactual}`);
      }
      
    } catch (error) {
      console.error(`❌ Error checking facts: ${error}`);
    }
  }

  // ハルシネーション検出テスト
  console.log('\n\n🧠 Testing Hallucination Detection...\n');
  
  const hallucinationText = "In 2024, scientists discovered flying elephants that can communicate through telepathy.";
  
  try {
    const hallucinationResult = await factChecker.detectHallucinations(hallucinationText);
    
    console.log(`Text: ${hallucinationText}`);
    console.log(`🤖 Has Hallucinations: ${hallucinationResult.hasHallucinations}`);
    console.log(`📊 Hallucination Score: ${hallucinationResult.hallucinationScore}%`);
    console.log(`⚠️  Detected Issues: ${hallucinationResult.detectedIssues.join(', ')}`);
    console.log(`💡 Suggestions: ${hallucinationResult.suggestions.join(', ')}`);
  } catch (error) {
    console.error(`❌ Error detecting hallucinations: ${error}`);
  }

  console.log('\n\n🎉 Ollama Fact Checking Test Completed!');
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    await testOllamaFactChecking();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main();
}

export { testOllamaFactChecking, main };
