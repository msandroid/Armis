import { ChatLlamaCpp } from '@langchain/community/chat_models/llama_cpp'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { z } from 'zod'

export interface LlamaCppTextExtractionConfig {
  modelPath: string
  temperature?: number
  maxTokens?: number
  contextSize?: number
  threads?: number
  gpuLayers?: number
  verbose?: boolean
}

export interface ExtractedText {
  mainText: string
  confidence: number
  reasoning: string
  hasInstructions: boolean
  instructionType?: 'tts_request' | 'explanation' | 'other'
}

export class LlamaCppTextExtractionChain {
  private llm: ChatLlamaCpp | null = null
  private config: LlamaCppTextExtractionConfig
  private chain: RunnableSequence | null = null
  private isInitialized = false

  constructor(config: LlamaCppTextExtractionConfig) {
    this.config = {
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      verbose: false,
      ...config
    }
  }

  /**
   * サービスを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Node.js環境チェック
      if (typeof window !== 'undefined') {
        throw new Error('LlamaCppTextExtractionChain is only available in Node.js environment')
      }

      // モデルファイルの存在確認
      const fs = await import('fs')
      if (!fs.existsSync(this.config.modelPath)) {
        throw new Error(`Model file not found at ${this.config.modelPath}`)
      }

      // ChatLlamaCppモデルを作成
      this.llm = await ChatLlamaCpp.initialize({
        modelPath: this.config.modelPath,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        contextSize: this.config.contextSize,
        threads: this.config.threads,
        gpuLayers: this.config.gpuLayers,
      })

      // Chainを作成
      this.chain = await this.createChain()
      this.isInitialized = true
      console.log('LlamaCpp Text Extraction Chain initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LlamaCpp Text Extraction Chain:', error)
      throw error
    }
  }

  /**
   * 本文抽出用のChainを作成
   */
  private async createChain(): Promise<RunnableSequence> {
    if (!this.llm) {
      throw new Error('LLM not initialized')
    }

    const prompt = PromptTemplate.fromTemplate(`
あなたはテキストからTTS（Text-to-Speech）に渡すべき本文部分を抽出する専門家です。

与えられたテキストを分析し、以下の点を判断してください：

1. **本文部分**: TTSで音声化すべき主要なコンテンツ
2. **指示文部分**: 「音声を作成」「TTSで」などの指示や説明
3. **信頼度**: 抽出の正確性（0-1の数値）
4. **理由**: 抽出判断の根拠

**抽出ルール:**
- 本文部分には指示文や説明文を含めない
- 複数の文がある場合、主要なコンテンツのみを抽出
- 指示文が明確でない場合は、全体を本文として扱う
- 信頼度は抽出の確実性に基づいて判定

**入力テキスト:**
{input}

**出力形式（JSON）:**
{{
  "mainText": "TTSに渡すべき本文部分（指示文や説明文を除く）",
  "confidence": 0.0-1.0,
  "reasoning": "抽出理由の説明",
  "hasInstructions": true/false,
  "instructionType": "tts_request/explanation/other"
}}

**例:**
入力: "ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。上記の文章を音声にしてください。"

出力: {{
  "mainText": "ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。",
  "confidence": 0.95,
  "reasoning": "「上記の文章を音声にしてください」という明確なTTS指示があり、その前の部分が本文として抽出できる。",
  "hasInstructions": true,
  "instructionType": "tts_request"
}}
`)

    return RunnableSequence.from([
      prompt,
      this.llm,
      new StringOutputParser()
    ])
  }

  /**
   * テキストから本文を抽出
   */
  async extractMainText(inputText: string): Promise<ExtractedText> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.chain) {
      throw new Error('Chain not initialized')
    }

    try {
      const result = await this.chain.invoke({ input: inputText })
      
      // JSON文字列をパース
      try {
        const parsed = JSON.parse(result)
        return parsed
      } catch (parseError) {
        console.warn('Failed to parse LLM response as JSON:', parseError)
        return this.fallbackExtraction(inputText)
      }
    } catch (error) {
      console.error('Text extraction failed:', error)
      // フォールバック: 基本的な抽出ロジック
      return this.fallbackExtraction(inputText)
    }
  }

  /**
   * フォールバック用の基本的な抽出ロジック
   */
  private fallbackExtraction(inputText: string): ExtractedText {
    const ttsKeywords = [
      '音声を作成', '音声で', '音声化', 'TTS', '音声合成',
      '音声を生成', '音声に変換', '音声で読み上げ',
      'audio', 'voice', 'speech', 'tts', '音声'
    ]

    const lowerText = inputText.toLowerCase()
    const foundKeyword = ttsKeywords.find(keyword => lowerText.includes(keyword.toLowerCase()))

    if (foundKeyword) {
      const keywordIndex = inputText.toLowerCase().indexOf(foundKeyword.toLowerCase())
      const mainText = inputText.substring(0, keywordIndex).trim()
      
      return {
        mainText: mainText || inputText,
        confidence: 0.7,
        reasoning: `キーワード「${foundKeyword}」を検出し、その前の部分を本文として抽出しました`,
        hasInstructions: true,
        instructionType: 'tts_request'
      }
    }

    // 指示文が見つからない場合は全体を本文として扱う
    return {
      mainText: inputText,
      confidence: 0.8,
      reasoning: '明確な指示文が見つからないため、全体を本文として扱います',
      hasInstructions: false
    }
  }

  /**
   * バッチ処理で複数のテキストを抽出
   */
  async extractBatch(texts: string[]): Promise<ExtractedText[]> {
    const results: ExtractedText[] = []
    
    for (const text of texts) {
      const extraction = await this.extractMainText(text)
      results.push(extraction)
    }
    
    return results
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<LlamaCppTextExtractionConfig>) {
    this.config = { ...this.config, ...config }
    this.isInitialized = false // 再初期化が必要
  }

  /**
   * 利用可能かどうかを確認
   */
  isAvailable(): boolean {
    return this.isInitialized && this.llm !== null
  }

  /**
   * モデル情報を取得
   */
  getModelInfo(): { modelPath: string; isInitialized: boolean } {
    return {
      modelPath: this.config.modelPath,
      isInitialized: this.isInitialized
    }
  }
}

export function createLlamaCppTextExtractionChain(config: LlamaCppTextExtractionConfig): LlamaCppTextExtractionChain {
  return new LlamaCppTextExtractionChain(config)
}
