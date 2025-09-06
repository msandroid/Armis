import { GraphAI, GraphData, GraphAILogger } from 'graphai'
import * as vanilla from '@graphai/vanilla'
import { openAIAgent } from '@graphai/openai_agent'
import { anthropicAgent } from '@graphai/anthropic_agent'
import { geminiAgent } from '@graphai/gemini_agent'
import { groqAgent } from '@graphai/groq_agent'
import { browserlessAgent } from '@graphai/browserless_agent'

// Node.js環境でのみ使用可能なエージェント
let textInputAgent: any = null
let fileWriteAgent: any = null
let consoleStreamDataAgentFilter: any = null

// ブラウザ環境かどうかをチェック
const isBrowser = typeof window !== 'undefined'

if (!isBrowser) {
  try {
    const inputAgents = require('@graphai/input_agents')
    const vanillaNodeAgents = require('@graphai/vanilla_node_agents')
    const streamAgentFilter = require('@graphai/stream_agent_filter/node')
    
    textInputAgent = inputAgents.textInputAgent
    fileWriteAgent = vanillaNodeAgents.fileWriteAgent
    consoleStreamDataAgentFilter = streamAgentFilter.consoleStreamDataAgentFilter
  } catch (error) {
    console.warn('Node.js specific GraphAI agents not available:', error)
  }
}

/**
 * GraphAIサービスクラス
 * GraphAIの機能をArmisプロジェクトで使いやすくするためのラッパー
 */
export class GraphAIService {
  private graphAI: GraphAI | null = null
  private agents: Record<string, any> = {}

  constructor() {
    this.initializeAgents()
  }

  /**
   * エージェントを初期化
   */
  private initializeAgents() {
    this.agents = {
      // 基本エージェント
      ...vanilla,
      
      // LLMエージェント
      openAIAgent,
      anthropicAgent,
      geminiAgent,
      groqAgent,
      
      // ブラウザエージェント
      browserlessAgent
    }

    // Node.js環境でのみ使用可能なエージェントを追加
    if (textInputAgent) {
      this.agents.textInputAgent = textInputAgent
    }
    if (fileWriteAgent) {
      this.agents.fileWriteAgent = fileWriteAgent
    }
    if (consoleStreamDataAgentFilter) {
      this.agents.consoleStreamDataAgentFilter = consoleStreamDataAgentFilter
    }
  }

  /**
   * GraphAIインスタンスを作成
   */
  private createGraphAI(graphData: GraphData): GraphAI {
    return new GraphAI(graphData, this.agents)
  }

  /**
   * 基本的なワークフローを実行
   */
  async executeWorkflow(
    graphData: GraphData,
    inputs?: Record<string, any>
  ): Promise<any> {
    try {
      this.graphAI = this.createGraphAI(graphData)
      
      GraphAILogger.info('Starting GraphAI workflow...')
      
      const result = await this.graphAI.run()
      
      GraphAILogger.info('GraphAI workflow completed successfully')
      
      return {
        success: true,
        result,
        error: null
      }
    } catch (error) {
      GraphAILogger.error('GraphAI workflow failed:', error)
      
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * テキスト処理ワークフロー
   */
  async processText(
    text: string,
    operations: string[] = ['summarize', 'extract_keywords']
  ): Promise<any> {
    const graphData: GraphData = {
      version: 0.5,
      nodes: {
        input: {
          value: text
        },
        operations: {
          agent: 'mapAgent',
          inputs: {
            rows: operations
          },
          params: {
            compositeResult: true
          },
          graph: {
            version: 0.5,
            nodes: {
              operation: {
                agent: 'copyAgent',
                inputs: {
                  text: ':row'
                }
              },
              result: {
                agent: 'openAIAgent',
                inputs: {
                  prompt: 'Process the following text with the operation: ${:operation}\n\nText: ${:input}'
                }
              }
            }
          }
        }
      }
    }

    return this.executeWorkflow(graphData, { input: text })
  }

  /**
   * マルチステップ推論ワークフロー
   */
  async multiStepReasoning(
    question: string,
    context?: string
  ): Promise<any> {
    const graphData: GraphData = {
      version: 0.5,
      nodes: {
        question: {
          value: question
        },
        context: {
          value: context || ''
        },
        step1_analysis: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Analyze the following question and break it down into steps:\n\nQuestion: ${:question}\nContext: ${:context}'
          }
        },
        step2_reasoning: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Based on the analysis, provide step-by-step reasoning:\n\nAnalysis: ${:step1_analysis}'
          }
        },
        step3_conclusion: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Based on the reasoning, provide a clear conclusion:\n\nReasoning: ${:step2_reasoning}'
          }
        }
      }
    }

    return this.executeWorkflow(graphData)
  }

  /**
   * ドキュメント処理ワークフロー
   */
  async processDocument(
    documentContent: string,
    operations: string[] = ['extract_structure', 'summarize', 'generate_questions']
  ): Promise<any> {
    const graphData: GraphData = {
      version: 0.5,
      nodes: {
        document: {
          value: documentContent
        },
        document_analysis: {
          agent: 'mapAgent',
          inputs: {
            rows: operations
          },
          params: {
            compositeResult: true
          },
          graph: {
            nodes: {
              operation: {
                agent: 'copyAgent',
                inputs: {
                  operation: ':row'
                }
              },
              analysis: {
                agent: 'openAIAgent',
                inputs: {
                  prompt: 'Perform the following operation on the document:\n\nOperation: ${:operation}\nDocument: ${:document}'
                }
              }
            }
          }
        }
      }
    }

    return this.executeWorkflow(graphData)
  }

  /**
   * コード生成ワークフロー
   */
  async generateCode(
    requirements: string,
    language: string = 'typescript'
  ): Promise<any> {
    const graphData: GraphData = {
      version: 0.5,
      nodes: {
        requirements: {
          value: requirements
        },
        language: {
          value: language
        },
        code_planning: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Create a detailed plan for implementing the following requirements in ${:language}:\n\nRequirements: ${:requirements}'
          }
        },
        code_generation: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Generate code based on the plan:\n\nPlan: ${:code_planning}\nLanguage: ${:language}'
          }
        },
        code_review: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Review the generated code for best practices and potential improvements:\n\nCode: ${:code_generation}'
          }
        }
      }
    }

    return this.executeWorkflow(graphData)
  }

  /**
   * データ分析ワークフロー
   */
  async analyzeData(
    data: any,
    analysisType: string = 'basic_statistics'
  ): Promise<any> {
    const graphData: GraphData = {
      version: 0.5,
      nodes: {
        data: {
          value: JSON.stringify(data)
        },
        analysis_type: {
          value: analysisType
        },
        data_analysis: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Analyze the following data with ${:analysis_type}:\n\nData: ${:data}'
          }
        },
        insights: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Extract key insights from the analysis:\n\nAnalysis: ${:data_analysis}'
          }
        },
        recommendations: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Provide recommendations based on the insights:\n\nInsights: ${:insights}'
          }
        }
      }
    }

    return this.executeWorkflow(graphData)
  }

  /**
   * カスタムワークフローを実行
   */
  async executeCustomWorkflow(
    workflowDefinition: GraphData,
    inputs?: Record<string, any>
  ): Promise<any> {
    return this.executeWorkflow(workflowDefinition, inputs)
  }

  /**
   * ワークフローの状態を取得
   */
  getWorkflowStatus(): { isRunning: boolean; currentStep?: string } {
    if (!this.graphAI) {
      return { isRunning: false }
    }

    return {
      isRunning: false, // GraphAI v2では実行状態の取得方法が変更
      currentStep: undefined
    }
  }

  /**
   * ワークフローを停止
   */
  stopWorkflow(): void {
    if (this.graphAI) {
      // GraphAI v2では停止方法が変更
      console.log('Workflow stop requested')
    }
  }

  /**
   * 利用可能なエージェントのリストを取得
   */
  getAvailableAgents(): string[] {
    return Object.keys(this.agents)
  }

  /**
   * エージェントの詳細情報を取得
   */
  getAgentInfo(agentName: string): any {
    return this.agents[agentName] || null
  }
}
