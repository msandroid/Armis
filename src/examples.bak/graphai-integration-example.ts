import { GraphAIService } from '@/services/graphai/graphai-service'
import { GraphAITools } from '@/services/tools/graphai-tools'
import { GraphData } from 'graphai'

/**
 * GraphAI統合例
 * GraphAIの機能をArmisで使用する例
 */
async function graphaiIntegrationExample() {
  console.log('🧠 GraphAI Integration Example')
  console.log('==============================')

  // GraphAIサービスインスタンスを作成
  const graphAIService = new GraphAIService()
  const graphAITools = new GraphAITools()

  try {
    // 例1: テキスト処理
    console.log('\n📝 Step 1: Text Processing...')
    const textResult = await graphAITools.textProcessor.execute({
      text: 'GraphAI is an asynchronous data flow execution engine that allows developers to build agentic applications by describing agent workflows as declarative data flow graphs in YAML or JSON.',
      operations: ['summarize', 'extract_keywords', 'analyze_sentiment']
    })

    if (textResult.success) {
      console.log('✅ Text processing completed successfully')
      console.log('📄 Result:', JSON.stringify(textResult.result, null, 2))
    } else {
      console.log('❌ Text processing failed:', textResult.error)
    }

    // 例2: マルチステップ推論
    console.log('\n🤔 Step 2: Multi-step Reasoning...')
    const reasoningResult = await graphAITools.multiStepReasoner.execute({
      question: 'How can GraphAI be used to improve software development workflows?',
      context: 'GraphAI is a framework for building AI-powered applications with declarative workflows.'
    })

    if (reasoningResult.success) {
      console.log('✅ Multi-step reasoning completed successfully')
      console.log('🧠 Result:', JSON.stringify(reasoningResult.result, null, 2))
    } else {
      console.log('❌ Multi-step reasoning failed:', reasoningResult.error)
    }

    // 例3: ドキュメント処理
    console.log('\n📄 Step 3: Document Processing...')
    const documentContent = `
    GraphAI is an asynchronous data flow execution engine, which allows developers to build agentic applications by describing agent workflows as declarative data flow graphs in YAML or JSON.
    
    Key Features:
    - Declarative workflow definition
    - Asynchronous execution
    - Multiple AI agent support
    - Extensible architecture
    - Real-time monitoring
    
    Use Cases:
    - Content generation
    - Data processing
    - Decision making
    - Automation workflows
    `

    const documentResult = await graphAITools.documentProcessor.execute({
      documentContent,
      operations: ['extract_structure', 'summarize', 'generate_questions']
    })

    if (documentResult.success) {
      console.log('✅ Document processing completed successfully')
      console.log('📋 Result:', JSON.stringify(documentResult.result, null, 2))
    } else {
      console.log('❌ Document processing failed:', documentResult.error)
    }

    // 例4: コード生成
    console.log('\n💻 Step 4: Code Generation...')
    const codeResult = await graphAITools.codeGenerator.execute({
      requirements: 'Create a function that processes text data and extracts key information using AI',
      language: 'typescript'
    })

    if (codeResult.success) {
      console.log('✅ Code generation completed successfully')
      console.log('🔧 Result:', JSON.stringify(codeResult.result, null, 2))
    } else {
      console.log('❌ Code generation failed:', codeResult.error)
    }

    // 例5: データ分析
    console.log('\n📊 Step 5: Data Analysis...')
    const sampleData = {
      users: [
        { id: 1, name: 'Alice', age: 25, score: 85 },
        { id: 2, name: 'Bob', age: 30, score: 92 },
        { id: 3, name: 'Charlie', age: 28, score: 78 },
        { id: 4, name: 'Diana', age: 35, score: 95 }
      ]
    }

    const dataResult = await graphAITools.dataAnalyzer.execute({
      data: sampleData,
      analysisType: 'user_performance_analysis'
    })

    if (dataResult.success) {
      console.log('✅ Data analysis completed successfully')
      console.log('📈 Result:', JSON.stringify(dataResult.result, null, 2))
    } else {
      console.log('❌ Data analysis failed:', dataResult.error)
    }

  } catch (error) {
    console.error('❌ Example failed:', error)
  }
}

/**
 * カスタムワークフロー例
 */
async function customWorkflowExample() {
  console.log('\n🔧 Custom Workflow Example')
  console.log('==========================')

  const graphAIService = new GraphAIService()

  try {
    // カスタムワークフロー定義
    const customWorkflow: GraphData = {
      version: 0.5,
      nodes: {
        input_text: {
          value: 'GraphAI is revolutionizing how we build AI applications.'
        },
        sentiment_analysis: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Analyze the sentiment of the following text:\n\n${:input_text}'
          }
        },
        keyword_extraction: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Extract key concepts from the following text:\n\n${:input_text}'
          }
        },
        summary: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Create a concise summary of the following text:\n\n${:input_text}'
          }
        },
        final_report: {
          agent: 'openAIAgent',
          inputs: {
            prompt: 'Create a comprehensive report combining:\n\nSentiment: ${:sentiment_analysis}\nKeywords: ${:keyword_extraction}\nSummary: ${:summary}'
          }
        }
      }
    }

    const result = await graphAIService.executeCustomWorkflow(customWorkflow)

    if (result.success) {
      console.log('✅ Custom workflow completed successfully')
      console.log('📋 Result:', JSON.stringify(result.result, null, 2))
    } else {
      console.log('❌ Custom workflow failed:', result.error)
    }

  } catch (error) {
    console.error('❌ Custom workflow example failed:', error)
  }
}

/**
 * 複合ワークフロー例
 */
async function compositeWorkflowExample() {
  console.log('\n🔄 Composite Workflow Example')
  console.log('=============================')

  const graphAITools = new GraphAITools()

  try {
    const result = await graphAITools.compositeTextReasoner.execute({
      text: 'GraphAI enables developers to build complex AI workflows using declarative graphs. It supports multiple AI agents and provides real-time monitoring capabilities.',
      question: 'What are the main benefits of using GraphAI for AI application development?'
    })

    if (result.success) {
      console.log('✅ Composite workflow completed successfully')
      console.log('🔄 Result:', JSON.stringify(result.result, null, 2))
    } else {
      console.log('❌ Composite workflow failed:', result.error)
    }

  } catch (error) {
    console.error('❌ Composite workflow example failed:', error)
  }
}

/**
 * エージェント情報取得例
 */
async function agentInfoExample() {
  console.log('\n🔍 Agent Information Example')
  console.log('============================')

  const graphAITools = new GraphAITools()

  try {
    // 利用可能なエージェントのリストを取得
    const agentsResult = await graphAITools.agentInfoGetter.execute({})

    if (agentsResult.success) {
      console.log('✅ Agent information retrieved successfully')
      console.log('📋 Available agents:', agentsResult.result.availableAgents)
    } else {
      console.log('❌ Agent information retrieval failed:', agentsResult.error)
    }

    // 特定のエージェントの情報を取得
    const specificAgentResult = await graphAITools.agentInfoGetter.execute({
      agentName: 'openAIAgent'
    })

    if (specificAgentResult.success) {
      console.log('✅ Specific agent information retrieved successfully')
      console.log('🔍 Agent info:', JSON.stringify(specificAgentResult.result, null, 2))
    } else {
      console.log('❌ Specific agent information retrieval failed:', specificAgentResult.error)
    }

  } catch (error) {
    console.error('❌ Agent info example failed:', error)
  }
}

/**
 * ワークフロー状態管理例
 */
async function workflowStatusExample() {
  console.log('\n📊 Workflow Status Management Example')
  console.log('=====================================')

  const graphAITools = new GraphAITools()

  try {
    // ワークフローの状態を確認
    const statusResult = await graphAITools.workflowStatusChecker.execute({})

    if (statusResult.success) {
      console.log('✅ Workflow status retrieved successfully')
      console.log('📊 Status:', JSON.stringify(statusResult.result, null, 2))
    } else {
      console.log('❌ Workflow status retrieval failed:', statusResult.error)
    }

    // ワークフローを停止（実行中のワークフローがある場合）
    const stopResult = await graphAITools.workflowStopper.execute({})

    if (stopResult.success) {
      console.log('✅ Workflow stopped successfully')
      console.log('⏹️ Result:', JSON.stringify(stopResult.result, null, 2))
    } else {
      console.log('❌ Workflow stop failed:', stopResult.error)
    }

  } catch (error) {
    console.error('❌ Workflow status example failed:', error)
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🧠 GraphAI Integration Examples')
  console.log('===============================')

  // 各例を実行
  await graphaiIntegrationExample()
  await customWorkflowExample()
  await compositeWorkflowExample()
  await agentInfoExample()
  await workflowStatusExample()

  console.log('\n✅ All GraphAI examples completed!')
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export {
  graphaiIntegrationExample,
  customWorkflowExample,
  compositeWorkflowExample,
  agentInfoExample,
  workflowStatusExample
}
