import { AgentType } from '@/types/llm'

export interface ClassificationResult {
  shouldRouteToAgent: boolean
  suggestedAgent?: AgentType
  confidence: number
  reasoning: string
  category: 'greeting' | 'casual_chat' | 'task_request' | 'question' | 'command'
  language: string
  complexity: 'simple' | 'moderate' | 'complex'
}

export class InputClassifier {
  // 多言語対応の挨拶・雑談パターン
  private greetingPatterns = {
    en: [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'howdy', 'sup', 'yo', 'greetings', 'salutations'
    ],
    ja: [
      'こんにちは', 'こんばんは', 'おはよう', 'おはようございます', 'こんばんは',
      'さようなら', 'お疲れ様', 'お疲れ様でした', 'よろしく', 'よろしくお願いします'
    ],
    zh: [
      '你好', '您好', '早上好', '下午好', '晚上好', '再见', '拜拜'
    ],
    ko: [
      '안녕하세요', '안녕', '좋은 아침', '좋은 오후', '좋은 저녁', '안녕히 가세요'
    ],
    es: [
      'hola', 'buenos días', 'buenas tardes', 'buenas noches', 'adiós'
    ],
    fr: [
      'bonjour', 'salut', 'bonsoir', 'au revoir', 'à bientôt'
    ],
    de: [
      'hallo', 'guten tag', 'guten morgen', 'guten abend', 'auf wiedersehen'
    ]
  }

  // 多言語対応の雑談パターン
  private casualChatPatterns = {
    en: [
      'how are you', 'how\'s it going', 'what\'s up', 'nice weather', 'good day',
      'thanks', 'thank you', 'appreciate it', 'cool', 'awesome', 'great',
      'that\'s good', 'that\'s nice', 'interesting', 'wow', 'amazing'
    ],
    ja: [
      'お元気ですか', '調子はどう', '天気がいいですね', 'いい天気ですね',
      'ありがとう', 'どうも', 'すごい', 'すばらしい', '素晴らしい',
      'それはいいですね', '面白い', 'なるほど', 'そうですね'
    ],
    zh: [
      '你好吗', '天气不错', '谢谢', '太棒了', '很好', '不错'
    ],
    ko: [
      '어떻게 지내세요', '날씨가 좋네요', '감사합니다', '멋져요', '좋아요'
    ],
    es: [
      '¿cómo estás', 'buen tiempo', 'gracias', 'genial', 'excelente'
    ],
    fr: [
      'comment allez-vous', 'beau temps', 'merci', 'génial', 'excellent'
    ],
    de: [
      'wie geht es dir', 'schönes wetter', 'danke', 'toll', 'großartig'
    ]
  }

  // 短い雑談パターン（3文字以下）
  private shortCasualPatterns = {
    en: ['hi', 'yo', 'ok', 'no', 'yes', 'wow', 'omg', 'lol', 'haha', 'hehe'],
    ja: ['はい', 'いいえ', 'うん', 'ううん', 'わあ', 'へえ', 'ふーん'],
    zh: ['好', '不', '嗯', '哇', '哦'],
    ko: ['네', '아니', '응', '와', '오'],
    es: ['sí', 'no', 'ok', 'wow', 'oh'],
    fr: ['oui', 'non', 'ok', 'wow', 'oh'],
    de: ['ja', 'nein', 'ok', 'wow', 'oh']
  }

  // 言語検出用のパターン
  private languagePatterns = {
    ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
    zh: /[\u4E00-\u9FAF]/,
    ko: /[\uAC00-\uD7AF]/,
    ar: /[\u0600-\u06FF]/,
    th: /[\u0E00-\u0E7F]/,
    hi: /[\u0900-\u097F]/,
    ru: /[\u0400-\u04FF]/,
    es: /[áéíóúñü]/,
    fr: /[àâäéèêëïîôöùûüÿç]/,
    de: /[äöüß]/
  }

  /**
   * 入力の分類を実行
   */
  classifyInput(input: string, context?: Record<string, any>): ClassificationResult {
    const normalizedInput = input.toLowerCase().trim()
    const language = this.detectLanguage(normalizedInput)
    
    // Audioが有効な場合は常にRouter Agentにルーティング
    const audioEnabled = context?.audioEnabled || false
    if (audioEnabled) {
      return {
        shouldRouteToAgent: true,
        confidence: 0.8,
        reasoning: 'Audio is enabled, routing to agent for TTS processing',
        category: 'task_request',
        language,
        complexity: 'moderate'
      }
    }
    
    // 短い入力（3文字以下）の特別処理
    if (normalizedInput.length <= 3) {
      return this.handleShortInput(normalizedInput, language)
    }

    // 挨拶パターンのチェック
    if (this.isGreeting(normalizedInput, language)) {
      return {
        shouldRouteToAgent: false,
        confidence: 0.95,
        reasoning: `${language}の挨拶パターンが検出されました`,
        category: 'greeting',
        language,
        complexity: 'simple'
      }
    }

    // 雑談パターンのチェック
    if (this.isCasualChat(normalizedInput, language)) {
      return {
        shouldRouteToAgent: false,
        confidence: 0.9,
        reasoning: `${language}の雑談パターンが検出されました`,
        category: 'casual_chat',
        language,
        complexity: 'simple'
      }
    }

    // タスク要求のチェック
    const taskResult = this.isTaskRequest(normalizedInput, language)
    if (taskResult.isTask) {
      return {
        shouldRouteToAgent: true,
        suggestedAgent: taskResult.suggestedAgent,
        confidence: taskResult.confidence,
        reasoning: taskResult.reasoning,
        category: 'task_request',
        language,
        complexity: taskResult.complexity
      }
    }

    // 質問のチェック
    if (this.isQuestion(normalizedInput, language)) {
      return {
        shouldRouteToAgent: true,
        confidence: 0.7,
        reasoning: `${language}の質問パターンが検出されました`,
        category: 'question',
        language,
        complexity: 'moderate'
      }
    }

    // コマンドのチェック
    if (this.isCommand(normalizedInput, language)) {
      return {
        shouldRouteToAgent: true,
        confidence: 0.8,
        reasoning: `${language}のコマンドパターンが検出されました`,
        category: 'command',
        language,
        complexity: 'moderate'
      }
    }

    // デフォルト：複雑な入力として扱う
    return {
      shouldRouteToAgent: true,
      confidence: 0.6,
      reasoning: '複雑な入力としてエージェントにルーティング',
      category: 'task_request',
      language,
      complexity: 'complex'
    }
  }

  /**
   * 言語を検出
   */
  private detectLanguage(input: string): string {
    // 日本語特有の文字（ひらがな、カタカナ）が含まれている場合は日本語
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(input)) {
      return 'ja'
    }
    
    // 韓国語特有の文字が含まれている場合は韓国語
    if (/[\uAC00-\uD7AF]/.test(input)) {
      return 'ko'
    }
    
    // 中国語の文字が含まれている場合は中国語として判定
    if (/[\u4E00-\u9FAF]/.test(input)) {
      return 'zh'
    }
    
    // スペイン語の特殊文字をチェック
    if (/[áéíóúñü]/.test(input)) {
      return 'es'
    }
    
    // フランス語の特殊文字をチェック
    if (/[àâäéèêëïîôöùûüÿç]/.test(input)) {
      return 'fr'
    }
    
    // ドイツ語の特殊文字をチェック
    if (/[äöüß]/.test(input)) {
      return 'de'
    }
    
    // その他の言語パターンをチェック
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (lang !== 'ja' && lang !== 'zh' && lang !== 'ko' && lang !== 'es' && lang !== 'fr' && lang !== 'de' && pattern.test(input)) {
        return lang
      }
    }
    
    return 'en' // デフォルトは英語
  }

  /**
   * 短い入力の処理
   */
  private handleShortInput(input: string, language: string): ClassificationResult {
    const shortPatterns = this.shortCasualPatterns[language as keyof typeof this.shortCasualPatterns] || this.shortCasualPatterns.en
    
    if (shortPatterns.includes(input)) {
      return {
        shouldRouteToAgent: false,
        confidence: 0.98,
        reasoning: `${language}の短い雑談パターンが検出されました`,
        category: 'casual_chat',
        language,
        complexity: 'simple'
      }
    }

    // 短いが雑談でない場合は挨拶として扱う
    return {
      shouldRouteToAgent: false,
      confidence: 0.8,
      reasoning: '短い入力ですが挨拶として扱います',
      category: 'greeting',
      language,
      complexity: 'simple'
    }
  }

  /**
   * 挨拶かどうかを判定
   */
  private isGreeting(input: string, language: string): boolean {
    const patterns = this.greetingPatterns[language as keyof typeof this.greetingPatterns] || this.greetingPatterns.en
    
    // 完全一致または単語境界での一致をチェック
    return patterns.some(pattern => {
      if (input === pattern) return true
      
      // 単語境界での一致をチェック（部分一致を防ぐ）
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      return regex.test(input)
    })
  }

  /**
   * 雑談かどうかを判定
   */
  private isCasualChat(input: string, language: string): boolean {
    const patterns = this.casualChatPatterns[language as keyof typeof this.casualChatPatterns] || this.casualChatPatterns.en
    
    // 完全一致または単語境界での一致をチェック
    return patterns.some(pattern => {
      if (input === pattern) return true
      
      // 単語境界での一致をチェック（部分一致を防ぐ）
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      return regex.test(input)
    })
  }

  /**
   * タスク要求かどうかを判定
   */
  private isTaskRequest(input: string, language: string): {
    isTask: boolean
    suggestedAgent?: AgentType
    confidence: number
    reasoning: string
    complexity: 'simple' | 'moderate' | 'complex'
  } {
    // タスク関連のキーワードパターン
    const taskKeywords = {
      en: {
        code: ['code', 'program', 'function', 'class', 'debug', 'error', 'fix', 'refactor'],
        file: ['file', 'upload', 'download', 'process', 'convert', 'parse'],
        data: ['data', 'analyze', 'chart', 'graph', 'statistics', 'calculate'],
        write: ['write', 'create', 'generate', 'compose', 'draft']
      },
      ja: {
        code: ['コード', 'プログラム', '関数', 'クラス', 'デバッグ', 'エラー', '修正', 'リファクタリング'],
        file: ['ファイル', 'アップロード', 'ダウンロード', '処理', '変換', '解析'],
        data: ['データ', '分析', 'グラフ', 'チャート', '統計', '計算'],
        write: ['書く', '作成', '生成', '執筆', '作成']
      }
    }

    const keywords = taskKeywords[language as keyof typeof taskKeywords] || taskKeywords.en
    
    // 各タスクタイプのキーワードをチェック
    for (const [taskType, taskWords] of Object.entries(keywords)) {
      const matches = taskWords.filter(word => input.includes(word))
      if (matches.length > 0) {
        const agentMap: Record<string, AgentType> = {
          code: 'code_assistant',
          file: 'file_processor',
          data: 'data_analyzer',
          write: 'creative_writer'
        }
        
        return {
          isTask: true,
          suggestedAgent: agentMap[taskType],
          confidence: Math.min(0.9, 0.6 + (matches.length * 0.1)),
          reasoning: `${taskType}関連のキーワードが検出されました`,
          complexity: matches.length > 2 ? 'complex' : 'moderate'
        }
      }
    }

    return { isTask: false, confidence: 0, reasoning: '', complexity: 'simple' }
  }

  /**
   * 質問かどうかを判定
   */
  private isQuestion(input: string, language: string): boolean {
    const questionPatterns = {
      en: /^(what|how|why|when|where|who|which|can|could|would|will|do|does|is|are|was|were)/,
      ja: /^(何|なぜ|どうして|いつ|どこ|誰|どの|どんな|いくつ|いくら|できますか|でしょうか|ですか|ますか)/,
      zh: /^(什么|为什么|什么时候|哪里|谁|哪个|怎么|多少|可以吗|是吗)/,
      ko: /^(무엇|왜|언제|어디|누가|어떤|몇|얼마|할 수 있나요|인가요)/,
      es: /^(qué|cómo|por qué|cuándo|dónde|quién|cuál|puede|podría|sería)/,
      fr: /^(quoi|comment|pourquoi|quand|où|qui|quel|peut|pourrait|serait)/,
      de: /^(was|wie|warum|wann|wo|wer|welche|kann|könnte|würde)/
    }

    const pattern = questionPatterns[language as keyof typeof questionPatterns] || questionPatterns.en
    return pattern.test(input) || input.includes('?') || input.includes('？')
  }

  /**
   * コマンドかどうかを判定
   */
  private isCommand(input: string, language: string): boolean {
    const commandPatterns = {
      en: /^(run|execute|start|stop|create|delete|update|install|build|deploy)/,
      ja: /^(実行|開始|停止|作成|削除|更新|インストール|ビルド|デプロイ)/,
      zh: /^(运行|执行|开始|停止|创建|删除|更新|安装|构建|部署)/,
      ko: /^(실행|시작|중지|생성|삭제|업데이트|설치|빌드|배포)/,
      es: /^(ejecutar|iniciar|detener|crear|eliminar|actualizar|instalar|construir|desplegar)/,
      fr: /^(exécuter|démarrer|arrêter|créer|supprimer|mettre à jour|installer|construire|déployer)/,
      de: /^(ausführen|starten|stoppen|erstellen|löschen|aktualisieren|installieren|bauen|bereitstellen)/
    }

    const pattern = commandPatterns[language as keyof typeof commandPatterns] || commandPatterns.en
    return pattern.test(input)
  }

  /**
   * デバッグ用：分類結果の詳細表示
   */
  debugClassification(input: string, context?: Record<string, any>): void {
    const result = this.classifyInput(input, context)
    console.log('=== Input Classification Debug ===')
    console.log('Input:', input)
    console.log('Language:', result.language)
    console.log('Category:', result.category)
    console.log('Should Route to Agent:', result.shouldRouteToAgent)
    console.log('Suggested Agent:', result.suggestedAgent)
    console.log('Confidence:', result.confidence)
    console.log('Reasoning:', result.reasoning)
    console.log('Complexity:', result.complexity)
    console.log('====================================')
  }
}
