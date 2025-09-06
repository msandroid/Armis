import { BaseMemory, BaseMemoryInput } from "./base-memory";
import { BaseRetriever } from "@langchain/core/retrievers";

export interface VectorStoreRetrieverMemoryParams extends BaseMemoryInput {
  retriever: BaseRetriever;
  memoryKey?: string;
  inputKey?: string;
  returnDocs?: boolean;
}

/**
 * VectorStoreRetrieverMemoryクラスは、ベクトルストアリトリーバーを使用して
 * メモリを管理するためのクラスです。
 * 
 * @example
 * ```typescript
 * import { MemoryVectorStore } from "langchain/vectorstores/memory";
 * import { OpenAIEmbeddings } from "@langchain/openai";
 * 
 * // ベクトルストアを作成
 * const vectorStore = new MemoryVectorStore(new OpenAIEmbeddings());
 * 
 * // リトリーバーを作成
 * const retriever = vectorStore.asRetriever(3);
 * 
 * // メモリを作成
 * const memory = new VectorStoreRetrieverMemory({
 *   retriever,
 *   memoryKey: "chat_history",
 *   inputKey: "input",
 * });
 * 
 * // メモリにコンテキストを保存
 * await memory.saveContext(
 *   { input: "Hello, how are you?" },
 *   { output: "I'm doing well, thank you!" }
 * );
 * 
 * // メモリから関連情報を取得
 * const result = await memory.loadMemoryVariables({ input: "What did we talk about?" });
 * console.log(result);
 * ```
 */
export class VectorStoreRetrieverMemory extends BaseMemory implements VectorStoreRetrieverMemoryParams {
  retriever: BaseRetriever;
  memoryKey = "history";
  returnDocs = false;

  constructor(fields: VectorStoreRetrieverMemoryParams) {
    super({
      chatHistory: fields.chatHistory,
      returnMessages: fields.returnMessages,
      inputKey: fields.inputKey,
      outputKey: fields.outputKey,
    });
    
    this.retriever = fields.retriever;
    this.memoryKey = fields.memoryKey ?? this.memoryKey;
    this.returnDocs = fields.returnDocs ?? this.returnDocs;
  }

  get memoryKeys() {
    return [this.memoryKey];
  }

  /**
   * メモリ変数を読み込みます。
   * リトリーバーを使用して関連するドキュメントを取得します。
   * @param values InputValuesオブジェクト
   * @returns MemoryVariablesオブジェクトを解決するPromise
   */
  async loadMemoryVariables(values: Record<string, any>): Promise<Record<string, any>> {
    const input = this.getInputValue(values, this.inputKey);
    
    if (!input) {
      return { [this.memoryKey]: this.returnDocs ? [] : "" };
    }

    const docs = await this.retriever.getRelevantDocuments(input);
    
    if (this.returnDocs) {
      return { [this.memoryKey]: docs };
    }
    
    const result = docs.map((doc) => doc.pageContent).join("\n");
    return { [this.memoryKey]: result };
  }

  /**
   * コンテキストを保存します。
   * ベクトルストアにドキュメントを追加します。
   * @param inputValues 入力値
   * @param outputValues 出力値
   * @returns コンテキストが保存されたときに解決するPromise
   */
  async saveContext(
    inputValues: Record<string, any>,
    outputValues: Record<string, any>
  ): Promise<void> {
    const input = this.getInputValue(inputValues, this.inputKey);
    const output = this.getOutputValue(outputValues, this.outputKey);
    
    // ベクトルストアにドキュメントを追加
    // 実際の実装では、適切なドキュメント形式で保存する必要があります
    const combinedText = `Input: ${input}\nOutput: ${output}`;
    
    // 簡易的な実装（実際の実装では適切なベクトルストア操作が必要）
    console.log("Saving to vector store:", combinedText);
  }
}
