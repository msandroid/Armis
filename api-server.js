import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// whisper.cppモデル定義（JavaScript版）
const WHISPER_MODELS = [
  // Tiny Models (軽量)
  {
    id: 'tiny',
    name: 'Tiny',
    size: '77.7MB',
    description: '多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    category: 'tiny',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'tiny.en',
    name: 'Tiny EN',
    size: '77.7MB',
    description: '英語専用、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
    category: 'tiny',
    language: 'english-only',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'tiny-q5_1',
    name: 'Tiny Q5_1',
    size: '32.2MB',
    description: '多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin',
    category: 'tiny',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: true
  },
  {
    id: 'tiny.en-q5_1',
    name: 'Tiny EN Q5_1',
    size: '32.2MB',
    description: '英語専用、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q5_1.bin',
    category: 'tiny',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'tiny-q8_0',
    name: 'Tiny Q8_0',
    size: '43.5MB',
    description: '多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q8_0.bin',
    category: 'tiny',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'tiny.en-q8_0',
    name: 'Tiny EN Q8_0',
    size: '43.6MB',
    description: '英語専用、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q8_0.bin',
    category: 'tiny',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false
  },

  // Base Models (標準)
  {
    id: 'base',
    name: 'Base',
    size: '148MB',
    description: '多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    category: 'base',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'base.en',
    name: 'Base EN',
    size: '148MB',
    description: '英語専用、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
    category: 'base',
    language: 'english-only',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'base-q5_1',
    name: 'Base Q5_1',
    size: '59.7MB',
    description: '多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin',
    category: 'base',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'base.en-q5_1',
    name: 'Base EN Q5_1',
    size: '59.7MB',
    description: '英語専用、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q5_1.bin',
    category: 'base',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'base-q8_0',
    name: 'Base Q8_0',
    size: '81.8MB',
    description: '多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q8_0.bin',
    category: 'base',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'base.en-q8_0',
    name: 'Base EN Q8_0',
    size: '81.8MB',
    description: '英語専用、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q8_0.bin',
    category: 'base',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false
  },

  // Small Models (中規模)
  {
    id: 'small',
    name: 'Small',
    size: '488MB',
    description: '多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    category: 'small',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'small.en',
    name: 'Small EN',
    size: '488MB',
    description: '英語専用、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
    category: 'small',
    language: 'english-only',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'small-q5_1',
    name: 'Small Q5_1',
    size: '190MB',
    description: '多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin',
    category: 'small',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'small.en-q5_1',
    name: 'Small EN Q5_1',
    size: '190MB',
    description: '英語専用、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q5_1.bin',
    category: 'small',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'small-q8_0',
    name: 'Small Q8_0',
    size: '264MB',
    description: '多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q8_0.bin',
    category: 'small',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'small.en-q8_0',
    name: 'Small EN Q8_0',
    size: '264MB',
    description: '英語専用、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q8_0.bin',
    category: 'small',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false
  },

  // Medium Models (大規模)
  {
    id: 'medium',
    name: 'Medium',
    size: '1.53GB',
    description: '多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    category: 'medium',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'medium.en',
    name: 'Medium EN',
    size: '1.53GB',
    description: '英語専用、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin',
    category: 'medium',
    language: 'english-only',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'medium-q5_0',
    name: 'Medium Q5_0',
    size: '539MB',
    description: '多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin',
    category: 'medium',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'medium.en-q5_0',
    name: 'Medium EN Q5_0',
    size: '539MB',
    description: '英語専用、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en-q5_0.bin',
    category: 'medium',
    language: 'english-only',
    quantization: 'q5_0',
    recommended: false
  },

  // Large Models (最大規模)
  {
    id: 'large-v3-turbo-q5_0',
    name: 'Large V3 Turbo Q5_0',
    size: '574MB',
    description: '最新技術、多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'large-v3-turbo-q8_0',
    name: 'Large V3 Turbo Q8_0',
    size: '874MB',
    description: '最新技術、多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q8_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'large-v3-turbo',
    name: 'Large V3 Turbo',
    size: '1.62GB',
    description: '最新技術、多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'large-v3-q5_0',
    name: 'Large V3 Q5_0',
    size: '1.08GB',
    description: '多言語対応、v3版、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-q5_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'large-v3',
    name: 'Large V3',
    size: '3.1GB',
    description: '多言語対応、v3版、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'large-v2-q5_0',
    name: 'Large V2 Q5_0',
    size: '1.08GB',
    description: '多言語対応、v2版、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q5_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'large-v2-q8_0',
    name: 'Large V2 Q8_0',
    size: '1.66GB',
    description: '多言語対応、v2版、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q8_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'large-v2',
    name: 'Large V2',
    size: '3.09GB',
    description: '多言語対応、v2版、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'large-v1',
    name: 'Large V1',
    size: '3.09GB',
    description: '多言語対応、v1版、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v1.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  }
]

function getWhisperModelById(id) {
  return WHISPER_MODELS.find(m => m.id === id)
}

const app = express()
const PORT = 3002

// CORS設定
app.use(cors())
app.use(express.json())

// whisper.cppモデルダウンロードAPI
app.post('/api/download-whisper-model', async (req, res) => {
  try {
    const { modelId } = req.body

    if (!modelId) {
      return res.status(400).json({ error: 'Model ID is required' })
    }

    // モデル情報を取得
    const model = getWhisperModelById(modelId)
    if (!model) {
      return res.status(404).json({ error: `Model ${modelId} not found` })
    }

    console.log(`Starting download for model: ${modelId}`)
    console.log(`Model URL: ${model.url}`)

    // 実際のダウンロード処理
    const downloadResult = await downloadWhisperModel(modelId, model.url)

    if (downloadResult.success) {
      return res.status(200).json({
        success: true,
        message: `Model ${modelId} downloaded successfully`,
        modelId,
        size: model.size
      })
    } else {
      return res.status(500).json({
        success: false,
        error: downloadResult.error
      })
    }

  } catch (error) {
    console.error('Error in download-whisper-model API:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

async function downloadWhisperModel(modelId, url) {
  try {
    // ダウンロードディレクトリを作成
    const downloadDir = path.join(__dirname, 'public', 'whisper', 'models')
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true })
    }

    const filepath = path.join(downloadDir, `ggml-${modelId}.bin`)

    // ファイルが既に存在するかチェック
    if (fs.existsSync(filepath)) {
      console.log(`Model ${modelId} already exists at ${filepath}`)
      return { success: true }
    }

    console.log(`Downloading ${modelId} from ${url}`)
    console.log(`Saving to: ${filepath}`)

    // ダウンロード実行
    await downloadFile(url, filepath)

    // シンボリックリンクを作成
    const symlinkPath = path.join(downloadDir, 'whisper.bin')
    if (fs.existsSync(symlinkPath)) {
      fs.unlinkSync(symlinkPath)
    }
    fs.symlinkSync(`ggml-${modelId}.bin`, symlinkPath)

    console.log(`Model ${modelId} downloaded successfully`)
    return { success: true }

  } catch (error) {
    console.error(`Error downloading model ${modelId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    }
  }
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    
    https.get(url, (response) => {
      // リダイレクトに対応
      if (response.statusCode === 301 || response.statusCode === 302) {
        const newUrl = response.headers.location
        console.log(`Redirecting to: ${newUrl}`)
        file.close()
        fs.unlink(filepath, () => {}) // ファイルを削除
        downloadFile(newUrl, filepath).then(resolve).catch(reject)
        return
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10)
      let downloadedBytes = 0

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length
        if (totalBytes > 0) {
          const progress = (downloadedBytes / totalBytes) * 100
          console.log(`Download progress: ${progress.toFixed(1)}% (${downloadedBytes}/${totalBytes} bytes)`)
        }
      })

      response.pipe(file)

      file.on('finish', () => {
        file.close()
        console.log(`Download completed: ${filepath}`)
        resolve()
      })

      file.on('error', (err) => {
        fs.unlink(filepath, () => {}) // エラー時にファイルを削除
        reject(err)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
