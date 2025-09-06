import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { TextExtractionChain, type ExtractedText } from './text-extraction-chain'
import { LlamaCppTextExtractionChain, type LlamaCppTextExtractionConfig } from './llama-cpp-text-extraction-chain'
import { GptOssTextExtractionChain, type GptOssTextExtractionConfig } from './gpt-oss-text-extraction-chain'

export interface TTSRequestAnalysis {
  isTTSRequest: boolean
  ttsText: string | null
  originalText: string
  confidence: number
  reasoning: string
  extractedData?: ExtractedText
}

export interface TTSRequestAnalyzerConfig {
  apiKey?: string
  model?: string
  temperature?: number
  useLlamaCpp?: boolean
  llamaCppConfig?: LlamaCppTextExtractionConfig
  useGptOss?: boolean
  gptOssConfig?: GptOssTextExtractionConfig
}

export class TTSRequestAnalyzer {
  private llm: ChatOpenAI | null = null
  private config: TTSRequestAnalyzerConfig
  private extractionChain: TextExtractionChain | null = null
  private llamaCppExtractionChain: LlamaCppTextExtractionChain | null = null
  private gptOssExtractionChain: GptOssTextExtractionChain | null = null

  constructor(config: TTSRequestAnalyzerConfig = {}) {
    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.1,
      ...config
    }
    
    if (this.config.apiKey) {
      this.initializeLLM()
    }
  }

  private initializeLLM() {
    if (!this.config.apiKey) {
      console.warn('TTSRequestAnalyzer: API key not provided')
      return
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: this.config.apiKey,
      modelName: this.config.model!,
      temperature: this.config.temperature,
    })
  }

  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey
    this.initializeLLM()
    this.initializeExtractionChain()
  }

  private initializeExtractionChain() {
    if (this.config.useGptOss && this.config.gptOssConfig) {
      // gpt-ossを使用
      this.gptOssExtractionChain = new GptOssTextExtractionChain(this.config.gptOssConfig)
    } else if (this.config.useLlamaCpp && this.config.llamaCppConfig) {
      // llama.cppを使用
      this.llamaCppExtractionChain = new LlamaCppTextExtractionChain(this.config.llamaCppConfig)
    } else if (this.config.apiKey) {
      // クラウドLLMを使用
      this.extractionChain = new TextExtractionChain({
        modelType: 'openai',
        modelName: this.config.model,
        temperature: this.config.temperature,
        apiKey: this.config.apiKey
      })
    }
  }

  // 基本的なキーワードベースのTTS要求検出
  private detectTTSRequestBasic(text: string): boolean {
    const ttsKeywords = [
      '音声を作成', '音声で', '音声化', 'TTS', '音声合成',
      '音声を生成', '音声に変換', '音声で読み上げ',
      'audio', 'voice', 'speech', 'tts', '音声'
    ]
    
    const lowerText = text.toLowerCase()
    return ttsKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
  }

  // LLMを使用した高度なTTS要求解析
  async analyzeTTSRequest(text: string): Promise<TTSRequestAnalysis> {
    // 基本的な検出をまず実行
    const isBasicTTSRequest = this.detectTTSRequestBasic(text)
    
    if (!isBasicTTSRequest) {
      return {
        isTTSRequest: false,
        ttsText: null,
        originalText: text,
        confidence: 0.0,
        reasoning: 'TTS要求のキーワードが検出されませんでした'
      }
    }

    // gpt-oss TextExtractionChainが利用可能な場合はそれを使用
    if (this.gptOssExtractionChain) {
      try {
        const extractedData = await this.gptOssExtractionChain.extractMainText(text)
        return {
          isTTSRequest: true,
          ttsText: extractedData.mainText,
          originalText: text,
          confidence: extractedData.confidence,
          reasoning: extractedData.reasoning,
          extractedData
        }
      } catch (error) {
        console.warn('GptOss TextExtractionChain failed, falling back to llama.cpp:', error)
      }
    }

    // llama.cpp TextExtractionChainが利用可能な場合はそれを使用
    if (this.llamaCppExtractionChain) {
      try {
        const extractedData = await this.llamaCppExtractionChain.extractMainText(text)
        return {
          isTTSRequest: true,
          ttsText: extractedData.mainText,
          originalText: text,
          confidence: extractedData.confidence,
          reasoning: extractedData.reasoning,
          extractedData
        }
      } catch (error) {
        console.warn('LlamaCpp TextExtractionChain failed, falling back to cloud LLM:', error)
      }
    }

    // クラウドLLM TextExtractionChainが利用可能な場合はそれを使用
    if (this.extractionChain) {
      try {
        const extractedData = await this.extractionChain.extractMainText(text)
        return {
          isTTSRequest: true,
          ttsText: extractedData.mainText,
          originalText: text,
          confidence: extractedData.confidence,
          reasoning: extractedData.reasoning,
          extractedData
        }
      } catch (error) {
        console.warn('TextExtractionChain failed, falling back to basic analysis:', error)
      }
    }

    // LLMが利用できない場合は基本的な解析のみ
    if (!this.llm) {
      return this.analyzeTTSRequestBasic(text)
    }

    try {
      const prompt = PromptTemplate.fromTemplate(`
あなたはTTS（Text-to-Speech）要求を解析する専門家です。

ユーザーの入力テキストを分析し、以下の点を判断してください：

1. このテキストはTTS要求ですか？
2. TTS処理に使用すべきテキストは何ですか？
3. その判断理由は何ですか？

**入力テキスト:**
{input}

**分析ルール:**
- TTS要求の場合、TTS処理に使用するテキストから指示部分（「音声を作成」「TTSで」など）を除外してください
- 複数の文がある場合、TTS処理に適した部分のみを抽出してください
- 指示部分とコンテンツ部分を明確に分離してください

**出力形式（JSON）:**
{{
  "isTTSRequest": boolean,
  "ttsText": "TTS処理に使用するテキスト（指示部分を除外）",
  "confidence": 0.0-1.0,
  "reasoning": "判断理由"
}}

**例:**
入力: "ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。上記の音声を作成"

出力: {{
  "isTTSRequest": true,
  "ttsText": "ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。",
  "confidence": 0.95,
  "reasoning": "「上記の音声を作成」という明確なTTS要求が含まれており、その前の部分がTTS処理に使用すべきコンテンツです。"
}}
`)

      const chain = RunnableSequence.from([
        prompt,
        this.llm,
        new StringOutputParser()
      ])

      const result = await chain.invoke({ input: text })
      
      try {
        const parsed = JSON.parse(result)
        return {
          isTTSRequest: parsed.isTTSRequest || false,
          ttsText: parsed.ttsText || null,
          originalText: text,
          confidence: parsed.confidence || 0.0,
          reasoning: parsed.reasoning || 'LLM解析完了'
        }
      } catch (parseError) {
        console.warn('Failed to parse LLM response:', parseError)
        return this.analyzeTTSRequestBasic(text)
      }

    } catch (error) {
      console.error('LLM analysis failed:', error)
      return this.analyzeTTSRequestBasic(text)
    }
  }

  // 基本的なTTS要求解析（LLMが利用できない場合）
  private analyzeTTSRequestBasic(text: string): TTSRequestAnalysis {
    const ttsKeywords = [
      '音声を作成', '音声で', '音声化', 'TTS', '音声合成',
      '音声を生成', '音声に変換', '音声で読み上げ',
      'audio', 'voice', 'speech', 'tts', '音声'
    ]
    
    const lowerText = text.toLowerCase()
    const foundKeyword = ttsKeywords.find(keyword => lowerText.includes(keyword.toLowerCase()))
    
    if (!foundKeyword) {
      return {
        isTTSRequest: false,
        ttsText: null,
        originalText: text,
        confidence: 0.0,
        reasoning: 'TTS要求のキーワードが検出されませんでした'
      }
    }

    // 基本的なテキスト分離ロジック
    const keywordIndex = lowerText.indexOf(foundKeyword.toLowerCase())
    const originalKeywordIndex = text.toLowerCase().indexOf(foundKeyword.toLowerCase())
    
    // キーワードより前の部分をTTSテキストとして抽出
    const ttsText = text.substring(0, originalKeywordIndex).trim()
    
    return {
      isTTSRequest: true,
      ttsText: ttsText || null,
      originalText: text,
      confidence: 0.7,
      reasoning: `キーワード「${foundKeyword}」を検出し、その前の部分をTTSテキストとして抽出しました`
    }
  }

  // バッチ処理で複数のテキストを解析
  async analyzeBatch(texts: string[]): Promise<TTSRequestAnalysis[]> {
    const results: TTSRequestAnalysis[] = []
    
    for (const text of texts) {
      const analysis = await this.analyzeTTSRequest(text)
      results.push(analysis)
    }
    
    return results
  }

  // 設定を更新
  updateConfig(config: Partial<TTSRequestAnalyzerConfig>) {
    this.config = { ...this.config, ...config }
    
    if (config.apiKey) {
      this.initializeLLM()
    }
  }

  // 利用可能かどうかを確認
  isAvailable(): boolean {
    return this.llm !== null
  }
}

export function createTTSRequestAnalyzer(config?: TTSRequestAnalyzerConfig): TTSRequestAnalyzer {
  return new TTSRequestAnalyzer(config)
}
