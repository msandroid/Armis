import { LLMManager } from '../llm/llm-manager'

export interface TTSTextExtractionResult {
  extractedText: string
  confidence: number
  reasoning: string
  shouldProcessTTS: boolean
}

export interface TTSTextExtractorConfig {
  llmManager?: LLMManager
  extractionPrompt?: string
  maxTokens?: number
  temperature?: number
}

export class TTSTextExtractor {
  private config: TTSTextExtractorConfig
  private llmManager: LLMManager | null = null

  constructor(config: TTSTextExtractorConfig = {}) {
    this.config = {
      extractionPrompt: `あなたは音声合成（TTS）用のテキスト抽出専門家です。

ユーザーの入力から、音声合成に適したテキストを抽出してください。

抽出ルール：
1. 音声合成に適した自然な文章を抽出
2. 不要な指示文（「上記の文章を音声にして」など）は除外
3. 抽出されたテキストは音声として聞き取りやすい形式にする
4. 抽出できない場合は空文字列を返す

出力形式：
{
  "extractedText": "抽出されたテキスト",
  "confidence": 0.95,
  "reasoning": "抽出理由",
  "shouldProcessTTS": true
}

ユーザー入力: `,
      maxTokens: 500,
      temperature: 0.1,
      ...config
    }
    
    this.llmManager = config.llmManager || null
  }

  /**
   * LLMマネージャーを設定
   */
  setLLMManager(llmManager: LLMManager) {
    this.llmManager = llmManager
  }

  /**
   * ユーザーの入力からTTS用テキストを抽出
   */
  async extractTTSText(userInput: string): Promise<TTSTextExtractionResult> {
    if (!this.llmManager) {
      console.warn('TTSTextExtractor: LLM Manager not configured')
      return {
        extractedText: userInput,
        confidence: 0.5,
        reasoning: 'LLM Manager not available, using original input',
        shouldProcessTTS: true
      }
    }

    try {
      console.log('🎵 TTS Text Extraction: Starting extraction for:', userInput.substring(0, 50) + '...')

      const prompt = `${this.config.extractionPrompt}${userInput}`

      // Local LLMを使用してテキスト抽出を実行
      const response = await this.llmManager.processUserRequestLegacy(prompt, {
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      })

      let responseContent = ''
      if (typeof response === 'string') {
        responseContent = response
      } else if (response && typeof response === 'object') {
        responseContent = response.content || response.response || response.text || ''
      }

      console.log('🎵 TTS Text Extraction: LLM Response:', responseContent.substring(0, 100) + '...')

      // JSONレスポンスを解析
      const extractionResult = this.parseExtractionResponse(responseContent, userInput)

      console.log('🎵 TTS Text Extraction: Result:', {
        extractedText: extractionResult.extractedText.substring(0, 50) + '...',
        confidence: extractionResult.confidence,
        shouldProcessTTS: extractionResult.shouldProcessTTS
      })

      return extractionResult

    } catch (error) {
      console.error('🎵 TTS Text Extraction: Error during extraction:', error)
      
      // エラー時は元のテキストを使用
      return {
        extractedText: userInput,
        confidence: 0.3,
        reasoning: 'Extraction failed, using original input',
        shouldProcessTTS: true
      }
    }
  }

  /**
   * LLMレスポンスを解析して抽出結果を取得
   */
  private parseExtractionResponse(response: string, originalInput: string): TTSTextExtractionResult {
    try {
      // JSONブロックを検索
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[0]
        const parsed = JSON.parse(jsonStr)
        
        if (parsed.extractedText && typeof parsed.extractedText === 'string') {
          return {
            extractedText: parsed.extractedText.trim(),
            confidence: parsed.confidence || 0.8,
            reasoning: parsed.reasoning || 'Successfully extracted from JSON response',
            shouldProcessTTS: parsed.shouldProcessTTS !== false
          }
        }
      }

      // JSONが見つからない場合、レスポンス全体をテキストとして扱う
      const cleanedResponse = response.trim()
      if (cleanedResponse && cleanedResponse !== originalInput) {
        return {
          extractedText: cleanedResponse,
          confidence: 0.6,
          reasoning: 'Used full response as extracted text',
          shouldProcessTTS: true
        }
      }

      // デフォルト: 元のテキストを使用
      return {
        extractedText: originalInput,
        confidence: 0.5,
        reasoning: 'No valid extraction found, using original input',
        shouldProcessTTS: true
      }

    } catch (error) {
      console.warn('🎵 TTS Text Extraction: Failed to parse JSON response:', error)
      
      // パースエラー時は元のテキストを使用
      return {
        extractedText: originalInput,
        confidence: 0.4,
        reasoning: 'JSON parsing failed, using original input',
        shouldProcessTTS: true
      }
    }
  }

  /**
   * 抽出されたテキストが有効かどうかをチェック
   */
  private isValidExtractedText(text: string): boolean {
    if (!text || text.trim() === '') {
      return false
    }

    // 最小文字数チェック
    if (text.trim().length < 5) {
      return false
    }

    // 不要な指示文が含まれていないかチェック
    const instructionPatterns = [
      /上記の文章を音声にして/,
      /音声にして/,
      /音声化して/,
      /TTSして/,
      /音声合成して/
    ]

    for (const pattern of instructionPatterns) {
      if (pattern.test(text)) {
        return false
      }
    }

    return true
  }
}

// ファクトリ関数
export function createTTSTextExtractor(config: TTSTextExtractorConfig = {}): TTSTextExtractor {
  return new TTSTextExtractor(config)
}
