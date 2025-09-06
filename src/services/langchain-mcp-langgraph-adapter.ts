import { ClientSession } from '@modelcontextprotocol/sdk';
import { Tool } from '@langchain/core/tools';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, START } from '@langchain/langgraph';
import { MessagesState } from '@langchain/langgraph/types';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { LangChainMCPAdapter } from './langchain-mcp-adapter';

/**
 * LangGraphとMCPを統合するアダプター
 */
export class LangGraphMCPAdapter {
  private adapter: LangChainMCPAdapter;

  constructor(mcpSession: ClientSession) {
    this.adapter = new LangChainMCPAdapter(mcpSession);
  }

  /**
   * MCPツールを使用するLangGraphエージェントを作成
   */
  async createLangGraphAgentWithMCPTools(
    model: BaseChatModel = new ChatOpenAI({ modelName: 'gpt-4' })
  ) {
    const tools = await this.adapter.convertMCPToolsToLangChain();

    // モデル呼び出しノード
    const callModel = (state: MessagesState) => {
      const response = model.bindTools(tools).invoke(state.messages);
      return { messages: response };
    };

    // グラフの構築
    const builder = new StateGraph(MessagesState);
    builder.addNode('call_model', callModel);
    builder.addNode('tools', new ToolNode(tools));
    
    // エッジの追加
    builder.addEdge(START, 'call_model');
    builder.addConditionalEdges(
      'call_model',
      toolsCondition,
    );
    builder.addEdge('tools', 'call_model');

    return builder.compile();
  }

  /**
   * 複数のMCPサーバーを使用するLangGraphエージェントを作成
   */
  async createMultiServerLangGraphAgent(
    sessions: Map<string, ClientSession>,
    model: BaseChatModel = new ChatOpenAI({ modelName: 'gpt-4' })
  ) {
    const allTools: Tool[] = [];

    // 各サーバーからツールを取得
    for (const [serverName, session] of sessions) {
      const serverAdapter = new LangChainMCPAdapter(session);
      const tools = await serverAdapter.convertMCPToolsToLangChain();
      
      // ツール名にサーバー名をプレフィックスとして追加
      tools.forEach(tool => {
        tool.name = `${serverName}_${tool.name}`;
      });
      
      allTools.push(...tools);
    }

    // モデル呼び出しノード
    const callModel = (state: MessagesState) => {
      const response = model.bind_tools(allTools).invoke(state.messages);
      return { messages: response };
    };

    // グラフの構築
    const builder = new StateGraph(MessagesState);
    builder.add_node('call_model', callModel);
    builder.add_node('tools', new ToolNode(allTools));
    
    // エッジの追加
    builder.add_edge(START, 'call_model');
    builder.add_conditional_edges(
      'call_model',
      tools_condition,
    );
    builder.add_edge('tools', 'call_model');

    return builder.compile();
  }

  /**
   * カスタム状態を持つLangGraphエージェントを作成
   */
  async createCustomStateLangGraphAgent<T extends Record<string, any>>(
    stateSchema: T,
    model: BaseChatModel = new ChatOpenAI({ modelName: 'gpt-4' }),
    customNodes?: Record<string, (state: T) => Promise<Partial<T>>>
  ) {
    const tools = await this.adapter.convertMCPToolsToLangChain();

    // モデル呼び出しノード
    const callModel = async (state: T) => {
      const response = model.bind_tools(tools).invoke(state.messages);
      return { ...state, messages: response };
    };

    // グラフの構築
    const builder = new StateGraph(stateSchema);
    builder.add_node('call_model', callModel);
    builder.add_node('tools', new ToolNode(tools));
    
    // カスタムノードの追加
    if (customNodes) {
      for (const [nodeName, nodeFunction] of Object.entries(customNodes)) {
        builder.add_node(nodeName, nodeFunction);
      }
    }
    
    // エッジの追加
    builder.add_edge(START, 'call_model');
    builder.add_conditional_edges(
      'call_model',
      tools_condition,
    );
    builder.add_edge('tools', 'call_model');

    return builder.compile();
  }

  /**
   * ツールの利用可能性を確認
   */
  async getAvailableTools(): Promise<string[]> {
    return await this.adapter.listAvailableTools();
  }

  /**
   * 特定のツールを呼び出し
   */
  async callTool(toolName: string, input: any): Promise<any> {
    return await this.adapter.callMCPTool(toolName, input);
  }

  /**
   * セッションを閉じる
   */
  async close(): Promise<void> {
    await this.adapter.close();
  }
}

/**
 * MCPツールを使用するLangGraph APIサーバー用の設定
 */
export class LangGraphMCPAPIServer {
  private sessions: Map<string, ClientSession> = new Map();

  /**
   * サーバーに接続
   */
  async connectToServer(serverName: string, session: ClientSession): Promise<void> {
    this.sessions.set(serverName, session);
  }

  /**
   * LangGraphエージェントを作成
   */
  async createAgent(model: BaseChatModel = new ChatOpenAI({ modelName: 'gpt-4' })) {
    if (this.sessions.size === 1) {
      // 単一サーバーの場合
      const [session] = this.sessions.values();
      const adapter = new LangGraphMCPAdapter(session);
      return await adapter.createLangGraphAgentWithMCPTools(model);
    } else {
      // 複数サーバーの場合
      const adapter = new LangGraphMCPAdapter(this.sessions.values().next().value);
      return await adapter.createMultiServerLangGraphAgent(this.sessions, model);
    }
  }

  /**
   * 利用可能なツールの一覧を取得
   */
  async getAllAvailableTools(): Promise<Record<string, string[]>> {
    const toolsByServer: Record<string, string[]> = {};

    for (const [serverName, session] of this.sessions) {
      const adapter = new LangGraphMCPAdapter(session);
      toolsByServer[serverName] = await adapter.getAvailableTools();
    }

    return toolsByServer;
  }

  /**
   * すべてのセッションを閉じる
   */
  async closeAll(): Promise<void> {
    for (const session of this.sessions.values()) {
      await session.close();
    }
    this.sessions.clear();
  }
}

/**
 * MCPツールの使用例を提供するユーティリティ
 */
export class MCPToolExamples {
  /**
   * 基本的な計算ツールの例
   */
  static async basicMathExample(adapter: LangGraphMCPAdapter) {
    const graph = await adapter.createLangGraphAgentWithMCPTools();
    
    const result = await graph.invoke({
      messages: [{ role: 'user', content: 'What is 15 + 27?' }]
    });

    return result;
  }

  /**
   * 複数ツールを使用する例
   */
  static async multiToolExample(adapter: LangGraphMCPAdapter) {
    const graph = await adapter.createLangGraphAgentWithMCPTools();
    
    const result = await graph.invoke({
      messages: [{ 
        role: 'user', 
        content: 'Get the current time and then reverse the string "hello world"' 
      }]
    });

    return result;
  }

  /**
   * エラーハンドリングを含む例
   */
  static async errorHandlingExample(adapter: LangGraphMCPAdapter) {
    try {
      const graph = await adapter.createLangGraphAgentWithMCPTools();
      
      const result = await graph.invoke({
        messages: [{ 
          role: 'user', 
          content: 'Call a non-existent tool' 
        }]
      });

      return result;
    } catch (error) {
      console.error('Error in tool execution:', error);
      return { error: error.message };
    }
  }
}
