import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import { ChatMessageHistory } from "./chat-message-history";

export interface BaseMemoryInput {
  chatHistory?: BaseChatMessageHistory;
  returnMessages?: boolean;
  inputKey?: string;
  outputKey?: string;
}

export abstract class BaseMemory {
  chatHistory: BaseChatMessageHistory;
  returnMessages = false;
  inputKey?: string;
  outputKey?: string;

  constructor(fields?: BaseMemoryInput) {
    this.chatHistory = fields?.chatHistory ?? new ChatMessageHistory();
    this.returnMessages = fields?.returnMessages ?? this.returnMessages;
    this.inputKey = fields?.inputKey ?? this.inputKey;
    this.outputKey = fields?.outputKey ?? this.outputKey;
  }

  abstract get memoryKeys(): string[];

  abstract loadMemoryVariables(values: Record<string, any>): Promise<Record<string, any>>;

  async saveContext(
    inputValues: Record<string, any>,
    outputValues: Record<string, any>
  ): Promise<void> {
    const inputValue = this.getInputValue(inputValues, this.inputKey);
    const outputValue = this.getOutputValue(outputValues, this.outputKey);
    
    await this.chatHistory.addUserMessage(inputValue);
    await this.chatHistory.addAIChatMessage(outputValue);
  }

  async clear(): Promise<void> {
    await this.chatHistory.clear();
  }

  protected getInputValue(values: Record<string, any>, key?: string): string {
    if (key) {
      return values[key];
    }
    const keys = Object.keys(values);
    if (keys.length === 1) {
      return values[keys[0]];
    }
    throw new Error(`Multiple input keys found: ${keys.join(", ")}`);
  }

  protected getOutputValue(values: Record<string, any>, key?: string): string {
    if (key) {
      return values[key];
    }
    const keys = Object.keys(values);
    if (keys.length === 1) {
      return values[keys[0]];
    }
    throw new Error(`Multiple output keys found: ${keys.join(", ")}`);
  }
}
