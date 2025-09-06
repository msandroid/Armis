import { BaseLanguageModelInterface } from "@langchain/core/language_models/base";
import { BasePromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { BufferMemory } from "./buffer-memory";
import { BaseMemory } from "./base-memory";

export interface ConversationChainInput {
  llm: BaseLanguageModelInterface;
  prompt?: BasePromptTemplate;
  outputKey?: string;
  memory?: BaseMemory;
}

const DEFAULT_TEMPLATE = `The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{history}
Human: {input}
AI:`;

/**
 * ConversationChainクラスは、人間とAIの間の会話を管理するためのクラスです。
 * LLMChainクラスを拡張し、メモリ機能を統合します。
 * 
 * @example
 * ```typescript
 * const model = new ChatOpenAI({ model: "gpt-4o-mini" });
 * const chain = new ConversationChain({ llm: model });
 * 
 * // 会話チェーンに挨拶を送信
 * const res1 = await chain.call({ input: "Hi! I'm Jim." });
 * console.log({ res1 });
 * 
 * // 会話でフォローアップ質問を行う
 * const res2 = await chain.call({ input: "What's my name?" });
 * console.log({ res2 });
 * ```
 */
export class ConversationChain {
  llm: BaseLanguageModelInterface;
  prompt: BasePromptTemplate;
  outputKey: string;
  memory: BaseMemory;

  constructor({
    prompt,
    outputKey,
    memory,
    ...rest
  }: ConversationChainInput) {
    this.llm = rest.llm;
    this.prompt = prompt ?? new PromptTemplate({
      template: DEFAULT_TEMPLATE,
      inputVariables: ["history", "input"],
    });
    this.outputKey = outputKey ?? "response";
    this.memory = memory ?? new BufferMemory();
  }

  /**
   * 会話チェーンを実行します。
   * @param values 入力値
   * @returns チェーンの出力
   */
  async call(values: Record<string, any>): Promise<Record<string, any>> {
    // メモリから変数を読み込み
    const memoryVariables = await this.memory.loadMemoryVariables(values);
    
    // プロンプトに変数を設定
    const promptVariables = {
      ...values,
      ...memoryVariables,
    };
    
    // プロンプトをフォーマット
    const formattedPrompt = await this.prompt.formatPromptValue(promptVariables);
    
    // LLMを呼び出し
    const response = await this.llm.invoke(formattedPrompt);
    
    // メモリにコンテキストを保存
    await this.memory.saveContext(values, {
      [this.outputKey]: response.content,
    });
    
    return {
      [this.outputKey]: response.content,
    };
  }

  /**
   * 会話チェーンの別名メソッド
   * @param values 入力値
   * @returns チェーンの出力
   */
  async invoke(values: Record<string, any>): Promise<Record<string, any>> {
    return this.call(values);
  }
}
