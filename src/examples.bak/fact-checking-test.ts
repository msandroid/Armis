import { FactCheckingService } from '../services/llm/fact-checking-service';

/**
 * ファクトチェック機能のテスト
 */
async function testFactChecking() {
  console.log('🧪 Testing Fact Checking Service...\n');

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
    },
    {
      name: "混在した情報",
      text: "The Great Wall of China is visible from space with the naked eye. The Moon is Earth's only natural satellite. Dinosaurs went extinct 65 million years ago. The pyramids were built by aliens.",
      expectedFactual: false
    }
  ];

  let passedTests = 0;
  let totalTests = 0;

  // 基本的なファクトチェックテスト
  console.log('📋 Testing Basic Fact Checking...\n');
  
  const factChecker = new FactCheckingService({
    model: 'openai',
    temperature: 0.1,
    includeSources: false
  });

  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n--- Test: ${testCase.name} ---`);
    
    try {
      const result = await factChecker.checkFacts(testCase.text);
      
      const testPassed = result.isFactual === testCase.expectedFactual;
      if (testPassed) {
        passedTests++;
        console.log(`✅ PASS - Expected: ${testCase.expectedFactual}, Got: ${result.isFactual}`);
      } else {
        console.log(`❌ FAIL - Expected: ${testCase.expectedFactual}, Got: ${result.isFactual}`);
      }
      
      console.log(`📊 Confidence: ${result.confidence}%`);
      console.log(`⚠️  Issues: ${result.issues.length > 0 ? result.issues.join(', ') : 'None'}`);
      console.log(`📝 Explanation: ${result.explanation.substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`❌ ERROR - ${error}`);
    }
  }

  // ハルシネーション検出テスト
  console.log('\n\n🧠 Testing Hallucination Detection...\n');
  
  const hallucinationTests = [
    {
      name: "明らかなハルシネーション",
      text: "In 2024, scientists discovered flying elephants that can communicate through telepathy.",
      expectedHallucination: true
    },
    {
      name: "事実に基づく情報",
      text: "The speed of light is approximately 299,792 kilometers per second.",
      expectedHallucination: false
    }
  ];

  for (const testCase of hallucinationTests) {
    totalTests++;
    console.log(`\n--- Test: ${testCase.name} ---`);
    
    try {
      const result = await factChecker.detectHallucinations(testCase.text);
      
      const testPassed = result.hasHallucinations === testCase.expectedHallucination;
      if (testPassed) {
        passedTests++;
        console.log(`✅ PASS - Expected: ${testCase.expectedHallucination}, Got: ${result.hasHallucinations}`);
      } else {
        console.log(`❌ FAIL - Expected: ${testCase.expectedHallucination}, Got: ${result.hasHallucinations}`);
      }
      
      console.log(`📊 Hallucination Score: ${result.hallucinationScore}%`);
      console.log(`⚠️  Issues: ${result.detectedIssues.join(', ')}`);
      
    } catch (error) {
      console.log(`❌ ERROR - ${error}`);
    }
  }

  // パフォーマンステスト
  console.log('\n\n⚡ Testing Performance...\n');
  
  const performanceTexts = [
    "The Earth is round.",
    "Gravity pulls objects toward the center of the Earth.",
    "The Sun is a star.",
    "Humans need oxygen to breathe.",
    "Water is composed of hydrogen and oxygen."
  ];

  const startTime = Date.now();
  
  try {
    const results = await factChecker.batchCheckFacts(performanceTexts);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Batch processing time: ${duration}ms`);
    console.log(`📊 Average time per text: ${duration / performanceTexts.length}ms`);
    
    const allFactual = results.every(r => r.isFactual);
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    console.log(`✅ All factual: ${allFactual}`);
    console.log(`📊 Average confidence: ${avgConfidence.toFixed(1)}%`);
    
    if (allFactual && avgConfidence > 80) {
      passedTests++;
    }
    totalTests++;
    
  } catch (error) {
    console.log(`❌ Performance test failed: ${error}`);
  }

  // 結果サマリー
  console.log('\n\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results.');
  }

  return {
    totalTests,
    passedTests,
    successRate: (passedTests / totalTests) * 100
  };
}

/**
 * モデル比較テスト
 */
async function testModelComparison() {
  console.log('\n\n🤖 Testing Model Comparison...\n');

  const testText = "The Great Wall of China is the only man-made structure visible from space with the naked eye.";

  const models = [
    { name: 'OpenAI GPT-4', options: { model: 'openai' as const, temperature: 0.1 } },
    { name: 'Anthropic Claude', options: { model: 'anthropic' as const, temperature: 0.1 } },
    { name: 'Google Gemini', options: { model: 'google' as const, temperature: 0.1 } }
  ];

  const results: Array<{
    model: string;
    isFactual: boolean;
    confidence: number;
    responseTime: number;
  }> = [];

  for (const modelConfig of models) {
    console.log(`\n--- Testing ${modelConfig.name} ---`);
    
    try {
      const factChecker = new FactCheckingService(modelConfig.options);
      const startTime = Date.now();
      
      const result = await factChecker.checkFacts(testText);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results.push({
        model: modelConfig.name,
        isFactual: result.isFactual,
        confidence: result.confidence,
        responseTime
      });
      
      console.log(`✅ Factual: ${result.isFactual}`);
      console.log(`📊 Confidence: ${result.confidence}%`);
      console.log(`⏱️  Response Time: ${responseTime}ms`);
      
    } catch (error) {
      console.log(`❌ Error with ${modelConfig.name}: ${error}`);
    }
  }

  // 比較結果
  console.log('\n📊 Model Comparison Results');
  console.log('============================');
  
  results.forEach(result => {
    console.log(`${result.model}:`);
    console.log(`  Factual: ${result.isFactual}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Response Time: ${result.responseTime}ms`);
  });

  return results;
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    const testResults = await testFactChecking();
    const modelResults = await testModelComparison();
    
    console.log('\n\n🎯 Final Summary');
    console.log('================');
    console.log(`Test Success Rate: ${testResults.successRate.toFixed(1)}%`);
    console.log(`Models Tested: ${modelResults.length}`);
    
    return {
      testResults,
      modelResults
    };
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main().catch(console.error);
}

export { testFactChecking, testModelComparison, main };
