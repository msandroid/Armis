import { 
  LlamaCppBackendService,
  createLlamaCppBackendService
} from '../services/tts'

/**
 * llama.cppバックエンド統合の使用例
 * 
 * この例では、ElectronやNode.jsサーバーでの使用を想定した
 * llama.cpp本文抽出機能の統合デモンストレーションを行います。
 */

// サンプルテキスト
const sampleTexts = [
  {
    name: 'ヴァイキングの説明文',
    text: `ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。上記の文章を音声にしてください。`
  },
  {
    name: 'シンプルなTTS要求',
    text: 'こんにちは、世界。この文章を音声にしてください。'
  },
  {
    name: '指示文なしのテキスト',
    text: 'これは単純なテキストです。特に指示はありません。'
  }
]

/**
 * バックエンドサービスの基本使用例
 */
export async function demonstrateBackendService(modelPath: string) {
  console.log('=== LlamaCpp Backend Service Demo ===')
  
  try {
    // バックエンドサービスを作成
    const backendService = createLlamaCppBackendService({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      verbose: true,
      maxIterations: 3
    })

    // 初期化
    await backendService.initialize()
    console.log('✅ Backend service initialized')

    // サービス状態を確認
    const status = backendService.getStatus()
    console.log('\n📊 Service Status:')
    console.log('Initialized:', status.isInitialized)
    console.log('Model Path:', status.modelInfo?.modelPath)
    console.log('Model Initialized:', status.modelInfo?.isInitialized)
    console.log('Services:', status.services)

    // 基本的な本文抽出
    console.log('\n📝 Basic Text Extraction:')
    const extractionResult = await backendService.extractText({
      text: sampleTexts[0].text,
      useAgent: false,
      batchMode: false
    })

    if (extractionResult.success) {
      console.log('✅ Extraction successful:')
      console.log('Main Text:', extractionResult.data.mainText.substring(0, 100) + '...')
      console.log('Confidence:', extractionResult.data.confidence)
      console.log('Execution Time:', extractionResult.executionTime, 'ms')
    } else {
      console.error('❌ Extraction failed:', extractionResult.error)
    }

    // Agentを使用した処理
    console.log('\n🤖 Agent-based Processing:')
    const agentResult = await backendService.extractText({
      text: sampleTexts[1].text,
      useAgent: true,
      batchMode: false
    })

    if (agentResult.success) {
      console.log('✅ Agent processing successful:')
      console.log('Extracted Text:', agentResult.data.extractedText)
      console.log('Confidence:', agentResult.data.confidence)
      console.log('Execution Time:', agentResult.executionTime, 'ms')
    } else {
      console.error('❌ Agent processing failed:', agentResult.error)
    }

    // TTSリクエスト分析
    console.log('\n🎵 TTS Request Analysis:')
    const ttsAnalysisResult = await backendService.analyzeTTSRequest(sampleTexts[0].text)

    if (ttsAnalysisResult.success) {
      console.log('✅ TTS analysis successful:')
      console.log('Is TTS Request:', ttsAnalysisResult.data.isTTSRequest)
      console.log('TTS Text:', ttsAnalysisResult.data.ttsText?.substring(0, 100) + '...')
      console.log('Confidence:', ttsAnalysisResult.data.confidence)
      console.log('Execution Time:', ttsAnalysisResult.executionTime, 'ms')
    } else {
      console.error('❌ TTS analysis failed:', ttsAnalysisResult.error)
    }

    // バッチ処理
    console.log('\n📦 Batch Processing:')
    const batchTexts = sampleTexts.map(item => item.text)
    const batchResult = await backendService.extractBatch(batchTexts)

    if (batchResult.success) {
      console.log('✅ Batch processing successful:')
      console.log('Results count:', batchResult.data.length)
      batchResult.data.forEach((result, index) => {
        console.log(`  ${index + 1}. ${sampleTexts[index].name}: ${result.confidence} confidence`)
      })
      console.log('Execution Time:', batchResult.executionTime, 'ms')
    } else {
      console.error('❌ Batch processing failed:', batchResult.error)
    }

    // クリーンアップ
    await backendService.cleanup()
    console.log('\n✅ Backend service cleaned up')

    return {
      extractionResult,
      agentResult,
      ttsAnalysisResult,
      batchResult
    }

  } catch (error) {
    console.error('❌ Backend service demo failed:', error)
    throw error
  }
}

/**
 * Electron統合の例
 */
export async function demonstrateElectronIntegration(modelPath: string) {
  console.log('\n=== Electron Integration Demo ===')
  
  try {
    const backendService = createLlamaCppBackendService({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      verbose: false
    })

    await backendService.initialize()

    // Electron IPCハンドラーの例
    const ipcHandlers = {
      // 本文抽出のIPCハンドラー
      'extract-text': async (event: any, request: any) => {
        try {
          const result = await backendService.extractText(request)
          return result
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: 0
          }
        }
      },

      // TTS分析のIPCハンドラー
      'analyze-tts': async (event: any, text: string) => {
        try {
          const result = await backendService.analyzeTTSRequest(text)
          return result
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: 0
          }
        }
      },

      // バッチ処理のIPCハンドラー
      'extract-batch': async (event: any, texts: string[]) => {
        try {
          const result = await backendService.extractBatch(texts)
          return result
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: 0
          }
        }
      },

      // サービス状態取得のIPCハンドラー
      'get-status': () => {
        return backendService.getStatus()
      }
    }

    console.log('✅ Electron IPC handlers configured')
    console.log('Available handlers:', Object.keys(ipcHandlers))

    // 使用例
    const testResult = await ipcHandlers['extract-text'](null, {
      text: sampleTexts[0].text,
      useAgent: false,
      batchMode: false
    })

    console.log('Test IPC call result:', testResult.success ? 'Success' : 'Failed')

    await backendService.cleanup()
    console.log('✅ Electron integration demo completed')

    return ipcHandlers

  } catch (error) {
    console.error('❌ Electron integration demo failed:', error)
    throw error
  }
}

/**
 * Node.jsサーバー統合の例
 */
export async function demonstrateServerIntegration(modelPath: string) {
  console.log('\n=== Node.js Server Integration Demo ===')
  
  try {
    const backendService = createLlamaCppBackendService({
      modelPath: modelPath,
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      verbose: false
    })

    await backendService.initialize()

    // Express.jsルートハンドラーの例
    const expressRoutes = {
      // 本文抽出のPOSTエンドポイント
      'POST /api/extract-text': async (req: any, res: any) => {
        try {
          const { text, useAgent, batchMode } = req.body
          const result = await backendService.extractText({ text, useAgent, batchMode })
          res.json(result)
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: 0
          })
        }
      },

      // TTS分析のPOSTエンドポイント
      'POST /api/analyze-tts': async (req: any, res: any) => {
        try {
          const { text } = req.body
          const result = await backendService.analyzeTTSRequest(text)
          res.json(result)
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: 0
          })
        }
      },

      // バッチ処理のPOSTエンドポイント
      'POST /api/extract-batch': async (req: any, res: any) => {
        try {
          const { texts } = req.body
          const result = await backendService.extractBatch(texts)
          res.json(result)
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: 0
          })
        }
      },

      // サービス状態取得のGETエンドポイント
      'GET /api/status': (req: any, res: any) => {
        res.json(backendService.getStatus())
      }
    }

    console.log('✅ Express.js routes configured')
    console.log('Available routes:', Object.keys(expressRoutes))

    await backendService.cleanup()
    console.log('✅ Server integration demo completed')

    return expressRoutes

  } catch (error) {
    console.error('❌ Server integration demo failed:', error)
    throw error
  }
}

/**
 * 統合デモ
 */
export async function runLlamaCppBackendDemo(modelPath: string) {
  console.log('🚀 Starting LlamaCpp Backend Integration Demo...\n')
  
  try {
    // 1. 基本的なバックエンドサービスデモ
    await demonstrateBackendService(modelPath)
    
    // 2. Electron統合デモ
    await demonstrateElectronIntegration(modelPath)
    
    // 3. Node.jsサーバー統合デモ
    await demonstrateServerIntegration(modelPath)
    
    console.log('\n✅ All backend integration demos completed successfully!')
    
  } catch (error) {
    console.error('❌ Backend integration demo failed:', error)
    throw error
  }
}

// 使用例（コメントアウト）
/*
// モデルパスを設定してデモを実行
const modelPath = './models/llama-2-7b-chat.gguf'
runLlamaCppBackendDemo(modelPath).catch(console.error)
*/
