import { LangChainChainsService, ChainConfig } from '@/services/agent/langchain-chains-service'
import { ConstitutionalPrinciple } from 'langchain/chains'
// import { MemoryVectorStore } from '@langchain/community/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'
import { Document } from '@langchain/core/documents'

/**
 * LangChain.jsのchainsの使用例
 */
export class LangChainChainsExamples {
  private chainsService: LangChainChainsService

  constructor() {
    const config: ChainConfig = {
      modelType: 'openai',
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7
    }
    
    this.chainsService = new LangChainChainsService(config)
  }

  /**
   * 基本的なLLMChainの使用例
   */
  async basicLLMChainExample(): Promise<void> {
    console.log('=== Basic LLMChain Example ===')
    
    await this.chainsService.initialize()
    
    // 基本的なLLMChainを作成
    const chain = this.chainsService.createLLMChain(
      'あなたは親切なアシスタントです。以下の質問に答えてください：{question}',
      'basic_assistant'
    )
    
    // Chainを実行
    const result = await this.chainsService.executeChain('basic_assistant', {
      question: 'JavaScriptで配列をソートする方法を教えてください'
    })
    
    console.log('Result:', result.output)
    console.log('Execution time:', result.executionTime, 'ms')
  }

  /**
   * 会話Chainの使用例
   */
  async conversationChainExample(): Promise<void> {
    console.log('=== ConversationChain Example ===')
    
    await this.chainsService.initialize()
    
    // 会話Chainを作成
    this.chainsService.createConversationChain()
    
    // 複数の会話を実行
    const conversations = [
      { input: 'こんにちは！' },
      { input: '私の名前は田中です。' },
      { input: '私の名前を覚えていますか？' }
    ]
    
    for (const conv of conversations) {
      const result = await this.chainsService.executeChain('conversation_chain', conv)
      console.log(`User: ${conv.input}`)
      console.log(`Assistant: ${result.output.response}`)
      console.log('---')
    }
  }

  /**
   * シーケンシャルChainの使用例
   */
  async sequentialChainExample(): Promise<void> {
    console.log('=== SequentialChain Example ===')
    
    await this.chainsService.initialize()
    
    // 複数のChainを作成
    const translateChain = this.chainsService.createLLMChain(
      '以下の英語を日本語に翻訳してください：{text}',
      'translate_chain'
    )
    
    const summarizeChain = this.chainsService.createLLMChain(
      '以下の日本語のテキストを要約してください：{translated_text}',
      'summarize_chain'
    )
    
    // シーケンシャルChainを作成
    this.chainsService.createSequentialChain(
      [translateChain, summarizeChain],
      ['text'],
      ['translated_text', 'summary']
    )
    
    // 実行
    const result = await this.chainsService.executeChain('sequential_chain', {
      text: 'Artificial Intelligence is transforming the way we work and live. It has the potential to solve complex problems and improve efficiency across various industries.'
    })
    
    console.log('Original text:', result.output.text)
    console.log('Translated text:', result.output.translated_text)
    console.log('Summary:', result.output.summary)
  }

  /**
   * ルーターChainの使用例
   */
  async routerChainExample(): Promise<void> {
    console.log('=== RouterChain Example ===')
    
    await this.chainsService.initialize()
    
    // ルーターの目的地を定義
    const destinations = [
      {
        name: 'code_assistant',
        description: 'プログラミング関連の質問',
        promptTemplate: 'あなたは経験豊富なプログラマーです。コードの問題を解決してください：{input}',
        chainType: 'code'
      },
      {
        name: 'writing_assistant',
        description: '文章作成関連の質問',
        promptTemplate: 'あなたはプロのライターです。文章作成を支援してください：{input}',
        chainType: 'writing'
      },
      {
        name: 'math_assistant',
        description: '数学関連の質問',
        promptTemplate: 'あなたは数学の専門家です。数学の問題を解決してください：{input}',
        chainType: 'math'
      }
    ]
    
    // ルーターChainを作成
    this.chainsService.createRouterChain(destinations)
    
    // 異なるタイプの質問をテスト
    const questions = [
      'JavaScriptで非同期処理を実装する方法を教えてください',
      'ビジネスメールの書き方を教えてください',
      '二次方程式 x² + 5x + 6 = 0 を解いてください'
    ]
    
    for (const question of questions) {
      const result = await this.chainsService.executeChain('router_chain', {
        input: question
      })
      
      console.log(`Question: ${question}`)
      console.log(`Response: ${result.output.text}`)
      console.log('---')
    }
  }

  /**
   * RetrievalQAChainの使用例
   */
  async retrievalQAChainExample(): Promise<void> {
    console.log('=== RetrievalQAChain Example ===')
    
    await this.chainsService.initialize()
    
    // ベクトルストアを作成
    const embeddings = new OpenAIEmbeddings()
    const vectorStore = await MemoryVectorStore.fromTexts(
      [
        'LangChain.jsは、大規模言語モデル（LLM）を使用したアプリケーション開発のためのフレームワークです。',
        'LangChain.jsは、チェーン、エージェント、ツールなどのコンポーネントを提供します。',
        'チェーンは、複数のコンポーネントを組み合わせて複雑な処理を実現します。',
        'エージェントは、ツールを使用してタスクを実行するAIシステムです。',
        'LangChain.jsは、TypeScriptとJavaScriptの両方をサポートしています。'
      ],
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      embeddings
    )
    
    // RetrievalQAChainを作成
    this.chainsService.createRetrievalQAChain(vectorStore.asRetriever())
    
    // 質問を実行
    const result = await this.chainsService.executeChain('retrieval_qa_chain', {
      query: 'LangChain.jsとは何ですか？'
    })
    
    console.log('Question:', result.output.query)
    console.log('Answer:', result.output.result)
    console.log('Sources:', result.output.sourceDocuments)
  }

  /**
   * ドキュメント処理Chainの使用例
   */
  async documentProcessingChainExample(): Promise<void> {
    console.log('=== Document Processing Chain Example ===')
    
    await this.chainsService.initialize()
    
    // サンプルドキュメントを作成
    const documents = [
      new Document({
        pageContent: 'LangChain.jsは、大規模言語モデルを使用したアプリケーション開発のためのフレームワークです。',
        metadata: { source: 'doc1' }
      }),
      new Document({
        pageContent: 'チェーンは、複数のコンポーネントを組み合わせて複雑な処理を実現します。',
        metadata: { source: 'doc2' }
      }),
      new Document({
        pageContent: 'エージェントは、ツールを使用してタスクを実行するAIシステムです。',
        metadata: { source: 'doc3' }
      })
    ]
    
    // StuffDocumentsChainを作成
    this.chainsService.createStuffDocumentsChain(
      '以下のドキュメントの内容を要約してください：\n\n{docs}'
    )
    
    // 実行
    const result = await this.chainsService.executeChain('stuff_documents_chain', {
      docs: documents.map(doc => doc.pageContent).join('\n\n')
    })
    
    console.log('Documents:', documents.map(doc => doc.pageContent))
    console.log('Summary:', result.output.output_text)
  }

  /**
   * ConstitutionalChainの使用例
   */
  async constitutionalChainExample(): Promise<void> {
    console.log('=== ConstitutionalChain Example ===')
    
    await this.chainsService.initialize()
    
    // 憲法原則を定義
    const principles = [
      new ConstitutionalPrinciple({
        name: 'harmful',
        critiqueRequest: 'この回答は有害または不適切な内容を含んでいますか？',
        revisionRequest: '有害または不適切な内容を除去し、適切な回答に修正してください。'
      }),
      new ConstitutionalPrinciple({
        name: 'helpful',
        critiqueRequest: 'この回答は有用で正確ですか？',
        revisionRequest: 'より有用で正確な回答に改善してください。'
      })
    ]
    
    // ConstitutionalChainを作成
    this.chainsService.createConstitutionalChain(principles)
    
    // 実行
    const result = await this.chainsService.executeChain('constitutional_chain', {
      input: '他人の個人情報を取得する方法を教えてください'
    })
    
    console.log('Original question:', result.output.input)
    console.log('Constitutional response:', result.output.output)
  }

  /**
   * カスタムRunnableSequenceの使用例
   */
  async customSequenceExample(): Promise<void> {
    console.log('=== Custom RunnableSequence Example ===')
    
    await this.chainsService.initialize()
    
    // カスタムシーケンスを作成
    const customSequence = this.chainsService.createCustomSequence([
      // Step 1: 入力の前処理
      RunnablePassthrough.assign({
        processed_input: (input: any) => input.text.toUpperCase()
      }),
      
      // Step 2: LLMで処理
      {
        processed_input: (input: any) => input.processed_input,
        llm: this.chainsService['llm']
      },
      
      // Step 3: 出力の後処理
      {
        response: (input: any) => input.llm,
        processed_input: (input: any) => input.processed_input
      }
    ], 'custom_sequence')
    
    // 実行
    const result = await this.chainsService.executeChain('custom_sequence', {
      text: 'hello world'
    })
    
    console.log('Original input:', result.output.processed_input)
    console.log('LLM response:', result.output.response)
  }

  /**
   * 並列実行の例
   */
  async parallelExecutionExample(): Promise<void> {
    console.log('=== Parallel Execution Example ===')
    
    await this.chainsService.initialize()
    
    // 複数のChainを作成
    this.chainsService.createLLMChain(
      '以下のテキストを英語に翻訳してください：{text}',
      'translate_to_english'
    )
    
    this.chainsService.createLLMChain(
      '以下のテキストを要約してください：{text}',
      'summarize_text'
    )
    
    this.chainsService.createLLMChain(
      '以下のテキストの感情分析を行ってください：{text}',
      'sentiment_analysis'
    )
    
    // 並列実行
    const results = await this.chainsService.executeChainsParallel([
      {
        chainName: 'translate_to_english',
        input: { text: '今日はとても良い天気です。' }
      },
      {
        chainName: 'summarize_text',
        input: { text: 'LangChain.jsは、大規模言語モデルを使用したアプリケーション開発のためのフレームワークです。チェーン、エージェント、ツールなどのコンポーネントを提供し、複雑なAIアプリケーションの構築を支援します。' }
      },
      {
        chainName: 'sentiment_analysis',
        input: { text: 'このプロジェクトは素晴らしい成果を上げています。' }
      }
    ])
    
    results.forEach((result, index) => {
      console.log(`Task ${index + 1} (${result.chainType}):`, result.output)
      console.log(`Execution time: ${result.executionTime}ms`)
      console.log('---')
    })
  }

  /**
   * すべての例を実行
   */
  async runAllExamples(): Promise<void> {
    try {
      console.log('Starting LangChain Chains Examples...\n')
      
      await this.basicLLMChainExample()
      console.log('\n')
      
      await this.conversationChainExample()
      console.log('\n')
      
      await this.sequentialChainExample()
      console.log('\n')
      
      await this.routerChainExample()
      console.log('\n')
      
      await this.retrievalQAChainExample()
      console.log('\n')
      
      await this.documentProcessingChainExample()
      console.log('\n')
      
      await this.constitutionalChainExample()
      console.log('\n')
      
      await this.customSequenceExample()
      console.log('\n')
      
      await this.parallelExecutionExample()
      console.log('\n')
      
      console.log('All examples completed successfully!')
      
    } catch (error) {
      console.error('Error running examples:', error)
    } finally {
      await this.chainsService.cleanup()
    }
  }
}

// 使用例
// const examples = new LangChainChainsExamples()
// examples.runAllExamples()
