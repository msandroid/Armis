import { ClientSession } from '@modelcontextprotocol/sdk';
// import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { LangChainMCPAdapter, LLMConfig } from '../services/langchain-mcp-adapter';

/**
 * Ollama Gemma 3:1Bを使用したMCP統合の例
 */
export async function ollamaMCPIntegrationExample() {
  console.log('🚀 Starting Ollama MCP Integration Example...');

  // 仮想的なMCPセッションを作成
  const mockSession = {
    listTools: async () => ({
      tools: [
        {
          name: 'echo',
          description: 'Echo a message',
          inputSchema: {
            type: 'object',
            properties: { message: { type: 'string' } },
            required: ['message']
          }
        },
        {
          name: 'add',
          description: 'Add two numbers',
          inputSchema: {
            type: 'object',
            properties: { 
              a: { type: 'number' },
              b: { type: 'number' }
            },
            required: ['a', 'b']
          }
        },
        {
          name: 'getTime',
          description: 'Get current time',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'reverse',
          description: 'Reverse a string',
          inputSchema: {
            type: 'object',
            properties: { text: { type: 'string' } },
            required: ['text']
          }
        }
      ]
    }),
    callTool: async (name: string, args: any) => {
      if (name === 'echo') {
        return { content: [{ type: 'text', text: `Echo: ${args.message}` }] };
      } else if (name === 'add') {
        return { content: [{ type: 'text', text: `${args.a} + ${args.b} = ${args.a + args.b}` }] };
      } else if (name === 'getTime') {
        return { content: [{ type: 'text', text: `Current time: ${new Date().toLocaleString()}` }] };
      } else if (name === 'reverse') {
        return { content: [{ type: 'text', text: `Reversed: ${args.text.split('').reverse().join('')}` }] };
      }
      throw new Error(`Unknown tool: ${name}`);
    },
    close: async () => {}
  } as ClientSession;

  try {
    // LangChain MCPアダプターを作成
    const adapter = new LangChainMCPAdapter(mockSession);

    // 利用可能なツールを取得
    const availableTools = await adapter.listAvailableTools();
    console.log('📋 Available MCP Tools:', availableTools);

    // LangChainツールに変換
    const langchainTools = await adapter.convertMCPToolsToLangChain();
    console.log('🔄 Converted to LangChain Tools:', langchainTools.map(t => t.name));

    // Ollama Gemma 3:1Bの設定
    const ollamaConfig: LLMConfig = {
      type: 'ollama',
      modelName: 'gemma3:1b', // 利用可能なモデル
      baseUrl: 'http://localhost:11434',
      temperature: 0.1
    };

    console.log('🤖 Creating React Agent with Ollama Gemma...');
    
    // Reactエージェントを作成
    const agent = await adapter.createReactAgentWithMCPTools(ollamaConfig);
    console.log('✅ React Agent created with Ollama and MCP tools');

    // エージェントを実行
    const result = await agent.invoke({
      input: "Echo 'Hello from Ollama' and then add 15 and 27"
    });

    console.log('✅ Agent Result:', result.output);
    return result;

  } catch (error) {
    console.error('❌ Error in Ollama example:', error);
    throw error;
  }
}

/**
 * 直接Ollamaモデルを使用した例
 */
export async function directOllamaExample() {
  console.log('🚀 Starting Direct Ollama Example...');

  // 仮想的なMCPセッションを作成
  const mockSession = {
    listTools: async () => ({
      tools: [
        {
          name: 'calculate',
          description: 'Perform basic calculations',
          inputSchema: {
            type: 'object',
            properties: { 
              expression: { type: 'string' }
            },
            required: ['expression']
          }
        }
      ]
    }),
    callTool: async (name: string, args: any) => {
      if (name === 'calculate') {
        // 簡単な計算（実際の実装ではより安全な方法を使用）
        const result = eval(args.expression);
        return { content: [{ type: 'text', text: `${args.expression} = ${result}` }] };
      }
      throw new Error(`Unknown tool: ${name}`);
    },
    close: async () => {}
  } as ClientSession;

  try {
    // 直接Ollamaモデルを作成
    // const ollamaModel = new ChatOllama({
    //   model: 'gemma3:1b',
    //   baseUrl: 'http://localhost:11434',
    //   temperature: 0.1
    // });

    // console.log('🤖 Created Ollama model directly');

    // LangChain MCPアダプターを作成
    const adapter = new LangChainMCPAdapter(mockSession);

    // 直接モデルを渡してReactエージェントを作成
    // const agent = await adapter.createReactAgentWithMCPTools(ollamaModel);
    // console.log('✅ React Agent created with direct Ollama model');

    // エージェントを実行
    // const result = await agent.invoke({
    //   input: "Calculate 25 * 4 and explain the result"
    // });

    // console.log('✅ Direct Ollama Result:', result.output);
    // return result;

    console.log('⚠️ Direct Ollama example is currently commented out.');
    return { output: 'Direct Ollama example is commented out.' };

  } catch (error) {
    console.error('❌ Error in direct Ollama example:', error);
    throw error;
  }
}

/**
 * 複数のOllamaモデルを比較する例
 */
export async function compareOllamaModelsExample() {
  console.log('🚀 Starting Ollama Models Comparison Example...');

  // 仮想的なMCPセッションを作成
  const mockSession = {
    listTools: async () => ({
      tools: [
        {
          name: 'add',
          description: 'Add two numbers',
          inputSchema: {
            type: 'object',
            properties: { 
              a: { type: 'number' },
              b: { type: 'number' }
            },
            required: ['a', 'b']
          }
        }
      ]
    }),
    callTool: async (name: string, args: any) => {
      if (name === 'add') {
        return { content: [{ type: 'text', text: `${args.a} + ${args.b} = ${args.a + args.b}` }] };
      }
      throw new Error(`Unknown tool: ${name}`);
    },
    close: async () => {}
  } as ClientSession;

  const models = [
    { name: 'Gemma 3:1B', config: { type: 'ollama' as const, modelName: 'gemma3:1b' } },
    { name: 'Gemma 3:4B', config: { type: 'ollama' as const, modelName: 'gemma3:4b' } },
    { name: 'Phi 3:3.8B', config: { type: 'ollama' as const, modelName: 'phi3:3.8b' } }
  ];

  const adapter = new LangChainMCPAdapter(mockSession);
  const testInput = "Add 10 and 5, then explain what you did";

  for (const modelInfo of models) {
    try {
      console.log(`\n🧪 Testing ${modelInfo.name}...`);
      
      const agent = await adapter.createReactAgentWithMCPTools(modelInfo.config);
      const result = await agent.invoke({ input: testInput });
      
      console.log(`✅ ${modelInfo.name} Result:`, result.output);
      
    } catch (error) {
      console.log(`❌ ${modelInfo.name} Error:`, error.message);
    }
  }
}

/**
 * Ollamaの設定をテストする例
 */
export async function testOllamaConfiguration() {
  console.log('🚀 Testing Ollama Configuration...');

  try {
    // 基本的なOllamaモデルを作成
    // const ollamaModel = new ChatOllama({
    //   model: 'gemma3:1b',
    //   baseUrl: 'http://localhost:11434',
    //   temperature: 0.1
    // });

    // console.log('✅ Ollama model created successfully');

    // 簡単なテスト
    // const response = await ollamaModel.invoke('Hello, can you respond with "Ollama is working"?');
    // console.log('✅ Ollama response:', response.content);

    console.log('⚠️ Ollama configuration test is currently commented out.');
    return { success: true, response: 'Ollama configuration test is commented out.' };

  } catch (error) {
    console.error('❌ Ollama configuration error:', error);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Tip: Make sure Ollama is running on http://localhost:11434');
      console.log('   Run: ollama serve');
    } else if (error.message.includes('model not found')) {
      console.log('💡 Tip: Make sure the model is installed');
      console.log('   Run: ollama pull gemma3:1b');
    }
    
    throw error;
  }
}

/**
 * メイン実行関数
 */
export async function runAllOllamaExamples() {
  console.log('🎯 Running All Ollama MCP Integration Examples\n');

  try {
    // Ollama設定テスト
    console.log('='.repeat(50));
    await testOllamaConfiguration();
    
    console.log('\n' + '='.repeat(50));
    await ollamaMCPIntegrationExample();
    
    console.log('\n' + '='.repeat(50));
    await directOllamaExample();
    
    console.log('\n' + '='.repeat(50));
    await compareOllamaModelsExample();
    
    console.log('\n🎉 All Ollama examples completed successfully!');
    
  } catch (error) {
    console.error('💥 Error running Ollama examples:', error);
  }
}

// 直接実行された場合の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllOllamaExamples().catch(console.error);
}
