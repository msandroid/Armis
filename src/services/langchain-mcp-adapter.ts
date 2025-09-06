import { ClientSession } from '@modelcontextprotocol/sdk';
import { DynamicTool } from '@langchain/core/tools';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { PromptTemplate } from '@langchain/core/prompts';

/**
 * サポートされているLLMモデルの種類
 */
export type SupportedLLMType = 'openai' | 'ollama' | 'gemini' | 'anthropic';

/**
 * LLMモデルの設定
 */
export interface LLMConfig {
  type: SupportedLLMType;
  modelName?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * MCPツールをLangChainツールに変換するアダプター
 */
export class LangChainMCPAdapter {
  private session: ClientSession | null = null;

  constructor(private mcpSession: ClientSession) {
    this.session = mcpSession;
  }

  /**
   * 指定された設定でLLMモデルを作成
   */
  static createLLMModel(config: LLMConfig): BaseChatModel {
    const defaultConfig = {
      temperature: 0,
      maxTokens: 1000,
    };

    switch (config.type) {
      case 'openai':
        return new ChatOpenAI({
          modelName: config.modelName || 'gpt-3.5-turbo',
          openAIApiKey: config.apiKey,
          temperature: config.temperature ?? defaultConfig.temperature,
          maxTokens: config.maxTokens ?? defaultConfig.maxTokens,
        });

      case 'ollama':
        return new ChatOllama({
          model: config.modelName || 'gemma2:2b',
          baseUrl: config.baseUrl || 'http://localhost:11434',
          temperature: config.temperature ?? defaultConfig.temperature,
        });

      case 'gemini':
        // Geminiの場合は別途実装が必要
        throw new Error('Gemini support not yet implemented');

      case 'anthropic':
        // Anthropicの場合は別途実装が必要
        throw new Error('Anthropic support not yet implemented');

      default:
        throw new Error(`Unsupported LLM type: ${config.type}`);
    }
  }

  /**
   * MCPツールをLangChainツールに変換
   */
  async convertMCPToolsToLangChain(): Promise<DynamicTool[]> {
    if (!this.session) {
      throw new Error('MCP session not initialized');
    }

    const tools = await this.session.listTools();
    const langchainTools: DynamicTool[] = [];

    for (const tool of tools.tools) {
      console.log('Converting tool:', tool.name, tool.description);
      
      const langchainTool = new DynamicTool({
        name: tool.name,
        description: tool.description || '',
        func: async (input: any) => {
          if (!this.session) {
            throw new Error('MCP session not available');
          }

          try {
            const result = await this.session.callTool(tool.name, input);
            return result.content?.[0]?.text || JSON.stringify(result);
          } catch (error) {
            console.error(`Error calling MCP tool ${tool.name}:`, error);
            throw error;
          }
        },
      });

      console.log('Created LangChain tool:', langchainTool.name, langchainTool.description);
      langchainTools.push(langchainTool);
    }

    return langchainTools;
  }

  /**
   * MCPツールを使用するReactエージェントを作成（カスタムLLM対応）
   */
  async createReactAgentWithMCPTools(
    llmConfig: LLMConfig | BaseChatModel = { type: 'openai', modelName: 'gpt-3.5-turbo' }
  ): Promise<AgentExecutor> {
    const tools = await this.convertMCPToolsToLangChain();
    
    // LLMモデルを取得または作成
    const model = llmConfig instanceof BaseChatModel 
      ? llmConfig 
      : LangChainMCPAdapter.createLLMModel(llmConfig);
    
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant with access to various tools through MCP (Model Context Protocol).
You can use these tools to help answer questions and perform tasks.

Available tools:
{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Question: {input}
Thought: {agent_scratchpad}
`);

    const agent = await createReactAgent({
      llm: model,
      tools,
      prompt,
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });
  }

  /**
   * 単一のMCPツールを呼び出す
   */
  async callMCPTool(toolName: string, input: any): Promise<any> {
    if (!this.session) {
      throw new Error('MCP session not initialized');
    }

    try {
      const result = await this.session.callTool(toolName, input);
      return result;
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * 利用可能なMCPツールの一覧を取得
   */
  async listAvailableTools(): Promise<string[]> {
    if (!this.session) {
      throw new Error('MCP session not initialized');
    }

    const tools = await this.session.listTools();
    return tools.tools.map(tool => tool.name);
  }

  /**
   * セッションを閉じる
   */
  async close(): Promise<void> {
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
  }
}

/**
 * 複数のMCPサーバーを管理するクライアント
 */
export class MultiServerMCPClient {
  private sessions: Map<string, ClientSession> = new Map();

  /**
   * MCPサーバーに接続
   */
  async connectToServer(
    serverName: string,
    session: ClientSession
  ): Promise<void> {
    this.sessions.set(serverName, session);
  }

  /**
   * 特定のサーバーからツールを取得
   */
  async getToolsFromServer(serverName: string): Promise<DynamicTool[]> {
    const session = this.sessions.get(serverName);
    if (!session) {
      throw new Error(`Server ${serverName} not connected`);
    }

    const adapter = new LangChainMCPAdapter(session);
    return await adapter.convertMCPToolsToLangChain();
  }

  /**
   * すべてのサーバーからツールを取得
   */
  async getAllTools(): Promise<DynamicTool[]> {
    const allTools: DynamicTool[] = [];
    
    for (const [serverName, session] of this.sessions) {
      const adapter = new LangChainMCPAdapter(session);
      const tools = await adapter.convertMCPToolsToLangChain();
      
      // ツール名にサーバー名をプレフィックスとして追加
      tools.forEach(tool => {
        tool.name = `${serverName}_${tool.name}`;
      });
      
      allTools.push(...tools);
    }

    return allTools;
  }

  /**
   * 特定のサーバーのツールを呼び出す
   */
  async callServerTool(
    serverName: string,
    toolName: string,
    input: any
  ): Promise<any> {
    const session = this.sessions.get(serverName);
    if (!session) {
      throw new Error(`Server ${serverName} not connected`);
    }

    const adapter = new LangChainMCPAdapter(session);
    return await adapter.callMCPTool(toolName, input);
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
 * LangChainツールをMCPツールに変換するユーティリティ
 */
export function convertLangChainToolToMCP(tool: DynamicTool) {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.schema,
    handler: async (args: any) => {
      try {
        const result = await tool.func(args);
        return {
          content: [{
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result)
          }]
        };
      } catch (error) {
        console.error(`Error in MCP tool handler for ${tool.name}:`, error);
        throw error;
      }
    }
  };
}
