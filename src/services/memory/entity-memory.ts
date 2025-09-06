import { BaseMemory, BaseMemoryInput } from "./base-memory";
import { BaseLanguageModelInterface } from "@langchain/core/language_models/base";
import { BasePromptTemplate } from "@langchain/core/prompts";
import { getBufferString } from "./utils";

export interface EntityMemoryInput extends BaseMemoryInput {
  llm: BaseLanguageModelInterface;
  humanPrefix?: string;
  aiPrefix?: string;
  chatHistoryKey?: string;
  entitiesKey?: string;
  entityExtractionPrompt?: BasePromptTemplate;
  entitySummarizationPrompt?: BasePromptTemplate;
  k?: number;
}

const ENTITY_EXTRACTION_PROMPT = new BasePromptTemplate({
  inputVariables: ["input", "chat_history"],
  template: `Given the following input and chat history, extract the key entities mentioned in the input. Return them as a JSON object with the entity name as the key and a brief description as the value.

Input: {input}
Chat History: {chat_history}

Extracted entities:`,
});

const ENTITY_SUMMARIZATION_PROMPT = new BasePromptTemplate({
  inputVariables: ["entities", "input"],
  template: `Given the following entities and input, provide a brief summary of what we know about each entity.

Entities: {entities}
Input: {input}

Summary:`,
});

/**
 * EntityMemoryクラスは、チャットボットアプリケーションでエンティティ抽出と
 * サマリー化をメモリに管理するためのクラスです。
 * BaseChatMemoryクラスを拡張し、EntityMemoryInputインターフェースを実装します。
 * 
 * @example
 * ```typescript
 * const memory = new EntityMemory({
 *   llm: new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 }),
 *   chatHistoryKey: "history",
 *   entitiesKey: "entities",
 * });
 * 
 * const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 });
 * const chain = new LLMChain({
 *   llm: model,
 *   prompt: ENTITY_MEMORY_CONVERSATION_TEMPLATE,
 *   memory,
 * });
 * 
 * const res1 = await chain.call({ input: "Hi! I'm Jim." });
 * console.log({
 *   res1,
 *   memory: await memory.loadMemoryVariables({ input: "Who is Jim?" }),
 * });
 * 
 * const res2 = await chain.call({
 *   input: "I work in construction. What about you?",
 * });
 * console.log({
 *   res2,
 *   memory: await memory.loadMemoryVariables({ input: "Who is Jim?" }),
 * });
 * ```
 */
export class EntityMemory extends BaseMemory implements EntityMemoryInput {
  private entityExtractionChain: any;
  private entitySummarizationChain: any;
  entityCache: string[] = [];
  k = 3;
  chatHistoryKey = "history";
  llm: BaseLanguageModelInterface;
  entitiesKey = "entities";
  humanPrefix?: string;
  aiPrefix?: string;

  constructor(fields: EntityMemoryInput) {
    super({
      chatHistory: fields.chatHistory,
      returnMessages: fields.returnMessages ?? false,
      inputKey: fields.inputKey,
      outputKey: fields.outputKey,
    });
    
    this.llm = fields.llm;
    this.humanPrefix = fields.humanPrefix;
    this.aiPrefix = fields.aiPrefix;
    this.chatHistoryKey = fields.chatHistoryKey ?? this.chatHistoryKey;
    this.entitiesKey = fields.entitiesKey ?? this.entitiesKey;
    
    // 簡易的なチェーン実装（実際の実装ではLLMChainを使用）
    this.entityExtractionChain = {
      predict: async (values: any) => {
        const promptValue = await ENTITY_EXTRACTION_PROMPT.formatPromptValue(values);
        const response = await this.llm.invoke(promptValue);
        return response.content as string;
      }
    };
    
    this.entitySummarizationChain = {
      predict: async (values: any) => {
        const promptValue = await ENTITY_SUMMARIZATION_PROMPT.formatPromptValue(values);
        const response = await this.llm.invoke(promptValue);
        return response.content as string;
      }
    };
    
    this.entityCache = fields.entityCache ?? this.entityCache;
    this.k = fields.k ?? this.k;
  }

  get memoryKeys() {
    return [this.chatHistoryKey];
  }

  /**
   * メモリ変数を読み込みます。
   * @param values InputValuesオブジェクト
   * @returns MemoryVariablesオブジェクトを解決するPromise
   */
  async loadMemoryVariables(values: Record<string, any>): Promise<Record<string, any>> {
    const messages = await this.chatHistory.getMessages();
    
    if (this.returnMessages) {
      return {
        [this.chatHistoryKey]: messages,
        [this.entitiesKey]: this.entityCache,
      };
    }
    
    const chatHistory = getBufferString(messages, this.humanPrefix, this.aiPrefix);
    
    return {
      [this.chatHistoryKey]: chatHistory,
      [this.entitiesKey]: this.entityCache,
    };
  }

  /**
   * コンテキストを保存し、エンティティを抽出・更新します。
   * @param inputValues 入力値
   * @param outputValues 出力値
   * @returns コンテキストが保存されたときに解決するPromise
   */
  async saveContext(
    inputValues: Record<string, any>,
    outputValues: Record<string, any>
  ): Promise<void> {
    await super.saveContext(inputValues, outputValues);
    
    // エンティティを抽出
    const input = this.getInputValue(inputValues, this.inputKey);
    const messages = await this.chatHistory.getMessages();
    const chatHistory = getBufferString(messages, this.humanPrefix, this.aiPrefix);
    
    const extractedEntities = await this.entityExtractionChain.predict({
      input,
      chat_history: chatHistory,
    });
    
    // エンティティを更新
    await this.updateEntities(extractedEntities, input);
  }

  /**
   * エンティティを更新します。
   * @param extractedEntities 抽出されたエンティティ
   * @param input 入力テキスト
   */
  private async updateEntities(extractedEntities: string, input: string): Promise<void> {
    try {
      // 簡易的なエンティティ処理（実際の実装ではより詳細な処理が必要）
      const entities = this.parseEntities(extractedEntities);
      
      for (const [entity, description] of Object.entries(entities)) {
        const summary = await this.entitySummarizationChain.predict({
          entities: this.entityCache,
          input: `${entity}: ${description}`,
        });
        
        // エンティティキャッシュを更新
        this.updateEntityCache(entity, summary);
      }
    } catch (error) {
      console.warn("Failed to update entities:", error);
    }
  }

  /**
   * エンティティ文字列をパースします。
   * @param extractedEntities 抽出されたエンティティ文字列
   * @returns パースされたエンティティオブジェクト
   */
  private parseEntities(extractedEntities: string): Record<string, string> {
    try {
      // JSONとしてパースを試行
      return JSON.parse(extractedEntities);
    } catch {
      // 簡易的なパース（実際の実装ではより堅牢な処理が必要）
      const entities: Record<string, string> = {};
      const lines = extractedEntities.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^(.+?):\s*(.+)$/);
        if (match) {
          entities[match[1].trim()] = match[2].trim();
        }
      }
      
      return entities;
    }
  }

  /**
   * エンティティキャッシュを更新します。
   * @param entity エンティティ名
   * @param summary エンティティのサマリー
   */
  private updateEntityCache(entity: string, summary: string): void {
    // 既存のエンティティを検索して更新または追加
    const existingIndex = this.entityCache.findIndex(item => 
      item.toLowerCase().includes(entity.toLowerCase())
    );
    
    if (existingIndex >= 0) {
      this.entityCache[existingIndex] = summary;
    } else {
      this.entityCache.push(summary);
      
      // キャッシュサイズを制限
      if (this.entityCache.length > this.k) {
        this.entityCache = this.entityCache.slice(-this.k);
      }
    }
  }
}
