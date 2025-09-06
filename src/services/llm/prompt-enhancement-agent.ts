import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import { LlamaService } from './llama-service'
import { OllamaService } from './ollama-service'

/**
 * プロンプト補完エージェントの設定
 */
export interface PromptEnhancementConfig {
  llmService: LlamaService | OllamaService
  enableQualityEvaluation?: boolean
  enableStyleTransfer?: boolean
  enableMultiLanguage?: boolean
}

/**
 * プロンプト解析結果
 */
export interface PromptAnalysis {
  subject: string
  style: string
  mood: string
  composition: string
  lighting: string
  colorPalette: string
  details: string[]
  missingElements: string[]
  confidence: number
  suggestions: string[]
}

/**
 * 強化されたプロンプト
 */
export interface EnhancedPrompt {
  originalPrompt: string
  enhancedPrompt: string
  englishPrompt: string
  style: string
  quality: string
  metadata: {
    analysis: PromptAnalysis
    generationTime: string
    model: string
  }
}

/**
 * プロンプト品質評価
 */
export interface PromptQualityEvaluation {
  clarity: number
  specificity: number
  creativity: number
  technicalAccuracy: number
  overallScore: number
  feedback: string
  recommendations: string[]
}

/**
 * LangChainベースの画像生成プロンプト補完エージェント
 * T2I-Copilotの概念を取り入れた三段構成を実装
 */
export class PromptEnhancementAgent {
  private config: PromptEnhancementConfig
  private inputInterpreter!: RunnableSequence
  private generationEngine!: RunnableSequence
  private qualityEvaluator!: RunnableSequence

  constructor(config: PromptEnhancementConfig) {
    this.config = config
    this.initializeChains()
  }

  /**
   * LangChainチェインを初期化
   */
  private initializeChains() {
    // Step 1: Input Interpreter - 入力プロンプトの解析
    this.inputInterpreter = this.createInputInterpreter()
    
    // Step 2: Generation Engine - 強化プロンプトの生成
    this.generationEngine = this.createGenerationEngine()
    
    // Step 3: Quality Evaluator - プロンプト品質の評価
    this.qualityEvaluator = this.createQualityEvaluator()
  }

  /**
   * Input Interpreterチェインを作成
   * 入力プロンプトの曖昧さを整理し、構造化された分析結果を生成
   */
  private createInputInterpreter(): RunnableSequence {
    const promptAnalysisParser = StructuredOutputParser.fromZodSchema(
      z.object({
        subject: z.string().describe("画像の主な被写体や主題"),
        style: z.string().describe("画像のスタイル（realistic, artistic, cartoon, abstract等）"),
        mood: z.string().describe("画像の雰囲気や感情（peaceful, dramatic, mysterious等）"),
        composition: z.string().describe("構図の説明（close-up, wide shot, portrait等）"),
        lighting: z.string().describe("照明の説明（natural, dramatic, soft等）"),
        colorPalette: z.string().describe("色調の説明（warm, cool, monochrome等）"),
        details: z.array(z.string()).describe("追加すべき詳細要素のリスト"),
        missingElements: z.array(z.string()).describe("不足している要素のリスト"),
        confidence: z.number().min(0).max(1).describe("解析の信頼度"),
        suggestions: z.array(z.string()).describe("改善提案のリスト")
      })
    )

    const prompt = ChatPromptTemplate.fromTemplate(`
あなたは画像生成プロンプトの専門分析者です。
入力されたプロンプトを詳細に解析し、画像生成に必要な要素を抽出してください。

## 入力プロンプト
{input}

## 解析ガイドライン
1. **主題の特定**: 何を描くべきかを明確にする
2. **スタイルの決定**: リアル、アート、カートーン、抽象など
3. **雰囲気の設定**: 感情やムードを表現
4. **技術的要素**: 構図、照明、色調を指定
5. **不足要素の特定**: より良い画像生成に必要な追加情報

## 出力形式
{format_instructions}

プロンプトが不完全な場合（例：「コアラのしてください。」）は、適切な補完を提案してください。
`)

    const inputMapper = {
      input: (input: any) => input.prompt,
      format_instructions: () => promptAnalysisParser.getFormatInstructions()
    }

    return RunnableSequence.from([
      inputMapper,
      prompt,
      this.config.llmService.getModel(),
      promptAnalysisParser
    ])
  }

  /**
   * Generation Engineチェインを作成
   * 解析結果を基に強化されたプロンプトを生成
   */
  private createGenerationEngine(): RunnableSequence {
    const enhancedPromptParser = StructuredOutputParser.fromZodSchema(
      z.object({
        enhancedPrompt: z.string().describe("強化された日本語プロンプト"),
        englishPrompt: z.string().describe("英語版プロンプト（Gemini API用）"),
        style: z.string().describe("適用されたスタイル"),
        quality: z.string().describe("品質設定（standard, high, ultra）"),
        reasoning: z.string().describe("強化の理由と説明")
      })
    )

    const prompt = ChatPromptTemplate.fromTemplate(`
あなたは画像生成プロンプトの専門エンジニアです。
解析結果を基に、高品質な画像生成のための強化プロンプトを作成してください。

## プロンプト解析結果
{analysis}

## 強化ガイドライン
1. **具体的な詳細**: 曖昧な表現を具体的に
2. **技術的要素**: 照明、構図、色調を明示
3. **スタイル統一**: 一貫したスタイルを維持
4. **英語変換**: Gemini API用の英語プロンプトも生成
5. **品質最適化**: 生成品質を向上させる要素を追加

## 出力形式
{format_instructions}

元のプロンプトの意図を保持しながら、より詳細で効果的なプロンプトに変換してください。
`)

    const analysisMapper = {
      analysis: (input: any) => JSON.stringify(input.analysis, null, 2),
      format_instructions: () => enhancedPromptParser.getFormatInstructions()
    }

    return RunnableSequence.from([
      analysisMapper,
      prompt,
      this.config.llmService.getModel(),
      enhancedPromptParser
    ])
  }

  /**
   * Quality Evaluatorチェインを作成
   * 生成されたプロンプトの品質を評価
   */
  private createQualityEvaluator(): RunnableSequence {
    const qualityEvaluationParser = StructuredOutputParser.fromZodSchema(
      z.object({
        clarity: z.number().min(0).max(10).describe("明確性のスコア（0-10）"),
        specificity: z.number().min(0).max(10).describe("具体性のスコア（0-10）"),
        creativity: z.number().min(0).max(10).describe("創造性のスコア（0-10）"),
        technicalAccuracy: z.number().min(0).max(10).describe("技術的精度のスコア（0-10）"),
        overallScore: z.number().min(0).max(10).describe("総合スコア（0-10）"),
        feedback: z.string().describe("品質評価のフィードバック"),
        recommendations: z.array(z.string()).describe("改善推奨事項のリスト")
      })
    )

    const prompt = ChatPromptTemplate.fromTemplate(`
あなたは画像生成プロンプトの品質評価専門家です。
生成されたプロンプトの品質を多角的に評価してください。

## 元のプロンプト
{originalPrompt}

## 強化されたプロンプト
{enhancedPrompt}

## 評価基準
1. **明確性**: プロンプトが明確で理解しやすいか
2. **具体性**: 十分に具体的で詳細か
3. **創造性**: 独創的で魅力的な要素があるか
4. **技術的精度**: 画像生成技術に適しているか

## 出力形式
{format_instructions}

各項目を0-10のスコアで評価し、具体的なフィードバックと改善提案を提供してください。
`)

    const qualityMapper = {
      originalPrompt: (input: any) => input.originalPrompt,
      enhancedPrompt: (input: any) => input.enhancedPrompt,
      format_instructions: () => qualityEvaluationParser.getFormatInstructions()
    }

    return RunnableSequence.from([
      qualityMapper,
      prompt,
      this.config.llmService.getModel(),
      qualityEvaluationParser
    ])
  }

  /**
   * プロンプトを強化する
   */
  async enhancePrompt(inputPrompt: string): Promise<EnhancedPrompt> {
    try {
      console.log('🔄 プロンプト強化開始:', inputPrompt)

      // Step 1: Input Interpreter - プロンプト解析
      const analysis = await this.inputInterpreter.invoke({ prompt: inputPrompt })
      console.log('📊 プロンプト解析完了:', analysis)

      // Step 2: Generation Engine - プロンプト強化
      const enhanced = await this.generationEngine.invoke({ analysis })
      console.log('✨ プロンプト強化完了:', enhanced)

      // Step 3: Quality Evaluator - 品質評価（オプション）
      let qualityEvaluation: PromptQualityEvaluation | null = null
      if (this.config.enableQualityEvaluation) {
        const evaluation = await this.qualityEvaluator.invoke({
          originalPrompt: inputPrompt,
          enhancedPrompt: enhanced.enhancedPrompt
        })
        qualityEvaluation = evaluation
        console.log('📈 品質評価完了:', evaluation)
      }

      const result: EnhancedPrompt = {
        originalPrompt: inputPrompt,
        enhancedPrompt: enhanced.enhancedPrompt,
        englishPrompt: enhanced.englishPrompt,
        style: enhanced.style,
        quality: enhanced.quality,
        metadata: {
          analysis,
          generationTime: new Date().toISOString(),
          model: this.config.llmService.getModelName()
        }
      }

      console.log('✅ プロンプト強化完了')
      return result

    } catch (error) {
      console.error('❌ プロンプト強化エラー:', error)
      throw new Error(`プロンプト強化に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 複数のプロンプト候補を生成
   */
  async generatePromptVariations(inputPrompt: string, count: number = 3): Promise<EnhancedPrompt[]> {
    const variations: EnhancedPrompt[] = []
    
    for (let i = 0; i < count; i++) {
      try {
        const variation = await this.enhancePrompt(inputPrompt)
        variations.push(variation)
      } catch (error) {
        console.error(`プロンプトバリエーション ${i + 1} の生成に失敗:`, error)
      }
    }

    return variations
  }

  /**
   * プロンプトの品質を評価
   */
  async evaluatePromptQuality(prompt: string): Promise<PromptQualityEvaluation> {
    try {
      const evaluation = await this.qualityEvaluator.invoke({
        originalPrompt: prompt,
        enhancedPrompt: prompt
      })
      return evaluation
    } catch (error) {
      console.error('❌ プロンプト品質評価エラー:', error)
      throw new Error(`プロンプト品質評価に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * スタイル転送機能（オプション）
   */
  async applyStyleTransfer(prompt: string, targetStyle: string): Promise<string> {
    if (!this.config.enableStyleTransfer) {
      throw new Error('スタイル転送機能が無効です')
    }

    const styleTransferPrompt = ChatPromptTemplate.fromTemplate(`
以下のプロンプトを「{targetStyle}」スタイルに変換してください。

## 元のプロンプト
{originalPrompt}

## 目標スタイル
{targetStyle}

## 変換ガイドライン
- 元のプロンプトの主題は保持
- スタイルの特徴を反映
- 自然で一貫した表現に変換

変換されたプロンプトのみを返してください。
`)

    try {
      const result = await RunnableSequence.from([
        {
          originalPrompt: () => prompt,
          targetStyle: () => targetStyle
        },
        styleTransferPrompt,
        this.config.llmService.getModel()
      ]).invoke({})

      return result.content as string
    } catch (error) {
      console.error('❌ スタイル転送エラー:', error)
      throw new Error(`スタイル転送に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
