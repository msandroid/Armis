import { BaseMessage } from "@langchain/core/messages";

/**
 * メッセージの配列を文字列バッファに変換します
 * @param messages メッセージの配列
 * @param humanPrefix 人間のメッセージのプレフィックス
 * @param aiPrefix AIのメッセージのプレフィックス
 * @returns フォーマットされた文字列
 */
export function getBufferString(
  messages: BaseMessage[],
  humanPrefix = "Human",
  aiPrefix = "AI"
): string {
  const string_messages: string[] = [];
  
  for (const message of messages) {
    let role: string;
    if (message._getType() === "human") {
      role = humanPrefix;
    } else if (message._getType() === "ai") {
      role = aiPrefix;
    } else if (message._getType() === "system") {
      role = "System";
    } else {
      console.warn(`Unknown message type: ${message._getType()}`);
      role = message._getType();
    }
    string_messages.push(`${role}: ${message.content}`);
  }
  
  return string_messages.join("\n");
}
