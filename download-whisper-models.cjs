#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// 利用可能なモデル一覧
const availableModels = {
  // Tiny models (軽量)
  'tiny': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    size: '77.7 MB',
    description: 'Multilingual model, smallest size'
  },
  'tiny.en': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
    size: '77.7 MB',
    description: 'English-only model, smallest size'
  },
  'tiny-q5_1': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin',
    size: '32.2 MB',
    description: 'Multilingual model, quantized (Q5_1) - Recommended for web'
  },
  'tiny.en-q5_1': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q5_1.bin',
    size: '32.2 MB',
    description: 'English-only model, quantized (Q5_1)'
  },
  'tiny-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q8_0.bin',
    size: '43.5 MB',
    description: 'Multilingual model, quantized (Q8_0)'
  },
  'tiny.en-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q8_0.bin',
    size: '43.6 MB',
    description: 'English-only model, quantized (Q8_0)'
  },

  // Base models (標準)
  'base': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    size: '148 MB',
    description: 'Multilingual model, base size'
  },
  'base.en': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
    size: '148 MB',
    description: 'English-only model, base size'
  },
  'base-q5_1': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin',
    size: '59.7 MB',
    description: 'Multilingual model, quantized (Q5_1)'
  },
  'base.en-q5_1': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q5_1.bin',
    size: '59.7 MB',
    description: 'English-only model, quantized (Q5_1)'
  },
  'base-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q8_0.bin',
    size: '81.8 MB',
    description: 'Multilingual model, quantized (Q8_0)'
  },
  'base.en-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q8_0.bin',
    size: '81.8 MB',
    description: 'English-only model, quantized (Q8_0)'
  },

  // Small models (中規模)
  'small': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    size: '488 MB',
    description: 'Multilingual model, small size'
  },
  'small.en': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
    size: '488 MB',
    description: 'English-only model, small size'
  },
  'small-q5_1': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin',
    size: '190 MB',
    description: 'Multilingual model, quantized (Q5_1)'
  },
  'small.en-q5_1': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q5_1.bin',
    size: '190 MB',
    description: 'English-only model, quantized (Q5_1)'
  },
  'small-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q8_0.bin',
    size: '264 MB',
    description: 'Multilingual model, quantized (Q8_0)'
  },
  'small.en-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q8_0.bin',
    size: '264 MB',
    description: 'English-only model, quantized (Q8_0)'
  },

  // Medium models (大規模)
  'medium': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    size: '1.53 GB',
    description: 'Multilingual model, medium size'
  },
  'medium.en': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin',
    size: '1.53 GB',
    description: 'English-only model, medium size'
  },
  'medium-q5_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin',
    size: '539 MB',
    description: 'Multilingual model, quantized (Q5_0)'
  },
  'medium.en-q5_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en-q5_0.bin',
    size: '539 MB',
    description: 'English-only model, quantized (Q5_0)'
  },
  'medium-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q8_0.bin',
    size: '823 MB',
    description: 'Multilingual model, quantized (Q8_0)'
  },
  'medium.en-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en-q8_0.bin',
    size: '823 MB',
    description: 'English-only model, quantized (Q8_0)'
  },

  // Large models (超大規模)
  'large-v1': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v1.bin',
    size: '3.09 GB',
    description: 'Multilingual model, large v1 size'
  },
  'large-v3-turbo-q5_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin',
    size: '574 MB',
    description: 'Multilingual model, large v3 turbo, quantized (Q5_0)'
  },
  'large-v3-turbo-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q8_0.bin',
    size: '874 MB',
    description: 'Multilingual model, large v3 turbo, quantized (Q8_0)'
  },
  'large-v2': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2.bin',
    size: '3.09 GB',
    description: 'Multilingual model, large v2 size'
  },
  'large-v2-q5_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q5_0.bin',
    size: '1.08 GB',
    description: 'Multilingual model, large v2, quantized (Q5_0)'
  },
  'large-v2-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q8_0.bin',
    size: '1.66 GB',
    description: 'Multilingual model, large v2, quantized (Q8_0)'
  },
  'large-v3': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    size: '3.1 GB',
    description: 'Multilingual model, large v3 size'
  },
  'large-v3-q5_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-q5_0.bin',
    size: '1.08 GB',
    description: 'Multilingual model, large v3, quantized (Q5_0)'
  },
  'large-v3-turbo': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
    size: '1.62 GB',
    description: 'Multilingual model, large v3 turbo size'
  },
  'large-v3-turbo-q5_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin',
    size: '574 MB',
    description: 'Multilingual model, large v3 turbo, quantized (Q5_0)'
  },
  'large-v3-turbo-q8_0': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q8_0.bin',
    size: '874 MB',
    description: 'Multilingual model, large v3 turbo, quantized (Q8_0)'
  }
};

// ダウンロードディレクトリ
const downloadDir = path.join(__dirname, 'public', 'whisper', 'models');

// ダウンロード関数
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    console.log(`To: ${filepath}`);
    
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\rProgress: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\nDownload completed!');
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // エラー時にファイルを削除
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// メイン関数
async function main() {
  try {
    // 引数からモデルを取得（デフォルトはtiny-q5_1）
    const modelName = process.argv[2] || 'tiny-q5_1';
    
    if (!availableModels[modelName]) {
      console.error(`Error: Model '${modelName}' not found.`);
      console.log('Available models:');
      Object.keys(availableModels).forEach(name => {
        const model = availableModels[name];
        console.log(`  ${name}: ${model.size} - ${model.description}`);
      });
      process.exit(1);
    }
    
    const model = availableModels[modelName];
    
    console.log('=== Whisper.cpp Model Downloader ===');
    console.log(`Model: ${modelName}`);
    console.log(`Size: ${model.size}`);
    console.log(`Description: ${model.description}`);
    console.log(`URL: ${model.url}`);
    console.log('');
    
    // ディレクトリを作成
    if (!fs.existsSync(downloadDir)) {
      console.log(`Creating directory: ${downloadDir}`);
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    // ファイルパス
    const filepath = path.join(downloadDir, `ggml-${modelName}.bin`);
    
    // ファイルが既に存在するかチェック
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(1);
      console.log(`Model already exists: ${filepath} (${fileSizeMB}MB)`);
      
      const answer = process.argv.includes('--force') ? 'y' : 
        await new Promise(resolve => {
          process.stdout.write('Do you want to re-download? (y/N): ');
          process.stdin.once('data', (data) => {
            resolve(data.toString().trim().toLowerCase());
          });
        });
      
      if (answer !== 'y' && answer !== 'yes') {
        console.log('Skipping download.');
        return;
      }
    }
    
    // ダウンロード実行
    console.log('Starting download...');
    await downloadFile(model.url, filepath);
    
    // ファイルサイズを確認
    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`Download completed: ${filepath} (${fileSizeMB}MB)`);
    
    // シンボリックリンクを作成（whisper.binとして）
    const symlinkPath = path.join(downloadDir, 'whisper.bin');
    try {
      if (fs.existsSync(symlinkPath)) {
        fs.unlinkSync(symlinkPath);
      }
      fs.symlinkSync(`ggml-${modelName}.bin`, symlinkPath);
      console.log(`Created symlink: ${symlinkPath} -> ggml-${modelName}.bin`);
    } catch (err) {
      console.log(`Note: Could not create symlink (${err.message})`);
      console.log(`You can manually copy ggml-${modelName}.bin to whisper.bin`);
    }
    
    console.log('\n=== Download Summary ===');
    console.log(`Model: ${modelName}`);
    console.log(`File: ${filepath}`);
    console.log(`Size: ${fileSizeMB}MB`);
    console.log('Status: Ready for use');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// ヘルプ表示
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Whisper.cpp Model Downloader');
  console.log('');
  console.log('Usage: node download-whisper-models.js [model-name] [options]');
  console.log('');
  console.log('Available models:');
  Object.keys(availableModels).forEach(name => {
    const model = availableModels[name];
    console.log(`  ${name}: ${model.size} - ${model.description}`);
  });
  console.log('');
  console.log('Options:');
  console.log('  --force    Force re-download even if file exists');
  console.log('  --help     Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node download-whisper-models.js tiny-q5_1');
  console.log('  node download-whisper-models.js base-q5_1 --force');
  process.exit(0);
}

// スクリプト実行
main().catch(console.error);
