import { tool as createTool } from 'ai'
import { z } from 'zod'

/**
 * 天気情報を取得するツール
 */
export const weatherTool = createTool({
  description: '指定された場所の天気情報を表示します',
  inputSchema: z.object({
    location: z.string().describe('天気を取得する場所'),
  }),
  execute: async function ({ location }) {
    // 実際のアプリケーションでは、ここで天気APIを呼び出します
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // シミュレートされた天気データ
    const weatherData = {
      location,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40度
      condition: ['晴れ', '曇り', '雨', '雪'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      forecast: [
        { time: '9:00', temp: Math.floor(Math.random() * 30) + 10, condition: '晴れ' },
        { time: '12:00', temp: Math.floor(Math.random() * 30) + 10, condition: '曇り' },
        { time: '15:00', temp: Math.floor(Math.random() * 30) + 10, condition: '晴れ' },
        { time: '18:00', temp: Math.floor(Math.random() * 30) + 10, condition: '雨' },
      ]
    }
    
    return weatherData
  },
})

/**
 * 株価情報を取得するツール
 */
export const stockTool = createTool({
  description: '指定された株式銘柄の価格情報を取得します',
  inputSchema: z.object({
    symbol: z.string().describe('株式銘柄のシンボル（例: AAPL, GOOGL）'),
  }),
  execute: async function ({ symbol }) {
    // 実際のアプリケーションでは、ここで株価APIを呼び出します
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // シミュレートされた株価データ
    const basePrice = Math.floor(Math.random() * 1000) + 50
    const change = (Math.random() - 0.5) * 20
    const changePercent = (change / basePrice) * 100
    
    return {
      symbol: symbol.toUpperCase(),
      price: basePrice + change,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      high: basePrice + Math.random() * 50,
      low: basePrice - Math.random() * 50,
    }
  },
})

/**
 * 画像生成ツール
 */
export const imageGeneratorTool = createTool({
  description: 'プロンプトから画像を生成します',
  inputSchema: z.object({
    prompt: z.string().describe('生成したい画像の説明'),
    style: z.enum(['realistic', 'artistic', 'cartoon', 'abstract']).optional().describe('画像のスタイル'),
    size: z.enum(['small', 'medium', 'large']).optional().describe('画像サイズ'),
  }),
  execute: async function ({ prompt, style = 'realistic', size = 'medium' }) {
    // 実際のアプリケーションでは、ここで画像生成APIを呼び出します
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // シミュレートされた画像生成結果
    const sizes = {
      small: { width: 512, height: 512 },
      medium: { width: 1024, height: 1024 },
      large: { width: 1792, height: 1024 }
    }
    
    return {
      prompt,
      style,
      size: sizes[size],
      imageUrl: `https://picsum.photos/${sizes[size].width}/${sizes[size].height}?random=${Date.now()}`,
      generatedAt: new Date().toISOString(),
    }
  },
})

/**
 * 翻訳ツール
 */
export const translationTool = createTool({
  description: 'テキストを指定された言語に翻訳します',
  inputSchema: z.object({
    text: z.string().describe('翻訳するテキスト'),
    targetLanguage: z.string().describe('翻訳先の言語（例: 英語, 日本語, スペイン語）'),
    sourceLanguage: z.string().optional().describe('翻訳元の言語（自動検出の場合は省略）'),
  }),
  execute: async function ({ text, targetLanguage, sourceLanguage }) {
    // 実際のアプリケーションでは、ここで翻訳APIを呼び出します
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // シミュレートされた翻訳結果
    const translations = {
      '英語': `Translated to English: ${text}`,
      '日本語': `日本語に翻訳: ${text}`,
      'スペイン語': `Traducido al español: ${text}`,
      'フランス語': `Traduit en français: ${text}`,
      'ドイツ語': `Ins Deutsche übersetzt: ${text}`,
    }
    
    return {
      originalText: text,
      translatedText: translations[targetLanguage] || `Translated to ${targetLanguage}: ${text}`,
      sourceLanguage: sourceLanguage || '自動検出',
      targetLanguage,
      confidence: Math.random() * 0.3 + 0.7, // 70-100%の信頼度
    }
  },
})

/**
 * 計算ツール
 */
export const calculatorTool = createTool({
  description: '数学的な計算を実行します',
  inputSchema: z.object({
    expression: z.string().describe('計算する数式（例: 2 + 2, sin(45), sqrt(16)）'),
  }),
  execute: async function ({ expression }) {
    try {
      // 安全な計算のための関数
      const safeEval = (expr: string) => {
        // 危険な関数を除外
        const allowedFunctions = ['Math.sin', 'Math.cos', 'Math.tan', 'Math.sqrt', 'Math.pow', 'Math.log', 'Math.exp']
        const allowedOperators = ['+', '-', '*', '/', '(', ')', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        
        // 基本的な検証
        if (!/^[0-9+\-*/().\s]+$/.test(expr.replace(/Math\.\w+/g, ''))) {
          throw new Error('Invalid expression')
        }
        
        // 安全な計算
        return eval(expr)
      }
      
      const result = safeEval(expression)
      
      return {
        expression,
        result,
        calculationType: 'arithmetic',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        expression,
        error: '計算できませんでした。有効な数式を入力してください。',
        calculationType: 'error',
        timestamp: new Date().toISOString(),
      }
    }
  },
})

/**
 * 検索ツール
 */
export const searchTool = createTool({
  description: 'Web検索を実行して情報を取得します',
  inputSchema: z.object({
    query: z.string().describe('検索クエリ'),
    maxResults: z.number().optional().describe('最大結果数（デフォルト: 5）'),
  }),
  execute: async function ({ query, maxResults = 5 }) {
    // 実際のアプリケーションでは、ここで検索APIを呼び出します
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    // シミュレートされた検索結果
    const results = Array.from({ length: maxResults }, (_, i) => ({
      title: `検索結果 ${i + 1}: ${query}`,
      url: `https://example.com/result-${i + 1}`,
      snippet: `これは「${query}」に関する検索結果の${i + 1}番目のスニペットです。関連する情報がここに表示されます。`,
      relevance: Math.random() * 0.3 + 0.7, // 70-100%の関連性
    }))
    
    return {
      query,
      results,
      totalResults: Math.floor(Math.random() * 1000000) + 1000,
      searchTime: Math.random() * 0.5 + 0.1, // 0.1-0.6秒
    }
  },
})

// すべてのツールをエクスポート
export const generativeUITools = {
  displayWeather: weatherTool,
  getStockPrice: stockTool,
  generateImage: imageGeneratorTool,
  translateText: translationTool,
  calculate: calculatorTool,
  searchWeb: searchTool,
}
