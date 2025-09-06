#!/usr/bin/env node

import { runAllExamples, runSpecificExample } from './langchain-agents-example';

// コマンドライン引数を取得
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    if (command === 'all') {
      console.log('🚀 Running all LangChain agents examples...\n');
      await runAllExamples();
    } else if (command) {
      console.log(`🚀 Running specific example: ${command}\n`);
      await runSpecificExample(command);
    } else {
      console.log('📖 LangChain Agents Examples');
      console.log('Usage:');
      console.log('  npm run agents:all          - Run all examples');
      console.log('  npm run agents:basic        - Run basic agent example');
      console.log('  npm run agents:chat         - Run chat agent example');
      console.log('  npm run agents:conversational - Run conversational agent example');
      console.log('  npm run agents:zero-shot    - Run zero-shot agent example');
      console.log('  npm run agents:structured   - Run structured chat agent example');
      console.log('  npm run agents:openai-functions - Run OpenAI functions agent example');
      console.log('  npm run agents:react        - Run ReAct agent example');
      console.log('  npm run agents:multiple     - Run multiple agents comparison example');
      console.log('  npm run agents:custom-tools - Run custom tools example');
      console.log('  npm run agents:batch        - Run batch execution example');
      console.log('\nAvailable examples:');
      console.log('  - basic');
      console.log('  - chat');
      console.log('  - conversational');
      console.log('  - zero-shot');
      console.log('  - structured');
      console.log('  - openai-functions');
      console.log('  - react');
      console.log('  - multiple');
      console.log('  - custom-tools');
      console.log('  - batch');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
