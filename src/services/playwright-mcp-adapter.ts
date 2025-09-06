import { ClientSession, stdioClient } from '@modelcontextprotocol/sdk';
import { DynamicTool } from '@langchain/core/tools';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Playwright MCPサーバーの設定
 */
export interface PlaywrightMCPConfig {
  command?: string;
  args?: string[];
  baseUrl?: string;
  headless?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  timeout?: number;
}

/**
 * Playwright MCPアダプター
 */
export class PlaywrightMCPAdapter {
  private session: ClientSession | null = null;
  private config: PlaywrightMCPConfig;

  constructor(config: PlaywrightMCPConfig = {}) {
    this.config = {
      command: 'npx',
      args: ['@playwright/mcp'],
      headless: true,
      browser: 'chromium',
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
      ...config
    };
  }

  /**
   * Playwright MCPサーバーに接続
   */
  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to Playwright MCP server...');
      
      const { read, write } = await stdioClient(
        this.config.command!,
        this.config.args!
      );
      
      this.session = new ClientSession(read, write);
      await this.session.initialize();
      
      console.log('✅ Playwright MCP session initialized successfully');
    } catch (error) {
      console.error('❌ Failed to connect to Playwright MCP server:', error);
      throw error;
    }
  }

  /**
   * 利用可能なツールを取得
   */
  async getAvailableTools(): Promise<string[]> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    const tools = await this.session.listTools();
    return tools.tools.map(tool => tool.name);
  }

  /**
   * Playwright MCPツールをLangChainツールに変換
   */
  async convertPlaywrightToolsToLangChain(): Promise<DynamicTool[]> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    const tools = await this.session.listTools();
    const langchainTools: DynamicTool[] = [];

    for (const tool of tools.tools) {
      console.log('Converting Playwright tool:', tool.name, tool.description);
      
      const langchainTool = new DynamicTool({
        name: tool.name,
        description: tool.description || '',
        func: async (input: any) => {
          if (!this.session) {
            throw new Error('Playwright MCP session not available');
          }

          try {
            const result = await this.session.callTool(tool.name, input);
            return result.content?.[0]?.text || JSON.stringify(result);
          } catch (error) {
            console.error(`Error calling Playwright tool ${tool.name}:`, error);
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
   * ブラウザを起動
   */
  async launchBrowser(): Promise<void> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      // ブラウザのインストールを確認
      await this.session.callTool('browser_install', {});
      console.log('✅ Browser installed/verified');
    } catch (error) {
      console.log('⚠️ Browser installation check failed, continuing...');
    }
  }

  /**
   * URLにナビゲート
   */
  async navigateToUrl(url: string): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_navigate', { url });
      console.log(`✅ Navigated to ${url}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to navigate to ${url}:`, error);
      throw error;
    }
  }

  /**
   * ページのスナップショットを取得
   */
  async takeSnapshot(): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_snapshot', {});
      console.log('✅ Page snapshot taken');
      return result;
    } catch (error) {
      console.error('❌ Failed to take snapshot:', error);
      throw error;
    }
  }

  /**
   * スクリーンショットを撮影
   */
  async takeScreenshot(options: {
    filename?: string;
    fullPage?: boolean;
    type?: 'png' | 'jpeg';
  } = {}): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_take_screenshot', {
        filename: options.filename || `screenshot-${Date.now()}.png`,
        fullPage: options.fullPage || false,
        type: options.type || 'png'
      });
      console.log('✅ Screenshot taken');
      return result;
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error);
      throw error;
    }
  }

  /**
   * 要素をクリック
   */
  async clickElement(element: string, ref: string): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_click', {
        element,
        ref
      });
      console.log(`✅ Clicked element: ${element}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to click element ${element}:`, error);
      throw error;
    }
  }

  /**
   * テキストを入力
   */
  async typeText(element: string, ref: string, text: string, options: {
    submit?: boolean;
    slowly?: boolean;
  } = {}): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_type', {
        element,
        ref,
        text,
        submit: options.submit || false,
        slowly: options.slowly || false
      });
      console.log(`✅ Typed text into element: ${element}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to type text into element ${element}:`, error);
      throw error;
    }
  }

  /**
   * キーを押す
   */
  async pressKey(key: string): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_press_key', { key });
      console.log(`✅ Pressed key: ${key}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to press key ${key}:`, error);
      throw error;
    }
  }

  /**
   * テキストが表示されるまで待機
   */
  async waitForText(text: string): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_wait_for', { text });
      console.log(`✅ Waited for text: ${text}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to wait for text ${text}:`, error);
      throw error;
    }
  }

  /**
   * JavaScriptを実行
   */
  async evaluateJavaScript(code: string, element?: string, ref?: string): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const params: any = { function: code };
      if (element && ref) {
        params.element = element;
        params.ref = ref;
      }

      const result = await this.session.callTool('browser_evaluate', params);
      console.log('✅ JavaScript evaluated');
      return result;
    } catch (error) {
      console.error('❌ Failed to evaluate JavaScript:', error);
      throw error;
    }
  }

  /**
   * フォームを入力
   */
  async fillForm(fields: Array<{
    element: string;
    ref: string;
    value: string;
  }>): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_fill_form', { fields });
      console.log('✅ Form filled');
      return result;
    } catch (error) {
      console.error('❌ Failed to fill form:', error);
      throw error;
    }
  }

  /**
   * ファイルをアップロード
   */
  async uploadFiles(filePaths: string[]): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_file_upload', { paths: filePaths });
      console.log('✅ Files uploaded');
      return result;
    } catch (error) {
      console.error('❌ Failed to upload files:', error);
      throw error;
    }
  }

  /**
   * ネットワークリクエストを取得
   */
  async getNetworkRequests(): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const result = await this.session.callTool('browser_network_requests', {});
      console.log('✅ Network requests retrieved');
      return result;
    } catch (error) {
      console.error('❌ Failed to get network requests:', error);
      throw error;
    }
  }

  /**
   * タブを管理
   */
  async manageTabs(action: 'list' | 'create' | 'close' | 'select', index?: number): Promise<any> {
    if (!this.session) {
      throw new Error('Playwright MCP session not initialized');
    }

    try {
      const params: any = { action };
      if (index !== undefined) {
        params.index = index;
      }

      const result = await this.session.callTool('browser_tabs', params);
      console.log(`✅ Tab action completed: ${action}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to manage tabs (${action}):`, error);
      throw error;
    }
  }

  /**
   * Playwright MCPツールを使用するReactエージェントを作成
   */
  async createReactAgentWithPlaywrightTools(
    llmConfig: any = { type: 'openai', modelName: 'gpt-3.5-turbo' }
  ): Promise<AgentExecutor> {
    const tools = await this.convertPlaywrightToolsToLangChain();
    
    // LLMモデルを取得または作成
    let model: BaseChatModel;
    
    if (llmConfig.type === 'ollama') {
      model = new ChatOllama({
        model: llmConfig.modelName || 'gemma3:1b',
        baseUrl: llmConfig.baseUrl || 'http://localhost:11434',
        temperature: llmConfig.temperature || 0.1
      });
    } else {
      model = new ChatOpenAI({
        modelName: llmConfig.modelName || 'gpt-3.5-turbo',
        openAIApiKey: llmConfig.apiKey,
        temperature: llmConfig.temperature || 0
      });
    }
    
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant with access to browser automation tools through Playwright MCP.
You can use these tools to interact with web pages, navigate, click elements, fill forms, and more.

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
   * セッションを閉じる
   */
  async close(): Promise<void> {
    if (this.session) {
      await this.session.close();
      this.session = null;
      console.log('🔌 Playwright MCP session closed');
    }
  }
}
