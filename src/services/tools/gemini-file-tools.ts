import { GeminiFileService, GeminiFileUploadResponse, GeminiChatResponse } from '@/services/llm/gemini-file-service'

export interface GeminiFileTool {
  name: string
  description: string
  parameters: Record<string, any>
  execute: (...args: any[]) => Promise<any>
}

export class GeminiFileTools {
  private geminiFileService: GeminiFileService

  constructor(geminiFileService: GeminiFileService) {
    this.geminiFileService = geminiFileService
  }

  /**
   * ファイルアップロードツール
   */
  getUploadFileTool(): GeminiFileTool {
    return {
      name: 'upload_file_to_gemini',
      description: 'ファイルをGemini APIにアップロードします',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'アップロードするファイルのパス'
          },
          mimeType: {
            type: 'string',
            description: 'ファイルのMIMEタイプ（省略時は自動判定）',
            optional: true
          },
          displayName: {
            type: 'string',
            description: 'ファイルの表示名（省略時はファイル名）',
            optional: true
          }
        },
        required: ['filePath']
      },
      execute: async (filePath: string, mimeType?: string, displayName?: string): Promise<GeminiFileUploadResponse> => {
        if (!this.geminiFileService.isConfigured()) {
          throw new Error('Gemini File Service is not configured. Please configure with API key first.')
        }

        return await this.geminiFileService.uploadFile(filePath, mimeType, displayName)
      }
    }
  }

  /**
   * ファイルについてチャットするツール
   */
  getChatAboutFileTool(): GeminiFileTool {
    return {
      name: 'chat_about_file',
      description: 'アップロードされたファイルについてGeminiとチャットします',
      parameters: {
        type: 'object',
        properties: {
          fileUri: {
            type: 'string',
            description: 'アップロードされたファイルのURI'
          },
          question: {
            type: 'string',
            description: 'ファイルについての質問'
          }
        },
        required: ['fileUri', 'question']
      },
      execute: async (fileUri: string, question: string): Promise<GeminiChatResponse> => {
        if (!this.geminiFileService.isConfigured()) {
          throw new Error('Gemini File Service is not configured. Please configure with API key first.')
        }

        return await this.geminiFileService.chatAboutFile(fileUri, question)
      }
    }
  }

  /**
   * 複数の質問を連続して実行するツール
   */
  getChatAboutFileMultipleTool(): GeminiFileTool {
    return {
      name: 'chat_about_file_multiple',
      description: 'アップロードされたファイルについて複数の質問を連続して実行します',
      parameters: {
        type: 'object',
        properties: {
          fileUri: {
            type: 'string',
            description: 'アップロードされたファイルのURI'
          },
          questions: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'ファイルについての質問の配列'
          }
        },
        required: ['fileUri', 'questions']
      },
      execute: async (fileUri: string, questions: string[]): Promise<GeminiChatResponse[]> => {
        if (!this.geminiFileService.isConfigured()) {
          throw new Error('Gemini File Service is not configured. Please configure with API key first.')
        }

        return await this.geminiFileService.chatAboutFileMultiple(fileUri, questions)
      }
    }
  }

  /**
   * サービス設定状態を確認するツール
   */
  getCheckConfigurationTool(): GeminiFileTool {
    return {
      name: 'check_gemini_file_configuration',
      description: 'Gemini File Serviceの設定状態を確認します',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: async (): Promise<{ configured: boolean; model: string }> => {
        return {
          configured: this.geminiFileService.isConfigured(),
          model: this.geminiFileService.getCurrentModel()
        }
      }
    }
  }

  /**
   * すべてのツールを取得
   */
  getAllTools(): GeminiFileTool[] {
    return [
      this.getUploadFileTool(),
      this.getChatAboutFileTool(),
      this.getChatAboutFileMultipleTool(),
      this.getCheckConfigurationTool()
    ]
  }
}
