import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Playwright MCPサーバーを使用したウェブ検索クライアント
 */
export class PlaywrightMcpClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor() {
    this.client = new Client({
      name: "playwright-mcp-client",
      version: "1.0.0"
    });

    // Playwright MCPサーバーを起動
    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["@playwright/mcp"]
    });
  }

  /**
   * クライアントを接続します
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
      console.log("Playwright MCPクライアントが正常に接続されました");
    } catch (error) {
      console.error("Playwright MCPクライアントの接続に失敗しました:", error);
      throw error;
    }
  }

  /**
   * 利用可能なツールを一覧表示します
   */
  async listTools(): Promise<any> {
    try {
      const tools = await this.client.listTools();
      console.log("利用可能なツール:", tools);
      return tools;
    } catch (error) {
      console.error("ツールの取得に失敗しました:", error);
      throw error;
    }
  }

  /**
   * ブラウザでURLにナビゲートします
   */
  async navigateToUrl(url: string): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_navigate",
        arguments: { url }
      });
      console.log(`URL ${url} へのナビゲート完了`);
      return result;
    } catch (error) {
      console.error(`URL ${url} へのナビゲートに失敗しました:`, error);
      throw error;
    }
  }

  /**
   * ページのスナップショットを取得します
   */
  async getPageSnapshot(): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_snapshot",
        arguments: {}
      });
      console.log("ページスナップショットを取得しました");
      return result;
    } catch (error) {
      console.error("ページスナップショットの取得に失敗しました:", error);
      throw error;
    }
  }

  /**
   * スクリーンショットを撮影します
   */
  async takeScreenshot(options?: {
    type?: string;
    filename?: string;
    fullPage?: boolean;
  }): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_take_screenshot",
        arguments: options || {}
      });
      console.log("スクリーンショットを撮影しました");
      return result;
    } catch (error) {
      console.error("スクリーンショットの撮影に失敗しました:", error);
      throw error;
    }
  }

  /**
   * テキストを入力します
   */
  async typeText(element: string, ref: string, text: string, options?: {
    submit?: boolean;
    slowly?: boolean;
  }): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_type",
        arguments: {
          element,
          ref,
          text,
          ...options
        }
      });
      console.log(`テキスト "${text}" を入力しました`);
      return result;
    } catch (error) {
      console.error("テキスト入力に失敗しました:", error);
      throw error;
    }
  }

  /**
   * 要素をクリックします
   */
  async clickElement(element: string, ref: string): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_click",
        arguments: { element, ref }
      });
      console.log(`要素 "${element}" をクリックしました`);
      return result;
    } catch (error) {
      console.error("要素のクリックに失敗しました:", error);
      throw error;
    }
  }

  /**
   * キーを押します
   */
  async pressKey(key: string): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_press_key",
        arguments: { key }
      });
      console.log(`キー "${key}" を押しました`);
      return result;
    } catch (error) {
      console.error("キー入力に失敗しました:", error);
      throw error;
    }
  }

  /**
   * テキストが表示されるまで待機します
   */
  async waitForText(text: string): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_wait_for",
        arguments: { text }
      });
      console.log(`テキスト "${text}" の表示を待機しました`);
      return result;
    } catch (error) {
      console.error("テキスト待機に失敗しました:", error);
      throw error;
    }
  }

  /**
   * 指定した時間待機します
   */
  async waitForTime(seconds: number): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_wait_for",
        arguments: { time: seconds }
      });
      console.log(`${seconds}秒待機しました`);
      return result;
    } catch (error) {
      console.error("時間待機に失敗しました:", error);
      throw error;
    }
  }

  /**
   * ブラウザをインストールします
   */
  async installBrowser(): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: "browser_install",
        arguments: {}
      });
      console.log("ブラウザをインストールしました");
      return result;
    } catch (error) {
      console.error("ブラウザのインストールに失敗しました:", error);
      throw error;
    }
  }

  /**
   * ウェブ検索を実行します
   */
  async performWebSearch(searchQuery: string, searchEngine: string = "google"): Promise<any> {
    try {
      let searchUrl: string;
      
      switch (searchEngine.toLowerCase()) {
        case "google":
          searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
          break;
        case "bing":
          searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`;
          break;
        case "duckduckgo":
          searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`;
          break;
        default:
          searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      }

      // 検索ページにナビゲート
      await this.navigateToUrl(searchUrl);
      
      // ページの読み込みを待機
      await this.waitForTime(2);
      
      // ページスナップショットを取得
      const snapshot = await this.getPageSnapshot();
      
      // スクリーンショットを撮影
      const screenshot = await this.takeScreenshot({
        filename: `search-${Date.now()}.png`,
        fullPage: true
      });

      return {
        searchQuery,
        searchEngine,
        searchUrl,
        snapshot,
        screenshot
      };
    } catch (error) {
      console.error("ウェブ検索の実行に失敗しました:", error);
      throw error;
    }
  }

  /**
   * クライアントを切断します
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log("Playwright MCPクライアントが切断されました");
    } catch (error) {
      console.error("Playwright MCPクライアントの切断に失敗しました:", error);
    }
  }
}

// 使用例
export async function runPlaywrightClientExample(): Promise<void> {
  const client = new PlaywrightMcpClient();
  
  try {
    await client.connect();
    await client.listTools();
    
    // 例: Googleで検索を実行
    const searchResult = await client.performWebSearch("Playwright MCP", "google");
    console.log("検索結果:", searchResult);
    
  } catch (error) {
    console.error("Playwrightクライアント例の実行に失敗しました:", error);
  } finally {
    await client.disconnect();
  }
}
