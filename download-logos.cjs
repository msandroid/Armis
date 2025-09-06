const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// プロバイダーとロゴURLのマッピング
const providers = {
  // 主要プロバイダー
  'xai-grok': 'https://x.ai/favicon.ico',
  'vercel': 'https://vercel.com/favicon.ico',
  'openai': 'https://openai.com/favicon.ico',
  'azure-openai': 'https://azure.microsoft.com/favicon.ico',
  'anthropic': 'https://www.anthropic.com/favicon.ico',
  'amazon-bedrock': 'https://aws.amazon.com/favicon.ico',
  'groq': 'https://groq.com/favicon.ico',
  'fal-ai': 'https://fal.ai/favicon.ico',
  'deepinfra': 'https://deepinfra.com/favicon.ico',
  'google-generative-ai': 'https://ai.google.dev/favicon.ico',
  'google-vertex-ai': 'https://cloud.google.com/favicon.ico',
  'mistral-ai': 'https://mistral.ai/favicon.ico',
  'together-ai': 'https://together.ai/favicon.ico',
  'cohere': 'https://cohere.com/favicon.ico',
  'fireworks': 'https://fireworks.ai/favicon.ico',
  'deepseek': 'https://deepseek.com/favicon.ico',
  'cerebras': 'https://cerebras.net/favicon.ico',
  'perplexity': 'https://perplexity.ai/favicon.ico',
  'luma-ai': 'https://lumalabs.ai/favicon.ico',
  
  // 音声・音響系プロバイダー
  'elevenlabs': 'https://elevenlabs.io/favicon.ico',
  'assemblyai': 'https://www.assemblyai.com/favicon.ico',
  'deepgram': 'https://deepgram.com/favicon.ico',
  'gladia': 'https://gladia.io/favicon.ico',
  'lmnt': 'https://lmnt.com/favicon.ico',
  'hume': 'https://hume.ai/favicon.ico',
  'rev-ai': 'https://www.rev.ai/favicon.ico',
  
  // コミュニティプロバイダー
  'ollama': 'https://ollama.ai/favicon.ico',
  'portkey': 'https://portkey.ai/favicon.ico',
  'openrouter': 'https://openrouter.ai/favicon.ico',
  'crosshatch': 'https://crosshatch.ai/favicon.ico',
  'mixedbread': 'https://mixedbread.ai/favicon.ico',
  'voyage-ai': 'https://voyageai.com/favicon.ico',
  'jina-ai': 'https://jina.ai/favicon.ico',
  'mem0': 'https://mem0.ai/favicon.ico',
  'letta': 'https://letta.ai/favicon.ico',
  'spark': 'https://spark.ai/favicon.ico',
  'inflection-ai': 'https://inflection.ai/favicon.ico',
  'langdb': 'https://langdb.com/favicon.ico',
  'sambanova': 'https://sambanova.ai/favicon.ico',
  'dify': 'https://dify.ai/favicon.ico',
  'sarvam': 'https://sarvam.ai/favicon.ico',
  'builtin-ai': 'https://builtin.ai/favicon.ico',
  
  // アダプター・統合
  'langchain': 'https://langchain.com/favicon.ico',
  'llamaindex': 'https://www.llamaindex.ai/favicon.ico',
  
  // オブザーバビリティ統合
  'braintrust': 'https://braintrust.com/favicon.ico',
  'helicone': 'https://helicone.ai/favicon.ico',
  'laminar': 'https://laminar.ai/favicon.ico',
  'langfuse': 'https://langfuse.com/favicon.ico',
  'langwatch': 'https://langwatch.ai/favicon.ico',
  'maxim': 'https://maxim.ai/favicon.ico',
  'patronus': 'https://patronus.ai/favicon.ico',
  'signoz': 'https://signoz.io/favicon.ico',
  'traceloop': 'https://traceloop.com/favicon.ico',
  'weave': 'https://weave.ai/favicon.ico'
};

// ロゴ保存用ディレクトリを作成
const logosDir = path.join(__dirname, 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// ファイルダウンロード関数
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      
      const filePath = path.join(logosDir, filename);
      const fileStream = fs.createWriteStream(filePath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // エラー時はファイルを削除
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// メイン実行関数
async function downloadAllLogos() {
  console.log('🚀 Starting logo downloads...\n');
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const [provider, url] of Object.entries(providers)) {
    try {
      const filename = `${provider}.ico`;
      await downloadFile(url, filename);
      results.success.push(provider);
    } catch (error) {
      console.log(`❌ Failed to download ${provider}: ${error.message}`);
      results.failed.push({ provider, error: error.message });
    }
  }
  
  // 結果サマリー
  console.log('\n📊 Download Summary:');
  console.log(`✅ Successfully downloaded: ${results.success.length} logos`);
  console.log(`❌ Failed downloads: ${results.failed.length} logos`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed downloads:');
    results.failed.forEach(({ provider, error }) => {
      console.log(`  - ${provider}: ${error}`);
    });
  }
  
  console.log(`\n📁 Logos saved to: ${logosDir}`);
}

// スクリプト実行
if (require.main === module) {
  downloadAllLogos().catch(console.error);
}

module.exports = { downloadAllLogos, providers };
