import { AgentType } from '@/types/llm'

export interface InputAnalysis {
  needsRouterAgent: boolean
  suggestedAgent?: AgentType
  confidence: number
  reasoning: string
  complexity: 'simple' | 'moderate' | 'complex'
  keywords: string[]
}

export class InputAnalyzer {
  private routerKeywords: Map<AgentType, string[]> = new Map([
    ['code_assistant', [
      'コード', 'プログラミング', '開発', 'デバッグ', 'アルゴリズム', '関数', 'クラス',
      'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Node.js', 'API', 'データベース', 'SQL',
      'HTML', 'CSS', 'フレームワーク', 'ライブラリ', 'パッケージ', 'npm', 'yarn',
      'git', 'GitHub', 'デプロイ', 'テスト', 'ユニットテスト', '統合テスト',
      'エラー', 'バグ', '修正', '最適化', 'リファクタリング', 'アーキテクチャ',
      'デザインパターン', 'SOLID', 'DRY', 'KISS', 'パフォーマンス', 'セキュリティ'
    ]],
    ['file_processor', [
      'ファイル', 'アップロード', 'ダウンロード', '処理', '変換', '解析', '読み込み', '書き込み',
      'CSV', 'JSON', 'XML', 'PDF', 'Word', 'Excel', 'PowerPoint', '画像', '動画', '音声',
      '圧縮', '解凍', 'バックアップ', '同期', 'バージョン管理', 'フォルダ', 'ディレクトリ',
      'パス', '拡張子', 'MIMEタイプ', 'エンコーディング', '文字コード', 'バイナリ', 'テキスト'
    ]],
    ['data_analyzer', [
      'データ', '分析', '統計', 'グラフ', 'チャート', '可視化', '集計', '計算', '数値',
      'パターン', 'トレンド', '相関', '回帰', '分類', 'クラスタリング', '機械学習',
      'AI', '予測', 'モデル', 'アルゴリズム', 'データセット', 'サンプル', '母集団',
      '平均', '中央値', '最頻値', '分散', '標準偏差', '信頼区間', '仮説検定',
      'Excel', 'Python', 'R', 'SQL', 'Tableau', 'PowerBI', 'Jupyter'
    ]],
    ['creative_writer', [
      '文章', '作成', '執筆', '物語', '小説', '詩', '歌詞', 'マーケティング', '広告',
      'ブログ', '記事', 'レポート', 'プレゼンテーション', 'スクリプト', 'シナリオ',
      'キャッチコピー', 'SNS', 'ツイート', '投稿', 'コンテンツ', 'SEO', 'キーワード',
      'ターゲット', 'ブランディング', 'ストーリーテリング', '感情', '共感', '説得'
    ]],
    ['sequential_thinking', [
      '分析', '段階的', '計画', '戦略', '複雑', '論理的', '思考', '解決', 'プロセス',
      'ステップ', '手順', '方法論', 'アプローチ', 'フレームワーク', 'モデル',
      '設計', 'アーキテクチャ', 'システム', '統合', '最適化', '改善', '改革',
      '問題解決', '意思決定', '評価', '比較', '選択', '実装', '実行'
    ]]
  ])

  private simpleKeywords: string[] = [
    'こんにちは', 'こんばんは', 'おはよう', 'ありがとう', 'どうも', 'よろしく',
    '天気', '時間', '日付', '今日', '明日', '昨日', '今', '最近',
    '簡単', '基本的', '一般的', '普通', '通常', '標準',
    '説明', '教えて', '何', 'なぜ', 'どうして', 'いつ', 'どこ', '誰',
    'はい', 'いいえ', 'そう', 'そうですね', 'なるほど', '確かに'
  ]

  analyzeInput(input: string, context?: Record<string, any>): InputAnalysis {
    const normalizedInput = input.toLowerCase().trim()
    const words = normalizedInput.split(/\s+/)
    
    // Audioが有効な場合は常にRouter Agentにルーティング
    const audioEnabled = context?.audioEnabled || false
    if (audioEnabled) {
      return {
        needsRouterAgent: true,
        confidence: 0.8,
        reasoning: 'Audio is enabled, routing to agent for TTS processing',
        complexity: 'moderate',
        keywords: ['audio', 'tts']
      }
    }
    
    // 単純な会話かどうかをチェック
    if (this.isSimpleConversation(normalizedInput, words)) {
      return {
        needsRouterAgent: false,
        confidence: 0.9,
        reasoning: '単純な会話や基本的な質問のため、通常のLLMで処理可能',
        complexity: 'simple',
        keywords: []
      }
    }

    // ファイル添付がある場合はファイル処理エージェントを推奨
    if (context?.files && context.files.length > 0) {
      return {
        needsRouterAgent: true,
        suggestedAgent: 'file_processor',
        confidence: 0.95,
        reasoning: 'ファイルが添付されているため、ファイル処理エージェントを使用',
        complexity: 'moderate',
        keywords: ['file_processor']
      }
    }

    // 各エージェントのキーワードをチェック
    const agentScores = new Map<AgentType, number>()
    
    for (const [agentType, keywords] of this.routerKeywords) {
      let score = 0
      const matchedKeywords: string[] = []
      
      for (const keyword of keywords) {
        if (normalizedInput.includes(keyword.toLowerCase())) {
          score += 1
          matchedKeywords.push(keyword)
        }
      }
      
      if (score > 0) {
        agentScores.set(agentType, score)
      }
    }

    // 最も適切なエージェントを選択
    if (agentScores.size > 0) {
      const bestAgent = Array.from(agentScores.entries())
        .sort(([,a], [,b]) => b - a)[0]
      
      const complexity = this.assessComplexity(normalizedInput, words, bestAgent[1])
      
      return {
        needsRouterAgent: true,
        suggestedAgent: bestAgent[0],
        confidence: Math.min(0.9, 0.5 + (bestAgent[1] * 0.1)),
        reasoning: `キーワードマッチングにより${bestAgent[0]}エージェントが最適と判断`,
        complexity,
        keywords: Array.from(agentScores.keys())
      }
    }

    // 複雑さを評価
    const complexity = this.assessComplexity(normalizedInput, words, 0)
    
    // 複雑な場合はSequential Thinkingエージェントを推奨
    if (complexity === 'complex') {
      return {
        needsRouterAgent: true,
        suggestedAgent: 'sequential_thinking',
        confidence: 0.7,
        reasoning: '複雑な要求のため、段階的思考エージェントを使用',
        complexity,
        keywords: ['sequential_thinking']
      }
    }

    // デフォルト：通常のLLMを使用
    return {
      needsRouterAgent: false,
      confidence: 0.8,
      reasoning: '特定の専門分野に該当しないため、通常のLLMで処理',
      complexity,
      keywords: []
    }
  }

  private isSimpleConversation(input: string, words: string[]): boolean {
    // 短い文章（20文字以下）
    if (input.length <= 20) {
      return true
    }

    // 単純なキーワードが含まれている
    const hasSimpleKeywords = this.simpleKeywords.some(keyword => 
      input.includes(keyword)
    )

    // 質問文のパターン
    const isSimpleQuestion = /^(何|なぜ|どうして|いつ|どこ|誰|どの|どんな|いくつ|いくら)/.test(input)

    // 挨拶パターン
    const isGreeting = /^(こんにちは|こんばんは|おはよう|さようなら|お疲れ様|ありがとう)/.test(input)

    return hasSimpleKeywords || isSimpleQuestion || isGreeting
  }

  private assessComplexity(input: string, words: string[], keywordScore: number): 'simple' | 'moderate' | 'complex' {
    const lengthScore = Math.min(1, input.length / 100) // 長さによるスコア
    const wordScore = Math.min(1, words.length / 20) // 単語数によるスコア
    const keywordWeight = Math.min(1, keywordScore / 5) // キーワードスコア

    const totalScore = (lengthScore + wordScore + keywordWeight) / 3

    if (totalScore < 0.3) return 'simple'
    if (totalScore < 0.6) return 'moderate'
    return 'complex'
  }

  // デバッグ用：分析結果の詳細表示
  debugAnalysis(input: string, context?: Record<string, any>): void {
    const analysis = this.analyzeInput(input, context)
    console.log('=== Input Analysis Debug ===')
    console.log('Input:', input)
    console.log('Needs Router Agent:', analysis.needsRouterAgent)
    console.log('Suggested Agent:', analysis.suggestedAgent)
    console.log('Confidence:', analysis.confidence)
    console.log('Reasoning:', analysis.reasoning)
    console.log('Complexity:', analysis.complexity)
    console.log('Keywords:', analysis.keywords)
    console.log('============================')
  }
}
