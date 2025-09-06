import { LlamaService } from '@/services/llm/llama-service'
import { OllamaService } from '@/services/llm/ollama-service'
import { LangChainAgent } from './langchain-router-agent'
import { AgentType, AgentResponse } from '@/types/llm'

export class CodeAssistantAgent implements LangChainAgent {
  type: AgentType = 'code_assistant'
  name = 'Code Assistant Agent'
  description = 'コードの作成、修正、リファクタリング、デバッグを専門とするエージェント'
  keywords = [
    'コード', 'プログラミング', '開発', 'デバッグ', 'リファクタリング', 'アルゴリズム',
    '関数', 'クラス', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#',
    'React', 'Vue', 'Angular', 'Node.js', 'API', 'データベース', 'SQL',
    'HTML', 'CSS', 'フレームワーク', 'ライブラリ', 'パッケージ', 'npm', 'yarn',
    'git', 'GitHub', 'デプロイ', 'テスト', 'ユニットテスト', '統合テスト',
    'エラー', 'バグ', '修正', '最適化', 'アーキテクチャ', 'デザインパターン'
  ]
  capabilities = ['code_generation', 'code_review', 'debugging', 'refactoring', 'testing']

  constructor(private llmService: LlamaService | OllamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const codePrompt = `
You are a professional code assistant. Please help with the following request:

${input}

${context?.files ? `Files provided: ${context.files.map((f: any) => f.name).join(', ')}` : ''}

Please provide:
1. Clear, well-documented code
2. Explanations of your approach
3. Best practices and recommendations
4. Any potential issues or considerations

Respond in a helpful, professional manner.
`

    const response = await this.llmService.generateResponse(codePrompt)
    
    return {
      content: response.text || response.response,
      agentType: this.type,
      confidence: 0.9,
      reasoning: 'Code assistant specialized in programming tasks',
      metadata: {
        capabilities: this.capabilities,
        language: this.detectLanguage(input),
        complexity: this.assessCodeComplexity(input)
      },
      executionTime: 0,
      success: true
    }
  }

  async canHandle(input: string, context?: Record<string, any>): Promise<{ canHandle: boolean; confidence: number; reasoning: string }> {
    const hasCodeKeywords = this.keywords.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    )
    
    const hasCodePatterns = /```[\s\S]*```|function\s*\(|class\s+\w+|import\s+|export\s+|const\s+|let\s+|var\s+/.test(input)
    
    const hasFiles = context?.files && context.files.length > 0
    
    if (hasCodeKeywords || hasCodePatterns || hasFiles) {
      return {
        canHandle: true,
        confidence: 0.85,
        reasoning: 'Input contains code-related keywords, patterns, or files'
      }
    }
    
    return {
      canHandle: false,
      confidence: 0.1,
      reasoning: 'Input does not appear to be code-related'
    }
  }

  private detectLanguage(input: string): string {
    const languagePatterns = {
      'typescript': /typescript|tsx?|\.ts/,
      'javascript': /javascript|jsx?|\.js/,
      'python': /python|\.py/,
      'java': /java|\.java/,
      'cpp': /c\+\+|\.cpp/,
      'csharp': /c#|\.cs/,
      'html': /html|\.html/,
      'css': /css|\.css/,
      'sql': /sql|\.sql/
    }
    
    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(input.toLowerCase())) {
        return lang
      }
    }
    
    return 'unknown'
  }

  private assessCodeComplexity(input: string): 'simple' | 'moderate' | 'complex' {
    const hasComplexPatterns = /class\s+\w+|async\s+function|Promise|async\/await|generator|iterator/.test(input)
    const hasSimplePatterns = /console\.log|alert|basic\s+function/.test(input)
    
    if (hasComplexPatterns) return 'complex'
    if (hasSimplePatterns) return 'simple'
    return 'moderate'
  }
}

export class FileProcessorAgent implements LangChainAgent {
  type: AgentType = 'file_processor'
  name = 'File Processor Agent'
  description = 'ファイルの処理、変換、解析を専門とするエージェント'
  keywords = [
    'ファイル', 'アップロード', 'ダウンロード', '処理', '変換', '解析', '読み込み', '書き込み',
    'CSV', 'JSON', 'XML', 'PDF', 'Word', 'Excel', 'PowerPoint', '画像', '動画', '音声',
    '圧縮', '解凍', 'バックアップ', '同期', 'バージョン管理', 'フォルダ', 'ディレクトリ',
    'パス', '拡張子', 'MIMEタイプ', 'エンコーディング', '文字コード', 'バイナリ', 'テキスト'
  ]
  capabilities = ['file_processing', 'format_conversion', 'file_analysis', 'data_extraction']

  constructor(private llmService: LlamaService | OllamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const filePrompt = `
You are a file processing specialist. Please help with the following file-related request:

${input}

${context?.files ? `Files to process: ${context.files.map((f: any) => `${f.name} (${f.type}, ${f.size} bytes)`).join(', ')}` : ''}

Please provide:
1. Detailed analysis of the files
2. Processing recommendations
3. Potential issues or limitations
4. Best practices for file handling

Respond with practical, actionable advice.
`

    const response = await this.llmService.generateResponse(filePrompt)
    
    return {
      content: response.text || response.response,
      agentType: this.type,
      confidence: 0.9,
      reasoning: 'File processor specialized in file handling tasks',
      metadata: {
        capabilities: this.capabilities,
        fileTypes: this.detectFileTypes(context?.files),
        processingType: this.determineProcessingType(input)
      },
      executionTime: 0,
      success: true
    }
  }

  async canHandle(input: string, context?: Record<string, any>): Promise<{ canHandle: boolean; confidence: number; reasoning: string }> {
    const hasFileKeywords = this.keywords.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    )
    
    const hasFiles = context?.files && context.files.length > 0
    
    if (hasFileKeywords || hasFiles) {
      return {
        canHandle: true,
        confidence: 0.9,
        reasoning: 'Input contains file-related keywords or actual files'
      }
    }
    
    return {
      canHandle: false,
      confidence: 0.1,
      reasoning: 'Input does not appear to be file-related'
    }
  }

  private detectFileTypes(files?: any[]): string[] {
    if (!files) return []
    
    const types = new Set<string>()
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension) {
        types.add(extension)
      }
    }
    
    return Array.from(types)
  }

  private determineProcessingType(input: string): string {
    if (/変換|convert/.test(input)) return 'conversion'
    if (/解析|analyze/.test(input)) return 'analysis'
    if (/処理|process/.test(input)) return 'processing'
    if (/読み込み|read/.test(input)) return 'reading'
    if (/書き込み|write/.test(input)) return 'writing'
    return 'general'
  }
}

export class DataAnalyzerAgent implements LangChainAgent {
  type: AgentType = 'data_analyzer'
  name = 'Data Analyzer Agent'
  description = 'データの分析、統計、可視化を専門とするエージェント'
  keywords = [
    'データ', '分析', '統計', 'グラフ', 'チャート', '可視化', '集計', '計算', '数値',
    'パターン', 'トレンド', '相関', '回帰', '分類', 'クラスタリング', '機械学習',
    'AI', '予測', 'モデル', 'アルゴリズム', 'データセット', 'サンプル', '母集団',
    '平均', '中央値', '最頻値', '分散', '標準偏差', '信頼区間', '仮説検定',
    'Excel', 'Python', 'R', 'SQL', 'Tableau', 'PowerBI', 'Jupyter'
  ]
  capabilities = ['data_analysis', 'statistical_analysis', 'data_visualization', 'predictive_modeling']

  constructor(private llmService: LlamaService | OllamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const dataPrompt = `
You are a data analysis specialist. Please help with the following data-related request:

${input}

${context?.files ? `Data files: ${context.files.map((f: any) => f.name).join(', ')}` : ''}

Please provide:
1. Data analysis approach and methodology
2. Statistical methods and techniques
3. Visualization recommendations
4. Interpretation of results
5. Potential insights and conclusions

Provide analytical, data-driven insights.
`

    const response = await this.llmService.generateResponse(dataPrompt)
    
    return {
      content: response.text || response.response,
      agentType: this.type,
      confidence: 0.9,
      reasoning: 'Data analyzer specialized in analytical tasks',
      metadata: {
        capabilities: this.capabilities,
        analysisType: this.determineAnalysisType(input),
        dataSource: this.detectDataSource(context?.files)
      }
    }
  }

  async canHandle(input: string, context?: Record<string, any>): Promise<{ canHandle: boolean; confidence: number; reasoning: string }> {
    const hasDataKeywords = this.keywords.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    )
    
    const hasDataFiles = context?.files && context.files.some((f: any) => 
      /\.(csv|json|xml|excel?|xlsx?|sql|db)$/i.test(f.name)
    )
    
    if (hasDataKeywords || hasDataFiles) {
      return {
        canHandle: true,
        confidence: 0.85,
        reasoning: 'Input contains data-related keywords or data files'
      }
    }
    
    return {
      canHandle: false,
      confidence: 0.1,
      reasoning: 'Input does not appear to be data-related'
    }
  }

  private determineAnalysisType(input: string): string {
    if (/統計|statistics/.test(input)) return 'statistical'
    if (/可視化|visualization|グラフ|chart/.test(input)) return 'visualization'
    if (/予測|prediction|機械学習|machine learning/.test(input)) return 'predictive'
    if (/相関|correlation/.test(input)) return 'correlation'
    if (/分類|classification/.test(input)) return 'classification'
    return 'general'
  }

  private detectDataSource(files?: any[]): string {
    if (!files) return 'text_input'
    
    const dataFiles = files.filter(f => /\.(csv|json|xml|excel?|xlsx?|sql|db)$/i.test(f.name))
    if (dataFiles.length > 0) {
      return dataFiles[0].name.split('.').pop()?.toLowerCase() || 'unknown'
    }
    
    return 'text_input'
  }
}

export class CreativeWriterAgent implements LangChainAgent {
  type: AgentType = 'creative_writer'
  name = 'Creative Writer Agent'
  description = '文章作成、執筆、クリエイティブなコンテンツ制作を専門とするエージェント'
  keywords = [
    '文章', '作成', '執筆', '物語', '小説', '詩', '歌詞', 'マーケティング', '広告',
    'ブログ', '記事', 'レポート', 'プレゼンテーション', 'スクリプト', 'シナリオ',
    'キャッチコピー', 'SNS', 'ツイート', '投稿', 'コンテンツ', 'SEO', 'キーワード',
    'ターゲット', 'ブランディング', 'ストーリーテリング', '感情', '共感', '説得'
  ]
  capabilities = ['content_creation', 'copywriting', 'storytelling', 'marketing_content']

  constructor(private llmService: LlamaService | OllamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const creativePrompt = `
You are a creative writing specialist. Please help with the following creative request:

${input}

Please provide:
1. Creative and engaging content
2. Appropriate tone and style
3. Clear structure and flow
4. Engaging storytelling elements
5. Call-to-action if appropriate

Create compelling, original content that resonates with the target audience.
`

    const response = await this.llmService.generateResponse(creativePrompt)
    
    return {
      content: response.text || response.response,
      agentType: this.type,
      confidence: 0.9,
      reasoning: 'Creative writer specialized in content creation',
      metadata: {
        capabilities: this.capabilities,
        contentType: this.determineContentType(input),
        targetAudience: this.detectTargetAudience(input)
      }
    }
  }

  async canHandle(input: string, context?: Record<string, any>): Promise<{ canHandle: boolean; confidence: number; reasoning: string }> {
    const hasCreativeKeywords = this.keywords.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    )
    
    const hasCreativeIntent = /作成|執筆|書いて|作って|物語|詩|歌詞|ブログ|記事|マーケティング/.test(input)
    
    if (hasCreativeKeywords || hasCreativeIntent) {
      return {
        canHandle: true,
        confidence: 0.8,
        reasoning: 'Input contains creative writing keywords or intent'
      }
    }
    
    return {
      canHandle: false,
      confidence: 0.1,
      reasoning: 'Input does not appear to be creative writing related'
    }
  }

  private determineContentType(input: string): string {
    if (/物語|小説|story/.test(input)) return 'story'
    if (/詩|poem/.test(input)) return 'poetry'
    if (/歌詞|lyrics/.test(input)) return 'lyrics'
    if (/ブログ|blog/.test(input)) return 'blog'
    if (/記事|article/.test(input)) return 'article'
    if (/マーケティング|marketing/.test(input)) return 'marketing'
    if (/SNS|ツイート|tweet/.test(input)) return 'social_media'
    return 'general'
  }

  private detectTargetAudience(input: string): string {
    if (/子供|child/.test(input)) return 'children'
    if (/ビジネス|business/.test(input)) return 'business'
    if (/技術|technical/.test(input)) return 'technical'
    if (/一般|general/.test(input)) return 'general'
    return 'general'
  }
}

export class SequentialThinkingAgentWrapper implements LangChainAgent {
  type: AgentType = 'sequential_thinking'
  name = 'Sequential Thinking Agent'
  description = '複雑な問題を段階的に分析し、論理的に解決するエージェント'
  keywords = [
    '分析', '段階的', '計画', '戦略', '複雑', '論理的', '思考', '解決', 'プロセス',
    'ステップ', '手順', '方法論', 'アプローチ', 'フレームワーク', 'モデル',
    '設計', 'アーキテクチャ', 'システム', '統合', '最適化', '改善', '改革',
    '問題解決', '意思決定', '評価', '比較', '選択', '実装', '実行'
  ]
  capabilities = ['complex_analysis', 'step_by_step_thinking', 'logical_reasoning', 'strategic_planning']

  constructor(private llmService: LlamaService | OllamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const thinkingPrompt = `
You are a sequential thinking specialist. Please analyze and solve the following complex problem step by step:

${input}

Please provide:
1. Step-by-step analysis of the problem
2. Logical reasoning for each step
3. Clear methodology and approach
4. Potential solutions and alternatives
5. Recommendations and next steps

Think through this systematically and provide a well-structured response.
`

    const response = await this.llmService.generateResponse(thinkingPrompt)
    
    return {
      content: response.text || response.response,
      agentType: this.type,
      confidence: 0.9,
      reasoning: 'Sequential thinking agent for complex problem solving',
      metadata: {
        capabilities: this.capabilities,
        complexity: this.assessComplexity(input),
        approach: this.determineApproach(input)
      }
    }
  }

  async canHandle(input: string, context?: Record<string, any>): Promise<{ canHandle: boolean; confidence: number; reasoning: string }> {
    const hasComplexKeywords = this.keywords.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    )
    
    const isComplex = input.length > 100 || input.split(/\s+/).length > 20
    
    if (hasComplexKeywords || isComplex) {
      return {
        canHandle: true,
        confidence: 0.7,
        reasoning: 'Input appears to be complex and requires systematic analysis'
      }
    }
    
    return {
      canHandle: false,
      confidence: 0.2,
      reasoning: 'Input appears to be simple and may not require sequential thinking'
    }
  }

  private assessComplexity(input: string): 'simple' | 'moderate' | 'complex' {
    const length = input.length
    const wordCount = input.split(/\s+/).length
    
    if (length < 50 && wordCount < 10) return 'simple'
    if (length > 200 || wordCount > 50) return 'complex'
    return 'moderate'
  }

  private determineApproach(input: string): string {
    if (/分析|analyze/.test(input)) return 'analytical'
    if (/計画|plan/.test(input)) return 'planning'
    if (/解決|solve/.test(input)) return 'problem_solving'
    if (/設計|design/.test(input)) return 'design'
    if (/最適化|optimize/.test(input)) return 'optimization'
    return 'general'
  }
}

export class GeneralAgent implements LangChainAgent {
  type: AgentType = 'general'
  name = 'General Agent'
  description = '汎用的なタスクを処理するエージェント'
  keywords = ['general', 'basic', 'simple', 'help', 'assist']
  capabilities = ['text_generation', 'conversation', 'general_assistance']

  constructor(private llmService: LlamaService | OllamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    const response = await this.llmService.generateResponse(input)
    
    return {
      content: response.text || response.response,
      agentType: this.type,
      confidence: 0.8,
      reasoning: '',
      metadata: {
        capabilities: this.capabilities,
        responseType: 'general'
      }
    }
  }

  async canHandle(input: string, context?: Record<string, any>): Promise<{ canHandle: boolean; confidence: number; reasoning: string }> {
    return {
      canHandle: true,
      confidence: 0.5,
      reasoning: 'General agent can handle any input'
    }
  }
}
