const fs = require('fs');
const path = require('path');

// モデルファイルの存在確認
const modelPath = './models/unsloth/Qwen2.5-Omni-7B-GGUF/Qwen2.5-Omni-7B-Q4_K_M.gguf';

console.log('🔍 Qwen2.5-Omni モデルテスト開始...');

// モデルファイルの確認
if (fs.existsSync(modelPath)) {
  const stats = fs.statSync(modelPath);
  const fileSizeInGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);
  console.log(`✅ モデルファイルが見つかりました: ${modelPath}`);
  console.log(`📊 ファイルサイズ: ${fileSizeInGB} GB`);
  
  // ファイルの詳細情報
  console.log(`📅 作成日時: ${stats.birthtime}`);
  console.log(`📅 最終更新: ${stats.mtime}`);
  
  // ファイルの最初の数バイトを確認（GGUFファイルのマジックナンバー）
  const buffer = fs.readFileSync(modelPath, { start: 0, end: 8 });
  const magic = buffer.toString('hex');
  console.log(`🔮 マジックナンバー: ${magic}`);
  
  if (magic.startsWith('67677566')) { // 'gguf' in hex
    console.log('✅ 有効なGGUFファイルです');
  } else {
    console.log('⚠️ GGUFファイルのマジックナンバーが一致しません');
  }
  
} else {
  console.log(`❌ モデルファイルが見つかりません: ${modelPath}`);
  console.log('📁 現在のディレクトリ:', process.cwd());
  
  // ディレクトリの内容を確認
  const modelDir = path.dirname(modelPath);
  if (fs.existsSync(modelDir)) {
    console.log(`📂 ${modelDir} の内容:`);
    const files = fs.readdirSync(modelDir);
    files.forEach(file => {
      const filePath = path.join(modelDir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  - ${file} (${sizeInMB} MB)`);
      } else {
        console.log(`  - ${file}/ (ディレクトリ)`);
      }
    });
  } else {
    console.log(`❌ ディレクトリが存在しません: ${modelDir}`);
  }
}

// システム情報
console.log('\n💻 システム情報:');
console.log(`🖥️  OS: ${process.platform} ${process.arch}`);
console.log(`📦 Node.js: ${process.version}`);
console.log(`💾 メモリ使用量: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);

// 利用可能なメモリ（概算）
const os = require('os');
const totalMemGB = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
const freeMemGB = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
console.log(`💾 総メモリ: ${totalMemGB} GB`);
console.log(`💾 空きメモリ: ${freeMemGB} GB`);

console.log('\n✅ Qwen2.5-Omni モデルテスト完了！');
