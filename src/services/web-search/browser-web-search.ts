/**
 * ブラウザ環境で動作するウェブ検索サービス
 * Playwright MCPの代替実装
 */

export interface WebSearchResult {
  searchQuery: string;
  searchEngine: string;
  searchUrl: string;
  title?: string;
  content?: string;
  timestamp: string;
  error?: string;
}

export interface SearchEngineConfig {
  name: string;
  searchUrl: string;
  queryParam: string;
}

export class BrowserWebSearchService {
  private searchEngines: Record<string, SearchEngineConfig> = {
    google: {
      name: 'Google',
      searchUrl: 'https://www.google.com/search',
      queryParam: 'q'
    },
    bing: {
      name: 'Bing',
      searchUrl: 'https://www.bing.com/search',
      queryParam: 'q'
    },
    duckduckgo: {
      name: 'DuckDuckGo',
      searchUrl: 'https://duckduckgo.com/',
      queryParam: 'q'
    }
  };

  /**
   * ウェブ検索を実行（ブラウザ環境用）
   */
  async performWebSearch(searchQuery: string, searchEngine: string = 'google'): Promise<WebSearchResult> {
    const engine = this.searchEngines[searchEngine.toLowerCase()];
    if (!engine) {
      throw new Error(`Unsupported search engine: ${searchEngine}`);
    }

    const searchUrl = this.buildSearchUrl(engine, searchQuery);
    
    try {
      // ブラウザ環境では実際の検索は実行できないため、
      // 検索URLとメタデータを返す
      const result: WebSearchResult = {
        searchQuery,
        searchEngine: engine.name,
        searchUrl,
        title: `${engine.name} Search Results`,
        content: `Search query: "${searchQuery}"\nSearch URL: ${searchUrl}\n\nNote: In browser environment, actual web scraping is not possible due to CORS restrictions. This is a simulated search result.`,
        timestamp: new Date().toLocaleString('ja-JP')
      };

      return result;
    } catch (error) {
      return {
        searchQuery,
        searchEngine: engine.name,
        searchUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleString('ja-JP')
      };
    }
  }

  /**
   * 検索URLを構築
   */
  private buildSearchUrl(engine: SearchEngineConfig, query: string): string {
    const url = new URL(engine.searchUrl);
    url.searchParams.set(engine.queryParam, query);
    return url.toString();
  }

  /**
   * 利用可能な検索エンジンを取得
   */
  getAvailableSearchEngines(): string[] {
    return Object.keys(this.searchEngines);
  }

  /**
   * 検索エンジンの設定を取得
   */
  getSearchEngineConfig(engine: string): SearchEngineConfig | null {
    return this.searchEngines[engine.toLowerCase()] || null;
  }

  /**
   * 検索結果をMarkdown形式でフォーマット
   */
  formatSearchResultAsMarkdown(result: WebSearchResult): string {
    if (result.error) {
      return `**ウェブ検索エラー:** ${result.error}\n`;
    }

    let markdown = `**ウェブ検索結果 (${result.searchEngine}):**\n\n`;
    markdown += `**検索クエリ:** ${result.searchQuery}\n`;
    markdown += `**検索URL:** ${result.searchUrl}\n`;
    
    if (result.title) {
      markdown += `**タイトル:** ${result.title}\n`;
    }
    
    if (result.content) {
      markdown += `**内容:**\n${result.content}\n`;
    }
    
    markdown += `**検索実行日時:** ${result.timestamp}\n`;
    
    return markdown;
  }

  /**
   * 複数の検索エンジンで並行検索
   */
  async performMultiSearch(searchQuery: string, engines: string[] = ['google', 'bing']): Promise<WebSearchResult[]> {
    const searchPromises = engines.map(engine => 
      this.performWebSearch(searchQuery, engine)
    );
    
    return Promise.all(searchPromises);
  }
}

// シングルトンインスタンス
export const browserWebSearchService = new BrowserWebSearchService();
