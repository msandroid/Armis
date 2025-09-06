import { ClientSession, stdioClient } from '@modelcontextprotocol/sdk';
import { ChatOpenAI } from '@langchain/openai';
import { LangChainMCPAdapter, MultiServerMCPClient } from '../services/langchain-mcp-adapter';
// import { LangGraphMCPAdapter, MCPToolExamples } from '../services/langchain-mcp-langgraph-adapter';
import { echoTool, addTool, getCurrentTimeTool } from '../mcp/tools/example-tools';

/**
 * 基本的なLangChain MCP統合の例
 */
export async function basicLangChainMCPExample() {
  console.log('🚀 Starting Basic LangChain MCP Integration Example...');

  // 仮想的なMCPセッションを作成（実際の実装では実際のMCPサーバーに接続）
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
        }
      ]
    }),
    callTool: async (name: string, args: any) => {
      if (name === 'echo') {
        return { content: [{ type: 'text', text: `Echo: ${args.message}` }] };
      } else if (name === 'add') {
        return { content: [{ type: 'text', text: `${args.a} + ${args.b} = ${args.a + args.b}` }] };
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

    // Reactエージェントを作成
    const model = new ChatOpenAI({ 
      modelName: 'gpt-3.5-turbo',
      temperature: 0 
    });
    
    const agent = await adapter.createReactAgentWithMCPTools(model);
    console.log('🤖 React Agent created with MCP tools');

    // エージェントを実行
    const result = await agent.invoke({
      input: "Echo 'Hello World' and then add 5 and 3"
    });

    console.log('✅ Agent Result:', result.output);
    return result;

  } catch (error) {
    console.error('❌ Error in basic example:', error);
    throw error;
  }
}

/**
 * 複数サーバーを使用する例
 */
export async function multiServerMCPExample() {
  console.log('🚀 Starting Multi-Server MCP Example...');

  // 複数の仮想的なMCPセッションを作成
  const mathServer = {
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
        },
        {
          name: 'multiply',
          description: 'Multiply two numbers',
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
      } else if (name === 'multiply') {
        return { content: [{ type: 'text', text: `${args.a} × ${args.b} = ${args.a * args.b}` }] };
      }
      throw new Error(`Unknown tool: ${name}`);
    },
    close: async () => {}
  } as ClientSession;

  const utilityServer = {
    listTools: async () => ({
      tools: [
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
      if (name === 'getTime') {
        return { content: [{ type: 'text', text: `Current time: ${new Date().toLocaleString()}` }] };
      } else if (name === 'reverse') {
        return { content: [{ type: 'text', text: `Reversed: ${args.text.split('').reverse().join('')}` }] };
      }
      throw new Error(`Unknown tool: ${name}`);
    },
    close: async () => {}
  } as ClientSession;

  try {
    // マルチサーバークライアントを作成
    const multiClient = new MultiServerMCPClient();
    
    // サーバーに接続
    await multiClient.connectToServer('math', mathServer);
    await multiClient.connectToServer('utility', utilityServer);

    // すべてのツールを取得
    const allTools = await multiClient.getAllTools();
    console.log('📋 All Available Tools:', allTools.map(t => t.name));

    // 特定のサーバーのツールを取得
    const mathTools = await multiClient.getToolsFromServer('math');
    console.log('🧮 Math Tools:', mathTools.map(t => t.name));

    const utilityTools = await multiClient.getToolsFromServer('utility');
    console.log('🔧 Utility Tools:', utilityTools.map(t => t.name));

    // ツールを個別に呼び出し
    const addResult = await multiClient.callServerTool('math', 'add', { a: 10, b: 5 });
    console.log('➕ Add Result:', addResult);

    const timeResult = await multiClient.callServerTool('utility', 'getTime', {});
    console.log('⏰ Time Result:', timeResult);

    await multiClient.closeAll();
    console.log('✅ Multi-server example completed');

  } catch (error) {
    console.error('❌ Error in multi-server example:', error);
    throw error;
  }
}

/**
 * LangGraph統合の例（現在は無効化）
 */
export async function langGraphMCPExample() {
  console.log('🚀 LangGraph MCP Integration Example is currently disabled');
  console.log('⚠️  LangGraph API has changed and needs to be updated');
  return { message: 'LangGraph example disabled' };
}

/**
 * エラーハンドリングの例
 */
export async function errorHandlingExample() {
  console.log('🚀 Starting Error Handling Example...');

  // エラーを発生させる可能性のあるMCPセッション
  const errorProneSession = {
    listTools: async () => ({
      tools: [
        {
          name: 'risky',
          description: 'A tool that might fail',
          inputSchema: {
            type: 'object',
            properties: { 
              shouldFail: { type: 'boolean' }
            },
            required: ['shouldFail']
          }
        }
      ]
    }),
    callTool: async (name: string, args: any) => {
      if (name === 'risky') {
        if (args.shouldFail) {
          throw new Error('Tool execution failed as requested');
        }
        return { content: [{ type: 'text', text: 'Tool executed successfully' }] };
      }
      throw new Error(`Unknown tool: ${name}`);
    },
    close: async () => {}
  } as ClientSession;

  try {
    const adapter = new LangChainMCPAdapter(errorProneSession);

    // 成功するケース
    console.log('🔄 Testing successful tool execution...');
    const successResult = await adapter.callMCPTool('risky', { shouldFail: false });
    console.log('✅ Success Result:', successResult);

    // 失敗するケース
    console.log('🔄 Testing failed tool execution...');
    try {
      await adapter.callMCPTool('risky', { shouldFail: true });
    } catch (error) {
      console.log('❌ Expected Error:', error.message);
    }

    await adapter.close();
    console.log('✅ Error handling example completed');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    throw error;
  }
}

/**
 * メイン実行関数
 */
export async function runAllExamples() {
  console.log('🎯 Running All LangChain MCP Integration Examples\n');

  try {
    // 基本的な例
    console.log('='.repeat(50));
    await basicLangChainMCPExample();
    
    console.log('\n' + '='.repeat(50));
    await multiServerMCPExample();
    
    console.log('\n' + '='.repeat(50));
    await langGraphMCPExample();
    
    console.log('\n' + '='.repeat(50));
    await errorHandlingExample();
    
    console.log('\n🎉 All examples completed successfully!');
    
  } catch (error) {
    console.error('💥 Error running examples:', error);
  }
}

// 直接実行された場合の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
