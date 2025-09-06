import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * 基本的なMCPサーバーの実装例
 */
export class BasicMcpServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "basic-mcp-server",
      version: "1.0.0"
    });

    this.setupTools();
  }

  /**
   * ツールの設定
   */
  private setupTools(): void {
    // エコーツール
    this.server.tool("echo", "メッセージをエコーするツール", async (extra) => {
      const message = extra.request.params.arguments?.message || "Hello, World!";
      return {
        content: [{
          type: "text",
          text: `Echo: ${message}`
        }]
      };
    });

    // 加算ツール
    this.server.tool("add", "2つの数値を加算するツール", async (extra) => {
      const a = extra.request.params.arguments?.a || 0;
      const b = extra.request.params.arguments?.b || 0;
      const result = Number(a) + Number(b);
      return {
        content: [{
          type: "text",
          text: `${a} + ${b} = ${result}`
        }]
      };
    });

    // 現在時刻取得ツール
    this.server.tool("getCurrentTime", "現在時刻を取得するツール", async () => {
      const now = new Date();
      return {
        content: [{
          type: "text",
          text: `現在時刻: ${now.toLocaleString('ja-JP')}`
        }]
      };
    });
  }

  /**
   * サーバーを開始します
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    try {
      await this.server.connect(transport);
      console.log("MCPサーバーが開始されました");
      
      // サーバーを継続実行
      await new Promise(() => {
        // 無限ループでサーバーを維持
      });
    } catch (error) {
      console.error("MCPサーバーの開始に失敗しました:", error);
      throw error;
    }
  }

  /**
   * サーバーを停止します
   */
  async stop(): Promise<void> {
    try {
      await this.server.close();
      console.log("MCPサーバーが停止されました");
    } catch (error) {
      console.error("MCPサーバーの停止に失敗しました:", error);
    }
  }
}

// サーバーを直接実行する場合
const server = new BasicMcpServer();
server.start().catch(console.error);
