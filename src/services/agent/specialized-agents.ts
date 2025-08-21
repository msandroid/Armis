import { LlamaService } from '@/services/llm/llama-service'
import { Agent, AgentResponse } from './router-agent'
import { AgentType } from '@/types/llm'
import { SequentialThinkingAgent } from './sequential-thinking-agent'

export class GeneralAgent implements Agent {
  type: AgentType = 'general'
  name = 'General Assistant'
  description = '汎用的な質問や会話に対応するエージェント'
  keywords = ['質問', '会話', '雑談', '説明', '一般']

  constructor(private llmService: LlamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      const response = await this.llmService.generateResponse(input)
      
      return {
        agentType: this.type,
        content: response.text,
        metadata: {
          tokens: response.tokens,
          duration: response.duration,
          model: 'general'
        },
        executionTime: Date.now() - startTime,
        success: true
      }
    } catch (error) {
      return {
        agentType: this.type,
        content: `エラーが発生しました: ${error.message}`,
        metadata: { error: error.message },
        executionTime: Date.now() - startTime,
        success: false,
        error: error.message
      }
    }
  }
}

export class CodeAssistantAgent implements Agent {
  type: AgentType = 'code_assistant'
  name = 'Code Assistant'
  description = 'プログラミングやコード関連の質問に対応するエージェント'
  keywords = ['コード', 'プログラミング', '開発', 'デバッグ', 'アルゴリズム', '関数', 'クラス', 'TypeScript', 'JavaScript', 'Python']

  constructor(private llmService: LlamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      const codePrompt = `
あなたは優秀なプログラマーです。以下の質問や要求に対して、適切なコードと説明を提供してください。

要求: ${input}

以下の点に注意して回答してください：
1. コードは実用的で実行可能であること
2. 適切なコメントを付けること
3. エラーハンドリングを考慮すること
4. ベストプラクティスに従うこと
5. 必要に応じて複数の解決策を提示すること
`

      const response = await this.llmService.generateResponse(codePrompt)
      
      return {
        agentType: this.type,
        content: response.text,
        metadata: {
          tokens: response.tokens,
          duration: response.duration,
          model: 'code-assistant',
          language: this.detectLanguage(input)
        },
        executionTime: Date.now() - startTime,
        success: true
      }
    } catch (error) {
      return {
        agentType: this.type,
        content: `コード生成中にエラーが発生しました: ${error.message}`,
        metadata: { error: error.message },
        executionTime: Date.now() - startTime,
        success: false,
        error: error.message
      }
    }
  }

  private detectLanguage(input: string): string {
    const languages = ['TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust']
    for (const lang of languages) {
      if (input.toLowerCase().includes(lang.toLowerCase())) {
        return lang
      }
    }
    return 'general'
  }
}

export class FileProcessorAgent implements Agent {
  type: AgentType = 'file_processor'
  name = 'File Processor'
  description = 'ファイル処理やファイル関連の操作に対応するエージェント'
  keywords = ['ファイル', 'アップロード', 'ダウンロード', '処理', '変換', '解析', '読み込み', '書き込み']

  constructor(private llmService: LlamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      const filePrompt = `
あなたはファイル処理の専門家です。以下の要求に対して、適切なファイル処理方法やコードを提供してください。

要求: ${input}

以下の点に注意して回答してください：
1. ファイル形式の適切な処理方法
2. エラーハンドリングとバリデーション
3. パフォーマンスの考慮
4. セキュリティの考慮
5. クロスプラットフォーム対応
`

      const response = await this.llmService.generateResponse(filePrompt)
      
      return {
        agentType: this.type,
        content: response.text,
        metadata: {
          tokens: response.tokens,
          duration: response.duration,
          model: 'file-processor',
          fileTypes: this.detectFileTypes(input)
        },
        executionTime: Date.now() - startTime,
        success: true
      }
    } catch (error) {
      return {
        agentType: this.type,
        content: `ファイル処理中にエラーが発生しました: ${error.message}`,
        metadata: { error: error.message },
        executionTime: Date.now() - startTime,
        success: false,
        error: error.message
      }
    }
  }

  private detectFileTypes(input: string): string[] {
    const fileExtensions = ['.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs']
    const detected = fileExtensions.filter(ext => input.toLowerCase().includes(ext))
    return detected.length > 0 ? detected : ['general']
  }
}

export class DataAnalyzerAgent implements Agent {
  type: AgentType = 'data_analyzer'
  name = 'Data Analyzer'
  description = 'データ分析や統計処理に対応するエージェント'
  keywords = ['データ', '分析', '統計', 'グラフ', 'チャート', '可視化', '集計', '計算', '数値', 'パターン']

  constructor(private llmService: LlamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      const dataPrompt = `
あなたはデータ分析の専門家です。以下の要求に対して、適切なデータ分析方法やコードを提供してください。

要求: ${input}

以下の点に注意して回答してください：
1. 適切な統計手法の選択
2. データの前処理とクリーニング
3. 可視化の提案
4. 結果の解釈方法
5. 仮説検定の適用
6. 機械学習手法の提案（必要に応じて）
`

      const response = await this.llmService.generateResponse(dataPrompt)
      
      return {
        agentType: this.type,
        content: response.text,
        metadata: {
          tokens: response.tokens,
          duration: response.duration,
          model: 'data-analyzer',
          analysisType: this.detectAnalysisType(input)
        },
        executionTime: Date.now() - startTime,
        success: true
      }
    } catch (error) {
      return {
        agentType: this.type,
        content: `データ分析中にエラーが発生しました: ${error.message}`,
        metadata: { error: error.message },
        executionTime: Date.now() - startTime,
        success: false,
        error: error.message
      }
    }
  }

  private detectAnalysisType(input: string): string {
    const analysisTypes = {
      '統計': 'statistical',
      '可視化': 'visualization',
      '機械学習': 'machine-learning',
      '予測': 'prediction',
      '分類': 'classification',
      '回帰': 'regression'
    }
    
    for (const [keyword, type] of Object.entries(analysisTypes)) {
      if (input.includes(keyword)) {
        return type
      }
    }
    return 'general'
  }
}

export class CreativeWriterAgent implements Agent {
  type: AgentType = 'creative_writer'
  name = 'Creative Writer'
  description = '創造的な文章作成やコンテンツ生成に対応するエージェント'
  keywords = ['文章', '作成', '執筆', '物語', '小説', '詩', '歌詞', 'マーケティング', '広告', 'ブログ', '記事']

  constructor(private llmService: LlamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      const creativePrompt = `
あなたは創造的な文章作成の専門家です。以下の要求に対して、魅力的で質の高いコンテンツを提供してください。

要求: ${input}

以下の点に注意して回答してください：
1. 適切な文体とトーンの選択
2. 読者の興味を引く構成
3. 明確で分かりやすい表現
4. 感情に訴える要素の活用
5. 目的に応じた最適化
`

      const response = await this.llmService.generateResponse(creativePrompt)
      
      return {
        agentType: this.type,
        content: response.text,
        metadata: {
          tokens: response.tokens,
          duration: response.duration,
          model: 'creative-writer',
          writingStyle: this.detectWritingStyle(input)
        },
        executionTime: Date.now() - startTime,
        success: true
      }
    } catch (error) {
      return {
        agentType: this.type,
        content: `文章作成中にエラーが発生しました: ${error.message}`,
        metadata: { error: error.message },
        executionTime: Date.now() - startTime,
        success: false,
        error: error.message
      }
    }
  }

  private detectWritingStyle(input: string): string {
    const styles = {
      '物語': 'narrative',
      '詩': 'poetry',
      '歌詞': 'lyrics',
      'マーケティング': 'marketing',
      '技術': 'technical',
      'ブログ': 'blog'
    }
    
    for (const [keyword, style] of Object.entries(styles)) {
      if (input.includes(keyword)) {
        return style
      }
    }
    return 'general'
  }
}

export class SequentialThinkingAgentWrapper implements Agent {
  type: AgentType = 'sequential_thinking'
  name = 'Sequential Thinking Agent'
  description = '複雑な問題を段階的に分析し解決するエージェント'
  keywords = ['分析', '段階的', '計画', '戦略', '複雑', '論理的', '思考', '解決']

  constructor(private sequentialAgent: SequentialThinkingAgent) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      const plan = await this.sequentialAgent.processUserIntent(input, context)
      
      // Convert plan to readable content
      const content = this.formatPlanAsContent(plan)
      
      return {
        agentType: this.type,
        content,
        metadata: {
          planId: plan.id,
          stepsCount: plan.steps.length,
          status: plan.status,
          model: 'sequential-thinking'
        },
        executionTime: Date.now() - startTime,
        success: plan.status === 'completed'
      }
    } catch (error) {
      return {
        agentType: this.type,
        content: `段階的思考中にエラーが発生しました: ${error.message}`,
        metadata: { error: error.message },
        executionTime: Date.now() - startTime,
        success: false,
        error: error.message
      }
    }
  }

  private formatPlanAsContent(plan: any): string {
    let content = `## 段階的思考計画\n\n`
    content += `**ステータス**: ${plan.status}\n\n`
    
    if (plan.steps.length > 0) {
      content += `**実行ステップ**:\n\n`
      plan.steps.forEach((step: any, index: number) => {
        content += `${index + 1}. **${step.type}**: ${step.content}\n`
        if (step.result) {
          content += `   結果: ${JSON.stringify(step.result, null, 2)}\n`
        }
        content += `\n`
      })
    }
    
    return content
  }
}
