import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  BufferMemory,
  ConversationSummaryMemory,
  BufferWindowMemory,
  ConversationTokenBufferMemory,
  ConversationSummaryBufferMemory,
  CombinedMemory,
  ConversationChain,
} from "./index";

/**
 * Memory機能の使用例
 * 
 * このファイルでは、LangChain.jsのMemory機能の様々な実装例を示します。
 * 各Memoryタイプの特徴と使用方法を理解するためのサンプルコードです。
 */

// 1. BufferMemory - 基本的な会話履歴保持
export async function bufferMemoryExample() {
  console.log("=== BufferMemory Example ===");
  
  const memory = new BufferMemory({ memoryKey: "chat_history" });
  const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 });
  
  const prompt = PromptTemplate.fromTemplate(`
The following is a friendly conversation between a human and an AI. 
The AI is talkative and provides lots of specific details from its context. 
If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{chat_history}
Human: {input}
AI:`);

  const chain = new ConversationChain({ llm: model, prompt, memory });

  // 最初の質問
  const res1 = await chain.call({ input: "Hi! I'm Jim." });
  console.log("Response 1:", res1.response);

  // 前の会話を踏まえた質問
  const res2 = await chain.call({ input: "What's my name?" });
  console.log("Response 2:", res2.response);
}

// 2. ConversationSummaryMemory - 会話を要約して保持
export async function conversationSummaryMemoryExample() {
  console.log("\n=== ConversationSummaryMemory Example ===");
  
  const memory = new ConversationSummaryMemory({
    memoryKey: "chat_history",
    llm: new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 }),
  });

  const model = new ChatOpenAI({ model: "gpt-4o-mini" });
  const prompt = PromptTemplate.fromTemplate(`
The following is a friendly conversation between a human and an AI. 
The AI is talkative and provides lots of specific details from its context. 
If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{chat_history}
Human: {input}
AI:`);

  const chain = new ConversationChain({ llm: model, prompt, memory });

  const res1 = await chain.call({ input: "Hi! I'm Jim." });
  console.log("Response 1:", res1.response);
  console.log("Memory:", await memory.loadMemoryVariables({}));

  const res2 = await chain.call({ input: "What's my name?" });
  console.log("Response 2:", res2.response);
  console.log("Memory:", await memory.loadMemoryVariables({}));
}

// 3. BufferWindowMemory - 直近N件のメッセージのみ保持
export async function bufferWindowMemoryExample() {
  console.log("\n=== BufferWindowMemory Example ===");
  
  const memory = new BufferWindowMemory({ 
    memoryKey: "chat_history", 
    k: 1 // 直近1件の会話のみ保持
  });
  
  const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 });
  const prompt = PromptTemplate.fromTemplate(`
The following is a friendly conversation between a human and an AI. 
The AI is talkative and provides lots of specific details from its context. 
If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{chat_history}
Human: {input}
AI:`);

  const chain = new ConversationChain({ llm: model, prompt, memory });

  const res1 = await chain.call({ input: "Hi! I'm Jim." });
  console.log("Response 1:", res1.response);

  const res2 = await chain.call({ input: "What's my name?" });
  console.log("Response 2:", res2.response);
}

// 4. ConversationTokenBufferMemory - トークン数制限付き
export async function conversationTokenBufferMemoryExample() {
  console.log("\n=== ConversationTokenBufferMemory Example ===");
  
  const memory = new ConversationTokenBufferMemory({
    llm: new ChatOpenAI({ model: "gpt-4o-mini" }),
    maxTokenLimit: 100, // 100トークン制限
  });

  const model = new ChatOpenAI({ model: "gpt-4o-mini" });
  const prompt = PromptTemplate.fromTemplate(`
The following is a friendly conversation between a human and an AI. 
The AI is talkative and provides lots of specific details from its context. 
If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{chat_history}
Human: {input}
AI:`);

  const chain = new ConversationChain({ llm: model, prompt, memory });

  // 複数の会話を追加
  await memory.saveContext({ input: "hi" }, { output: "whats up" });
  await memory.saveContext({ input: "not much you" }, { output: "not much" });
  await memory.saveContext({ input: "how are you doing?" }, { output: "I'm doing great, thanks for asking!" });

  const result = await memory.loadMemoryVariables({});
  console.log("Memory result:", result);
}

// 5. ConversationSummaryBufferMemory - 要約とバッファの組み合わせ
export async function conversationSummaryBufferMemoryExample() {
  console.log("\n=== ConversationSummaryBufferMemory Example ===");
  
  const memory = new ConversationSummaryBufferMemory({
    llm: new ChatOpenAI({ model: "gpt-3.5-turbo-instruct", temperature: 0 }),
    maxTokenLimit: 50, // 50トークン制限
  });

  const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 });
  const prompt = PromptTemplate.fromTemplate(`
The following is a friendly conversation between a human and an AI. 
The AI is talkative and provides lots of specific details from its context. 
If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{chat_history}
Human: {input}
AI:`);

  const chain = new ConversationChain({ llm: model, prompt, memory });

  // メモリに会話コンテキストを保存
  await memory.saveContext({ input: "hi" }, { output: "whats up" });
  await memory.saveContext({ input: "not much you" }, { output: "not much" });

  const history = await memory.loadMemoryVariables({});
  console.log("Memory history:", history);
}

// 6. CombinedMemory - 複数のメモリを組み合わせ
export async function combinedMemoryExample() {
  console.log("\n=== CombinedMemory Example ===");
  
  // バッファメモリ
  const bufferMemory = new BufferMemory({
    memoryKey: "chat_history_lines",
    inputKey: "input",
  });

  // サマリーメモリ
  const summaryMemory = new ConversationSummaryMemory({
    llm: new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 }),
    inputKey: "input",
    memoryKey: "conversation_summary",
  });

  // メモリを組み合わせ
  const memory = new CombinedMemory({
    memories: [bufferMemory, summaryMemory],
  });

  const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 });
  const prompt = PromptTemplate.fromTemplate(`
The following is a friendly conversation between a human and an AI. 
The AI is talkative and provides lots of specific details from its context. 
If the AI does not know the answer to a question, it truthfully says it does not know.

Summary of conversation:
{conversation_summary}
Current conversation:
{chat_history_lines}
Human: {input}
AI:`);

  const chain = new ConversationChain({ llm: model, prompt, memory });

  const res1 = await chain.call({ input: "Hi! I'm Jim." });
  console.log("Response 1:", res1.response);

  const res2 = await chain.call({ input: "What did we talk about?" });
  console.log("Response 2:", res2.response);
}

// メイン実行関数
export async function runAllExamples() {
  try {
    await bufferMemoryExample();
    await conversationSummaryMemoryExample();
    await bufferWindowMemoryExample();
    await conversationTokenBufferMemoryExample();
    await conversationSummaryBufferMemoryExample();
    await combinedMemoryExample();
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

// 個別実行用
if (require.main === module) {
  runAllExamples();
}
