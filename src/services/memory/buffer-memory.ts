import { BaseMemory, BaseMemoryInput } from "./base-memory";
import { getBufferString } from "./utils";

export interface BufferMemoryInput extends BaseMemoryInput {
  humanPrefix?: string;
  aiPrefix?: string;
  memoryKey?: string;
}

/**
 * BufferMemoryクラスは、チャットメッセージを保存・管理するためのメモリコンポーネントです。
 * ChatMessageHistoryのラッパーで、メッセージを入力変数に抽出します。
 * チャットボットなどのアプリケーションで、以前のやり取りを覚えておくことが重要な場合に特に有用です。
 * 
 * 注意: メモリインスタンスは単一の会話の履歴を表します。
 * したがって、2つの異なるチェーン間で同じ履歴やメモリインスタンスを共有することは推奨されません。
 * 
 * @example
 * ```typescript
 * // メモリを初期化してチャット履歴を保存し、特定の温度で言語モデルを設定
 * const memory = new BufferMemory({ memoryKey: "chat_history" });
 * const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 });
 * 
 * // 人間とAIの間の友好的な会話のためのプロンプトテンプレートを作成
 * const prompt = PromptTemplate.fromTemplate(`
 * The following is a friendly conversation between a human and an AI. 
 * The AI is talkative and provides lots of specific details from its context. 
 * If the AI does not know the answer to a question, it truthfully says it does not know.
 * 
 * Current conversation:
 * {chat_history}
 * Human: {input}
 * AI:`);
 * 
 * // 言語モデル、プロンプト、メモリでチェーンを設定
 * const chain = new LLMChain({ llm: model, prompt, memory });
 * 
 * // 会話を続けるためのチェーンの使用例
 * const res = await chain.call({ input: "Hi! I'm Jim." });
 * console.log({ res });
 * ```
 */
export class BufferMemory extends BaseMemory implements BufferMemoryInput {
  humanPrefix = "Human";
  aiPrefix = "AI";
  memoryKey = "history";

  constructor(fields?: BufferMemoryInput) {
    super({
      chatHistory: fields?.chatHistory,
      returnMessages: fields?.returnMessages ?? false,
      inputKey: fields?.inputKey,
      outputKey: fields?.outputKey,
    });
    this.humanPrefix = fields?.humanPrefix ?? this.humanPrefix;
    this.aiPrefix = fields?.aiPrefix ?? this.aiPrefix;
    this.memoryKey = fields?.memoryKey ?? this.memoryKey;
  }

  get memoryKeys() {
    return [this.memoryKey];
  }

  /**
   * メモリ変数を読み込みます。
   * @param _values InputValuesオブジェクト
   * @returns MemoryVariablesオブジェクトを解決するPromise
   */
  async loadMemoryVariables(_values: Record<string, any>): Promise<Record<string, any>> {
    const messages = await this.chatHistory.getMessages();
    
    if (this.returnMessages) {
      return {
        [this.memoryKey]: messages,
      };
    }
    
    return {
      [this.memoryKey]: getBufferString(
        messages,
        this.humanPrefix,
        this.aiPrefix
      ),
    };
  }
}
