import {
  Agent,
  AgentExecutor,
  ChatAgent,
  ChatConversationalAgent,
  ZeroShotAgent,
  StructuredChatAgent,
  OpenAIAgent,
  XMLAgent,
  createReactAgent,
  createStructuredChatAgent,
  createOpenAIFunctionsAgent,
  createOpenAIToolsAgent,
  createToolCallingAgent,
  createXmlAgent,
  createJsonAgent,
  createOpenApiAgent,
  createVectorStoreAgent,
  createVectorStoreRouterAgent,
  initializeAgentExecutor,
  initializeAgentExecutorWithOptions,
  type AgentArgs,
  type AgentExecutorInput,
  type ChatAgentInput,
  type ChatConversationalAgentInput,
  type ZeroShotAgentInput,
  type StructuredChatAgentInput,
  type OpenAIAgentInput,
  type XMLAgentInput,
  type CreateReactAgentParams,
  type CreateStructuredChatAgentParams,
  type CreateOpenAIFunctionsAgentParams,
  type CreateOpenAIToolsAgentParams,
  type CreateToolCallingAgentParams,
  type CreateXmlAgentParams,
  type InitializeAgentExecutorOptions,
  type InitializeAgentExecutorOptionsStructured,
} from "langchain/agents";

import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatLlamaCpp } from "@langchain/community/chat_models/llama_cpp";

import { Calculator } from "@langchain/community/tools/calculator";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import { DynamicTool } from "@langchain/community/tools/dynamic";
import { Tool } from "@langchain/core/tools";
import { ChainTool } from "@langchain/community/tools/chain";
import { VectorStoreQATool } from "@langchain/community/tools/vectorstore_qa";
import { VectorStoreRouterTool } from "@langchain/community/tools/vectorstore_router";

import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { AgentAction, AgentFinish } from "@langchain/core/agents";

export interface LangChainAgentConfig {
  modelType: "openai" | "anthropic" | "google" | "ollama" | "llama-cpp";
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface AgentCreationOptions {
  tools?: Tool[];
  verbose?: boolean;
  maxIterations?: number;
  returnIntermediateSteps?: boolean;
}

export class LangChainAgentsService {
  private config: LangChainAgentConfig;

  constructor(config: LangChainAgentConfig) {
    this.config = config;
  }

  private createModel() {
    switch (this.config.modelType) {
      case "openai":
        return new ChatOpenAI({
          modelName: this.config.modelName || "gpt-3.5-turbo",
          temperature: this.config.temperature || 0,
          maxTokens: this.config.maxTokens,
          openAIApiKey: this.config.apiKey,
        });
      case "anthropic":
        return new ChatAnthropic({
          modelName: this.config.modelName || "claude-3-sonnet-20240229",
          temperature: this.config.temperature || 0,
          maxTokens: this.config.maxTokens,
          anthropicApiKey: this.config.apiKey,
        });
      case "google":
        return new ChatGoogleGenerativeAI({
          modelName: this.config.modelName || "gemini-pro",
          temperature: this.config.temperature || 0,
          maxOutputTokens: this.config.maxTokens,
          googleApiKey: this.config.apiKey,
        });
      case "ollama":
        return new ChatOllama({
          model: this.config.modelName || "llama2",
          baseUrl: this.config.baseUrl || "http://localhost:11434",
          temperature: this.config.temperature || 0,
        });
      case "llama-cpp":
        return new ChatLlamaCpp({
          modelPath: this.config.modelName || "./models/gpt-oss-20b-GGUF.gguf",
          temperature: this.config.temperature || 0,
          maxTokens: this.config.maxTokens || 2048,
        });
      default:
        throw new Error(`Unsupported model type: ${this.config.modelType}`);
    }
  }

  // 基本的なエージェント作成
  async createBasicAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    console.log('Tools:', tools);
    console.log('Tools type:', typeof tools);
    console.log('Tools is array:', Array.isArray(tools));

    // より簡単なアプローチでエージェントを作成
    try {
      return await initializeAgentExecutor({
        llm: model,
        tools: Array.isArray(tools) ? tools : [tools],
        agentType: "zero-shot-react-description",
        verbose: options.verbose || false,
        maxIterations: options.maxIterations || 10,
        returnIntermediateSteps: options.returnIntermediateSteps || false,
      });
    } catch (error) {
      console.error('Error creating agent with initializeAgentExecutor:', error);
      
      // フォールバック: 直接LLMを使用
      return {
        invoke: async (input: any) => {
          const response = await model.invoke(input.input);
          return { output: response.content };
        }
      };
    }
  }

  // チャットエージェント作成
  async createChatAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agent = new ChatAgent({
      llmChain: RunnableSequence.from([
        {
          input: (input: any) => input.input,
          agent_scratchpad: (input: any) => input.agent_scratchpad,
        },
        PromptTemplate.fromTemplate(
          "Answer the following questions as best you can. You have access to the following tools:\n\n{tools}\n\nUse the following format:\n\nQuestion: the input question you must answer\nThought: you should always think about what to do\nAction: the action to take, should be one of [{tool_names}]\nAction Input: the input to the action\nObservation: the result of the action\n... (this Thought/Action/Action Input/Observation can repeat N times)\nThought: I now know the final answer\nFinal Answer: the final answer to the original input question\n\nQuestion: {input}\nThought:{agent_scratchpad}"
        ),
        model,
      ]),
      allowedTools: tools.map((tool) => tool.name),
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // 会話型チャットエージェント作成
  async createChatConversationalAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agent = new ChatConversationalAgent({
      llmChain: RunnableSequence.from([
        {
          input: (input: any) => input.input,
          agent_scratchpad: (input: any) => input.agent_scratchpad,
          chat_history: (input: any) => input.chat_history,
        },
        PromptTemplate.fromTemplate(
          "You are a helpful AI assistant. You have access to the following tools:\n\n{tools}\n\nUse the following format:\n\nQuestion: the input question you must answer\nThought: you should always think about what to do\nAction: the action to take, should be one of [{tool_names}]\nAction Input: the input to the action\nObservation: the result of the action\n... (this Thought/Action/Action Input/Observation can repeat N times)\nThought: I now know the final answer\nFinal Answer: the final answer to the original input question\n\nPrevious conversation history:\n{chat_history}\n\nQuestion: {input}\nThought:{agent_scratchpad}"
        ),
        model,
      ]),
      allowedTools: tools.map((tool) => tool.name),
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // Zero-Shotエージェント作成
  async createZeroShotAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agent = new ZeroShotAgent({
      llmChain: RunnableSequence.from([
        {
          input: (input: any) => input.input,
          agent_scratchpad: (input: any) => input.agent_scratchpad,
        },
        PromptTemplate.fromTemplate(
          "Answer the following questions as best you can. You have access to the following tools:\n\n{tools}\n\nUse the following format:\n\nQuestion: the input question you must answer\nThought: you should always think about what to do\nAction: the action to take, should be one of [{tool_names}]\nAction Input: the input to the action\nObservation: the result of the action\n... (this Thought/Action/Action Input/Observation can repeat N times)\nThought: I now know the final answer\nFinal Answer: the final answer to the original input question\n\nQuestion: {input}\nThought:{agent_scratchpad}"
        ),
        model,
      ]),
      allowedTools: tools.map((tool) => tool.name),
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // 構造化チャットエージェント作成
  async createStructuredChatAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const params: CreateStructuredChatAgentParams = {
      llm: model,
      tools,
      verbose: options.verbose || false,
    };

    const agent = await createStructuredChatAgent(params);

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // OpenAI Functionsエージェント作成
  async createOpenAIFunctionsAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const params: CreateOpenAIFunctionsAgentParams = {
      llm: model,
      tools,
      verbose: options.verbose || false,
    };

    const agent = await createOpenAIFunctionsAgent(params);

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // OpenAI Toolsエージェント作成
  async createOpenAIToolsAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const params: CreateOpenAIToolsAgentParams = {
      llm: model,
      tools,
      verbose: options.verbose || false,
    };

    const agent = await createOpenAIToolsAgent(params);

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // Tool Callingエージェント作成
  async createToolCallingAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const params: CreateToolCallingAgentParams = {
      llm: model,
      tools,
      verbose: options.verbose || false,
    };

    const agent = await createToolCallingAgent(params);

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // XMLエージェント作成
  async createXmlAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const params: CreateXmlAgentParams = {
      llm: model,
      tools,
      verbose: options.verbose || false,
    };

    const agent = await createXmlAgent(params);

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // ReActエージェント作成
  async createReactAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const params: CreateReactAgentParams = {
      llm: model,
      tools,
      verbose: options.verbose || false,
    };

    const agent = await createReactAgent(params);

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // JSONエージェント作成
  async createJsonAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agent = await createJsonAgent({
      llm: model,
      tools,
      verbose: options.verbose || false,
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // OpenAPIエージェント作成
  async createOpenApiAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agent = await createOpenApiAgent({
      llm: model,
      tools,
      verbose: options.verbose || false,
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // ベクトルストアエージェント作成
  async createVectorStoreAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agent = await createVectorStoreAgent({
      llm: model,
      tools,
      verbose: options.verbose || false,
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // ベクトルストアルーターエージェント作成
  async createVectorStoreRouterAgent(options: AgentCreationOptions = {}) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agent = await createVectorStoreRouterAgent({
      llm: model,
      tools,
      verbose: options.verbose || false,
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
    });
  }

  // 初期化オプションを使用したエージェント作成
  async createAgentWithOptions(
    agentType: string,
    options: InitializeAgentExecutorOptions = {}
  ) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agentOptions: InitializeAgentExecutorOptions = {
      llm: model,
      tools,
      agentType: agentType as any,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
      ...options,
    };

    return await initializeAgentExecutor(agentOptions);
  }

  // 構造化オプションを使用したエージェント作成
  async createStructuredAgentWithOptions(
    options: InitializeAgentExecutorOptionsStructured = {}
  ) {
    const model = this.createModel();
    const tools = options.tools || [new Calculator()];

    const agentOptions: InitializeAgentExecutorOptionsStructured = {
      llm: model,
      tools,
      verbose: options.verbose || false,
      maxIterations: options.maxIterations || 10,
      returnIntermediateSteps: options.returnIntermediateSteps || false,
      ...options,
    };

    return await initializeAgentExecutorWithOptions(agentOptions);
  }

  // カスタムツールの作成
  createCustomTool(name: string, description: string, func: Function) {
    return new DynamicTool({
      name,
      description,
      func: async (input: string) => {
        try {
          return await func(input);
        } catch (error) {
          return `Error: ${error}`;
        }
      },
    });
  }

  // エージェントの実行
  async runAgent(
    agent: AgentExecutor,
    input: string,
    callbacks?: any[]
  ) {
    try {
      const result = await agent.invoke(
        { input },
        { callbacks }
      );
      return result;
    } catch (error) {
      console.error("Agent execution error:", error);
      throw error;
    }
  }

  // エージェントの一括実行
  async runMultipleAgents(
    agents: { name: string; agent: AgentExecutor }[],
    input: string
  ) {
    const results = [];
    
    for (const { name, agent } of agents) {
      try {
        const result = await this.runAgent(agent, input);
        results.push({ name, result, success: true });
      } catch (error) {
        results.push({ name, error: error.message, success: false });
      }
    }
    
    return results;
  }
}

// エクスポート
export default LangChainAgentsService;
