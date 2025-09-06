import { BaseMemory, BaseMemoryInput } from "./base-memory";
import { getBufferString } from "./utils";

export interface BufferWindowMemoryInput extends BaseMemoryInput {
  humanPrefix?: string;
  aiPrefix?: string;
  memoryKey?: string;
  k?: number;
}

/**
 * BufferWindowMemoryクラスは、チャットメッセージを管理・保存するためのクラスです。
 * BaseMemoryクラスを拡張し、BufferWindowMemoryInputインターフェースを実装します。
 * このクラスは状態を持ち、バッファにメッセージを保存します。
 * チェーンで呼び出されると、保存されたすべてのメッセージを返します。
 * 
 * @example
 * ```typescript
 * const prompt = PromptTemplate.fromTemplate(`
 * The following is a friendly conversation between a human and an AI. 
 * The AI is talkative and provides lots of specific details from its context. 
 * If the AI does not know the answer to a question, it truthfully says it does not know.
 * Current conversation:
 * {chat_history}
 * Human: {input}
 * AI:`);
 * 
 * const chain = new LLMChain({
 *   llm: new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 }),
 *   prompt,
 *   memory: new BufferWindowMemory({ memoryKey: "chat_history", k: 1 }),
 * });
 * 
 * // AIとの会話を開始する例
 * const res1 = await chain.call({ input: "Hi! I'm Jim." });
 * console.log({ res1 });
 * 
 * // 別の質問でフォローアップする例
 * const res2 = await chain.call({ input: "What's my name?" });
 * console.log({ res2 });
 * ```
 */
export class BufferWindowMemory extends BaseMemory implements BufferWindowMemoryInput {
  humanPrefix = "Human";
  aiPrefix = "AI";
  memoryKey = "history";
  k = 5;

  constructor(fields?: BufferWindowMemoryInput) {
    super({
      returnMessages: fields?.returnMessages ?? false,
      chatHistory: fields?.chatHistory,
      inputKey: fields?.inputKey,
      outputKey: fields?.outputKey,
    });
    this.humanPrefix = fields?.humanPrefix ?? this.humanPrefix;
    this.aiPrefix = fields?.aiPrefix ?? this.aiPrefix;
    this.memoryKey = fields?.memoryKey ?? this.memoryKey;
    this.k = fields?.k ?? this.k;
  }

  get memoryKeys() {
    return [this.memoryKey];
  }

  /**
   * メモリ変数を読み込むメソッド。
   * チャット履歴からメッセージを取得し、最後の'k'個のメッセージをスライスして、
   * memoryKeyの下にメモリに保存します。
   * returnMessagesプロパティがtrueに設定されている場合、メソッドはメッセージをそのまま返します。
   * そうでなければ、メッセージの文字列表現を返します。
   * @param _values InputValuesオブジェクト
   * @returns MemoryVariablesオブジェクトを解決するPromise
   */
  async loadMemoryVariables(_values: Record<string, any>): Promise<Record<string, any>> {
    const messages = await this.chatHistory.getMessages();
    
    if (this.returnMessages) {
      return {
        [this.memoryKey]: messages.slice(-this.k * 2),
      };
    }
    
    return {
      [this.memoryKey]: getBufferString(
        messages.slice(-this.k * 2),
        this.humanPrefix,
        this.aiPrefix
      ),
    };
  }
}
