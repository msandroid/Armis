import { ClientSession, stdioClient } from '@modelcontextprotocol/sdk';
import { ChatOpenAI } from '@langchain/openai';
import { LangChainMCPAdapter, MultiServerMCPClient } from '../services/langchain-mcp-adapter';
import { LangGraphMCPAdapter } from '../services/langchain-mcp-langgraph-adapter';

/**
 * 実際のMCPサーバーとの統合例
 * 注意: この例を実行するには、対応するMCPサーバーが起動している必要があります
 */
export class RealMCPServerIntegration {
  
  /**
   * stdio経由でMCPサーバーに接続する例
   */
  static async connectToStdioServer(
    command: string,
    args: string[] = []
  ): Promise<ClientSession> {
    console.log(`🔌 Connecting to MCP server: ${command} ${args.join(' ')}`);
    
    try {
      const { read, write } = await stdioClient(command, args);
      const session = new ClientSession(read, write);
      
      // セッションを初期化
      await session.initialize();
      console.log('✅ MCP session initialized successfully');
      
      return session;
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * 複数のMCPサーバーに接続する例
   */
  static async connectToMultipleServers(
    serverConfigs: Array<{
      name: string;
      command: string;
      args?: string[];
    }>
  ): Promise<Map<string, ClientSession>> {
    const sessions = new Map<string, ClientSession>();
    
    console.log('🔌 Connecting to multiple MCP servers...');
    
    for (const config of serverConfigs) {
      try {
        const session = await this.connectToStdioServer(config.command, config.args);
        sessions.set(config.name, session);
        console.log(`✅ Connected to ${config.name} server`);
      } catch (error) {
        console.error(`❌ Failed to connect to ${config.name} server:`, error);
        // 他のサーバーへの接続は続行
      }
    }
    
    return sessions;
  }

  /**
   * MCPサーバーのツール一覧を表示
   */
  static async listServerTools(session: ClientSession, serverName: string = 'Unknown') {
    try {
      const tools = await session.listTools();
      console.log(`📋 Tools available in ${serverName} server:`);
      
      for (const tool of tools.tools) {
        console.log(`  - ${tool.name}: ${tool.description}`);
        if (tool.inputSchema) {
          console.log(`    Schema: ${JSON.stringify(tool.inputSchema, null, 2)}`);
        }
      }
      
      return tools.tools;
    } catch (error) {
      console.error(`❌ Failed to list tools from ${serverName} server:`, error);
      throw error;
    }
  }

  /**
   * LangChainエージェントでMCPツールを使用する例
   */
  static async useMCPToolsWithLangChain(session: ClientSession) {
    console.log('🤖 Creating LangChain agent with MCP tools...');
    
    try {
      const adapter = new LangChainMCPAdapter(session);
      
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
      console.log('✅ React Agent created with MCP tools');
      
      return { adapter, agent, tools: langchainTools };
      
    } catch (error) {
      console.error('❌ Error creating LangChain agent:', error);
      throw error;
    }
  }

  /**
   * LangGraphエージェントでMCPツールを使用する例
   */
  static async useMCPToolsWithLangGraph(session: ClientSession) {
    console.log('🔄 Creating LangGraph agent with MCP tools...');
    
    try {
      const adapter = new LangGraphMCPAdapter(session);
      
      // LangGraphエージェントを作成
      const model = new ChatOpenAI({ 
        modelName: 'gpt-3.5-turbo',
        temperature: 0 
      });
      
      const graph = await adapter.createLangGraphAgentWithMCPTools(model);
      console.log('✅ LangGraph agent created with MCP tools');
      
      return { adapter, graph };
      
    } catch (error) {
      console.error('❌ Error creating LangGraph agent:', error);
      throw error;
    }
  }

  /**
   * 複数サーバーでLangChainエージェントを使用する例
   */
  static async useMultipleServersWithLangChain(sessions: Map<string, ClientSession>) {
    console.log('🔗 Creating LangChain agent with multiple MCP servers...');
    
    try {
      const multiClient = new MultiServerMCPClient();
      
      // 各サーバーをマルチクライアントに接続
      for (const [serverName, session] of sessions) {
        await multiClient.connectToServer(serverName, session);
      }
      
      // すべてのツールを取得
      const allTools = await multiClient.getAllTools();
      console.log('📋 All Available Tools:', allTools.map(t => t.name));
      
      // サーバー別のツール一覧を表示
      for (const [serverName, session] of sessions) {
        const tools = await multiClient.getToolsFromServer(serverName);
        console.log(`📋 ${serverName} Tools:`, tools.map(t => t.name));
      }
      
      return { multiClient, tools: allTools };
      
    } catch (error) {
      console.error('❌ Error creating multi-server agent:', error);
      throw error;
    }
  }

  /**
   * セッションを安全に閉じる
   */
  static async closeSession(session: ClientSession, serverName: string = 'Unknown') {
    try {
      await session.close();
      console.log(`🔌 Closed session for ${serverName} server`);
    } catch (error) {
      console.error(`❌ Error closing session for ${serverName} server:`, error);
    }
  }

  /**
   * 複数のセッションを安全に閉じる
   */
  static async closeAllSessions(sessions: Map<string, ClientSession>) {
    console.log('🔌 Closing all MCP sessions...');
    
    for (const [serverName, session] of sessions) {
      await this.closeSession(session, serverName);
    }
    
    sessions.clear();
    console.log('✅ All sessions closed');
  }
}

/**
 * 実際のMCPサーバーとの統合例を実行
 */
export async function runRealMCPServerExample() {
  console.log('🎯 Running Real MCP Server Integration Example\n');

  // 注意: 以下の例を実行するには、対応するMCPサーバーが起動している必要があります
  // 例: python math_server.py や node weather_server.js など

  const serverConfigs = [
    {
      name: 'math',
      command: 'python',
      args: ['./examples/math_server.py'] // 実際のパスに変更してください
    },
    {
      name: 'weather',
      command: 'node',
      args: ['./examples/weather_server.js'] // 実際のパスに変更してください
    }
  ];

  const sessions = new Map<string, ClientSession>();

  try {
    // 1. 複数のMCPサーバーに接続
    console.log('='.repeat(50));
    console.log('Step 1: Connecting to MCP servers...');
    
    // 実際のサーバーが利用できない場合は、モックセッションを使用
    console.log('⚠️  Note: Using mock sessions for demonstration');
    console.log('   To use real servers, start them first and update the paths above');
    
    // モックセッションを作成（実際の実装では上記のconnectToMultipleServersを使用）
    const mockMathSession = {
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

    const mockWeatherSession = {
      listTools: async () => ({
        tools: [
          {
            name: 'getWeather',
            description: 'Get weather for a location',
            inputSchema: {
              type: 'object',
              properties: { 
                location: { type: 'string' }
              },
              required: ['location']
            }
          }
        ]
      }),
      callTool: async (name: string, args: any) => {
        if (name === 'getWeather') {
          return { content: [{ type: 'text', text: `Weather in ${args.location}: Sunny, 25°C` }] };
        }
        throw new Error(`Unknown tool: ${name}`);
      },
      close: async () => {}
    } as ClientSession;

    sessions.set('math', mockMathSession);
    sessions.set('weather', mockWeatherSession);

    // 2. 各サーバーのツール一覧を表示
    console.log('\n' + '='.repeat(50));
    console.log('Step 2: Listing available tools...');
    
    for (const [serverName, session] of sessions) {
      await RealMCPServerIntegration.listServerTools(session, serverName);
    }

    // 3. LangChainエージェントでMCPツールを使用
    console.log('\n' + '='.repeat(50));
    console.log('Step 3: Using MCP tools with LangChain...');
    
    const mathSession = sessions.get('math')!;
    const { agent: langchainAgent } = await RealMCPServerIntegration.useMCPToolsWithLangChain(mathSession);
    
    // エージェントを実行
    const langchainResult = await langchainAgent.invoke({
      input: "Add 15 and 27, then multiply the result by 2"
    });
    
    console.log('✅ LangChain Agent Result:', langchainResult.output);

    // 4. LangGraphエージェントでMCPツールを使用
    console.log('\n' + '='.repeat(50));
    console.log('Step 4: Using MCP tools with LangGraph...');
    
    const { graph: langgraphAgent } = await RealMCPServerIntegration.useMCPToolsWithLangGraph(mathSession);
    
    // エージェントを実行
    const langgraphResult = await langgraphAgent.invoke({
      messages: [{ 
        role: 'user', 
        content: 'Calculate 10 * 5 and then add 3 to the result' 
      }]
    });
    
    console.log('✅ LangGraph Agent Result:', langgraphResult);

    // 5. 複数サーバーでLangChainエージェントを使用
    console.log('\n' + '='.repeat(50));
    console.log('Step 5: Using multiple MCP servers with LangChain...');
    
    const { multiClient } = await RealMCPServerIntegration.useMultipleServersWithLangChain(sessions);
    
    // 各サーバーのツールを個別に呼び出し
    const addResult = await multiClient.callServerTool('math', 'add', { a: 10, b: 5 });
    console.log('➕ Math Result:', addResult);
    
    const weatherResult = await multiClient.callServerTool('weather', 'getWeather', { location: 'Tokyo' });
    console.log('🌤️ Weather Result:', weatherResult);

    console.log('\n🎉 Real MCP Server Integration Example completed successfully!');

  } catch (error) {
    console.error('💥 Error in real MCP server example:', error);
  } finally {
    // セッションを閉じる
    await RealMCPServerIntegration.closeAllSessions(sessions);
  }
}

// 直接実行された場合の処理
if (require.main === module) {
  runRealMCPServerExample().catch(console.error);
}
