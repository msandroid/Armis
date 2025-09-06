/**
 * Gemini CLIを使用したウェブ検索サービス
 * Google Generative AI APIを使用してWeb Search機能を提供
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiWebSearchResult {
  searchQuery: string;
  searchEngine: string;
  searchUrl: string;
  title?: string;
  content?: string;
  timestamp: string;
  error?: string;
  geminiResponse?: string;
}

export interface GeminiWebSearchConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiWebSearchService {
  private genAI: GoogleGenerativeAI | null = null;
  private config: GeminiWebSearchConfig;
  private searchEngines: Record<string, { name: string; searchUrl: string; queryParam: string }> = {
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

  constructor(config: GeminiWebSearchConfig) {
    this.config = {
      model: 'gemini-2.0-flash-lite',
      temperature: 0.3,
      maxOutputTokens: 4096,
      ...config
    };
    
    if (this.config.apiKey) {
      this.initializeGemini();
    }
  }

  /**
   * Gemini APIを初期化
   */
  private initializeGemini(): void {
    try {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      console.log('✅ Gemini Web Search Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
      throw new Error('Failed to initialize Gemini API');
    }
  }

  /**
   * Gemini CLIを使用してウェブ検索を実行
   */
  async performWebSearch(searchQuery: string, searchEngine: string = 'google'): Promise<GeminiWebSearchResult> {
    if (!this.genAI) {
      throw new Error('Gemini API is not initialized. Please provide a valid API key.');
    }

    const engine = this.searchEngines[searchEngine.toLowerCase()];
    if (!engine) {
      throw new Error(`Unsupported search engine: ${searchEngine}`);
    }

    const searchUrl = this.buildSearchUrl(engine, searchQuery);
    const timestamp = new Date().toLocaleString('ja-JP');

    try {
      console.log(`🔍 Performing Gemini web search for: "${searchQuery}" using ${engine.name}`);

      // Geminiモデルを取得
      const model = this.genAI.getGenerativeModel({
        model: this.config.model!,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
        },
      });

      // Web Search用のプロンプトを作成
      const webSearchPrompt = this.createWebSearchPrompt(searchQuery, searchEngine);

      // GeminiにWeb Searchを実行
      const result = await model.generateContent(webSearchPrompt);
      const geminiResponse = result.response.text();

      console.log('✅ Gemini web search completed');

      return {
        searchQuery,
        searchEngine: engine.name,
        searchUrl,
        title: `${engine.name} Search Results via Gemini`,
        content: `Search query: "${searchQuery}"\nSearch URL: ${searchUrl}\n\nGemini Response:\n${geminiResponse}`,
        timestamp,
        geminiResponse
      };

    } catch (error) {
      console.error('❌ Gemini web search failed:', error);
      
      return {
        searchQuery,
        searchEngine: engine.name,
        searchUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
    }
  }

  /**
   * Web Search用のプロンプトを作成
   */
  private createWebSearchPrompt(query: string, searchEngine: string): string {
    return `You are a web search assistant. Please search for information about: "${query}"

Search Engine: ${searchEngine}

Instructions:
1. Provide accurate and up-to-date information about the search query
2. Include relevant facts, statistics, and context
3. Cite sources when possible
4. If the information is not available or uncertain, clearly state that
5. Format your response in a clear, structured manner
6. Focus on the most relevant and recent information

Search Query: "${query}"

Please provide a comprehensive search result:`;
  }

  /**
   * 検索URLを構築
   */
  private buildSearchUrl(engine: { searchUrl: string; queryParam: string }, query: string): string {
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
  getSearchEngineConfig(engine: string) {
    return this.searchEngines[engine.toLowerCase()] || null;
  }

  /**
   * 検索結果をMarkdown形式でフォーマット
   */
  formatSearchResultAsMarkdown(result: GeminiWebSearchResult): string {
    if (result.error) {
      return `**Gemini Web Search Error:** ${result.error}\n`;
    }

    let markdown = `**Gemini Web Search Results (${result.searchEngine}):**\n\n`;
    markdown += `**Search Query:** ${result.searchQuery}\n`;
    markdown += `**Search URL:** ${result.searchUrl}\n`;
    
    if (result.title) {
      markdown += `**Title:** ${result.title}\n`;
    }
    
    if (result.geminiResponse) {
      markdown += `**Gemini Response:**\n${result.geminiResponse}\n`;
    }
    
    markdown += `**Search Timestamp:** ${result.timestamp}\n`;
    
    return markdown;
  }

  /**
   * 複数の検索エンジンで並行検索
   */
  async performMultiSearch(searchQuery: string, engines: string[] = ['google', 'bing']): Promise<GeminiWebSearchResult[]> {
    const searchPromises = engines.map(engine => 
      this.performWebSearch(searchQuery, engine)
    );
    
    return Promise.all(searchPromises);
  }

  /**
   * APIキーを更新
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.initializeGemini();
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<GeminiWebSearchConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.apiKey) {
      this.initializeGemini();
    }
  }
}

// シングルトンインスタンス（APIキーは後で設定）
export const geminiWebSearchService = new GeminiWebSearchService({
  apiKey: ''
});
