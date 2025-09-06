import { FactCheckingService, FactCheckOptions } from '../services/llm/fact-checking-service';

/**
 * ファクトチェック機能の使用例
 */
async function runFactCheckingExamples() {
  console.log('🔍 Starting Fact Checking Examples...\n');

  // ファクトチェックサービスの初期化
  const factChecker = new FactCheckingService({
    model: 'openai',
    temperature: 0.1,
    includeSources: true,
    strictMode: false
  });

  // テスト用のテキスト（事実と非事実が混在）
  const testTexts = [
    {
      title: "正確な情報の例",
      text: "The Earth orbits around the Sun. The capital of Japan is Tokyo. Water boils at 100 degrees Celsius at sea level."
    },
    {
      title: "不正確な情報の例",
      text: "The Earth is flat and the Sun orbits around it. The capital of Japan is Osaka. Water boils at 50 degrees Celsius at sea level."
    },
    {
      title: "ハルシネーションの例",
      text: "In 2023, scientists discovered that humans can breathe underwater using special gills. The city of Atlantis was found off the coast of Greece and is now a popular tourist destination."
    },
    {
      title: "混在した情報の例",
      text: "The Great Wall of China is visible from space with the naked eye. The Moon is Earth's only natural satellite. Dinosaurs went extinct 65 million years ago. The pyramids were built by aliens."
    }
  ];

  // 基本的なファクトチェック
  console.log('📋 Running Basic Fact Checks...\n');
  
  for (const testCase of testTexts) {
    console.log(`\n--- ${testCase.title} ---`);
    console.log(`Text: ${testCase.text}`);
    
    try {
      const result = await factChecker.checkFacts(testCase.text);
      
      console.log(`✅ Factual: ${result.isFactual}`);
      console.log(`📊 Confidence: ${result.confidence}%`);
      console.log(`⚠️  Issues: ${result.issues.length > 0 ? result.issues.join(', ') : 'None'}`);
      console.log(`📝 Explanation: ${result.explanation}`);
      
      if (result.correctedText) {
        console.log(`🔧 Corrected: ${result.correctedText}`);
      }
      
      if (result.sources && result.sources.length > 0) {
        console.log(`📚 Sources: ${result.sources.join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ Error checking facts: ${error}`);
    }
  }

  // ハルシネーション検出
  console.log('\n\n🧠 Running Hallucination Detection...\n');
  
  const hallucinationText = "In 2024, scientists discovered a new species of flying elephants in the Amazon rainforest. These elephants can reach speeds of 200 mph and communicate through telepathy.";
  
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

  // 高度なファクトチェック（ソース付き）
  console.log('\n\n🔬 Running Enhanced Fact Check...\n');
  
  const enhancedText = "The speed of light is approximately 299,792 kilometers per second. The human brain contains about 86 billion neurons.";
  
  try {
    const enhancedResult = await factChecker.checkFactsWithSources(enhancedText);
    
    console.log(`Text: ${enhancedText}`);
    console.log(`✅ Factual: ${enhancedResult.isFactual}`);
    console.log(`📊 Confidence: ${enhancedResult.confidence}%`);
    console.log(`📚 Sources: ${enhancedResult.sources?.join(', ') || 'None provided'}`);
    console.log(`📝 Explanation: ${enhancedResult.explanation}`);
  } catch (error) {
    console.error(`❌ Error in enhanced fact check: ${error}`);
  }

  // ストリーミングファクトチェック
  console.log('\n\n🌊 Running Streaming Fact Check...\n');
  
  const streamingText = "The Internet was invented by Al Gore in 1993. The first computer was built in 1946.";
  
  try {
    console.log(`Text: ${streamingText}`);
    console.log('Streaming results:');
    
    for await (const chunk of factChecker.checkFactsStream(streamingText)) {
      if (chunk.explanation) {
        process.stdout.write(chunk.explanation);
      }
    }
    console.log('\n');
  } catch (error) {
    console.error(`❌ Error in streaming fact check: ${error}`);
  }

  // 一括ファクトチェック
  console.log('\n\n📦 Running Batch Fact Check...\n');
  
  const batchTexts = [
    "The Earth is round.",
    "The Earth is flat.",
    "Gravity pulls objects toward the center of the Earth.",
    "Gravity is just a theory and doesn't really exist."
  ];
  
  try {
    const batchResults = await factChecker.batchCheckFacts(batchTexts);
    
    batchResults.forEach((result, index) => {
      console.log(`\n--- Text ${index + 1}: ${batchTexts[index]} ---`);
      console.log(`✅ Factual: ${result.isFactual}`);
      console.log(`📊 Confidence: ${result.confidence}%`);
      console.log(`⚠️  Issues: ${result.issues.length > 0 ? result.issues.join(', ') : 'None'}`);
    });
  } catch (error) {
    console.error(`❌ Error in batch fact check: ${error}`);
  }

  console.log('\n\n🎉 Fact Checking Examples Completed!');
}

/**
 * 異なるモデルでの比較例
 */
async function compareModels() {
  console.log('\n\n🤖 Comparing Different Models...\n');

  const testText = "The Great Wall of China is the only man-made structure visible from space with the naked eye.";

  const models: Array<{ name: string; options: FactCheckOptions }> = [
    { name: 'OpenAI GPT-4', options: { model: 'openai', temperature: 0.1 } },
    { name: 'Anthropic Claude', options: { model: 'anthropic', temperature: 0.1 } },
    { name: 'Google Gemini', options: { model: 'google', temperature: 0.1 } }
  ];

  for (const modelConfig of models) {
    console.log(`\n--- Testing ${modelConfig.name} ---`);
    
    try {
      const factChecker = new FactCheckingService(modelConfig.options);
      const result = await factChecker.checkFacts(testText);
      
      console.log(`✅ Factual: ${result.isFactual}`);
      console.log(`📊 Confidence: ${result.confidence}%`);
      console.log(`📝 Explanation: ${result.explanation.substring(0, 200)}...`);
    } catch (error) {
      console.error(`❌ Error with ${modelConfig.name}: ${error}`);
    }
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    await runFactCheckingExamples();
    await compareModels();
  } catch (error) {
    console.error('❌ Main execution failed:', error);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main();
}

export { runFactCheckingExamples, compareModels, main };
