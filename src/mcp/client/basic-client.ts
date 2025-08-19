import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * 基本的なMCPクライアントの実装例
 */
export class BasicMcpClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor() {
    this.client = new Client({
      name: "basic-mcp-client",
      version: "1.0.0"
    });

    this.transport = new StdioClientTransport({
      command: "node",
      args: ["../server/basic-server.js"]
    });
  }

  /**
   * クライアントを接続します
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
      console.log("MCPクライアントが正常に接続されました");
    } catch (error) {
      console.error("MCPクライアントの接続に失敗しました:", error);
      throw error;
    }
  }

  /**
   * 利用可能なプロンプトを一覧表示します
   */
  async listPrompts(): Promise<void> {
    try {
      const prompts = await this.client.listPrompts();
      console.log("利用可能なプロンプト:", prompts);
    } catch (error) {
      console.error("プロンプトの取得に失敗しました:", error);
    }
  }

  /**
   * 利用可能なリソースを一覧表示します
   */
  async listResources(): Promise<void> {
    try {
      const resources = await this.client.listResources();
      console.log("利用可能なリソース:", resources);
    } catch (error) {
      console.error("リソースの取得に失敗しました:", error);
    }
  }

  /**
   * 利用可能なツールを一覧表示します
   */
  async listTools(): Promise<void> {
    try {
      const tools = await this.client.listTools();
      console.log("利用可能なツール:", tools);
    } catch (error) {
      console.error("ツールの取得に失敗しました:", error);
    }
  }

  /**
   * 特定のツールを呼び出します
   */
  async callTool(toolName: string, arguments_: Record<string, any>): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: arguments_
      });
      console.log(`ツール ${toolName} の実行結果:`, result);
      return result;
    } catch (error) {
      console.error(`ツール ${toolName} の実行に失敗しました:`, error);
      throw error;
    }
  }

  /**
   * クライアントを切断します
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log("MCPクライアントが切断されました");
    } catch (error) {
      console.error("MCPクライアントの切断に失敗しました:", error);
    }
  }
}

// 使用例
export async function runBasicClientExample(): Promise<void> {
  const client = new BasicMcpClient();
  
  try {
    await client.connect();
    await client.listPrompts();
    await client.listResources();
    await client.listTools();
    
    // 例: 簡単なツールの呼び出し
    await client.callTool("echo", { message: "Hello, MCP!" });
    
  } catch (error) {
    console.error("クライアント例の実行に失敗しました:", error);
  } finally {
    await client.disconnect();
  }
}
