import { BaseMemory, BaseMemoryInput } from "./base-memory";
import { BaseLanguageModelInterface } from "@langchain/core/language_models/base";
import { getBufferString } from "./utils";

export interface ConversationTokenBufferMemoryInput extends BaseMemoryInput {
  llm: BaseLanguageModelInterface;
  humanPrefix?: string;
  aiPrefix?: string;
  memoryKey?: string;
  maxTokenLimit?: number;
}

/**
 * ConversationTokenBufferMemoryクラスは、トークンバッファ付きの会話チャットメモリを表します。
 * BaseChatMemoryクラスを拡張し、ConversationTokenBufferMemoryInputインターフェースを実装します。
 * 
 * @example
 * ```typescript
 * const memory = new ConversationTokenBufferMemory({
 *   llm: new ChatOpenAI({ model: "gpt-4o-mini" }),
 *   maxTokenLimit: 10,
 * });
 * 
 * // 会話コンテキストを保存
 * await memory.saveContext({ input: "hi" }, { output: "whats up" });
 * await memory.saveContext({ input: "not much you" }, { output: "not much" });
 * 
 * // メモリ変数を読み込み
 * const result = await memory.loadMemoryVariables({});
 * console.log(result);
 * ```
 */
export class ConversationTokenBufferMemory extends BaseMemory implements ConversationTokenBufferMemoryInput {
  humanPrefix = "Human";
  aiPrefix = "AI";
  memoryKey = "history";
  maxTokenLimit = 2000; // デフォルトの最大トークン制限2000（オーバーライド可能）
  llm: BaseLanguageModelInterface;

  constructor(fields: ConversationTokenBufferMemoryInput) {
    super(fields);
    this.llm = fields.llm;
    this.humanPrefix = fields?.humanPrefix ?? this.humanPrefix;
    this.aiPrefix = fields?.aiPrefix ?? this.aiPrefix;
    this.memoryKey = fields?.memoryKey ?? this.memoryKey;
    this.maxTokenLimit = fields?.maxTokenLimit ?? this.maxTokenLimit;
  }

  get memoryKeys() {
    return [this.memoryKey];
  }

  /**
   * メモリ変数を読み込みます。
   * トークン制限を考慮してメッセージをフィルタリングします。
   * @param _values InputValuesオブジェクト
   * @returns MemoryVariablesオブジェクトを解決するPromise
   */
  async loadMemoryVariables(_values: Record<string, any>): Promise<Record<string, any>> {
    const messages = await this.chatHistory.getMessages();
    const prunedMessages = await this.pruneMessages(messages);
    
    if (this.returnMessages) {
      return {
        [this.memoryKey]: prunedMessages,
      };
    }
    
    return {
      [this.memoryKey]: getBufferString(
        prunedMessages,
        this.humanPrefix,
        this.aiPrefix
      ),
    };
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

    // 簡易的なトークン数計算（実際の実装ではより正確なトークナイザーを使用）
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
   * テキストのトークン数を概算します。
   * 実際の実装では、使用するLLMのトークナイザーに合わせて調整してください。
   * @param text トークン数を概算するテキスト
   * @returns 概算トークン数
   */
  private estimateTokenCount(text: string): number {
    // 簡易的な概算：1トークン ≈ 4文字
    return Math.ceil(text.length / 4);
  }
}
