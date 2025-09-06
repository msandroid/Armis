import { PlaywrightMCPAdapter, PlaywrightMCPConfig } from '../services/playwright-mcp-adapter';

/**
 * 基本的なPlaywright MCP統合の例
 */
export async function basicPlaywrightMCPExample() {
  console.log('🚀 Starting Basic Playwright MCP Integration Example...');

  const adapter = new PlaywrightMCPAdapter({
    headless: true,
    browser: 'chromium',
    viewport: { width: 1280, height: 720 }
  });

  try {
    // Playwright MCPサーバーに接続
    await adapter.connect();
    console.log('✅ Connected to Playwright MCP server');

    // 利用可能なツールを取得
    const availableTools = await adapter.getAvailableTools();
    console.log('📋 Available Playwright Tools:', availableTools);

    // ブラウザを起動
    await adapter.launchBrowser();
    console.log('✅ Browser launched');

    // GitHubにナビゲート
    await adapter.navigateToUrl('https://github.com');
    console.log('✅ Navigated to GitHub');

    // ページのスナップショットを取得
    const snapshot = await adapter.takeSnapshot();
    console.log('✅ Page snapshot taken');

    // スクリーンショットを撮影
    await adapter.takeScreenshot({
      filename: 'github-homepage.png',
      fullPage: true
    });
    console.log('✅ Screenshot taken');

    // JavaScriptを実行してページタイトルを取得
    const titleResult = await adapter.evaluateJavaScript('() => document.title');
    console.log('✅ Page title:', titleResult);

    await adapter.close();
    console.log('✅ Basic Playwright MCP example completed');

  } catch (error) {
    console.error('❌ Error in basic Playwright example:', error);
    await adapter.close();
    throw error;
  }
}

/**
 * フォーム入力の例
 */
export async function formInteractionExample() {
  console.log('🚀 Starting Form Interaction Example...');

  const adapter = new PlaywrightMCPAdapter({
    headless: false, // ヘッドレスモードを無効にして動作を確認
    browser: 'chromium',
    viewport: { width: 1280, height: 720 }
  });

  try {
    await adapter.connect();
    await adapter.launchBrowser();

    // テスト用のフォームページにナビゲート
    await adapter.navigateToUrl('https://httpbin.org/forms/post');
    console.log('✅ Navigated to form page');

    // ページのスナップショットを取得
    const snapshot = await adapter.takeSnapshot();
    console.log('✅ Form page snapshot taken');

    // フォームフィールドを入力
    // 注意: 実際の要素のrefはスナップショットから取得する必要があります
    console.log('⚠️ Note: Form interaction requires element references from snapshot');

    await adapter.close();
    console.log('✅ Form interaction example completed');

  } catch (error) {
    console.error('❌ Error in form interaction example:', error);
    await adapter.close();
    throw error;
  }
}

/**
 * 検索エンジンでの検索例
 */
export async function searchEngineExample() {
  console.log('🚀 Starting Search Engine Example...');

  const adapter = new PlaywrightMCPAdapter({
    headless: true,
    browser: 'chromium',
    viewport: { width: 1280, height: 720 }
  });

  try {
    await adapter.connect();
    await adapter.launchBrowser();

    // Googleにナビゲート
    await adapter.navigateToUrl('https://www.google.com');
    console.log('✅ Navigated to Google');

    // ページのスナップショットを取得
    const snapshot = await adapter.takeSnapshot();
    console.log('✅ Google page snapshot taken');

    // 検索ボックスにテキストを入力
    // 注意: 実際の要素のrefはスナップショットから取得する必要があります
    console.log('⚠️ Note: Search interaction requires element references from snapshot');

    // スクリーンショットを撮影
    await adapter.takeScreenshot({
      filename: 'google-search.png'
    });

    await adapter.close();
    console.log('✅ Search engine example completed');

  } catch (error) {
    console.error('❌ Error in search engine example:', error);
    await adapter.close();
    throw error;
  }
}

/**
 * ネットワークリクエストの監視例
 */
export async function networkMonitoringExample() {
  console.log('🚀 Starting Network Monitoring Example...');

  const adapter = new PlaywrightMCPAdapter({
    headless: true,
    browser: 'chromium',
    viewport: { width: 1280, height: 720 }
  });

  try {
    await adapter.connect();
    await adapter.launchBrowser();

    // 複数のリクエストを行うページにナビゲート
    await adapter.navigateToUrl('https://httpbin.org/json');
    console.log('✅ Navigated to test page');

    // ネットワークリクエストを取得
    const networkRequests = await adapter.getNetworkRequests();
    console.log('✅ Network requests retrieved:', networkRequests);

    await adapter.close();
    console.log('✅ Network monitoring example completed');

  } catch (error) {
    console.error('❌ Error in network monitoring example:', error);
    await adapter.close();
    throw error;
  }
}

/**
 * タブ管理の例
 */
export async function tabManagementExample() {
  console.log('🚀 Starting Tab Management Example...');

  const adapter = new PlaywrightMCPAdapter({
    headless: true,
    browser: 'chromium',
    viewport: { width: 1280, height: 720 }
  });

  try {
    await adapter.connect();
    await adapter.launchBrowser();

    // 最初のページにナビゲート
    await adapter.navigateToUrl('https://github.com');
    console.log('✅ Navigated to GitHub');

    // タブ一覧を取得
    const tabs = await adapter.manageTabs('list');
    console.log('✅ Current tabs:', tabs);

    // 新しいタブを作成
    await adapter.manageTabs('create');
    console.log('✅ New tab created');

    // 新しいタブにナビゲート
    await adapter.navigateToUrl('https://www.google.com');
    console.log('✅ Navigated to Google in new tab');

    // タブ一覧を再取得
    const updatedTabs = await adapter.manageTabs('list');
    console.log('✅ Updated tabs:', updatedTabs);

    await adapter.close();
    console.log('✅ Tab management example completed');

  } catch (error) {
    console.error('❌ Error in tab management example:', error);
    await adapter.close();
    throw error;
  }
}

/**
 * LangChainエージェントとPlaywright MCPの統合例
 */
export async function langChainPlaywrightIntegrationExample() {
  console.log('🚀 Starting LangChain + Playwright MCP Integration Example...');

  const adapter = new PlaywrightMCPAdapter({
    headless: true,
    browser: 'chromium',
    viewport: { width: 1280, height: 720 }
  });

  try {
    await adapter.connect();
    await adapter.launchBrowser();

    // Playwright MCPツールを使用するReactエージェントを作成
    const agent = await adapter.createReactAgentWithPlaywrightTools({
      type: 'openai',
      modelName: 'gpt-3.5-turbo'
    });

    console.log('✅ React Agent created with Playwright tools');

    // エージェントを実行（GitHubにナビゲートしてスクリーンショットを撮影）
    const result = await agent.invoke({
      input: "Navigate to https://github.com and take a screenshot of the page"
    });

    console.log('✅ Agent Result:', result.output);

    await adapter.close();
    console.log('✅ LangChain + Playwright integration example completed');

  } catch (error) {
    console.error('❌ Error in LangChain + Playwright integration example:', error);
    await adapter.close();
    throw error;
  }
}

/**
 * OllamaとPlaywright MCPの統合例
 */
export async function ollamaPlaywrightIntegrationExample() {
  console.log('🚀 Starting Ollama + Playwright MCP Integration Example...');

  const adapter = new PlaywrightMCPAdapter({
    headless: true,
    browser: 'chromium',
    viewport: { width: 1280, height: 720 }
  });

  try {
    await adapter.connect();
    await adapter.launchBrowser();

    // Ollamaを使用するReactエージェントを作成
    const agent = await adapter.createReactAgentWithPlaywrightTools({
      type: 'ollama',
      modelName: 'gemma3:1b',
      baseUrl: 'http://localhost:11434'
    });

    console.log('✅ React Agent created with Ollama and Playwright tools');

    // エージェントを実行
    const result = await agent.invoke({
      input: "Go to https://httpbin.org/json and get the page title"
    });

    console.log('✅ Ollama Agent Result:', result.output);

    await adapter.close();
    console.log('✅ Ollama + Playwright integration example completed');

  } catch (error) {
    console.error('❌ Error in Ollama + Playwright integration example:', error);
    await adapter.close();
    throw error;
  }
}

/**
 * エラーハンドリングの例
 */
export async function errorHandlingExample() {
  console.log('🚀 Starting Error Handling Example...');

  const adapter = new PlaywrightMCPAdapter({
    headless: true,
    browser: 'chromium',
    viewport: { width: 1280, height: 720 }
  });

  try {
    await adapter.connect();
    await adapter.launchBrowser();

    // 存在しないURLにナビゲート（エラーをテスト）
    try {
      await adapter.navigateToUrl('https://this-url-does-not-exist-12345.com');
    } catch (error) {
      console.log('✅ Expected navigation error caught:', error.message);
    }

    // 存在しない要素をクリック（エラーをテスト）
    try {
      await adapter.clickElement('Non-existent element', 'fake-ref');
    } catch (error) {
      console.log('✅ Expected click error caught:', error.message);
    }

    await adapter.close();
    console.log('✅ Error handling example completed');

  } catch (error) {
    console.error('❌ Error in error handling example:', error);
    await adapter.close();
    throw error;
  }
}

/**
 * メイン実行関数
 */
export async function runAllPlaywrightExamples() {
  console.log('🎯 Running All Playwright MCP Integration Examples\n');

  try {
    // 基本的な例
    console.log('='.repeat(50));
    await basicPlaywrightMCPExample();
    
    console.log('\n' + '='.repeat(50));
    await searchEngineExample();
    
    console.log('\n' + '='.repeat(50));
    await networkMonitoringExample();
    
    console.log('\n' + '='.repeat(50));
    await tabManagementExample();
    
    console.log('\n' + '='.repeat(50));
    await errorHandlingExample();
    
    console.log('\n🎉 All Playwright MCP examples completed successfully!');
    
  } catch (error) {
    console.error('💥 Error running Playwright examples:', error);
  }
}

// 直接実行された場合の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllPlaywrightExamples().catch(console.error);
}
