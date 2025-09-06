import { PlaywrightMcpClient } from '../mcp/client/playwright-client';

/**
 * Playwright MCPを使用したウェブ検索の使用例
 */
export async function runWebSearchExample(): Promise<void> {
  console.log('=== Playwright MCP ウェブ検索例 ===');
  
  const client = new PlaywrightMcpClient();
  
  try {
    // 1. クライアントに接続
    console.log('1. Playwright MCPサーバーに接続中...');
    await client.connect();
    console.log('✓ 接続成功');
    
    // 2. 利用可能なツールを確認
    console.log('\n2. 利用可能なツールを確認中...');
    const tools = await client.listTools();
    console.log(`✓ ${tools.tools?.length || 0}個のツールが利用可能`);
    
    // 3. Googleで検索を実行
    console.log('\n3. Googleで検索を実行中...');
    const searchQuery = 'Playwright MCP';
    const searchResult = await client.performWebSearch(searchQuery, 'google');
    
    console.log('✓ 検索完了');
    console.log(`検索クエリ: ${searchResult.searchQuery}`);
    console.log(`検索エンジン: ${searchResult.searchEngine}`);
    console.log(`検索URL: ${searchResult.searchUrl}`);
    
    if (searchResult.snapshot) {
      console.log(`ページタイトル: ${searchResult.snapshot.title || 'N/A'}`);
      console.log(`ページURL: ${searchResult.snapshot.url || 'N/A'}`);
      console.log(`要素数: ${searchResult.snapshot.nodes?.length || 0}`);
    }
    
    if (searchResult.screenshot) {
      console.log(`スクリーンショット: ${searchResult.screenshot.filename || 'N/A'}`);
    }
    
    // 4. Bingでも検索を実行
    console.log('\n4. Bingで検索を実行中...');
    const bingResult = await client.performWebSearch('Microsoft Playwright', 'bing');
    console.log('✓ Bing検索完了');
    console.log(`検索URL: ${bingResult.searchUrl}`);
    
    // 5. DuckDuckGoでも検索を実行
    console.log('\n5. DuckDuckGoで検索を実行中...');
    const duckResult = await client.performWebSearch('Web automation', 'duckduckgo');
    console.log('✓ DuckDuckGo検索完了');
    console.log(`検索URL: ${duckResult.searchUrl}`);
    
    console.log('\n=== すべての検索が完了しました ===');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    // 6. クライアントを切断
    console.log('\n6. クライアントを切断中...');
    await client.disconnect();
    console.log('✓ 切断完了');
  }
}

/**
 * 特定のウェブサイトにナビゲートする例
 */
export async function runNavigationExample(): Promise<void> {
  console.log('=== Playwright MCP ナビゲーション例 ===');
  
  const client = new PlaywrightMcpClient();
  
  try {
    await client.connect();
    console.log('✓ 接続成功');
    
    // GitHubにナビゲート
    console.log('\n1. GitHubにナビゲート中...');
    await client.navigateToUrl('https://github.com/microsoft/playwright-mcp');
    await client.waitForTime(3);
    
    // ページスナップショットを取得
    console.log('\n2. ページスナップショットを取得中...');
    const snapshot = await client.getPageSnapshot();
    console.log(`✓ スナップショット取得完了`);
    console.log(`タイトル: ${snapshot.title || 'N/A'}`);
    console.log(`URL: ${snapshot.url || 'N/A'}`);
    
    // スクリーンショットを撮影
    console.log('\n3. スクリーンショットを撮影中...');
    const screenshot = await client.takeScreenshot({
      filename: `github-${Date.now()}.png`,
      fullPage: true
    });
    console.log(`✓ スクリーンショット撮影完了: ${screenshot.filename || 'N/A'}`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await client.disconnect();
    console.log('✓ 切断完了');
  }
}

/**
 * ブラウザのインストール例
 */
export async function runBrowserInstallExample(): Promise<void> {
  console.log('=== Playwright MCP ブラウザインストール例 ===');
  
  const client = new PlaywrightMcpClient();
  
  try {
    await client.connect();
    console.log('✓ 接続成功');
    
    // ブラウザをインストール
    console.log('\n1. ブラウザをインストール中...');
    await client.installBrowser();
    console.log('✓ ブラウザインストール完了');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await client.disconnect();
    console.log('✓ 切断完了');
  }
}

// メイン実行関数
export async function main(): Promise<void> {
  console.log('Playwright MCP ウェブ検索機能のテストを開始します...\n');
  
  try {
    // ブラウザインストール例を実行
    await runBrowserInstallExample();
    
    // ナビゲーション例を実行
    await runNavigationExample();
    
    // ウェブ検索例を実行
    await runWebSearchExample();
    
    console.log('\n=== すべてのテストが完了しました ===');
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
