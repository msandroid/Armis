import { BaseMemory, BaseMemoryInput } from "./base-memory";

export interface CombinedMemoryInput extends BaseMemoryInput {
  memories: BaseMemory[];
}

/**
 * CombinedMemoryクラスは、複数のメモリのデータを組み合わせるためのクラスです。
 * 複数のメモリインスタンスを管理し、それらのデータを統合して提供します。
 * 
 * @example
 * ```typescript
 * // バッファメモリとサマリーメモリを組み合わせる
 * const bufferMemory = new BufferMemory({
 *   memoryKey: "chat_history_lines",
 *   inputKey: "input",
 * });
 * 
 * const summaryMemory = new ConversationSummaryMemory({
 *   llm: new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 }),
 *   inputKey: "input",
 *   memoryKey: "conversation_summary",
 * });
 * 
 * const memory = new CombinedMemory({
 *   memories: [bufferMemory, summaryMemory],
 * });
 * 
 * // プロンプトテンプレートで両方のメモリを使用
 * const prompt = PromptTemplate.fromTemplate(`
 * The following is a friendly conversation between a human and an AI. 
 * The AI is talkative and provides lots of specific details from its context. 
 * If the AI does not know the answer to a question, it truthfully says it does not know.
 * 
 * Summary of conversation:
 * {conversation_summary}
 * Current conversation:
 * {chat_history_lines}
 * Human: {input}
 * AI:`);
 * 
 * const chain = new ConversationChain({ 
 *   llm: model, 
 *   memory, 
 *   prompt 
 * });
 * ```
 */
export class CombinedMemory extends BaseMemory implements CombinedMemoryInput {
  memories: BaseMemory[];

  constructor(fields: CombinedMemoryInput) {
    super({
      chatHistory: fields.chatHistory,
      returnMessages: fields.returnMessages,
      inputKey: fields.inputKey,
      outputKey: fields.outputKey,
    });
    this.memories = fields.memories;
  }

  get memoryKeys(): string[] {
    const memoryKeys: string[] = [];
    for (const memory of this.memories) {
      memoryKeys.push(...memory.memoryKeys);
    }
    return memoryKeys;
  }

  /**
   * すべてのメモリから変数を読み込み、統合します。
   * @param values InputValuesオブジェクト
   * @returns 統合されたMemoryVariablesオブジェクトを解決するPromise
   */
  async loadMemoryVariables(values: Record<string, any>): Promise<Record<string, any>> {
    const memoryVariables: Record<string, any> = {};
    
    for (const memory of this.memories) {
      const variables = await memory.loadMemoryVariables(values);
      Object.assign(memoryVariables, variables);
    }
    
    return memoryVariables;
  }

  /**
   * すべてのメモリにコンテキストを保存します。
   * @param inputValues 入力値
   * @param outputValues 出力値
   * @returns すべてのメモリにコンテキストが保存されたときに解決するPromise
   */
  async saveContext(
    inputValues: Record<string, any>,
    outputValues: Record<string, any>
  ): Promise<void> {
    // すべてのメモリに並行して保存
    await Promise.all(
      this.memories.map(memory => memory.saveContext(inputValues, outputValues))
    );
  }

  /**
   * すべてのメモリをクリアします。
   * @returns すべてのメモリがクリアされたときに解決するPromise
   */
  async clear(): Promise<void> {
    await Promise.all(this.memories.map(memory => memory.clear()));
  }
}
