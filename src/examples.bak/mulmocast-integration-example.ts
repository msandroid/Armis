import { MulmoCastTools } from '@/services/tools/mulmocast-tools'
import fs from 'fs'

/**
 * MulmoCast統合例
 * MulmoCast CLIの機能をArmisで使用する例
 */
async function mulmoCastIntegrationExample() {
  console.log('🎬 MulmoCast Integration Example')
  console.log('================================')

  // MulmoCastツールインスタンスを作成
  const mulmoCastTools = new MulmoCastTools()

  try {
    // 例1: スクリプト生成
    console.log('\n📝 Step 1: Generating script from URLs...')
    const scriptResult = await mulmoCastTools.scriptGenerator.execute({
      urls: ['https://example.com/article1', 'https://example.com/article2'],
      template: 'business',
      outputName: 'demo_script'
    })

    if (scriptResult.success) {
      console.log('✅ Script generated successfully')
      console.log(`📄 Script path: ${scriptResult.scriptPath}`)
    } else {
      console.log('❌ Script generation failed:', scriptResult.error)
      return
    }

    // 例2: 音声生成
    console.log('\n🎵 Step 2: Generating audio...')
    const audioResult = await mulmoCastTools.audioGenerator.execute({
      scriptFile: scriptResult.scriptPath,
      language: 'en',
      force: true
    })

    if (audioResult.success) {
      console.log('✅ Audio generated successfully')
      console.log(`🎧 Audio directory: ${audioResult.audioDir}`)
    } else {
      console.log('❌ Audio generation failed:', audioResult.error)
    }

    // 例3: 画像生成
    console.log('\n🖼️ Step 3: Generating images...')
    const imageResult = await mulmoCastTools.imageGenerator.execute({
      scriptFile: scriptResult.scriptPath,
      language: 'en',
      force: true
    })

    if (imageResult.success) {
      console.log('✅ Images generated successfully')
      console.log(`🖼️ Image directory: ${imageResult.imageDir}`)
    } else {
      console.log('❌ Image generation failed:', imageResult.error)
    }

    // 例4: 動画生成
    console.log('\n🎬 Step 4: Generating movie...')
    const movieResult = await mulmoCastTools.movieGenerator.execute({
      scriptFile: scriptResult.scriptPath,
      language: 'en',
      force: true,
      captions: 'en'
    })

    if (movieResult.success) {
      console.log('✅ Movie generated successfully')
      console.log(`🎥 Video path: ${movieResult.videoPath}`)
    } else {
      console.log('❌ Movie generation failed:', movieResult.error)
    }

    // 例5: PDF生成
    console.log('\n📄 Step 5: Generating PDF...')
    const pdfResult = await mulmoCastTools.pdfGenerator.execute({
      scriptFile: scriptResult.scriptPath,
      language: 'en',
      force: true,
      pdfMode: 'slide',
      pdfSize: 'a4'
    })

    if (pdfResult.success) {
      console.log('✅ PDF generated successfully')
      console.log(`📄 PDF path: ${pdfResult.pdfPath}`)
    } else {
      console.log('❌ PDF generation failed:', pdfResult.error)
    }

  } catch (error) {
    console.error('❌ Example failed:', error)
  }
}

/**
 * 完全なワークフロー例
 * URLから最終的な動画まで一気通貫で生成
 */
async function completeWorkflowExample() {
  console.log('\n🚀 Complete Workflow Example')
  console.log('============================')

  const mulmoCastTools = new MulmoCastTools()

  try {
    const result = await mulmoCastTools.completeWorkflow.execute({
      urls: ['https://example.com/topic1', 'https://example.com/topic2'],
      template: 'business',
      language: 'en',
      force: true
    })

    if (result.success) {
      console.log('✅ Complete workflow finished successfully!')
      console.log(`📄 Script: ${result.scriptPath}`)
      console.log(`🎧 Audio: ${result.audioDir}`)
      console.log(`🖼️ Images: ${result.imageDir}`)
      console.log(`🎥 Video: ${result.videoPath}`)
    } else {
      console.log('❌ Complete workflow failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Complete workflow example failed:', error)
  }
}

/**
 * ストーリーからスクリプト生成例
 */
async function storyToScriptExample() {
  console.log('\n📖 Story to Script Example')
  console.log('==========================')

  const mulmoCastTools = new MulmoCastTools()

  try {
    // サンプルストーリーファイルを作成
    const storyContent = `
Title: The Future of AI
Author: AI Researcher

Once upon a time, in a world not so different from ours, artificial intelligence was just a dream. Scientists and researchers worked tirelessly to create machines that could think, learn, and create like humans.

The breakthrough came in 2023, when a new generation of AI models emerged. These models could understand context, generate creative content, and even collaborate with humans in ways never before imagined.

Today, AI is transforming every industry - from healthcare to education, from entertainment to transportation. The future is bright, and the possibilities are endless.

But with great power comes great responsibility. We must ensure that AI is developed and used ethically, for the benefit of all humanity.

The journey continues, and the story of AI is still being written. What will the next chapter bring?
    `

    const storyPath = './output/mulmocast/story.txt'
    fs.writeFileSync(storyPath, storyContent)

    const result = await mulmoCastTools.storyToScriptGenerator.execute({
      storyFile: storyPath,
      template: 'business',
      beatsPerScene: 3,
      mode: 'step_wise'
    })

    if (result.success) {
      console.log('✅ Story to script conversion successful!')
      console.log(`📄 Script path: ${result.scriptPath}`)
    } else {
      console.log('❌ Story to script conversion failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Story to script example failed:', error)
  }
}

/**
 * プロンプトとスキーマの確認例
 */
async function promptAndSchemaExample() {
  console.log('\n🔍 Prompt and Schema Example')
  console.log('=============================')

  const mulmoCastTools = new MulmoCastTools()

  try {
    // プロンプトの確認
    console.log('\n📝 Template prompt:')
    const promptResult = await mulmoCastTools.promptDumper.execute({
      template: 'business'
    })

    if (promptResult.success) {
      console.log('✅ Prompt retrieved successfully')
      console.log(`📄 Template: ${promptResult.template}`)
      console.log(`📝 Prompt preview: ${promptResult.prompt.substring(0, 200)}...`)
    } else {
      console.log('❌ Prompt retrieval failed:', promptResult.error)
    }

    // スキーマの確認
    console.log('\n📋 Schema:')
    const schemaResult = await mulmoCastTools.schemaDumper.execute({})

    if (schemaResult.success) {
      console.log('✅ Schema retrieved successfully')
      console.log(`📋 Schema preview: ${schemaResult.schema.substring(0, 200)}...`)
    } else {
      console.log('❌ Schema retrieval failed:', schemaResult.error)
    }

  } catch (error) {
    console.error('❌ Prompt and schema example failed:', error)
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🎬 MulmoCast CLI Integration Examples')
  console.log('=====================================')

  // 各例を実行
  await mulmoCastIntegrationExample()
  await completeWorkflowExample()
  await storyToScriptExample()
  await promptAndSchemaExample()

  console.log('\n✅ All examples completed!')
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export {
  mulmoCastIntegrationExample,
  completeWorkflowExample,
  storyToScriptExample,
  promptAndSchemaExample
}
