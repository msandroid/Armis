import { LLMConfig, LLMResponse } from '@/types/llm'

// ブラウザ環境ではLlamaCppを使用しない
let LlamaCpp: any = null
if (typeof window === 'undefined') {
  // Node.js環境でのみLlamaCppをインポート
  try {
    const { LlamaCpp: LlamaCppClass } = await import('@langchain/community/llms/llama_cpp')
    LlamaCpp = LlamaCppClass
  } catch (error) {
    console.warn('LlamaCpp not available:', error)
  }
}

export class LlamaService {
  private model: any = null
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    // ブラウザ環境ではモックモードを使用
    if (typeof window !== 'undefined') {
      console.log('Browser environment detected. Using mock mode for LlamaService.')
      this.model = null
      return
    }

    // LlamaCppが利用できない場合はモックモード
    if (!LlamaCpp) {
      console.log('LlamaCpp not available. Using mock mode.')
      this.model = null
      return
    }

    try {
      // モデルファイルの存在確認
      const fs = await import('fs')
      if (!fs.existsSync(this.config.modelPath)) {
        console.warn(`Llama model file not found at ${this.config.modelPath}. Using mock mode.`)
        this.model = null
        return
      }

      this.model = new LlamaCpp({
        modelPath: this.config.modelPath,
        temperature: this.config.temperature,
        maxTokens: this.config.contextSize,
        topP: this.config.topP,
        topK: this.config.topK,
        verbose: false,
      })

      console.log('Llama 3 8B model initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Llama model:', error)
      console.warn('Using mock mode due to initialization failure')
      this.model = null
    }
  }

  async generateResponse(prompt: string): Promise<LLMResponse> {
    const startTime = Date.now()
    
    if (!this.model) {
      // モック応答を返す
      const mockResponse = this.generateMockResponse(prompt)
      const endTime = Date.now()
      
      return {
        text: mockResponse,
        tokens: mockResponse.length,
        duration: endTime - startTime
      }
    }

    try {
      const response = await this.model.invoke(prompt)
      const endTime = Date.now()
      
      return {
        text: response,
        tokens: response.length, // Approximate token count
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error generating response:', error)
      // エラー時もモック応答を返す
      const mockResponse = this.generateMockResponse(prompt)
      const endTime = Date.now()
      
      return {
        text: mockResponse,
        tokens: mockResponse.length,
        duration: endTime - startTime
      }
    }
  }

  private generateMockResponse(prompt: string): string {
    // プロンプトの内容に基づいて適切なモック応答を生成
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.includes('typescript') || lowerPrompt.includes('javascript') || lowerPrompt.includes('コード')) {
      return `これはTypeScript/JavaScriptのコード例です：

\`\`\`typescript
// 基本的な関数の例
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

// 使用例
const message = greet('World');
console.log(message); // "Hello, World!"
\`\`\`

このコードは基本的なTypeScript関数の例です。型安全性を保ちながら、シンプルで理解しやすいコードになっています。`
    }
    
    if (lowerPrompt.includes('python') || lowerPrompt.includes('python')) {
      return `これはPythonのコード例です：

\`\`\`python
# 基本的な関数の例
def greet(name: str) -> str:
    return f"Hello, {name}!"

# 使用例
message = greet("World")
print(message)  # "Hello, World!"
\`\`\`

このコードは基本的なPython関数の例です。型ヒントを使用して、コードの可読性を向上させています。`
    }
    
    if (lowerPrompt.includes('データ') || lowerPrompt.includes('分析')) {
      return `データ分析の基本的な手順について説明します：

1. **データの収集**: 必要なデータを収集し、整理します
2. **データのクリーニング**: 欠損値や異常値を処理します
3. **探索的データ分析**: データの分布や相関を確認します
4. **仮説の設定**: 分析の目的に応じて仮説を立てます
5. **統計的分析**: 適切な統計手法を使用して分析します
6. **結果の解釈**: 分析結果を解釈し、結論を導きます
7. **可視化**: 結果をグラフやチャートで表現します

これらの手順に従うことで、効果的なデータ分析が可能になります。`
    }
    
    if (lowerPrompt.includes('ファイル') || lowerPrompt.includes('処理')) {
      return `ファイル処理の基本的な手順について説明します：

1. **ファイルの読み込み**: 適切なエンコーディングでファイルを読み込みます
2. **データの検証**: ファイルの形式や内容を確認します
3. **データの変換**: 必要に応じてデータ形式を変換します
4. **処理の実行**: 目的に応じた処理を実行します
5. **結果の保存**: 処理結果を適切な形式で保存します
6. **エラーハンドリング**: 処理中のエラーを適切に処理します

これらの手順により、安全で効率的なファイル処理が可能になります。`
    }
    
    // デフォルトの応答
    return `申し訳ございませんが、現在Llamaモデルが利用できません。モック応答をお返しします。

ご質問の内容を理解しましたが、実際のLlamaモデルを使用した応答を提供するには、適切なモデルファイルが必要です。

モデルファイルを配置するか、別のLLMサービスを使用してください。`
  }

  async generateWithTools(prompt: string, availableTools: string[]): Promise<LLMResponse> {
    const toolPrompt = `
${prompt}

Available tools: ${availableTools.join(', ')}

Please think step by step and determine which tools to use. If you need to use a tool, format your response as:
TOOL_CALL: {"tool": "tool_name", "arguments": {"param": "value"}}

Otherwise, provide a direct response.
`

    return this.generateResponse(toolPrompt)
  }

  isInitialized(): boolean {
    // モックモードの場合も初期化済みとみなす
    return true
  }

  getConfig(): LLMConfig {
    return this.config
  }

  /**
   * LangChainモデルを取得（プロンプト補完エージェント用）
   */
  getModel(): any {
    if (this.model) {
      return this.model
    }
    
    // モックモデルを返す（LangChain互換）
    return {
      invoke: async (input: any) => {
        const response = await this.generateResponse(typeof input === 'string' ? input : input.prompt || input.input || '')
        return response.text
      }
    }
  }

  /**
   * モデル名を取得
   */
  getModelName(): string {
    return this.config.modelPath ? `Llama-${this.config.modelPath.split('/').pop()}` : 'Llama-Mock'
  }
}
