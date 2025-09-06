/**
 * Gemini Web Search機能の使用例
 * 統合Web Searchマネージャーを使用した検索の実装例
 */

import { webSearchManager } from '../services/web-search/web-search-manager';

/**
 * 基本的なWeb Searchの使用例
 */
export async function basicWebSearchExample(): Promise<void> {
  console.log('=== Gemini Web Search Basic Example ===');
  
  try {
    // 1. 自動モードで検索（Gemini優先、フォールバックでBrowser）
    console.log('1. Performing auto mode search...');
    const autoResult = await webSearchManager.performWebSearch(
      'latest AI developments 2024',
      'google',
      'auto'
    );
    
    console.log('✅ Auto search completed');
    console.log(`Search Query: ${autoResult.searchQuery}`);
    console.log(`Search Engine: ${autoResult.searchEngine}`);
    console.log(`Search Mode: ${autoResult.mode}`);
    console.log(`Content: ${autoResult.content?.substring(0, 200)}...`);
    
    // 2. Gemini専用モードで検索
    console.log('\n2. Performing Gemini-only search...');
    const geminiResult = await webSearchManager.performWebSearch(
      'machine learning trends',
      'google',
      'gemini'
    );
    
    console.log('✅ Gemini search completed');
    console.log(`Search Query: ${geminiResult.searchQuery}`);
    console.log(`Search Engine: ${geminiResult.searchEngine}`);
    console.log(`Search Mode: ${geminiResult.mode}`);
    if (geminiResult.geminiResponse) {
      console.log(`Gemini Response: ${geminiResult.geminiResponse.substring(0, 200)}...`);
    }
    
    // 3. Browser専用モードで検索
    console.log('\n3. Performing browser-only search...');
    const browserResult = await webSearchManager.performWebSearch(
      'web development frameworks',
      'bing',
      'browser'
    );
    
    console.log('✅ Browser search completed');
    console.log(`Search Query: ${browserResult.searchQuery}`);
    console.log(`Search Engine: ${browserResult.searchEngine}`);
    console.log(`Search Mode: ${browserResult.mode}`);
    
  } catch (error) {
    console.error('❌ Web search example failed:', error);
  }
}

/**
 * 複数検索エンジンでの並行検索例
 */
export async function multiEngineSearchExample(): Promise<void> {
  console.log('\n=== Multi-Engine Search Example ===');
  
  try {
    const searchQuery = 'artificial intelligence applications';
    const engines = ['google', 'bing', 'duckduckgo'];
    
    console.log(`Performing multi-engine search for: "${searchQuery}"`);
    console.log(`Engines: ${engines.join(', ')}`);
    
    const results = await webSearchManager.performMultiSearch(
      searchQuery,
      engines,
      'auto'
    );
    
    console.log(`✅ Multi-engine search completed with ${results.length} results`);
    
    results.forEach((result, index) => {
      console.log(`\nResult ${index + 1}:`);
      console.log(`  Engine: ${result.searchEngine}`);
      console.log(`  Mode: ${result.mode}`);
      console.log(`  URL: ${result.searchUrl}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      } else {
        console.log(`  Success: ${result.content ? 'Yes' : 'No'}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Multi-engine search failed:', error);
  }
}

/**
 * 検索結果のMarkdownフォーマット例
 */
export async function markdownFormatExample(): Promise<void> {
  console.log('\n=== Markdown Format Example ===');
  
  try {
    const result = await webSearchManager.performWebSearch(
      'TypeScript best practices',
      'google',
      'auto'
    );
    
    const markdown = webSearchManager.formatSearchResultAsMarkdown(result);
    
    console.log('✅ Markdown formatting completed');
    console.log('\n--- Markdown Output ---');
    console.log(markdown);
    console.log('--- End Markdown ---');
    
  } catch (error) {
    console.error('❌ Markdown formatting failed:', error);
  }
}

/**
 * 設定管理の例
 */
export function configurationExample(): void {
  console.log('\n=== Configuration Example ===');
  
  // 現在の設定を取得
  const currentConfig = webSearchManager.getConfig();
  console.log('Current configuration:', currentConfig);
  
  // Geminiの利用可能性をチェック
  const isGeminiAvailable = webSearchManager.isGeminiWebSearchAvailable();
  console.log(`Gemini available: ${isGeminiAvailable}`);
  
  // 利用可能な検索エンジンを取得
  const availableEngines = webSearchManager.getAvailableSearchEngines();
  console.log(`Available engines: ${availableEngines.join(', ')}`);
  
  // 検索モードを変更
  webSearchManager.setSearchMode('gemini');
  console.log(`Search mode changed to: ${webSearchManager.getSearchMode()}`);
  
  // 設定を更新
  webSearchManager.updateConfig({
    mode: 'auto',
    defaultSearchEngine: 'google',
    enableFallback: true
  });
  
  console.log('✅ Configuration updated');
}

/**
 * エラーハンドリングの例
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('\n=== Error Handling Example ===');
  
  try {
    // 無効な検索エンジンで検索を試行
    console.log('1. Testing invalid search engine...');
    const invalidResult = await webSearchManager.performWebSearch(
      'test query',
      'invalid-engine',
      'auto'
    );
    
    if (invalidResult.error) {
      console.log(`✅ Error handled: ${invalidResult.error}`);
    }
    
    // 空のクエリで検索を試行
    console.log('\n2. Testing empty query...');
    const emptyResult = await webSearchManager.performWebSearch(
      '',
      'google',
      'auto'
    );
    
    console.log(`Empty query result: ${emptyResult.error || 'No error'}`);
    
  } catch (error) {
    console.error('❌ Error handling example failed:', error);
  }
}

/**
 * メイン実行関数
 */
export async function runGeminiWebSearchExamples(): Promise<void> {
  console.log('🚀 Starting Gemini Web Search Examples\n');
  
  try {
    // 基本検索例
    await basicWebSearchExample();
    
    // 複数エンジン検索例
    await multiEngineSearchExample();
    
    // Markdownフォーマット例
    await markdownFormatExample();
    
    // 設定管理例
    configurationExample();
    
    // エラーハンドリング例
    await errorHandlingExample();
    
    console.log('\n✅ All Gemini Web Search examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Gemini Web Search examples failed:', error);
  }
}

// 直接実行時の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  runGeminiWebSearchExamples().catch(console.error);
}
