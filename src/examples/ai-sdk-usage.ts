/**
 * AI SDK Usage Examples
 * 
 * このファイルは、ArmisでAI SDKを使用する実際の例を示しています。
 */

import { AISDKService } from '@/services/llm/ai-sdk-service'
import { AIProviderConfig } from '@/types/ai-sdk'

// AI SDKサービスの初期化
const aiService = new AISDKService()

/**
 * OpenAI GPT-5の設定例
 */
export const openaiConfig: AIProviderConfig = {
  providerId: 'openai',
  modelId: 'gpt-5',
  apiKey: 'your-openai-api-key',
  temperature: 0.7,
  maxTokens: 1000
}

/**
 * Anthropic Claude Opus 4の設定例
 */
export const anthropicConfig: AIProviderConfig = {
  providerId: 'anthropic',
  modelId: 'claude-opus-4-latest',
  apiKey: 'your-anthropic-api-key',
  temperature: 0.7,
  maxTokens: 1000
}

/**
 * Google Gemini 2.0 Flash Expの設定例（最新のGeminiモデル）
 */
export const googleConfig: AIProviderConfig = {
  providerId: 'google',
  modelId: 'gemini-2.0-flash-exp',
  apiKey: 'AIzaSyA6ZFPqGaYWZEGq2CbfBt7tADn3tJwChhA',
  temperature: 0.7,
  maxTokens: 1000
}

/**
 * Google Gemini 1.5 Flashの設定例（高速・軽量）
 */
export const geminiFlashConfig: AIProviderConfig = {
  providerId: 'google',
  modelId: 'gemini-1.5-flash',
  apiKey: 'AIzaSyA6ZFPqGaYWZEGq2CbfBt7tADn3tJwChhA',
  temperature: 0.7,
  maxTokens: 1000
}

/**
 * Google Gemini 1.5 Proの設定例（高機能）
 */
export const geminiProConfig: AIProviderConfig = {
  providerId: 'google',
  modelId: 'gemini-1.5-pro',
  apiKey: 'AIzaSyA6ZFPqGaYWZEGq2CbfBt7tADn3tJwChhA',
  temperature: 0.7,
  maxTokens: 1000
}

/**
 * Groq Llama 3.1 8B Instantの設定例（超高速推論）
 */
export const groqConfig: AIProviderConfig = {
  providerId: 'groq',
  modelId: 'llama-3.1-8b-instant',
  apiKey: 'your-groq-api-key',
  temperature: 0.7,
  maxTokens: 1000
}

/**
 * 基本的なテキスト生成の例
 */
export async function basicTextGeneration() {
  try {
    // プロバイダーを設定
    await aiService.configureProvider(googleConfig)
    
    // テキスト生成
    const response = await aiService.generateResponse(
      'Hello! Please introduce yourself and explain what you can do.'
    )
    
    console.log('Generated response:', response.text)
    console.log('Tokens used:', response.tokens)
    console.log('Duration:', response.duration, 'ms')
    
  } catch (error) {
    console.error('Error in basic text generation:', error)
  }
}

/**
 * Gemini 2.0 Flash Expでのテキスト生成例
 */
export async function geminiFlashExpGeneration() {
  try {
    // Gemini 2.0 Flash Expを設定
    await aiService.configureProvider(googleConfig)
    
    const startTime = Date.now()
    
    // テキスト生成
    const response = await aiService.generateResponse(
      'Hello! I am using Gemini 2.0 Flash Exp. Please introduce yourself and explain your capabilities.'
    )
    
    const endTime = Date.now()
    
    console.log('Gemini 2.0 Flash Exp response:', response.text)
    console.log('Tokens used:', response.tokens)
    console.log('AI processing time:', response.duration, 'ms')
    console.log('Total time including network:', endTime - startTime, 'ms')
    
  } catch (error) {
    console.error('Error in Gemini 2.0 Flash Exp generation:', error)
  }
}

/**
 * Gemini 1.5 Flashでの高速推論例
 */
export async function geminiFlashGeneration() {
  try {
    // Gemini 1.5 Flashを設定
    await aiService.configureProvider(geminiFlashConfig)
    
    const startTime = Date.now()
    
    // テキスト生成
    const response = await aiService.generateResponse(
      'Hello! I am using Gemini 1.5 Flash. Please introduce yourself and explain your capabilities.'
    )
    
    const endTime = Date.now()
    
    console.log('Gemini 1.5 Flash response:', response.text)
    console.log('Tokens used:', response.tokens)
    console.log('AI processing time:', response.duration, 'ms')
    console.log('Total time including network:', endTime - startTime, 'ms')
    
  } catch (error) {
    console.error('Error in Gemini 1.5 Flash generation:', error)
  }
}

/**
 * ストリーミング応答の例
 */
export async function streamingResponse() {
  try {
    await aiService.configureProvider(anthropicConfig)
    
    let fullResponse = ''
    
    await aiService.streamResponse(
      'Write a short story about a robot learning to paint.',
      (chunk) => {
        fullResponse += chunk
        console.log('Received chunk:', chunk)
      }
    )
    
    console.log('Full response:', fullResponse)
    
  } catch (error) {
    console.error('Error in streaming response:', error)
  }
}

/**
 * Gemini 2.0 Flash Expでのストリーミング例
 */
export async function geminiFlashExpStreaming() {
  try {
    await aiService.configureProvider(googleConfig)
    
    let fullResponse = ''
    
    await aiService.streamResponse(
      'Write a short story about a robot learning to paint using Gemini 2.0 Flash Exp.',
      (chunk) => {
        fullResponse += chunk
        console.log('Received chunk:', chunk)
      }
    )
    
    console.log('Full Gemini 2.0 Flash Exp response:', fullResponse)
    
  } catch (error) {
    console.error('Error in Gemini 2.0 Flash Exp streaming:', error)
  }
}

/**
 * ツール使用の例
 */
export async function toolUsage() {
  try {
    await aiService.configureProvider(openaiConfig)
    
    const response = await aiService.generateWithTools(
      'I want to create a video summary of this webpage: https://example.com. Please tell me which tools you would use and in what order.'
    )
    
    console.log('Tool usage plan:', response.text)
    if (response.toolCalls) {
      console.log('Tool calls:', response.toolCalls)
    }
    
  } catch (error) {
    console.error('Error in tool usage:', error)
  }
}

/**
 * Gemini 2.0 Flash Expでのツール使用例
 */
export async function geminiFlashExpToolUsage() {
  try {
    await aiService.configureProvider(googleConfig)
    
    const response = await aiService.generateWithTools(
      'I want to create a video summary of this webpage: https://example.com using Gemini 2.0 Flash Exp. Please tell me which tools you would use and in what order.'
    )
    
    console.log('Gemini 2.0 Flash Exp tool usage plan:', response.text)
    if (response.toolCalls) {
      console.log('Tool calls:', response.toolCalls)
    }
    
  } catch (error) {
    console.error('Error in Gemini 2.0 Flash Exp tool usage:', error)
  }
}

/**
 * ストリーミングツール使用の例
 */
export async function streamingToolUsage() {
  try {
    await aiService.configureProvider(openaiConfig)
    
    let fullResponse = ''
    const toolCalls: any[] = []
    
    await aiService.streamWithTools(
      'Create a video summary of this webpage: https://example.com',
      (chunk) => {
        fullResponse += chunk
        console.log('Received chunk:', chunk)
      },
      (toolCall) => {
        toolCalls.push(toolCall)
        console.log('Tool call:', toolCall)
      }
    )
    
    console.log('Full response:', fullResponse)
    console.log('All tool calls:', toolCalls)
    
  } catch (error) {
    console.error('Error in streaming tool usage:', error)
  }
}

/**
 * Gemini 2.0 Flash Expでのストリーミングツール使用例
 */
export async function geminiFlashExpStreamingToolUsage() {
  try {
    await aiService.configureProvider(googleConfig)
    
    let fullResponse = ''
    const toolCalls: any[] = []
    
    await aiService.streamWithTools(
      'Create a video summary of this webpage: https://example.com using Gemini 2.0 Flash Exp',
      (chunk) => {
        fullResponse += chunk
        console.log('Received chunk:', chunk)
      },
      (toolCall) => {
        toolCalls.push(toolCall)
        console.log('Tool call:', toolCall)
      }
    )
    
    console.log('Full Gemini 2.0 Flash Exp response:', fullResponse)
    console.log('All tool calls:', toolCalls)
    
  } catch (error) {
    console.error('Error in Gemini 2.0 Flash Exp streaming tool usage:', error)
  }
}

/**
 * 画像分析の例
 */
export async function imageAnalysis() {
  try {
    await aiService.configureProvider(googleConfig) // Geminiは画像分析に対応
    
    const imageUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg'
    ]
    
    const response = await aiService.generateWithImages(
      'Describe what you see in these images and how they relate to each other.',
      imageUrls
    )
    
    console.log('Image analysis:', response.text)
    
  } catch (error) {
    console.error('Error in image analysis:', error)
  }
}

/**
 * Gemini 2.0 Flash Expでの画像分析例
 */
export async function geminiFlashExpImageAnalysis() {
  try {
    await aiService.configureProvider(googleConfig)
    
    const imageUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg'
    ]
    
    const response = await aiService.generateWithImages(
      'Describe what you see in these images using Gemini 2.0 Flash Exp.',
      imageUrls
    )
    
    console.log('Gemini 2.0 Flash Exp image analysis:', response.text)
    
  } catch (error) {
    console.error('Error in Gemini 2.0 Flash Exp image analysis:', error)
  }
}

/**
 * 高速推論の例（Groq使用）
 */
export async function fastInference() {
  try {
    await aiService.configureProvider(groqConfig)
    
    const startTime = Date.now()
    
    const response = await aiService.generateResponse(
      'What is the capital of France and what is it known for?'
    )
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    console.log('Fast inference response:', response.text)
    console.log('Total time including network:', totalTime, 'ms')
    console.log('AI processing time:', response.duration, 'ms')
    
  } catch (error) {
    console.error('Error in fast inference:', error)
  }
}

/**
 * Gemini 2.0 Flash Expでの高速推論例
 */
export async function geminiFlashExpFastInference() {
  try {
    await aiService.configureProvider(googleConfig)
    
    const startTime = Date.now()
    
    const response = await aiService.generateResponse(
      'What is the capital of France and what is it known for? Please answer using Gemini 2.0 Flash Exp.'
    )
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    console.log('Gemini 2.0 Flash Exp fast inference response:', response.text)
    console.log('Total time including network:', totalTime, 'ms')
    console.log('AI processing time:', response.duration, 'ms')
    
  } catch (error) {
    console.error('Error in Gemini 2.0 Flash Exp fast inference:', error)
  }
}

/**
 * プロバイダー切り替えの例
 */
export async function providerSwitching() {
  try {
    // OpenAIで開始
    await aiService.configureProvider(openaiConfig)
    let response = await aiService.generateResponse('What is 2+2?')
    console.log('OpenAI response:', response.text)
    
    // Anthropicに切り替え
    await aiService.configureProvider(anthropicConfig)
    response = await aiService.generateResponse('What is 2+2?')
    console.log('Anthropic response:', response.text)
    
    // Gemini 2.0 Flash Expに切り替え
    await aiService.configureProvider(googleConfig)
    response = await aiService.generateResponse('What is 2+2?')
    console.log('Gemini 2.0 Flash Exp response:', response.text)
    
    // Groqに切り替え（高速）
    await aiService.configureProvider(groqConfig)
    response = await aiService.generateResponse('What is 2+2?')
    console.log('Groq response:', response.text)
    
  } catch (error) {
    console.error('Error in provider switching:', error)
  }
}

/**
 * 接続テストの例
 */
export async function connectionTest() {
  try {
    await aiService.configureProvider(openaiConfig)
    
    const isConnected = await aiService.testConnection()
    
    if (isConnected) {
      console.log('successful!')
    } else {
      console.log('failed!')
    }
    
  } catch (error) {
    console.error('Connection test error:', error)
  }
}

/**
 * Gemini 2.0 Flash Exp接続テストの例
 */
export async function geminiFlashExpConnectionTest() {
  try {
    await aiService.configureProvider(googleConfig)
    
    const isConnected = await aiService.testConnection()
    
    if (isConnected) {
      console.log('Gemini 2.0 Flash Exp connection test successful!')
    } else {
      console.log('Gemini 2.0 Flash Exp connection test failed!')
    }
    
  } catch (error) {
    console.error('Gemini 2.0 Flash Exp connection test error:', error)
  }
}

/**
 * 推奨モデルの取得例
 */
export function getRecommendedModels() {
  const generalModels = aiService.getRecommendedModels('general')
  const codingModels = aiService.getRecommendedModels('coding')
  const fastModels = aiService.getRecommendedModels('fast')
  
  console.log('General models:', generalModels.map(m => `${m.provider}: ${m.name}`))
  console.log('Coding models:', codingModels.map(m => `${m.provider}: ${m.name}`))
  console.log('Fast models:', fastModels.map(m => `${m.provider}: ${m.name}`))
}

/**
 * プロバイダー機能の確認例
 */
export function checkProviderCapabilities() {
  const providers = ['openai', 'anthropic', 'google', 'groq', 'mistral']
  
  providers.forEach(providerId => {
    const capabilities = aiService.getProviderCapabilities(providerId)
    console.log(`${providerId} capabilities:`, capabilities)
  })
}

/**
 * 新しいストリーミングチャット機能のテスト
 */
export async function testNewStreamingChat() {
  try {
    await aiService.configureProvider(anthropicConfig)
    
    const messages = [
      { role: 'system' as const, content: 'You are a helpful AI assistant.' },
      { role: 'user' as const, content: 'Hello! How are you today?' }
    ]
    
    let fullResponse = ''
    
    await aiService.streamChatResponse(
      messages,
      (chunk) => {
        fullResponse += chunk
        console.log('Received chunk:', chunk)
      },
      (completeResponse) => {
        console.log('Streaming completed!')
        console.log('Full response:', completeResponse)
      },
      (error) => {
        console.error('Streaming error:', error.message)
      }
    )
    
  } catch (error) {
    console.error('Error in new streaming chat test:', error)
  }
}

/**
 * 高速ストリーミング機能のテスト
 */
export async function testFastStreaming() {
  try {
    await aiService.configureProvider(anthropicConfig)
    
    const response = await aiService.streamFastResponse(
      'Write a short poem about AI.',
      (chunk) => {
        console.log('Fast chunk:', chunk)
      },
      {
        temperature: 0.8,
        maxTokens: 100,
        systemPrompt: 'You are a creative poet.'
      }
    )
    
    console.log('Fast streaming completed:', response)
    
  } catch (error) {
    console.error('Error in fast streaming test:', error)
  }
}

/**
 * ストリーミング機能の比較テスト
 */
export async function compareStreamingMethods() {
  try {
    await aiService.configureProvider(anthropicConfig)
    
    console.log('=== Testing Traditional Streaming ===')
    const startTime1 = Date.now()
    await aiService.streamResponse(
      'Tell me a short story.',
      (chunk) => {
        process.stdout.write(chunk)
      }
    )
    const endTime1 = Date.now()
    console.log(`\nTraditional streaming took: ${endTime1 - startTime1}ms`)
    
    console.log('\n=== Testing Fast Streaming ===')
    const startTime2 = Date.now()
    await aiService.streamFastResponse(
      'Tell me a short story.',
      (chunk) => {
        process.stdout.write(chunk)
      }
    )
    const endTime2 = Date.now()
    console.log(`\nFast streaming took: ${endTime2 - startTime2}ms`)
    
  } catch (error) {
    console.error('Error in streaming comparison:', error)
  }
}

// 使用例の実行
export async function runExamples() {
  console.log('=== AI SDK Usage Examples ===')
  
  // 基本機能のテスト
  await connectionTest()
  getRecommendedModels()
  checkProviderCapabilities()
  
  // Gemini 2.0 Flash Expのテスト
  await geminiFlashExpConnectionTest()
  await geminiFlashExpGeneration()
  await geminiFlashExpStreaming()
  await geminiFlashExpToolUsage()
  await geminiFlashExpStreamingToolUsage()
  await geminiFlashExpImageAnalysis()
  await geminiFlashExpFastInference()
  
  // Gemini 1.5 Flashのテスト
  await geminiFlashGeneration()
  
  // 実際の生成テスト（APIキーが必要）
  // await basicTextGeneration()
  // await streamingResponse()
  // await toolUsage()
  // await streamingToolUsage()
  // await fastInference()
  // await providerSwitching()
  
  console.log('=== Examples completed ===')
}

// 直接実行（Node.js環境）
if (typeof window === 'undefined') {
  runExamples().catch(console.error)
}
