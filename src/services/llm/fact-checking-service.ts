import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
// Fact check chain is not available in current LangChain version
// We'll implement our own fact checking logic
import { 
  ChatPromptTemplate, 
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate 
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export interface FactCheckResult {
  isFactual: boolean;
  confidence: number;
  issues: string[];
  correctedText?: string;
  sources?: string[];
  explanation: string;
}

export interface FactCheckOptions {
  model?: "openai" | "anthropic" | "google" | "ollama";
  temperature?: number;
  maxTokens?: number;
  includeSources?: boolean;
  strictMode?: boolean;
  ollamaModel?: string;
  ollamaBaseUrl?: string;
}

export class FactCheckingService {
  private llm: ChatOpenAI | ChatAnthropic | ChatGoogleGenerativeAI | ChatOllama;
  private options: FactCheckOptions;

  constructor(options: FactCheckOptions = {}) {
    this.options = {
      model: "openai",
      temperature: 0.1,
      maxTokens: 1000,
      includeSources: true,
      strictMode: false,
      ...options
    };

    this.llm = this.createLLM();
  }

  private createLLM() {
    const { model, temperature, maxTokens, ollamaModel, ollamaBaseUrl } = this.options;

    switch (model) {
      case "anthropic":
        return new ChatAnthropic({
          modelName: "claude-3-sonnet-20240229",
          temperature,
          maxTokens,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
      
      case "google":
        return new ChatGoogleGenerativeAI({
          model: "gemini-pro",
          temperature,
          maxOutputTokens: maxTokens,
          apiKey: process.env.GOOGLE_API_KEY,
        });
      
      case "ollama":
        return new ChatOllama({
          model: ollamaModel || "gemma3:1b",
          baseUrl: ollamaBaseUrl || "http://localhost:11434",
          temperature,
        });
      
      default:
        return new ChatOpenAI({
          modelName: "gpt-4-turbo-preview",
          temperature,
          maxTokens,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
    }
  }

  /**
   * 基本的なファクトチェックを実行
   */
  async checkFacts(text: string): Promise<FactCheckResult> {
    const factCheckPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are a professional fact-checker. Analyze the given text and determine if it contains factual inaccuracies, contradictions, or unverifiable claims.
        
        Provide your analysis in the following JSON format:
        {
          "isFactual": boolean,
          "confidence": number (0-100),
          "issues": ["list of specific issues found"],
          "explanation": "detailed explanation of your findings"
        }
        
        Be thorough and objective in your analysis.`
      ),
      HumanMessagePromptTemplate.fromTemplate(
        `Please fact-check the following text:
        
        {text}`
      )
    ]);

    const chain = RunnableSequence.from([
      factCheckPrompt,
      this.llm,
      new StringOutputParser()
    ]);

    try {
      const result = await chain.invoke({ text });
      return this.parseJSONResult(result);
    } catch (error) {
      console.error("Fact checking failed:", error);
      return {
        isFactual: false,
        confidence: 0,
        issues: ["Fact checking process failed"],
        explanation: "Unable to verify facts due to an error"
      };
    }
  }

  /**
   * 高度なファクトチェック（ソース検証付き）
   */
  async checkFactsWithSources(text: string): Promise<FactCheckResult> {
    const enhancedPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are a professional fact-checker. Analyze the given text and:
        1. Identify factual claims
        2. Verify each claim against reliable sources
        3. Provide specific corrections for any inaccuracies
        4. Include source citations for verified information
        5. Rate confidence level (0-100%)
        
        Be thorough and objective in your analysis.`
      ),
      HumanMessagePromptTemplate.fromTemplate(
        `Please fact-check the following text:
        
        {text}
        
        Provide your analysis in the following JSON format:
        {
          "isFactual": boolean,
          "confidence": number,
          "issues": ["list of specific issues found"],
          "correctedText": "corrected version if needed",
          "sources": ["list of sources used"],
          "explanation": "detailed explanation of findings"
        }`
      )
    ]);

    const chain = RunnableSequence.from([
      enhancedPrompt,
      this.llm,
      new StringOutputParser()
    ]);

    try {
      const result = await chain.invoke({ text });
      return this.parseJSONResult(result);
    } catch (error) {
      console.error("Enhanced fact checking failed:", error);
      return this.checkFacts(text); // Fallback to basic fact checking
    }
  }

  /**
   * リアルタイムファクトチェック（ストリーミング対応）
   */
  async *checkFactsStream(text: string): AsyncGenerator<Partial<FactCheckResult>> {
    const streamingLLM = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.1,
      maxTokens: 1000,
      openAIApiKey: process.env.OPENAI_API_KEY,
      streaming: true
    });

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are a real-time fact-checker. Analyze the text as you read it and provide immediate feedback on factual accuracy.`
      ),
      HumanMessagePromptTemplate.fromTemplate(
        `Fact-check this text in real-time: {text}`
      )
    ]);

    const chain = RunnableSequence.from([
      prompt,
      streamingLLM,
      new StringOutputParser()
    ]);

    try {
      const stream = await chain.stream({ text });
      
      for await (const chunk of stream) {
        yield {
          explanation: chunk,
          isFactual: chunk.toLowerCase().includes("accurate") || chunk.toLowerCase().includes("correct"),
          confidence: this.extractConfidence(chunk)
        };
      }
    } catch (error) {
      console.error("Streaming fact check failed:", error);
      yield {
        isFactual: false,
        confidence: 0,
        issues: ["Streaming fact check failed"],
        explanation: "Unable to perform real-time fact checking"
      };
    }
  }

  /**
   * ハルシネーション検出専用チェック
   */
  async detectHallucinations(text: string): Promise<{
    hasHallucinations: boolean;
    hallucinationScore: number;
    detectedIssues: string[];
    suggestions: string[];
  }> {
    const hallucinationPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are an expert at detecting AI hallucinations. Look for:
        1. Contradictory statements
        2. Unverifiable claims
        3. Inconsistent information
        4. Fabricated details
        5. Outdated information presented as current
        
        Rate hallucination likelihood from 0-100%.`
      ),
      HumanMessagePromptTemplate.fromTemplate(
        `Analyze this text for potential hallucinations:
        
        {text}
        
        Provide analysis in JSON format:
        {
          "hasHallucinations": boolean,
          "hallucinationScore": number,
          "detectedIssues": ["list of issues"],
          "suggestions": ["improvement suggestions"]
        }`
      )
    ]);

    const chain = RunnableSequence.from([
      hallucinationPrompt,
      this.llm,
      new StringOutputParser()
    ]);

    try {
      const result = await chain.invoke({ text });
      return this.parseHallucinationResult(result);
    } catch (error) {
      console.error("Hallucination detection failed:", error);
      return {
        hasHallucinations: true,
        hallucinationScore: 50,
        detectedIssues: ["Unable to perform hallucination detection"],
        suggestions: ["Use basic fact checking instead"]
      };
    }
  }

  /**
   * 複数のテキストを一括でファクトチェック
   */
  async batchCheckFacts(texts: string[]): Promise<FactCheckResult[]> {
    const results: FactCheckResult[] = [];
    
    for (const text of texts) {
      const result = await this.checkFacts(text);
      results.push(result);
    }
    
    return results;
  }

  // Removed getFactCheckConfig as it's no longer needed

  private parseFactCheckResult(result: any): FactCheckResult {
    try {
      if (typeof result === "string") {
        return this.parseJSONResult(result);
      }
      
      return {
        isFactual: result.isFactual ?? true,
        confidence: result.confidence ?? 50,
        issues: result.issues ?? [],
        correctedText: result.correctedText,
        sources: result.sources ?? [],
        explanation: result.explanation ?? "Fact check completed"
      };
    } catch (error) {
      console.error("Error parsing fact check result:", error);
      return {
        isFactual: false,
        confidence: 0,
        issues: ["Failed to parse fact check result"],
        explanation: "Error in result parsing"
      };
    }
  }

  private parseJSONResult(result: string): FactCheckResult {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return {
        isFactual: !result.toLowerCase().includes("inaccurate") && !result.toLowerCase().includes("false"),
        confidence: this.extractConfidence(result),
        issues: this.extractIssues(result),
        explanation: result
      };
    } catch (error) {
      console.error("JSON parsing failed:", error);
      return {
        isFactual: false,
        confidence: 0,
        issues: ["JSON parsing failed"],
        explanation: result
      };
    }
  }

  private parseHallucinationResult(result: string): any {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        hasHallucinations: result.toLowerCase().includes("hallucination") || result.toLowerCase().includes("false"),
        hallucinationScore: this.extractConfidence(result),
        detectedIssues: this.extractIssues(result),
        suggestions: ["Review and verify information"]
      };
    } catch (error) {
      console.error("Hallucination result parsing failed:", error);
      return {
        hasHallucinations: true,
        hallucinationScore: 50,
        detectedIssues: ["Parsing failed"],
        suggestions: ["Manual review required"]
      };
    }
  }

  private extractConfidence(text: string): number {
    const confidenceMatch = text.match(/(\d+)%/);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]);
    }
    
    const numberMatch = text.match(/(\d+)/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1]);
      return num <= 100 ? num : 50;
    }
    
    return 50;
  }

  private extractIssues(text: string): string[] {
    const issues: string[] = [];
    
    // Look for common issue indicators
    const issuePatterns = [
      /inaccurate|incorrect|wrong|false|misleading/gi,
      /contradict|conflict|inconsistent/gi,
      /unverified|unconfirmed|uncertain/gi
    ];
    
    issuePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        issues.push(...matches);
      }
    });
    
    return issues.length > 0 ? issues : ["No specific issues identified"];
  }
}

// 使用例とエクスポート
export default FactCheckingService;
