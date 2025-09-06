import LangChainAgentsService, { LangChainAgentConfig, AgentCreationOptions } from '../services/agent/langchain-agents-service';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { DynamicTool } from '@langchain/community/tools/dynamic';

// 環境変数からAPIキーを取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY || '';

// 基本的な設定例
const basicConfig: LangChainAgentConfig = {
  modelType: 'openai',
  modelName: 'gpt-3.5-turbo',
  temperature: 0,
  maxTokens: 1000,
  apiKey: OPENAI_API_KEY,
};

const anthropicConfig: LangChainAgentConfig = {
  modelType: 'anthropic',
  modelName: 'claude-3-sonnet-20240229',
  temperature: 0,
  maxTokens: 1000,
  apiKey: ANTHROPIC_API_KEY,
};

const googleConfig: LangChainAgentConfig = {
  modelType: 'google',
  modelName: 'gemini-pro',
  temperature: 0,
  maxTokens: 1000,
  apiKey: GOOGLE_API_KEY,
};

const ollamaConfig: LangChainAgentConfig = {
  modelType: 'ollama',
  modelName: 'llama2',
  temperature: 0,
  baseUrl: 'http://localhost:11434',
};

// カスタムツールの例
const customTools = [
  new Calculator(),
  new SerpAPI(SERPAPI_API_KEY),
  new DynamicTool({
    name: 'get_current_time',
    description: '現在の時刻を取得します',
    func: async () => {
      return new Date().toISOString();
    },
  }),
  new DynamicTool({
    name: 'get_weather_info',
    description: '指定された都市の天気情報を取得します（モック）',
    func: async (input: string) => {
      // 実際の実装では天気APIを使用
      return `天気情報: ${input}の天気は晴れです。気温は25度です。`;
    },
  }),
];

// エージェント作成オプション
const agentOptions: AgentCreationOptions = {
  tools: customTools,
  verbose: true,
  maxIterations: 10,
  returnIntermediateSteps: true,
};

// 基本的なエージェント使用例
export async function basicAgentExample() {
  console.log('=== Basic Agent Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  try {
    // 基本的なエージェントを作成
    const agent = await service.createBasicAgent(agentOptions);
    
    // エージェントを実行
    const result = await service.runAgent(agent, '2 + 2 は何ですか？');
    
    console.log('Basic Agent Result:', result);
    return result;
  } catch (error) {
    console.error('Basic Agent Error:', error);
    throw error;
  }
}

// チャットエージェント使用例
export async function chatAgentExample() {
  console.log('=== Chat Agent Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  try {
    // チャットエージェントを作成
    const agent = await service.createChatAgent(agentOptions);
    
    // エージェントを実行
    const result = await service.runAgent(agent, '東京の現在の天気を教えてください');
    
    console.log('Chat Agent Result:', result);
    return result;
  } catch (error) {
    console.error('Chat Agent Error:', error);
    throw error;
  }
}

// 会話型チャットエージェント使用例
export async function chatConversationalAgentExample() {
  console.log('=== Chat Conversational Agent Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  try {
    // 会話型チャットエージェントを作成
    const agent = await service.createChatConversationalAgent(agentOptions);
    
    // 複数の質問を連続で実行
    const questions = [
      'こんにちは',
      '私の名前は何ですか？',
      '今日の日付を教えてください',
      'ありがとうございます'
    ];
    
    for (const question of questions) {
      console.log(`Question: ${question}`);
      const result = await service.runAgent(agent, question);
      console.log(`Answer: ${result.output}`);
    }
    
    return 'Conversation completed';
  } catch (error) {
    console.error('Chat Conversational Agent Error:', error);
    throw error;
  }
}

// Zero-Shotエージェント使用例
export async function zeroShotAgentExample() {
  console.log('=== Zero-Shot Agent Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  try {
    // Zero-Shotエージェントを作成
    const agent = await service.createZeroShotAgent(agentOptions);
    
    // エージェントを実行
    const result = await service.runAgent(agent, '100の平方根を計算してください');
    
    console.log('Zero-Shot Agent Result:', result);
    return result;
  } catch (error) {
    console.error('Zero-Shot Agent Error:', error);
    throw error;
  }
}

// 構造化チャットエージェント使用例
export async function structuredChatAgentExample() {
  console.log('=== Structured Chat Agent Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  try {
    // 構造化チャットエージェントを作成
    const agent = await service.createStructuredChatAgent(agentOptions);
    
    // エージェントを実行
    const result = await service.runAgent(agent, '複雑な数学の問題を解いてください: (15 * 3) + (20 / 4) - 7');
    
    console.log('Structured Chat Agent Result:', result);
    return result;
  } catch (error) {
    console.error('Structured Chat Agent Error:', error);
    throw error;
  }
}

// OpenAI Functionsエージェント使用例
export async function openAIFunctionsAgentExample() {
  console.log('=== OpenAI Functions Agent Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  try {
    // OpenAI Functionsエージェントを作成
    const agent = await service.createOpenAIFunctionsAgent(agentOptions);
    
    // エージェントを実行
    const result = await service.runAgent(agent, '最新のAI技術のニュースを検索してください');
    
    console.log('OpenAI Functions Agent Result:', result);
    return result;
  } catch (error) {
    console.error('OpenAI Functions Agent Error:', error);
    throw error;
  }
}

// ReActエージェント使用例
export async function reactAgentExample() {
  console.log('=== ReAct Agent Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  try {
    // ReActエージェントを作成
    const agent = await service.createReactAgent(agentOptions);
    
    // エージェントを実行
    const result = await service.runAgent(agent, '2024年のオリンピック開催地を調べて、その都市の人口も教えてください');
    
    console.log('ReAct Agent Result:', result);
    return result;
  } catch (error) {
    console.error('ReAct Agent Error:', error);
    throw error;
  }
}

// 複数エージェント比較例
export async function multipleAgentsComparisonExample() {
  console.log('=== Multiple Agents Comparison Example ===');
  
  const question = '日本の首都の人口を教えてください';
  
  const agents = [
    { name: 'OpenAI Basic Agent', config: basicConfig },
    { name: 'Anthropic Basic Agent', config: anthropicConfig },
    { name: 'Google Basic Agent', config: googleConfig },
  ];
  
  const results = [];
  
  for (const { name, config } of agents) {
    try {
      console.log(`Running ${name}...`);
      const service = new LangChainAgentsService(config);
      const agent = await service.createBasicAgent(agentOptions);
      const result = await service.runAgent(agent, question);
      
      results.push({
        name,
        result,
        success: true,
      });
      
      console.log(`${name} Result:`, result.output);
    } catch (error) {
      console.error(`${name} Error:`, error);
      results.push({
        name,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }
  
  console.log('All Results:', results);
  return results;
}

// カスタムツール使用例
export async function customToolsExample() {
  console.log('=== Custom Tools Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  // カスタムツールを作成
  const customTool = service.createCustomTool(
    'get_user_info',
    'ユーザー情報を取得します',
    async (input: string) => {
      // 実際の実装ではデータベースから取得
      return `ユーザー情報: ${input}の情報を取得しました。`;
    }
  );
  
  const customAgentOptions: AgentCreationOptions = {
    tools: [new Calculator(), customTool],
    verbose: true,
    maxIterations: 5,
    returnIntermediateSteps: false,
  };
  
  try {
    const agent = await service.createBasicAgent(customAgentOptions);
    const result = await service.runAgent(agent, 'ユーザーID 12345の情報を取得してください');
    
    console.log('Custom Tools Result:', result);
    return result;
  } catch (error) {
    console.error('Custom Tools Error:', error);
    throw error;
  }
}

// エージェントの一括実行例
export async function batchExecutionExample() {
  console.log('=== Batch Execution Example ===');
  
  const service = new LangChainAgentsService(basicConfig);
  
  try {
    // 複数のエージェントを作成
    const agent1 = await service.createBasicAgent(agentOptions);
    const agent2 = await service.createChatAgent(agentOptions);
    const agent3 = await service.createZeroShotAgent(agentOptions);
    
    const agents = [
      { name: 'Basic Agent', agent: agent1 },
      { name: 'Chat Agent', agent: agent2 },
      { name: 'Zero-Shot Agent', agent: agent3 },
    ];
    
    // 一括実行
    const results = await service.runMultipleAgents(agents, '1 + 1 は何ですか？');
    
    console.log('Batch Execution Results:', results);
    return results;
  } catch (error) {
    console.error('Batch Execution Error:', error);
    throw error;
  }
}

// メイン実行関数
export async function runAllExamples() {
  console.log('🚀 Starting LangChain Agents Examples...\n');
  
  try {
    // 基本的な例を実行
    await basicAgentExample();
    console.log('\n');
    
    await chatAgentExample();
    console.log('\n');
    
    await zeroShotAgentExample();
    console.log('\n');
    
    await structuredChatAgentExample();
    console.log('\n');
    
    await reactAgentExample();
    console.log('\n');
    
    await customToolsExample();
    console.log('\n');
    
    await batchExecutionExample();
    console.log('\n');
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// 個別実行用の関数
export async function runSpecificExample(exampleName: string) {
  const examples: { [key: string]: () => Promise<any> } = {
    'basic': basicAgentExample,
    'chat': chatAgentExample,
    'conversational': chatConversationalAgentExample,
    'zero-shot': zeroShotAgentExample,
    'structured': structuredChatAgentExample,
    'openai-functions': openAIFunctionsAgentExample,
    'react': reactAgentExample,
    'multiple': multipleAgentsComparisonExample,
    'custom-tools': customToolsExample,
    'batch': batchExecutionExample,
  };
  
  const example = examples[exampleName];
  if (!example) {
    throw new Error(`Unknown example: ${exampleName}`);
  }
  
  return await example();
}

// デフォルトエクスポート
export default {
  basicAgentExample,
  chatAgentExample,
  chatConversationalAgentExample,
  zeroShotAgentExample,
  structuredChatAgentExample,
  openAIFunctionsAgentExample,
  reactAgentExample,
  multipleAgentsComparisonExample,
  customToolsExample,
  batchExecutionExample,
  runAllExamples,
  runSpecificExample,
};
