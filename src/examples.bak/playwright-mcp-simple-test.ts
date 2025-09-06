import { stdioClient, ClientSession } from '@modelcontextprotocol/sdk';

/**
 * Playwright MCPの簡単なテスト
 */
async function testPlaywrightMCP() {
  console.log('🚀 Testing Playwright MCP...');

  try {
    // Playwright MCPサーバーに接続
    console.log('🔌 Connecting to Playwright MCP server...');
    
    const { read, write } = await stdioClient('npx', ['@playwright/mcp']);
    console.log('✅ stdioClient created');

    // セッションを作成
    const session = new ClientSession(read, write);
    console.log('✅ ClientSession created');

    // セッションを初期化
    await session.initialize();
    console.log('✅ Session initialized');

    // 利用可能なツールを取得
    const tools = await session.listTools();
    console.log('📋 Available tools:', tools.tools.map(t => t.name));

    // ブラウザをインストール
    try {
      await session.callTool('browser_install', {});
      console.log('✅ Browser installed');
    } catch (error) {
      console.log('⚠️ Browser installation check failed:', error.message);
    }

    // GitHubにナビゲート
    await session.callTool('browser_navigate', { url: 'https://github.com' });
    console.log('✅ Navigated to GitHub');

    // ページのスナップショットを取得
    const snapshot = await session.callTool('browser_snapshot', {});
    console.log('✅ Page snapshot taken');

    // スクリーンショットを撮影
    await session.callTool('browser_take_screenshot', {
      filename: 'test-screenshot.png'
    });
    console.log('✅ Screenshot taken');

    // セッションを閉じる
    await session.close();
    console.log('✅ Session closed');

    console.log('🎉 Playwright MCP test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Playwright MCP:', error);
    throw error;
  }
}

// 直接実行された場合の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  testPlaywrightMCP().catch(console.error);
}
