import { AgentType, AgentResponse } from '@/types/llm'
import { LlamaService } from '@/services/llm/llama-service'
import { OllamaService } from '@/services/llm/ollama-service'
import { GeminiImageService } from '@/services/llm/gemini-image-service'
import { checkGoogleAIConfig } from '@/utils/env-checker'

export interface ImageGenerationAgent {
  type: AgentType
  name: string
  description: string
  keywords: string[]
  execute: (input: string, context?: Record<string, any>) => Promise<AgentResponse>
}

export class ImageGenerationAgent implements ImageGenerationAgent {
  type: AgentType = 'image_generation'
  name = 'Image Generation Agent'
  description = '画像生成に特化したエージェント。テキストプロンプトから高品質な画像を生成します。'
  keywords = [
    '画像生成', 'create image', 'generate image', 'draw', 'paint', '画像を作成', '絵を描いて',
    'image generation', 'art', 'picture', 'visual', 'graphic', 'illustration'
  ]

  private llmService: LlamaService | OllamaService
  private geminiImageService: GeminiImageService

  constructor(llmService: LlamaService | OllamaService) {
    this.llmService = llmService
    this.geminiImageService = new GeminiImageService()
  }

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    try {
      console.log('🎨 Image Generation Agent executing...')
      
      // プロンプトから画像生成用のテキストを抽出
      const imagePrompt = input
        .replace(/画像を生成|create image|generate image|draw|paint|画像を作成|絵を描いて/gi, '')
        .trim()
      
      if (!imagePrompt) {
        return {
          content: '画像生成のプロンプトを入力してください。例: "美しい夕日を画像で生成"',
          agentType: this.type,
          confidence: 0.8,
          reasoning: 'プロンプトが空のため、適切な画像生成リクエストではありません。'
        }
      }

      // 環境変数の設定状況を確認
      const config = checkGoogleAIConfig()
      
      if (!config.isConfigured) {
        return {
          content: `## 🎨 画像生成の設定が必要です

画像生成機能を使用するには、Google AI APIの設定が必要です。

### 📋 設定手順:

1. **Google Cloud Console**でプロジェクトを作成
2. **Vertex AI API**を有効化
3. **API Key**を作成
4. **Project ID**を取得

### 🔧 環境変数の設定:

プロジェクトのルートディレクトリに\`.env\`ファイルを作成し、以下を追加してください：

\`\`\`bash
# Google AI API Key for Gemini File Upload and Image Generation
VITE_GOOGLE_API_KEY=your_google_api_key_here

# Google Cloud Project ID for Vertex AI Image Generation
VITE_GOOGLE_PROJECT_ID=your_google_cloud_project_id_here

# Google Cloud Location for Vertex AI (default: us-central1)
VITE_GOOGLE_LOCATION=us-central1
\`\`\`

### 📖 詳細な設定方法:

詳細な設定方法については、[README.md](./README.md)の「Gemini Image Generation Integration」セクションを参照してください。

### 🔄 設定後の再起動:

環境変数を設定した後、アプリケーションを再起動してください。

---
**現在のプロンプト:** ${imagePrompt}
**状態:** 設定待ち`,
          agentType: this.type,
          confidence: 0.9,
          reasoning: 'API設定が不足しているため、画像生成を実行できません。'
        }
      }

      // Gemini Image Serviceを設定
      await this.geminiImageService.configure(config.googleApiKey!, config.googleProjectId!, config.googleLocation)

      // 画像生成リクエストを作成
      const imageRequest = {
        prompt: imagePrompt,
        model: 'imagen-3.0-generate-002',
        aspectRatio: '1:1' as const,
        quality: 'standard' as const,
        style: 'photorealistic' as const,
        safetyFilter: 'block_some' as const,
        personGeneration: 'dont_allow' as const
      }

      console.log('🔄 Generating image with prompt:', imagePrompt)
      
      // 画像生成を実行
      const imageResponse = await this.geminiImageService.generateImage(imageRequest)
      
      console.log('✅ Image generation completed:', imageResponse)

      return {
        content: `image generated!\n\n**プロンプト:** ${imagePrompt}\n**モデル:** ${imageResponse.model || 'imagen-3.0-generate-002'}\n**サイズ:** ${imageResponse.metadata?.width || 1024}x${imageResponse.metadata?.height || 1024}`,
        agentType: this.type,
        confidence: 0.95,
        reasoning: '画像生成が正常に完了しました。',
        images: imageResponse.images // 生成された画像データを追加
      }

    } catch (error) {
      console.error('❌ Image generation failed:', error)
      
      return {
        content: `画像生成中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        agentType: this.type,
        confidence: 0.1,
        reasoning: '画像生成処理中にエラーが発生しました。',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
