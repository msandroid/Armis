import { LlamaCppService } from '@/services/llm/llama-cpp-service'

/**
 * LlamaCppServiceの使用例
 * 
 * このスクリプトは、LlamaCppServiceを使用してローカルでLLM推論を行う方法を示します。
 * 
 * 前提条件:
 * 1. node-llama-cppパッケージがインストールされている
 * 2. GGUF形式のモデルファイルが./models/ディレクトリに配置されている
 * 3. Node.js環境で実行される（ブラウザでは動作しません）
 */

async function main() {
  console.log('🚀 LlamaCppService使用例を開始します...')

  // LlamaCppServiceの初期化
  const llamaCppService = new LlamaCppService({
    modelPath: './models/llama-2-7b-chat.gguf',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    contextSize: 4096,
    threads: 4,
    gpuLayers: 0,
    verbose: false
  })

  try {
    // サービスの初期化
    console.log('📥 LlamaCppServiceを初期化中...')
    await llamaCppService.initialize()
    console.log('✅ LlamaCppServiceが正常に初期化されました')

    // 利用可能なモデルの確認
    console.log('\n📋 利用可能なモデル:')
    const availableModels = await llamaCppService.getAvailableModels()
    availableModels.forEach(model => {
      console.log(`  - ${model.name} (${formatFileSize(model.size)})`)
    })

    // 現在のモデル情報の取得
    const currentModel = llamaCppService.getModelInfo()
    if (currentModel) {
      console.log(`\n🎯 現在のモデル: ${currentModel.name}`)
    }

    // 基本的なテキスト生成
    console.log('\n💬 基本的なテキスト生成テスト...')
    const prompt = "こんにちは！あなたは何ができますか？"
    const response = await llamaCppService.generateResponse(prompt)
    console.log(`質問: ${prompt}`)
    console.log(`回答: ${response.text}`)
    console.log(`生成時間: ${response.duration}ms`)
    console.log(`推定トークン数: ${response.tokens}`)

    // チャット形式での応答生成
    console.log('\n💬 チャット形式での応答生成テスト...')
    const messages = [
      { role: 'system', content: 'あなたは親切で知識豊富なアシスタントです。' },
      { role: 'user', content: 'プログラミングについて教えてください。' }
    ]
    const chatResponse = await llamaCppService.chat(messages)
    console.log(`チャット応答: ${chatResponse.text}`)

    // ストリーミング応答のテスト
    console.log('\n🌊 ストリーミング応答テスト...')
    const streamPrompt = "短い詩を作ってください。"
    await llamaCppService.generateStream(streamPrompt, (chunk) => {
      process.stdout.write(chunk)
    })
    console.log('\n')

    // 設定の更新
    console.log('\n⚙️ 設定の更新テスト...')
    llamaCppService.updateConfig({
      temperature: 0.9,
      maxTokens: 1024
    })
    console.log('設定が更新されました')

    // 新しいモデルの読み込み（利用可能な場合）
    if (availableModels.length > 1) {
      const secondModel = availableModels[1]
      console.log(`\n🔄 モデルを切り替え中: ${secondModel.name}`)
      await llamaCppService.loadModel(secondModel.path)
      console.log('モデルが正常に切り替えられました')

      // 新しいモデルでのテスト
      const newResponse = await llamaCppService.generateResponse("簡単な挨拶をしてください。")
      console.log(`新しいモデルの応答: ${newResponse.text}`)
    }

    // サービスの終了
    console.log('\n🔄 LlamaCppServiceを終了中...')
    await llamaCppService.close()
    console.log('✅ LlamaCppServiceが正常に終了しました')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// ファイルサイズのフォーマット関数
function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// エラーハンドリング付きでメイン関数を実行
if (typeof window === 'undefined') {
  // Node.js環境でのみ実行
  main().catch(console.error)
} else {
  console.log('⚠️ このスクリプトはNode.js環境でのみ実行してください。')
}

/**
 * 使用例の説明:
 * 
 * 1. 初期化:
 *    - LlamaCppServiceのインスタンスを作成
 *    - モデルパスと設定を指定
 *    - initialize()メソッドでサービスを開始
 * 
 * 2. モデル管理:
 *    - getAvailableModels()で利用可能なモデルを取得
 *    - loadModel()で新しいモデルを読み込み
 *    - getModelInfo()で現在のモデル情報を取得
 * 
 * 3. テキスト生成:
 *    - generateResponse()で基本的なテキスト生成
 *    - chat()でチャット形式の応答生成
 *    - generateStream()でストリーミング応答
 * 
 * 4. 設定管理:
 *    - updateConfig()で設定を動的に変更
 *    - 温度、トークン数、コンテキストサイズなどを調整
 * 
 * 5. リソース管理:
 *    - close()でサービスを適切に終了
 * 
 * 注意事項:
 * - ブラウザ環境では動作しません
 * - GGUF形式のモデルファイルが必要です
 * - 十分なメモリとCPUリソースが必要です
 * - GPU使用時は適切なドライバーが必要です
 */
