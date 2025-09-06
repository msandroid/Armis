import { BaseMemory, BaseMemoryInput } from "./base-memory";
import { BaseLanguageModelInterface } from "@langchain/core/language_models/base";
import { BasePromptTemplate } from "@langchain/core/prompts";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { getBufferString } from "./utils";

export interface ConversationSummaryMemoryInput extends BaseMemoryInput {
  llm: BaseLanguageModelInterface;
  prompt?: BasePromptTemplate;
  summaryChatMessageClass?: new (content: string) => BaseMessage;
  humanPrefix?: string;
  aiPrefix?: string;
  memoryKey?: string;
}

const SUMMARY_PROMPT = new BasePromptTemplate({
  inputVariables: ["summary", "new_lines"],
  template: `Progressively summarize the lines of conversation provided, adding onto the previous summary returning a new summary.

EXAMPLE
Current summary:
The human asks what the AI thinks of artificial intelligence. The AI thinks artificial intelligence is a force for good.

New lines of conversation:
Human: Why do you think artificial intelligence is a force for good?
AI: Because artificial intelligence will help humans reach their full potential.

New summary:
The human asks what the AI thinks of artificial intelligence. The AI thinks artificial intelligence is a force for good because it will help humans reach their full potential.
END OF EXAMPLE

Current summary:
{summary}

New lines of conversation:
{new_lines}

New summary:`,
});

/**
 * ConversationSummaryMemoryクラスは、会話のメモリを保存・管理するための具体的な実装を提供します。
 * メモリ変数の読み込み、コンテキストの保存、メモリのクリアのメソッドが含まれています。
 * 
 * @example
 * ```typescript
 * const memory = new ConversationSummaryMemory({
 *   memoryKey: "chat_history",
 *   llm: new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 }),
 * });
 * 
 * const model = new ChatOpenAI({ model: "gpt-4o-mini" });
 * const prompt = PromptTemplate.fromTemplate(`
 * The following is a friendly conversation between a human and an AI. 
 * The AI is talkative and provides lots of specific details from its context. 
 * If the AI does not know the answer to a question, it truthfully says it does not know.
 * 
 * Current conversation:
 * {chat_history}
 * Human: {input}
 * AI:`);
 * const chain = new LLMChain({ llm: model, prompt, memory });
 * 
 * const res1 = await chain.call({ input: "Hi! I'm Jim." });
 * console.log({ res1, memory: await memory.loadMemoryVariables({}) });
 * 
 * const res2 = await chain.call({ input: "What's my name?" });
 * console.log({ res2, memory: await memory.loadMemoryVariables({}) });
 * ```
 */
export class ConversationSummaryMemory extends BaseMemory implements ConversationSummaryMemoryInput {
  memoryKey = "history";
  humanPrefix = "Human";
  aiPrefix = "AI";
  llm: BaseLanguageModelInterface;
  prompt: BasePromptTemplate = SUMMARY_PROMPT;
  summaryChatMessageClass: new (content: string) => BaseMessage = SystemMessage;
  buffer = "";

  constructor(fields: ConversationSummaryMemoryInput) {
    const {
      returnMessages,
      inputKey,
      outputKey,
      chatHistory,
      humanPrefix,
      aiPrefix,
      llm,
      prompt,
      summaryChatMessageClass,
    } = fields;

    super({ returnMessages, inputKey, outputKey, chatHistory });

    this.memoryKey = fields?.memoryKey ?? this.memoryKey;
    this.humanPrefix = humanPrefix ?? this.humanPrefix;
    this.aiPrefix = aiPrefix ?? this.aiPrefix;
    this.llm = llm;
    this.prompt = prompt ?? this.prompt;
    this.summaryChatMessageClass = summaryChatMessageClass ?? this.summaryChatMessageClass;
  }

  get memoryKeys() {
    return [this.memoryKey];
  }

  /**
   * 会話メモリのメモリ変数を読み込みます。
   * @returns メモリ変数を含むオブジェクトを解決するPromise
   */
  async loadMemoryVariables(_: Record<string, any>): Promise<Record<string, any>> {
    if (this.returnMessages) {
      return {
        [this.memoryKey]: [new this.summaryChatMessageClass(this.buffer)],
      };
    }
    return { [this.memoryKey]: this.buffer };
  }

  /**
   * 会話メモリのコンテキストを保存します。
   * @param inputValues 会話の入力値
   * @param outputValues 会話からの出力値
   * @returns コンテキストが保存されたときに解決するPromise
   */
  async saveContext(
    inputValues: Record<string, any>,
    outputValues: Record<string, any>
  ): Promise<void> {
    await super.saveContext(inputValues, outputValues);
    const messages = await this.chatHistory.getMessages();
    this.buffer = await this.predictNewSummary(messages.slice(-2), this.buffer);
  }

  /**
   * 会話メモリをクリアします。
   * @returns メモリがクリアされたときに解決するPromise
   */
  async clear() {
    await super.clear();
    this.buffer = "";
  }

  /**
   * 既存のメッセージとサマリーを考慮して、会話の新しいサマリーを予測します。
   * @param messages 会話の既存メッセージ
   * @param existingSummary 会話の現在のサマリー
   * @returns 新しいサマリー文字列を解決するPromise
   */
  async predictNewSummary(
    messages: BaseMessage[],
    existingSummary: string
  ): Promise<string> {
    const newLines = getBufferString(messages, this.humanPrefix, this.aiPrefix);
    
    // 簡易的な要約生成（実際の実装ではLLMChainを使用）
    const promptValue = await this.prompt.formatPromptValue({
      summary: existingSummary,
      new_lines: newLines,
    });
    
    const response = await this.llm.invoke(promptValue);
    return response.content as string;
  }
}
