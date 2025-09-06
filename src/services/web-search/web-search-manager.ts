/**
 * Web Search機能の統合マネージャー
 * Browser Web SearchとGemini Web Searchを統合管理
 */

import { browserWebSearchService, WebSearchResult } from './browser-web-search';
import { geminiWebSearchService, GeminiWebSearchResult } from './gemini-web-search';

export type WebSearchMode = 'browser' | 'gemini' | 'auto';

export interface WebSearchManagerConfig {
  mode: WebSearchMode;
  defaultSearchEngine?: string;
  geminiApiKey?: string;
  enableFallback?: boolean;
}

export interface UnifiedWebSearchResult {
  searchQuery: string;
  searchEngine: string;
  searchUrl: string;
  title?: string;
  content?: string;
  timestamp: string;
  error?: string;
  mode: WebSearchMode;
  geminiResponse?: string;
}

export class WebSearchManager {
  private config: WebSearchManagerConfig;
  private isGeminiAvailable: boolean = false;
  private providerApiKeys: Record<string, string> = {};

  constructor(config: WebSearchManagerConfig) {
    this.config = {
      ...config,
      mode: config.mode || 'auto',
      defaultSearchEngine: config.defaultSearchEngine || 'google',
      enableFallback: config.enableFallback !== undefined ? config.enableFallback : true
    };
  }

  /**
   * プロバイダーAPIキーを設定
   */
  setProviderApiKeys(apiKeys: Record<string, string>): void {
    this.providerApiKeys = apiKeys;
    this.initializeGemini();
  }

  /**
   * Gemini APIの初期化
   */
  private initializeGemini(): void {
    const googleApiKey = this.providerApiKeys['google'];
    if (googleApiKey) {
      try {
        geminiWebSearchService.updateApiKey(googleApiKey);
        this.isGeminiAvailable = true;
        console.log('✅ Gemini Web Search available');
      } catch (error) {
        console.warn('⚠️ Gemini Web Search not available:', error);
        this.isGeminiAvailable = false;
      }
    } else {
      console.warn('⚠️ No Google API key provided');
      this.isGeminiAvailable = false;
    }
  }

  /**
   * 統合Web Searchを実行
   */
  async performWebSearch(
    searchQuery: string, 
    searchEngine: string = 'google',
    mode?: WebSearchMode
  ): Promise<UnifiedWebSearchResult> {
    const searchMode = mode || this.config.mode;
    const engine = searchEngine || this.config.defaultSearchEngine || 'google';

    console.log(`🔍 Performing web search with mode: ${searchMode}, engine: ${engine}`);

    try {
      switch (searchMode) {
        case 'gemini':
          return await this.performGeminiSearch(searchQuery, engine);
        
        case 'browser':
          return await this.performBrowserSearch(searchQuery, engine);
        
        case 'auto':
        default:
          return await this.performAutoSearch(searchQuery, engine);
      }
    } catch (error) {
      console.error('❌ Web search failed:', error);
      
      return {
        searchQuery,
        searchEngine: engine,
        searchUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleString('ja-JP'),
        mode: searchMode
      };
    }
  }

  /**
   * Gemini Web Searchを実行
   */
  private async performGeminiSearch(searchQuery: string, searchEngine: string): Promise<UnifiedWebSearchResult> {
    if (!this.isGeminiAvailable) {
      throw new Error('Gemini Web Search is not available');
    }

    const result = await geminiWebSearchService.performWebSearch(searchQuery, searchEngine);
    
    return {
      searchQuery: result.searchQuery,
      searchEngine: result.searchEngine,
      searchUrl: result.searchUrl,
      title: result.title,
      content: result.content,
      timestamp: result.timestamp,
      error: result.error,
      mode: 'gemini',
      geminiResponse: result.geminiResponse
    };
  }

  /**
   * Browser Web Searchを実行
   */
  private async performBrowserSearch(searchQuery: string, searchEngine: string): Promise<UnifiedWebSearchResult> {
    const result = await browserWebSearchService.performWebSearch(searchQuery, searchEngine);
    
    return {
      searchQuery: result.searchQuery,
      searchEngine: result.searchEngine,
      searchUrl: result.searchUrl,
      title: result.title,
      content: result.content,
      timestamp: result.timestamp,
      error: result.error,
      mode: 'browser'
    };
  }

  /**
   * 自動モードでWeb Searchを実行（Gemini優先、フォールバックでBrowser）
   */
  private async performAutoSearch(searchQuery: string, searchEngine: string): Promise<UnifiedWebSearchResult> {
    if (this.isGeminiAvailable) {
      try {
        console.log('🔄 Trying Gemini Web Search first...');
        return await this.performGeminiSearch(searchQuery, searchEngine);
      } catch (error) {
        console.warn('⚠️ Gemini search failed, falling back to browser search:', error);
        
        if (this.config.enableFallback) {
          return await this.performBrowserSearch(searchQuery, searchEngine);
        } else {
          throw error;
        }
      }
    } else {
      console.log('🔄 Using browser Web Search (Gemini not available)');
      return await this.performBrowserSearch(searchQuery, searchEngine);
    }
  }

  /**
   * 複数の検索エンジンで並行検索
   */
  async performMultiSearch(
    searchQuery: string, 
    engines: string[] = ['google', 'bing'],
    mode?: WebSearchMode
  ): Promise<UnifiedWebSearchResult[]> {
    const searchPromises = engines.map(engine => 
      this.performWebSearch(searchQuery, engine, mode)
    );
    
    return Promise.all(searchPromises);
  }

  /**
   * 検索結果をMarkdown形式でフォーマット
   */
  formatSearchResultAsMarkdown(result: UnifiedWebSearchResult): string {
    if (result.error) {
      return `**Web Search Error (${result.mode}):** ${result.error}\n`;
    }

    let markdown = `**Web Search Results (${result.searchEngine}) - ${result.mode} mode:**\n\n`;
    markdown += `**Search Query:** ${result.searchQuery}\n`;
    markdown += `**Search URL:** ${result.searchUrl}\n`;
    
    if (result.title) {
      markdown += `**Title:** ${result.title}\n`;
    }
    
    if (result.geminiResponse) {
      markdown += `**Gemini Response:**\n${result.geminiResponse}\n`;
    } else if (result.content) {
      markdown += `**Content:**\n${result.content}\n`;
    }
    
    markdown += `**Search Timestamp:** ${result.timestamp}\n`;
    markdown += `**Search Mode:** ${result.mode}\n`;
    
    return markdown;
  }

  /**
   * 利用可能な検索エンジンを取得
   */
  getAvailableSearchEngines(): string[] {
    return browserWebSearchService.getAvailableSearchEngines();
  }

  /**
   * 検索エンジンの設定を取得
   */
  getSearchEngineConfig(engine: string) {
    return browserWebSearchService.getSearchEngineConfig(engine);
  }

  /**
   * Geminiの利用可能性を確認
   */
  isGeminiWebSearchAvailable(): boolean {
    return this.isGeminiAvailable;
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<WebSearchManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): WebSearchManagerConfig {
    return { ...this.config };
  }

  /**
   * 検索モードを取得
   */
  getSearchMode(): WebSearchMode {
    return this.config.mode;
  }

  /**
   * 検索モードを設定
   */
  setSearchMode(mode: WebSearchMode): void {
    this.config.mode = mode;
  }
}

// シングルトンインスタンス
export const webSearchManager = new WebSearchManager({
  mode: 'auto',
  defaultSearchEngine: 'google',
  enableFallback: true
});
