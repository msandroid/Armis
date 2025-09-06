import { ConversationSummaryMemory, ConversationSummaryMemoryInput } from "./conversation-summary-memory";
import { getBufferString } from "./utils";

export interface ConversationSummaryBufferMemoryInput extends ConversationSummaryMemoryInput {
  maxTokenLimit?: number;
}

/**
 * ConversationSummaryBufferMemoryクラスは、BaseConversationSummaryMemoryを拡張し、
 * ConversationSummaryBufferMemoryInputを実装します。
 * LangChainアプリケーションで会話履歴を管理し、メモリの読み込み、保存、プルーニング、
 * クリアのメソッドを提供します。
 * 
 * @example
 * ```typescript
 * // 特定のモデルとトークン制限でメモリを初期化
 * const memory = new ConversationSummaryBufferMemory({
 *   llm: new ChatOpenAI({ model: "gpt-3.5-turbo-instruct", temperature: 0 }),
 *   maxTokenLimit: 10,
 * });
 * 
 * // メモリに会話コンテキストを保存
 * await memory.saveContext({ input: "hi" }, { output: "whats up" });
 * await memory.saveContext({ input: "not much you" }, { output: "not much" });
 * 
 * // メモリから会話履歴を読み込み
 * const history = await memory.loadMemoryVariables({});
 * console.log({ history });
 * 
 * // 会話履歴を使用したチャットプロンプトの作成
 * const chatPrompt = ChatPromptTemplate.fromMessages([
 *   SystemMessagePromptTemplate.fromTemplate(
 *     "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.",
 *   ),
 *   new MessagesPlaceholder("history"),
 *   HumanMessagePromptTemplate.fromTemplate("{input}"),
 * ]);
 * 
 * // モデル、メモリ、プロンプトで会話チェーンを初期化
 * const chain = new ConversationChain({
 *   llm: new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9, verbose: true }),
 *   memory: memory,
 *   prompt: chatPrompt,
 * });
 * ```
 */
export class ConversationSummaryBufferMemory extends ConversationSummaryMemory implements ConversationSummaryBufferMemoryInput {
  movingSummaryBuffer = "";
  maxTokenLimit = 2000;

  constructor(fields: ConversationSummaryBufferMemoryInput) {
    super(fields);
    this.maxTokenLimit = fields?.maxTokenLimit ?? this.maxTokenLimit;
  }

  /**
   * メモリ変数を読み込みます。
   * 要約バッファと現在のメッセージを組み合わせて返します。
   * @param values InputValuesオブジェクト
   * @returns MemoryVariablesオブジェクトを解決するPromise
   */
  async loadMemoryVariables(values: Record<string, any>): Promise<Record<string, any>> {
    const messages = await this.chatHistory.getMessages();
    const prunedMessages = await this.pruneMessages(messages);
    
    if (this.returnMessages) {
      const summaryMessage = new this.summaryChatMessageClass(this.movingSummaryBuffer);
      return {
        [this.memoryKey]: [summaryMessage, ...prunedMessages],
      };
    }
    
    const summaryString = this.movingSummaryBuffer ? `Summary: ${this.movingSummaryBuffer}\n` : "";
    const messageString = getBufferString(prunedMessages, this.humanPrefix, this.aiPrefix);
    
    return {
      [this.memoryKey]: summaryString + messageString,
    };
  }

  /**
   * コンテキストを保存し、必要に応じて要約を更新します。
   * @param inputValues 入力値
   * @param outputValues 出力値
   * @returns コンテキストが保存されたときに解決するPromise
   */
  async saveContext(
    inputValues: Record<string, any>,
    outputValues: Record<string, any>
  ): Promise<void> {
    await super.saveContext(inputValues, outputValues);
    const messages = await this.chatHistory.getMessages();
    
    // トークン制限を超えた場合、要約を更新
    if (await this.shouldUpdateSummary(messages)) {
      this.movingSummaryBuffer = await this.predictNewSummary(messages.slice(-2), this.movingSummaryBuffer);
    }
  }

  /**
   * メモリをクリアします。
   * @returns メモリがクリアされたときに解決するPromise
   */
  async clear() {
    await super.clear();
    this.movingSummaryBuffer = "";
  }

  /**
   * トークン制限に基づいてメッセージをプルーニングします。
   * @param messages プルーニングするメッセージの配列
   * @returns プルーニングされたメッセージの配列
   */
  async pruneMessages(messages: any[]): Promise<any[]> {
    if (messages.length === 0) {
      return messages;
    }

    let totalTokens = 0;
    const prunedMessages: any[] = [];
    
    // メッセージを逆順で処理して、制限内に収まるまで追加
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.estimateTokenCount(message.content);
      
      if (totalTokens + messageTokens > this.maxTokenLimit) {
        break;
      }
      
      prunedMessages.unshift(message);
      totalTokens += messageTokens;
    }
    
    return prunedMessages;
  }

  /**
   * 要約を更新すべきかどうかを判断します。
   * @param messages 現在のメッセージの配列
   * @returns 要約を更新すべきかどうか
   */
  async shouldUpdateSummary(messages: any[]): Promise<boolean> {
    const totalTokens = messages.reduce((sum, message) => {
      return sum + this.estimateTokenCount(message.content);
    }, 0);
    
    return totalTokens > this.maxTokenLimit;
  }

  /**
   * テキストのトークン数を概算します。
   * @param text トークン数を概算するテキスト
   * @returns 概算トークン数
   */
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
