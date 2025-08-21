import { GeminiFileService } from '@/services/llm/gemini-file-service'

/**
 * Gemini File Serviceの使用例
 * 参考記事: https://qiita.com/shokkaa/items/b137366cca35ce331c4d
 */
async function geminiFileUsageExample() {
  // 1. サービスを初期化
  const geminiService = new GeminiFileService()
  
  // APIキーを設定（環境変数から取得）
  const apiKey = process.env.VITE_GOOGLE_API_KEY
  if (!apiKey) {
    console.error('VITE_GOOGLE_API_KEYが設定されていません')
    return
  }

  try {
    // 2. サービスを設定
    await geminiService.configure(apiKey, 'gemini-1.5-flash')
    console.log('Gemini File Service configured successfully')

    // 3. ファイルをアップロード
    const filePath = './example-image.jpg' // 実際のファイルパスに変更
    const uploadResponse = await geminiService.uploadFile(filePath, 'image/jpeg', 'Example Image')
    console.log('File uploaded:', uploadResponse)

    // 4. ファイルについてチャット
    const question = '画像を20文字で説明して'
    const chatResponse = await geminiService.chatAboutFile(uploadResponse.file.uri, question)
    console.log('Chat response:', chatResponse)

    // 5. 複数の質問を連続して実行
    const questions = [
      '画像を20文字で説明して',
      'カード上の透かし文言は何'
    ]
    const multipleResponses = await geminiService.chatAboutFileMultiple(uploadResponse.file.uri, questions)
    console.log('Multiple responses:', multipleResponses)

  } catch (error) {
    console.error('Error:', error)
  }
}

/**
 * コマンドライン引数からファイルパスを取得してアップロード
 */
async function uploadFileFromCommandLine() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('使用方法: npm run gemini-upload <file-path>')
    return
  }

  const geminiService = new GeminiFileService()
  const apiKey = process.env.VITE_GOOGLE_API_KEY
  
  if (!apiKey) {
    console.error('VITE_GOOGLE_API_KEYが設定されていません')
    return
  }

  try {
    await geminiService.configure(apiKey)
    const uploadResponse = await geminiService.uploadFile(filePath)
    console.log('Upload successful:', uploadResponse)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

/**
 * アップロードされたファイルについてチャット
 */
async function chatAboutUploadedFile() {
  const fileUri = process.argv[2]
  const question = process.argv[3]
  
  if (!fileUri || !question) {
    console.error('使用方法: npm run gemini-chat <file-uri> <question>')
    return
  }

  const geminiService = new GeminiFileService()
  const apiKey = process.env.VITE_GOOGLE_API_KEY
  
  if (!apiKey) {
    console.error('VITE_GOOGLE_API_KEYが設定されていません')
    return
  }

  try {
    await geminiService.configure(apiKey)
    const response = await geminiService.chatAboutFile(fileUri, question)
    console.log('Q:', question)
    console.log('A:', response.text)
    console.log('Usage:', response.usageMetadata)
  } catch (error) {
    console.error('Chat failed:', error)
  }
}

// エクスポート
export {
  geminiFileUsageExample,
  uploadFileFromCommandLine,
  chatAboutUploadedFile
}

// コマンドライン実行時の処理
if (require.main === module) {
  const command = process.argv[2]
  
  switch (command) {
    case 'upload':
      uploadFileFromCommandLine()
      break
    case 'chat':
      chatAboutUploadedFile()
      break
    default:
      console.log('使用方法:')
      console.log('  npm run gemini-upload <file-path>')
      console.log('  npm run gemini-chat <file-uri> <question>')
  }
}
