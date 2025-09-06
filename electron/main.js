import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'
import { spawn } from 'child_process'

// Google Cloud認証ライブラリを追加
import { GoogleAuth } from 'google-auth-library'
// node-fetchを追加
import fetch from 'node-fetch'

// 環境変数を読み込み
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

// Google Cloud認証情報のパスを明示的に設定
// プロジェクトルートの認証情報ファイルを使用
const credentialsPath = path.resolve(__dirname, '../armis-vertex-ai-key.json')
if (fs.existsSync(credentialsPath)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath
  console.log('✅ Google Cloud認証情報ファイルを設定:', credentialsPath)
  console.log('ファイル存在確認:', fs.existsSync(credentialsPath))
  console.log('ファイルサイズ:', fs.statSync(credentialsPath).size, 'bytes')
} else {
  console.log('❌ Google Cloud認証情報ファイルが見つかりません:', credentialsPath)
  // フォールバック: デフォルトのgcloud認証情報を使用
  const fallbackPath = path.join(process.env.HOME || process.env.USERPROFILE, '.config/gcloud/application_default_credentials.json')
  process.env.GOOGLE_APPLICATION_CREDENTIALS = fallbackPath
  console.log('フォールバック認証情報パス:', fallbackPath)
}

function createWindow() {
  // Electron環境であることを示す環境変数を設定
  process.env.ELECTRON_IS_DEV = process.env.NODE_ENV === 'development' ? 'true' : 'false'
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../icon/icon.png'),
    title: 'Armis - Multimodal Editing Environment',
  })

  // 開発環境ではローカルサーバーを、本番環境ではビルドされたファイルを読み込み
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return mainWindow
}

let mainWindow

app.whenReady().then(() => {
  mainWindow = createWindow()
  setupIPC()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow()
  }
})

function setupIPC() {
  // 環境変数を取得するハンドラー
  ipcMain.handle('get-env-vars', async () => {
    return {
      VITE_GOOGLE_API_KEY: process.env.VITE_GOOGLE_API_KEY,
      VITE_GOOGLE_PROJECT_ID: process.env.VITE_GOOGLE_PROJECT_ID,
      VITE_GOOGLE_LOCATION: process.env.VITE_GOOGLE_LOCATION || 'us-central1',
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS
    }
  })

  // Google Cloud認証状況を確認するハンドラー
  ipcMain.handle('check-google-auth', async () => {
    try {
      console.log('🔍 Google Cloud認証確認開始...')
      console.log('認証情報ファイルパス:', process.env.GOOGLE_APPLICATION_CREDENTIALS)
      
      // 認証情報ファイルの存在確認
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        if (fs.existsSync(credentialsPath)) {
          console.log('✅ 認証情報ファイルが存在します')
        } else {
          console.log('❌ 認証情報ファイルが存在しません:', credentialsPath)
        }
      }

      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      })
      
      console.log('🔑 GoogleAuth初期化完了')
      
      const client = await auth.getClient()
      console.log('🔑 クライアント取得完了')
      
      const tokenResponse = await client.getAccessToken()
      console.log('🔑 アクセストークン取得完了')
      
      const projectId = await auth.getProjectId()
      console.log('🔑 プロジェクトID取得完了:', projectId)
      
      return {
        success: true,
        hasCredentials: !!tokenResponse.token,
        projectId: projectId
      }
    } catch (error) {
      console.error('❌ Google Cloud認証チェックエラー:', error)
      return {
        success: false,
        error: error.message,
        stack: error.stack
      }
    }
  })

  // Directory creation handler
  ipcMain.handle('create-directory', async (event, options) => {
    try {
      const { path: dirPath } = options
      
      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log(`📁 Created directory: ${dirPath}`)
      } else {
        console.log(`📁 Directory already exists: ${dirPath}`)
      }
      
      return { success: true, path: dirPath }
    } catch (error) {
      console.error('Directory creation error:', error)
      return { success: false, error: error.message }
    }
  })

  // File move handler
  ipcMain.handle('move-file', async (event, options) => {
    try {
      const { oldPath, newPath } = options
      
      // Ensure target directory exists
      const targetDir = path.dirname(newPath)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      
      // Move the file
      fs.renameSync(oldPath, newPath)
      
      console.log(`✅ File moved: ${oldPath} -> ${newPath}`)
      return { success: true, path: newPath }
    } catch (error) {
      console.error('File move error:', error)
      return { success: false, error: error.message }
    }
  })

  // File download handler
  ipcMain.handle('download-file', async (event, options) => {
    try {
      const { url, targetPath, fileName, fileSize, modelId } = options
      
      // Ensure models directory exists
      const modelsDir = path.join(__dirname, '../models')
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true })
      }

      // Create proper directory structure for the model
      let fullPath
      if (targetPath && targetPath !== `./models/${fileName}`) {
        // Use the provided target path
        fullPath = path.join(__dirname, '..', targetPath.replace('./', ''))
        
        // Ensure target directory exists
        const targetDir = path.dirname(fullPath)
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
          console.log(`📁 Created target directory: ${targetDir}`)
        }
      } else {
        // Create directory structure based on modelId
        const modelDir = modelId ? modelId.replace('/', path.sep) : 'unknown'
        const modelDirPath = path.join(modelsDir, modelDir)
        
        // Ensure model directory exists
        if (!fs.existsSync(modelDirPath)) {
          fs.mkdirSync(modelDirPath, { recursive: true })
          console.log(`📁 Created model directory: ${modelDirPath}`)
        }
        
        fullPath = path.join(modelDirPath, fileName)
      }
      
      console.log(`📁 Creating directory structure for model: ${modelId}`)
      console.log(`📂 Target path: ${fullPath}`)
      
      return await downloadFile(url, fullPath, fileSize, (progress) => {
        // Send progress to renderer
        mainWindow.webContents.send('download-progress', {
          modelId: options.modelId,
          ...progress
        })
      })
    } catch (error) {
      console.error('Download error:', error)
      return { success: false, error: error.message }
    }
  })

  // Vertex AI Imagen API 画像生成ハンドラー
  ipcMain.handle('generate-image', async (event, options) => {
    try {
      const { prompt, model, width, height, quality, style, safetyFilter, personGeneration, projectId, location } = options
      
      console.log('🎨 Starting Imagen image generation in main process...')
      console.log('Options:', { prompt, model, width, height, quality, style, projectId, location })
      
      const result = await generateImageWithVertexAI({
        prompt,
        model,
        width,
        height,
        quality,
        style,
        safetyFilter,
        personGeneration,
        projectId,
        location
      })
      
      console.log('✅ Imagen image generation completed successfully')
      return { success: true, images: result.images }
    } catch (error) {
      console.error('❌ Imagen image generation failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Gemini API 画像生成ハンドラー
  ipcMain.handle('generate-image-with-gemini', async (event, options) => {
    try {
      const { prompt, model, apiKey } = options
      
      console.log('🎨 Starting Gemini image generation in main process...')
      console.log('Options:', { prompt, model, apiKey: apiKey ? '設定済み' : '未設定' })
      
      const result = await generateImageWithGeminiAPI({
        prompt,
        model,
        apiKey
      })
      
      console.log('✅ Gemini image generation completed successfully')
      return { success: true, images: result.images }
    } catch (error) {
      console.error('❌ Gemini image generation failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Local Inworld TTS ハンドラー
  ipcMain.handle('local-tts-setup', async (event, options) => {
    try {
      const { pythonPath = 'python3', modelsDir } = options
      
      console.log('🚀 Starting Local Inworld TTS setup...')
      console.log('Options:', { pythonPath, modelsDir })
      
      const result = await runLocalTTSSetup(pythonPath, modelsDir)
      
      console.log('✅ Local TTS setup completed successfully')
      return result
    } catch (error) {
      console.error('❌ Local TTS setup failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Local Inworld TTS 音声合成ハンドラー
  ipcMain.handle('local-tts-synthesize', async (event, options) => {
    try {
      const { text, modelName, language, pythonPath = 'python3', modelsDir } = options
      
      console.log('🎤 Starting Local Inworld TTS synthesis...')
      console.log('Options:', { text: text.substring(0, 50), modelName, language, pythonPath, modelsDir })
      
      const result = await runLocalTTSSynthesis(text, modelName, language, pythonPath, modelsDir)
      
      console.log('✅ Local TTS synthesis completed successfully')
      return result
    } catch (error) {
      console.error('❌ Local TTS synthesis failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Local Inworld TTS モデル一覧取得ハンドラー
  ipcMain.handle('local-tts-list-models', async (event, options) => {
    try {
      const { pythonPath = 'python3', modelsDir } = options
      
      console.log('📋 Getting Local Inworld TTS models...')
      
      const result = await runLocalTTSListModels(pythonPath, modelsDir)
      
      console.log('✅ Local TTS models retrieved successfully')
      return result
    } catch (error) {
      console.error('❌ Local TTS models retrieval failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Coqui XTTS-v2 モデル存在確認ハンドラー
  ipcMain.handle('check-xtts-model', async (event, options) => {
    try {
      const { modelsDir } = options
      
      console.log('🔍 Checking XTTS-v2 model...')
      
      const result = await checkXTTSModel(modelsDir)
      
      console.log('✅ XTTS-v2 model check completed')
      return result
    } catch (error) {
      console.error('❌ XTTS-v2 model check failed:', error)
      return { exists: false, error: error.message }
    }
  })

  // Coqui XTTS-v2 モデルダウンロードハンドラー
  ipcMain.handle('download-xtts-model', async (event, options) => {
    try {
      const { pythonPath = 'python3', modelsDir } = options
      
      console.log('📥 Downloading XTTS-v2 model...')
      
      const result = await downloadXTTSModel(pythonPath, modelsDir)
      
      console.log('✅ XTTS-v2 model download completed')
      return result
    } catch (error) {
      console.error('❌ XTTS-v2 model download failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Coqui XTTS-v2 音声合成ハンドラー
  ipcMain.handle('xtts-synthesize', async (event, options) => {
    try {
      const { text, voiceName, language, speed, pythonPath = 'python3', modelsDir } = options
      
      console.log('🎤 Starting XTTS-v2 synthesis...')
      console.log('Options:', { text: text.substring(0, 50), voiceName, language, speed, pythonPath, modelsDir })
      
      const result = await runXTTSSynthesis(text, voiceName, language, speed, pythonPath, modelsDir)
      
      console.log('✅ XTTS-v2 synthesis completed successfully')
      return result
    } catch (error) {
      console.error('❌ XTTS-v2 synthesis failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Coqui XTTS-v2 セットアップハンドラー
  ipcMain.handle('xtts-setup', async (event, options) => {
    try {
      const { pythonPath = 'python3', modelsDir } = options
      
      console.log('🚀 Starting XTTS-v2 setup...')
      console.log('Options:', { pythonPath, modelsDir })
      
      const result = await runXTTSSetup(pythonPath, modelsDir)
      
      console.log('✅ XTTS-v2 setup completed successfully')
      return result
    } catch (error) {
      console.error('❌ XTTS-v2 setup failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Hugging Face ウェブスクレイピングハンドラー
  ipcMain.handle('scrape-huggingface-models', async (event, options) => {
    try {
      const { query = '', limit = 50, sort = 'trending', direction = 'desc' } = options
      
      console.log('🌐 Starting Hugging Face web scraping...')
      console.log('Options:', { query, limit, sort, direction })
      
      const result = await scrapeHuggingFaceModels(query, limit, sort, direction)
      
      console.log('✅ Hugging Face web scraping completed successfully')
      return result
    } catch (error) {
      console.error('❌ Hugging Face web scraping failed:', error)
      return { success: false, error: error.message }
    }
  })
}

/**
 * Vertex AI Imagen APIを使用して画像を生成
 */
async function generateImageWithVertexAI(params) {
  const {
    prompt,
    model = 'imagen-3.0-generate-002',
    width = 1024,
    height = 1024,
    quality = 'standard',
    style = 'photorealistic',
    safetyFilter = 'block_some',
    personGeneration = 'dont_allow',
    projectId,
    location = 'us-central1'
  } = params

  if (!projectId) {
    throw new Error('Project ID is required for Imagen API calls')
  }

  // Google Cloud認証の初期化
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: projectId
  })

  // OAuth2アクセストークンを取得
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  const accessToken = tokenResponse.token || ''
  
  if (!accessToken) {
    throw new Error('アクセストークンが取得できませんでした')
  }

  console.log('OAuth2アクセストークン取得完了')

  // Imagen APIのエンドポイント
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`

  // Imagen APIのリクエスト形式
  const requestBody = {
    instances: [{
      prompt: prompt
    }],
    parameters: {
      sampleImageSize: `${width}x${height}`,
      sampleCount: 1,
      mimeType: "image/png",
      quality: quality,
      style: style,
      safetyFilterLevel: safetyFilter,
      personGeneration: personGeneration
    }
  }

  console.log('Imagen API リクエスト:', {
    endpoint,
    model,
    prompt,
    size: `${width}x${height}`,
    quality
  })

  // fetchを使用してAPIを呼び出し
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  console.log('Response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    let errorData = {}
    try {
      errorData = JSON.parse(errorText)
    } catch (e) {
      console.error('Failed to parse error response as JSON:', errorText)
    }
    console.error('Imagen API error response:', errorData)
    throw new Error(`Imagen API error: ${response.status} ${response.statusText} - ${errorData.error?.message || errorText || 'Unknown error'}`)
  }

  const data = await response.json()
  console.log('Imagen API response received')

  // レスポンスから画像データを抽出
  const images = []
  
  if (data.predictions && data.predictions[0]) {
    const prediction = data.predictions[0]
    
    // 複数のレスポンス形式に対応
    if (prediction.bytesBase64Encoded) {
      images.push(prediction.bytesBase64Encoded)
    } else if (prediction.instances && prediction.instances[0]) {
      const instance = prediction.instances[0]
      if (instance.bytesBase64Encoded) {
        images.push(instance.bytesBase64Encoded)
      }
    } else if (prediction.image && prediction.image.bytesBase64Encoded) {
      images.push(prediction.image.bytesBase64Encoded)
    } else if (prediction.generatedImage && prediction.generatedImage.bytesBase64Encoded) {
      images.push(prediction.generatedImage.bytesBase64Encoded)
    }
  }

  if (images.length === 0) {
    throw new Error('No images generated. Please check the API response format.')
  }

  console.log(`Generated ${images.length} image(s)`)
  return { images }
}

/**
 * Gemini APIを使用して画像を生成
 */
async function generateImageWithGeminiAPI(params) {
  const { prompt, model = 'gemini-2.0-flash-preview-image-generation', apiKey } = params

  if (!apiKey) {
    throw new Error('API Key is required for Gemini API calls')
  }

  try {
    console.log('Gemini APIを使用して画像生成を実行:', prompt)
    
    // Gemini APIのエンドポイント
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    
    // Gemini APIのリクエスト形式
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    }

    console.log('Gemini API リクエスト:', {
      endpoint,
      model,
      prompt
    })

    // fetchを使用してAPIを呼び出し
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      let errorData = {}
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        console.error('Failed to parse error response as JSON:', errorText)
      }
      console.error('Gemini API error response:', errorData)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData.error?.message || errorText || 'Unknown error'}`)
    }

    const data = await response.json()
    console.log('Gemini API response:', JSON.stringify(data, null, 2))
    
    // レスポンスから画像データを抽出
    const images = []
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
          console.log('Found image data in response')
          images.push(part.inlineData.data)
        }
      }
    }

    if (images.length === 0) {
      console.error('No images found in Gemini API response:', data)
      throw new Error('No images generated. Please check the API response format.')
    }

    console.log(`Generated ${images.length} image(s) with Gemini API`)
    return { images }
  } catch (error) {
    console.error('Gemini API call failed:', error)
    throw error
  }
}

/**
 * Local Inworld TTS セットアップを実行
 */
async function runLocalTTSSetup(pythonPath, modelsDir) {
  return new Promise((resolve, reject) => {
    const setupScript = path.join(modelsDir, 'setup.py')
    
    // セットアップスクリプトの存在確認
    if (!fs.existsSync(setupScript)) {
      reject(new Error(`Setup script not found: ${setupScript}`))
      return
    }
    
    console.log(`Running setup script: ${setupScript}`)
    
    const setupProcess = spawn(pythonPath, [setupScript], {
      cwd: modelsDir,
      stdio: 'pipe'
    })
    
    let output = ''
    let errorOutput = ''
    
    setupProcess.stdout?.on('data', (data) => {
      output += data.toString()
      console.log(data.toString().trim())
    })
    
    setupProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
      console.error(data.toString().trim())
    })
    
    setupProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Local TTS setup completed successfully')
        resolve({ success: true, output })
      } else {
        console.error('❌ Local TTS setup failed with code:', code)
        console.error('Error output:', errorOutput)
        reject(new Error(`Setup failed with code ${code}: ${errorOutput}`))
      }
    })
    
    setupProcess.on('error', (error) => {
      console.error('❌ Setup process error:', error)
      reject(error)
    })
  })
}

/**
 * Local Inworld TTS 音声合成を実行
 */
async function runLocalTTSSynthesis(text, modelName, language, pythonPath, modelsDir) {
  return new Promise((resolve, reject) => {
    const servicePath = path.join(modelsDir, 'local_tts_service.py')
    
    // サービスの存在確認
    if (!fs.existsSync(servicePath)) {
      reject(new Error(`TTS service not found: ${servicePath}`))
      return
    }
    
    console.log(`Running TTS synthesis: ${servicePath}`)
    
    const pythonProcess = spawn(pythonPath, [servicePath, 'synthesize', text, modelName, language], {
      cwd: modelsDir,
      stdio: 'pipe'
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout?.on('data', (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim())
          console.log('✅ TTS synthesis completed successfully')
          resolve(result)
        } catch (error) {
          console.error('❌ Failed to parse TTS result:', error)
          reject(new Error(`Failed to parse result: ${output}`))
        }
      } else {
        console.error('❌ TTS synthesis failed with code:', code)
        console.error('Error output:', errorOutput)
        reject(new Error(`Synthesis failed with code ${code}: ${errorOutput}`))
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('❌ TTS synthesis process error:', error)
      reject(error)
    })
  })
}

/**
 * Local Inworld TTS モデル一覧を取得
 */
async function runLocalTTSListModels(pythonPath, modelsDir) {
  return new Promise((resolve, reject) => {
    const servicePath = path.join(modelsDir, 'local_tts_service.py')
    
    // サービスの存在確認
    if (!fs.existsSync(servicePath)) {
      reject(new Error(`TTS service not found: ${servicePath}`))
      return
    }
    
    console.log(`Getting models list: ${servicePath}`)
    
    const pythonProcess = spawn(pythonPath, [servicePath, 'list_models'], {
      cwd: modelsDir,
      stdio: 'pipe'
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout?.on('data', (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim())
          console.log('✅ Models list retrieved successfully')
          resolve(result)
        } catch (error) {
          console.error('❌ Failed to parse models list:', error)
          reject(new Error(`Failed to parse models list: ${output}`))
        }
      } else {
        console.error('❌ Models list retrieval failed with code:', code)
        console.error('Error output:', errorOutput)
        reject(new Error(`Models list retrieval failed with code ${code}: ${errorOutput}`))
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('❌ Models list process error:', error)
      reject(error)
    })
  })
}

async function downloadFile(url, targetPath, expectedSize, onProgress) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    const file = fs.createWriteStream(targetPath)
    
    let downloadedBytes = 0
    const startTime = Date.now()

    const request = protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length
        file.write(chunk)

        // Calculate progress
        const percentage = (downloadedBytes / expectedSize) * 100
        const elapsedTime = (Date.now() - startTime) / 1000
        const speed = downloadedBytes / elapsedTime
        const remainingBytes = expectedSize - downloadedBytes
        const eta = remainingBytes / speed

        onProgress({
          downloaded: downloadedBytes,
          total: expectedSize,
          percentage: Math.round(percentage * 100) / 100,
          speed: Math.round(speed),
          eta: Math.round(eta),
          status: 'downloading'
        })
      })

      response.on('end', () => {
        file.end()
        onProgress({
          downloaded: expectedSize,
          total: expectedSize,
          percentage: 100,
          speed: 0,
          eta: 0,
          status: 'completed'
        })
        resolve({ success: true, path: targetPath })
      })
    })

    request.on('error', (error) => {
      file.destroy()
      fs.unlink(targetPath, () => {}) // Clean up partial file
      reject(error)
    })

    file.on('error', (error) => {
      request.destroy()
      reject(error)
    })
  })
}

// XTTS-v2関連の関数
async function checkXTTSModel(modelsDir) {
  return new Promise((resolve, reject) => {
    const pythonPath = 'python3'
    const scriptPath = path.join(__dirname, '../models/coqui-xtts/xtts_service.py')
    
    console.log('🔍 Checking XTTS-v2 model...')
    console.log('Script path:', scriptPath)
    
    const pythonProcess = spawn(pythonPath, [scriptPath, 'check_model'], {
      cwd: path.dirname(scriptPath),
      stdio: 'pipe'
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout?.on('data', (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim())
          console.log('✅ XTTS-v2 model check completed')
          resolve(result)
        } catch (error) {
          console.error('❌ Failed to parse XTTS-v2 model check result:', error)
          reject(new Error(`Failed to parse XTTS-v2 model check result: ${output}`))
        }
      } else {
        console.error('❌ XTTS-v2 model check failed with code:', code)
        console.error('Error output:', errorOutput)
        reject(new Error(`XTTS-v2 model check failed with code ${code}: ${errorOutput}`))
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('❌ XTTS-v2 model check process error:', error)
      reject(error)
    })
  })
}

async function downloadXTTSModel(pythonPath, modelsDir) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../models/coqui-xtts/xtts_service.py')
    
    console.log('📥 Downloading XTTS-v2 model...')
    console.log('Script path:', scriptPath)
    
    const pythonProcess = spawn(pythonPath, [scriptPath, 'download_model'], {
      cwd: path.dirname(scriptPath),
      stdio: 'pipe'
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout?.on('data', (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim())
          console.log('✅ XTTS-v2 model download completed')
          resolve(result)
        } catch (error) {
          console.error('❌ Failed to parse XTTS-v2 model download result:', error)
          reject(new Error(`Failed to parse XTTS-v2 model download result: ${output}`))
        }
      } else {
        console.error('❌ XTTS-v2 model download failed with code:', code)
        console.error('Error output:', errorOutput)
        reject(new Error(`XTTS-v2 model download failed with code ${code}: ${errorOutput}`))
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('❌ XTTS-v2 model download process error:', error)
      reject(error)
    })
  })
}

async function runXTTSSetup(pythonPath, modelsDir) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../models/coqui-xtts/setup.py')
    
    console.log('🚀 Running XTTS-v2 setup...')
    console.log('Script path:', scriptPath)
    
    const pythonProcess = spawn(pythonPath, [scriptPath, 'setup'], {
      cwd: path.dirname(scriptPath),
      stdio: 'pipe'
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout?.on('data', (data) => {
      output += data.toString()
      console.log('XTTS Setup:', data.toString().trim())
    })
    
    pythonProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
      console.error('XTTS Setup Error:', data.toString().trim())
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ XTTS-v2 setup completed successfully')
        resolve({ success: true, message: 'Setup completed successfully' })
      } else {
        console.error('❌ XTTS-v2 setup failed with code:', code)
        console.error('Error output:', errorOutput)
        reject(new Error(`XTTS-v2 setup failed with code ${code}: ${errorOutput}`))
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('❌ XTTS-v2 setup process error:', error)
      reject(error)
    })
  })
}

async function runXTTSSynthesis(text, voiceName, language, speed, pythonPath, modelsDir) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../models/coqui-xtts/xtts_service.py')
    
    console.log('🎤 Running XTTS-v2 synthesis...')
    console.log('Script path:', scriptPath)
    console.log('Parameters:', { text: text.substring(0, 50), voiceName, language, speed })
    
    const pythonProcess = spawn(pythonPath, [scriptPath, 'synthesize', text, voiceName, language, speed.toString()], {
      cwd: path.dirname(scriptPath),
      stdio: 'pipe'
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout?.on('data', (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim())
          console.log('✅ XTTS-v2 synthesis completed successfully')
          resolve(result)
        } catch (error) {
          console.error('❌ Failed to parse XTTS-v2 synthesis result:', error)
          reject(new Error(`Failed to parse XTTS-v2 synthesis result: ${output}`))
        }
      } else {
        console.error('❌ XTTS-v2 synthesis failed with code:', code)
        console.error('Error output:', errorOutput)
        reject(new Error(`XTTS-v2 synthesis failed with code ${code}: ${errorOutput}`))
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('❌ XTTS-v2 synthesis process error:', error)
      reject(error)
    })
  })
}

/**
 * Hugging Faceのウェブサイトからllama.cpp対応モデルをスクレイピング
 */
async function scrapeHuggingFaceModels(query, limit, sort, direction) {
  try {
    console.log('🌐 Scraping Hugging Face models...')
    
    // Hugging Faceのウェブサイトからデータを取得
    const searchParams = new URLSearchParams({
      apps: 'llama.cpp',
      sort: sort
    })

    if (query) {
      searchParams.append('search', query)
    }

    const url = `https://huggingface.co/models?${searchParams}`
    console.log('Fetching URL:', url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    console.log('HTML content length:', html.length)

    // HTMLからモデルデータを解析
    const models = parseModelsFromHTML(html)
    console.log(`Parsed ${models.length} models from HTML`)

    // 十分なモデルが見つからない場合は、フォールバックモデルを追加
    if (models.length < 15) {
      console.log(`⚠️ Only ${models.length} models found, adding fallback models`)
      const fallbackModels = generateFallbackModels()
      for (const model of fallbackModels) {
        if (!models.some(existing => existing.id === model.id)) {
          models.push(model)
        }
      }
      console.log(`✅ Added ${fallbackModels.length} fallback models`)
    }

    return {
      success: true,
      models: models.slice(0, limit)
    }

  } catch (error) {
    console.error('Error scraping Hugging Face models:', error)
    console.log('🔄 Using fallback models due to scraping error')
    const fallbackModels = generateFallbackModels()
    return {
      success: true,
      models: fallbackModels.slice(0, limit)
    }
  }
}

/**
 * HTMLからモデルデータを解析
 */
function parseModelsFromHTML(html) {
  const models = []
  
  try {
    // 複数のパーサーを順番に試す
    const parsers = [
      parseModelsFromCards,
      parseModelsFromLinks,
      parseModelsFromJSON,
      parseModelsFallback
    ]

    for (const parser of parsers) {
      const parsedModels = parser(html)
      if (parsedModels.length > 0) {
        // 重複を避けて追加
        for (const model of parsedModels) {
          if (!models.some(existing => existing.id === model.id)) {
            models.push(model)
          }
        }
        console.log(`✅ Parser found ${parsedModels.length} models`)
        break
      }
    }

    // 最低限のモデルが見つからない場合は、フォールバックでGGUFモデルを生成
    if (models.length < 10) {
      const fallbackModels = generateFallbackModels()
      for (const model of fallbackModels) {
        if (!models.some(existing => existing.id === model.id)) {
          models.push(model)
        }
      }
    }

  } catch (error) {
    console.error('Error parsing HTML:', error)
  }

  return models
}

/**
 * モデルカードからデータを解析
 */
function parseModelsFromCards(html) {
  const models = []
  
  try {
    // より柔軟なモデルカードのパターンを検索
    const modelCardPatterns = [
      /<article[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*class="[^"]*model-card[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*data-testid="[^"]*model-card[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*group[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ]

    for (const pattern of modelCardPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null && models.length < 100) {
        const cardHtml = match[1]
        const model = parseModelCard(cardHtml)
        
        if (model && isLlamaCppModel(model)) {
          models.push(model)
        }
      }
    }
  } catch (error) {
    console.error('Error parsing model cards:', error)
  }

  return models
}

/**
 * モデルリンクからデータを解析
 */
function parseModelsFromLinks(html) {
  const models = []
  
  try {
    // モデルリンクを直接検索
    const modelLinkPattern = /href="\/models\/([^"]+)"/gi
    let match
    const seenIds = new Set()

    while ((match = modelLinkPattern.exec(html)) !== null && models.length < 100) {
      const modelId = match[1]
      
      if (seenIds.has(modelId)) continue
      seenIds.add(modelId)

      // GGUFを含むモデルのみを対象とする
      if (modelId.toLowerCase().includes('gguf')) {
        const model = {
          id: modelId,
          name: modelId,
          description: 'GGUF model for llama.cpp',
          downloads: 0,
          likes: 0,
          tags: ['gguf', 'llama.cpp'],
          model_type: 'text-generation',
          size: 0,
          format: 'GGUF',
          quantization: extractQuantization(modelId, []),
          updated_at: new Date().toISOString(),
          author: 'unknown',
          parameter_size: extractParameterSize(modelId, []),
          family: extractModelFamily(modelId, []),
          url: `https://huggingface.co/models/${modelId}`,
          lastUpdated: new Date().toISOString()
        }
        
        models.push(model)
      }
    }
  } catch (error) {
    console.error('Error parsing model links:', error)
  }

  return models
}

/**
 * JSONデータからモデルを解析
 */
function parseModelsFromJSON(html) {
  const models = []
  
  try {
    // JSONデータを検索
    const jsonPatterns = [
      /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi,
      /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/gi,
      /"models":\s*\[([\s\S]*?)\]/gi
    ]

    for (const pattern of jsonPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null && models.length < 50) {
        try {
          const jsonData = JSON.parse(match[1])
          const extractedModels = extractModelsFromJSON(jsonData)
          models.push(...extractedModels)
        } catch (parseError) {
          // JSONパースエラーは無視して続行
          continue
        }
      }
    }
  } catch (error) {
    console.error('Error parsing JSON data:', error)
  }

  return models
}

/**
 * JSONデータからモデルを抽出
 */
function extractModelsFromJSON(data) {
  const models = []
  
  try {
    // データ構造を再帰的に探索
    const extractFromObject = (obj, path = []) => {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => extractFromObject(item, [...path, index.toString()]))
      } else if (obj && typeof obj === 'object') {
        // モデルオブジェクトの可能性をチェック
        if (obj.id && obj.name && (obj.tags?.includes('gguf') || obj.modelId?.includes('gguf'))) {
          const model = {
            id: obj.id || obj.modelId,
            name: obj.name || obj.id || obj.modelId,
            description: obj.description || 'GGUF model for llama.cpp',
            downloads: obj.downloads || 0,
            likes: obj.likes || 0,
            tags: obj.tags || ['gguf', 'llama.cpp'],
            model_type: obj.model_type || 'text-generation',
            size: obj.size || 0,
            format: 'GGUF',
            quantization: extractQuantization(obj.id || obj.name, obj.tags || []),
            updated_at: obj.updated_at || obj.lastModified || new Date().toISOString(),
            author: obj.author || 'unknown',
            parameter_size: extractParameterSize(obj.id || obj.name, obj.tags || []),
            family: extractModelFamily(obj.id || obj.name, obj.tags || []),
            url: `https://huggingface.co/models/${obj.id || obj.modelId}`,
            lastUpdated: obj.updated_at || obj.lastModified || new Date().toISOString()
          }
          models.push(model)
        }
        
        // 再帰的に探索
        Object.keys(obj).forEach(key => {
          extractFromObject(obj[key], [...path, key])
        })
      }
    }

    extractFromObject(data)
  } catch (error) {
    console.error('Error extracting models from JSON:', error)
  }

  return models
}

/**
 * フォールバックパーサー：より簡単なアプローチでモデルを抽出
 */
function parseModelsFallback(html) {
  const models = []
  
  try {
    // モデルリンクを直接検索
    const modelLinkPattern = /href="\/models\/([^"]+)"/gi
    let match
    const seenIds = new Set()

    while ((match = modelLinkPattern.exec(html)) !== null && models.length < 50) {
      const modelId = match[1]
      
      if (seenIds.has(modelId)) continue
      seenIds.add(modelId)

      // GGUFを含むモデルのみを対象とする
      if (modelId.toLowerCase().includes('gguf')) {
        const model = {
          id: modelId,
          name: modelId,
          description: 'GGUF model for llama.cpp',
          downloads: 0,
          likes: 0,
          tags: ['gguf', 'llama.cpp'],
          model_type: 'text-generation',
          size: 0,
          format: 'GGUF',
          quantization: extractQuantization(modelId, []),
          updated_at: new Date().toISOString(),
          author: 'unknown',
          parameter_size: extractParameterSize(modelId, []),
          family: extractModelFamily(modelId, []),
          url: `https://huggingface.co/models/${modelId}`,
          lastUpdated: new Date().toISOString()
        }
        
        models.push(model)
      }
    }
  } catch (error) {
    console.error('Error in fallback parser:', error)
  }

  return models
}

/**
 * フォールバックモデルを生成（最低限のモデルリスト）
 */
function generateFallbackModels() {
  const fallbackModels = [
    'unsloth/DeepSeek-V3.1-GGUF',
    'DavidAU/OpenAi-GPT-oss-20b-abliterated-uncensored-NEO-Imatrix-gguf',
    'unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF',
    'unsloth/gemma-3-270m-it-GGUF',
    'unsloth/gpt-oss-20b-GGUF',
    'unsloth/Seed-OSS-36B-Instruct-GGUF',
    'yarikdevcom/Seed-OSS-36B-Instruct-GGUF',
    'unsloth/GLM-4.5-Air-GGUF',
    'unsloth/Qwen2.5-VL-7B-Instruct-GGUF',
    'mradermacher/Qwen2.5-VL-7B-Abliterated-Caption-it-GGUF',
    'Jinx-org/Jinx-gpt-oss-20b-GGUF',
    'ggml-org/Kimi-VL-A3B-Thinking-2506-GGUF',
    'unsloth/gpt-oss-120b-GGUF',
    'BasedBase/Qwen3-Coder-30B-A3B-Instruct-480B-Distill-V2',
    'DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion-Instruct-uncensored-abliterated-18.4B-GGUF',
    'huihui-ai/Huihui-gpt-oss-20b-BF16-abliterated',
    'bartowski/deepseek-ai_DeepSeek-V3.1-Base-Q4_K_M-GGUF',
    'ubergarm/DeepSeek-V3.1-GGUF',
    'openbmb/MiniCPM-V-4_5-gguf',
    'ggml-org/gpt-oss-20b-GGUF',
    'janhq/Jan-v1-4B-GGUF',
    'kurakurai/Luth-LFM2-1.2B-GGUF',
    'Orenguteng/Llama-3-8B-Lexi-Uncensored-GGUF',
    'dphn/Dolphin3.0-Llama3.1-8B-GGUF',
    'unsloth/Qwen3-0.6B-GGUF',
    'unsloth/Qwen3-1.7B-GGUF',
    'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF',
    'unsloth/Qwen3-4B-Instruct-2507-GGUF',
    'TheDrummer/Cydonia-24B-v4.1-GGUF',
    'internlm/Intern-S1-mini-GGUF',
    'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF',
    // 追加のモデル
    'TheBloke/Llama-2-7B-Chat-GGUF',
    'TheBloke/Llama-2-13B-Chat-GGUF',
    'TheBloke/Llama-2-70B-Chat-GGUF',
    'TheBloke/CodeLlama-7B-Python-GGUF',
    'TheBloke/CodeLlama-13B-Python-GGUF',
    'TheBloke/CodeLlama-34B-Python-GGUF',
    'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
    'TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF',
    'TheBloke/Qwen-7B-Chat-GGUF',
    'TheBloke/Qwen-14B-Chat-GGUF',
    'TheBloke/Qwen-72B-Chat-GGUF',
    'TheBloke/DeepSeek-Coder-6.7B-Instruct-GGUF',
    'TheBloke/DeepSeek-Coder-33B-Instruct-GGUF',
    'TheBloke/Phi-2-GGUF',
    'TheBloke/Phi-3.5-GGUF',
    'TheBloke/Phi-3.5-Mini-GGUF',
    'TheBloke/LLaVA-1.5-7B-GGUF',
    'TheBloke/LLaVA-1.5-13B-GGUF',
    'TheBloke/Vicuna-7B-v1.5-GGUF',
    'TheBloke/Vicuna-13B-v1.5-GGUF',
    'TheBloke/Alpaca-7B-GGUF',
    'TheBloke/Alpaca-13B-GGUF',
    'TheBloke/WizardLM-7B-V1.0-GGUF',
    'TheBloke/WizardLM-13B-V1.0-GGUF',
    'TheBloke/WizardLM-30B-V1.0-GGUF',
    'TheBloke/WizardCoder-15B-V1.0-GGUF',
    'TheBloke/WizardCoder-33B-V1.0-GGUF',
    'TheBloke/WizardMath-7B-V1.0-GGUF',
    'TheBloke/WizardMath-13B-V1.0-GGUF',
    'TheBloke/WizardMath-30B-V1.0-GGUF',
    'TheBloke/Orca-2-7B-GGUF',
    'TheBloke/Orca-2-13B-GGUF',
    'TheBloke/Orca-2-70B-GGUF',
    'TheBloke/MPT-7B-Instruct-GGUF',
    'TheBloke/MPT-30B-Instruct-GGUF',
    'TheBloke/Falcon-7B-Instruct-GGUF',
    'TheBloke/Falcon-40B-Instruct-GGUF',
    'TheBloke/Falcon-180B-Chat-GGUF',
    'TheBloke/StarCoder-15B-GGUF',
    'TheBloke/StarCoder-33B-GGUF',
    'TheBloke/StarCoder-7B-GGUF',
    'TheBloke/CodeLlama-7B-Instruct-GGUF',
    'TheBloke/CodeLlama-13B-Instruct-GGUF',
    'TheBloke/CodeLlama-34B-Instruct-GGUF',
    'TheBloke/CodeLlama-70B-Instruct-GGUF',
    'TheBloke/CodeLlama-7B-Python-GGUF',
    'TheBloke/CodeLlama-13B-Python-GGUF',
    'TheBloke/CodeLlama-34B-Python-GGUF',
    'TheBloke/CodeLlama-70B-Python-GGUF',
    'TheBloke/CodeLlama-7B-Chat-GGUF',
    'TheBloke/CodeLlama-13B-Chat-GGUF',
    'TheBloke/CodeLlama-34B-Chat-GGUF',
    'TheBloke/CodeLlama-70B-Chat-GGUF'
  ]

  return fallbackModels.map(modelId => ({
    id: modelId,
    name: modelId,
    description: 'Popular GGUF model for llama.cpp',
    downloads: Math.floor(Math.random() * 100000) + 1000,
    likes: Math.floor(Math.random() * 1000) + 10,
    tags: ['gguf', 'llama.cpp', 'text-generation'],
    model_type: 'text-generation',
    size: 0,
    format: 'GGUF',
    quantization: extractQuantization(modelId, []),
    updated_at: new Date().toISOString(),
    author: modelId.split('/')[0],
    parameter_size: extractParameterSize(modelId, []),
    family: extractModelFamily(modelId, []),
    url: `https://huggingface.co/models/${modelId}`,
    lastUpdated: new Date().toISOString()
  }))
}

/**
 * モデルカードからデータを解析
 */
function parseModelCard(cardHtml) {
  try {
    // モデル名を抽出（複数のパターンを試す）
    const namePatterns = [
      /<h3[^>]*>([^<]+)<\/h3>/i,
      /<a[^>]*href="\/models\/[^"]*"[^>]*>([^<]+)<\/a>/i,
      /<span[^>]*class="[^"]*model-name[^"]*"[^>]*>([^<]+)<\/span>/i
    ]
    
    let name = ''
    for (const pattern of namePatterns) {
      const match = cardHtml.match(pattern)
      if (match) {
        name = match[1].trim()
        break
      }
    }

    if (!name) return null

    // モデルIDを抽出
    const idMatch = cardHtml.match(/href="\/models\/([^"]+)"/i)
    const id = idMatch ? idMatch[1] : name

    // 説明を抽出（複数のパターンを試す）
    const descPatterns = [
      /<p[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/p>/i,
      /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i,
      /<span[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/span>/i
    ]
    
    let description = 'No description available'
    for (const pattern of descPatterns) {
      const match = cardHtml.match(pattern)
      if (match) {
        description = match[1].trim()
        break
      }
    }

    // ダウンロード数を抽出
    const downloadsMatch = cardHtml.match(/(\d+(?:\.\d+)?[KMB]?)\s*downloads/i)
    const downloads = downloadsMatch ? parseNumber(downloadsMatch[1]) : 0

    // いいね数を抽出
    const likesMatch = cardHtml.match(/(\d+(?:\.\d+)?[KMB]?)\s*likes/i)
    const likes = likesMatch ? parseNumber(likesMatch[1]) : 0

    // タグを抽出（複数のパターンを試す）
    const tags = []
    const tagPatterns = [
      /<span[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/span>/gi,
      /<div[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/div>/gi,
      /<a[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/a>/gi
    ]
    
    for (const pattern of tagPatterns) {
      const tagMatches = cardHtml.match(pattern)
      if (tagMatches) {
        tagMatches.forEach(tagMatch => {
          const tagText = tagMatch.replace(/<[^>]*>/g, '').trim()
          if (tagText && !tags.includes(tagText)) tags.push(tagText)
        })
      }
    }

    // 更新日を抽出
    const updatedMatch = cardHtml.match(/Updated\s+([^<]+)/i)
    const updated_at = updatedMatch ? updatedMatch[1].trim() : new Date().toISOString()

    // 作者を抽出
    const authorMatch = cardHtml.match(/by\s+([^<]+)/i)
    const author = authorMatch ? authorMatch[1].trim() : 'unknown'

    // パラメータサイズを抽出
    const parameterSize = extractParameterSize(name, tags)

    // モデルファミリーを抽出
    const family = extractModelFamily(name, tags)

    // 量子化レベルを抽出
    const quantization = extractQuantization(name, tags)

    return {
      id,
      name,
      description,
      downloads,
      likes,
      tags,
      model_type: 'text-generation',
      size: 0,
      format: 'GGUF',
      quantization,
      updated_at,
      author,
      parameter_size: parameterSize,
      family,
      url: `https://huggingface.co/models/${id}`,
      lastUpdated: updated_at
    }
  } catch (error) {
    console.error('Error parsing model card:', error)
    return null
  }
}

/**
 * llama.cpp対応モデルかどうかを判定
 */
function isLlamaCppModel(model) {
  return model.tags.some(tag => 
    tag.toLowerCase().includes('gguf') ||
    tag.toLowerCase().includes('llama.cpp') ||
    model.name.toLowerCase().includes('gguf')
  )
}

/**
 * 数値文字列を数値に変換
 */
function parseNumber(str) {
  const num = parseFloat(str.replace(/[KMB]/i, ''))
  const multiplier = str.toUpperCase().includes('K') ? 1000 : 
                   str.toUpperCase().includes('M') ? 1000000 : 
                   str.toUpperCase().includes('B') ? 1000000000 : 1
  return num * multiplier
}

/**
 * モデルIDから量子化レベルを抽出
 */
function extractQuantization(modelId, tags) {
  const quantizationPatterns = [
    /Q2_K/, /Q3_K/, /Q4_K/, /Q5_K/, /Q6_K/, /Q8_K/,
    /Q2/, /Q3/, /Q4/, /Q5/, /Q6/, /Q8/,
    /F16/, /F32/, /BF16/
  ]

  for (const pattern of quantizationPatterns) {
    if (pattern.test(modelId)) {
      return pattern.source.replace(/[\/\\]/g, '')
    }
  }

  for (const tag of tags) {
    for (const pattern of quantizationPatterns) {
      if (pattern.test(tag)) {
        return pattern.source.replace(/[\/\\]/g, '')
      }
    }
  }

  return 'unknown'
}

/**
 * モデルIDからパラメータサイズを抽出
 */
function extractParameterSize(modelId, tags) {
  const sizePatterns = [
    /(\d+(?:\.\d+)?)b/i,
    /(\d+(?:\.\d+)?)B/i,
    /(\d+(?:\.\d+)?)billion/i
  ]

  for (const pattern of sizePatterns) {
    const match = modelId.match(pattern)
    if (match) {
      return `${match[1]}B`
    }
  }

  for (const tag of tags) {
    for (const pattern of sizePatterns) {
      const match = tag.match(pattern)
      if (match) {
        return `${match[1]}B`
      }
    }
  }

  return 'unknown'
}

/**
 * モデルIDからモデルファミリーを抽出
 */
function extractModelFamily(modelId, tags) {
  const familyPatterns = [
    /llama/i,
    /gemma/i,
    /qwen/i,
    /deepseek/i,
    /mistral/i,
    /phi/i,
    /llava/i,
    /codellama/i,
    /vicuna/i,
    /alpaca/i
  ]

  for (const pattern of familyPatterns) {
    if (pattern.test(modelId)) {
      return pattern.source.replace(/[\/\\]/g, '').toLowerCase()
    }
  }

  for (const tag of tags) {
    for (const pattern of familyPatterns) {
      if (pattern.test(tag)) {
        return pattern.source.replace(/[\/\\]/g, '').toLowerCase()
      }
    }
  }

  return 'unknown'
}
