import { Tool } from '@/services/agent/sequential-thinking-agent'

// Node.js環境でのみchild_processをインポート
let spawn: any
let exec: any
let execAsync: any
let path: any
let fs: any

// ブラウザ環境かどうかをチェック
const isBrowser = typeof window !== 'undefined'

if (!isBrowser) {
  try {
    const childProcess = require('child_process')
    const util = require('util')
    const pathModule = require('path')
    const fsModule = require('fs')
    
    spawn = childProcess.spawn
    exec = childProcess.exec
    execAsync = util.promisify(exec)
    path = pathModule
    fs = fsModule
  } catch (error) {
    console.warn('Node.js modules not available:', error)
  }
}

/**
 * MulmoCast CLIツールクラス
 * MulmoCast CLIの機能をArmisのツールシステムに統合
 */
export class MulmoCastTools {
  private mulmoPath: string
  private baseDir: string

  constructor(mulmoPath: string = './mulmocast-cli', baseDir: string = './output/mulmocast') {
    this.mulmoPath = mulmoPath
    this.baseDir = baseDir
    
    // Node.js環境でのみディレクトリ作成を実行
    if (!isBrowser && fs) {
      this.ensureOutputDir()
    }
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true })
    }
  }

  private async runMulmoCommand(command: string, args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
    // ブラウザ環境では実行不可
    if (isBrowser || !execAsync) {
      return {
        success: false,
        output: '',
        error: 'MulmoCast tools are only available in Electron main process'
      }
    }

    try {
      const fullCommand = `cd ${this.mulmoPath} && npx tsx ./src/cli/bin.ts ${command} ${args.join(' ')}`
      const { stdout, stderr } = await execAsync(fullCommand, { 
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })
      
      return {
        success: true,
        output: stdout,
        error: stderr
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // スクリプト生成ツール
  scriptGenerator: Tool = {
    name: 'mulmocastScriptGenerator',
    description: 'Generate MulmoCast script from URLs or interactive input',
    execute: async (args: Record<string, any>) => {
      const { urls, template, interactive, outputName } = args as { 
        urls?: string[], 
        template?: string, 
        interactive?: boolean,
        outputName?: string 
      }
      try {
        const scriptArgs = []
        
        if (template) {
          scriptArgs.push('-t', template)
        }
        
        if (interactive) {
          scriptArgs.push('-i')
        }
        
        if (urls && urls.length > 0) {
          urls.forEach(url => scriptArgs.push('-u', url))
        }
        
        if (outputName) {
          scriptArgs.push('-s', outputName)
        }
        
        scriptArgs.push('-o', this.baseDir)
        
        const result = await this.runMulmoCommand('tool scripting', scriptArgs)
        
        if (result.success) {
          return {
            success: true,
            scriptPath: path.join(this.baseDir, `${outputName || 'script'}.json`),
            output: result.output
          }
        } else {
          return {
            success: false,
            error: result.error
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // 音声生成ツール
  audioGenerator: Tool = {
    name: 'mulmocastAudioGenerator',
    description: 'Generate audio files from MulmoCast script',
    execute: async (args: Record<string, any>) => {
      const { scriptFile, language, force } = args as { 
        scriptFile: string, 
        language?: 'en' | 'ja',
        force?: boolean 
      }
              try {
          const audioArgs = [scriptFile]
          
          if (language) {
            audioArgs.push('-l', language)
          }
          
          if (force) {
            audioArgs.push('-f')
          }
        
        audioArgs.push('-o', this.baseDir)
        audioArgs.push('-a', path.join(this.baseDir, 'audio'))
        
        const result = await this.runMulmoCommand('audio', audioArgs)
        
        if (result.success) {
          return {
            success: true,
            audioDir: path.join(this.baseDir, 'audio'),
            output: result.output
          }
        } else {
          return {
            success: false,
            error: result.error
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // 画像生成ツール
  imageGenerator: Tool = {
    name: 'mulmocastImageGenerator',
    description: 'Generate images from MulmoCast script',
    execute: async (args: Record<string, any>) => {
      const { scriptFile, language, force } = args as { 
        scriptFile: string, 
        language?: 'en' | 'ja',
        force?: boolean 
      }
      try {
        const imageArgs = [scriptFile]
        
        if (language) {
          imageArgs.push('-l', language)
        }
        
        if (force) {
          imageArgs.push('-f')
        }
        
        imageArgs.push('-o', this.baseDir)
        imageArgs.push('-i', path.join(this.baseDir, 'images'))
        
        const result = await this.runMulmoCommand('images', imageArgs)
        
        if (result.success) {
          return {
            success: true,
            imageDir: path.join(this.baseDir, 'images'),
            output: result.output
          }
        } else {
          return {
            success: false,
            error: result.error
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // 動画生成ツール
  movieGenerator: Tool = {
    name: 'mulmocastMovieGenerator',
    description: 'Generate movie from MulmoCast script',
    execute: async (args: Record<string, any>) => {
      const { scriptFile, language, force, captions } = args as { 
        scriptFile: string, 
        language?: 'en' | 'ja',
        force?: boolean,
        captions?: 'en' | 'ja'
      }
      try {
        const movieArgs = [scriptFile]
        
        if (language) {
          movieArgs.push('-l', language)
        }
        
        if (force) {
          movieArgs.push('-f')
        }
        
        if (captions) {
          movieArgs.push('-c', captions)
        }
        
        movieArgs.push('-o', this.baseDir)
        movieArgs.push('-a', path.join(this.baseDir, 'audio'))
        movieArgs.push('-i', path.join(this.baseDir, 'images'))
        
        const result = await this.runMulmoCommand('movie', movieArgs)
        
        if (result.success) {
          return {
            success: true,
            videoPath: path.join(this.baseDir, 'output.mp4'),
            output: result.output
          }
        } else {
          return {
            success: false,
            error: result.error
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // PDF生成ツール
  pdfGenerator: Tool = {
    name: 'mulmocastPdfGenerator',
    description: 'Generate PDF from MulmoCast script',
    execute: async (args: Record<string, any>) => {
      const { scriptFile, language, force, pdfMode, pdfSize } = args as { 
        scriptFile: string, 
        language?: 'en' | 'ja',
        force?: boolean,
        pdfMode?: 'slide' | 'talk' | 'handout',
        pdfSize?: 'letter' | 'a4'
      }
      try {
        const pdfArgs = [scriptFile]
        
        if (language) {
          pdfArgs.push('-l', language)
        }
        
        if (force) {
          pdfArgs.push('-f')
        }
        
        if (pdfMode) {
          pdfArgs.push('--pdf_mode', pdfMode)
        }
        
        if (pdfSize) {
          pdfArgs.push('--pdf_size', pdfSize)
        }
        
        pdfArgs.push('-o', this.baseDir)
        pdfArgs.push('-i', path.join(this.baseDir, 'images'))
        
        const result = await this.runMulmoCommand('pdf', pdfArgs)
        
        if (result.success) {
          return {
            success: true,
            pdfPath: path.join(this.baseDir, 'output.pdf'),
            output: result.output
          }
        } else {
          return {
            success: false,
            error: result.error
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // ストーリーからスクリプト生成ツール
  storyToScriptGenerator: Tool = {
    name: 'mulmocastStoryToScriptGenerator',
    description: 'Generate MulmoCast script from story file',
    execute: async (args: Record<string, any>) => {
      const { storyFile, template, beatsPerScene, mode } = args as { 
        storyFile: string, 
        template?: string,
        beatsPerScene?: number,
        mode?: 'step_wise' | 'one_step'
      }
      try {
        const storyArgs = [storyFile]
        
        if (template) {
          storyArgs.push('-t', template)
        }
        
        if (beatsPerScene) {
          storyArgs.push('--beats_per_scene', beatsPerScene.toString())
        }
        
        if (mode) {
          storyArgs.push('--mode', mode)
        }
        
        storyArgs.push('-o', this.baseDir)
        
        const result = await this.runMulmoCommand('tool story_to_script', storyArgs)
        
        if (result.success) {
          return {
            success: true,
            scriptPath: path.join(this.baseDir, 'script.json'),
            output: result.output
          }
        } else {
          return {
            success: false,
            error: result.error
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // プロンプトダンプツール
  promptDumper: Tool = {
    name: 'mulmocastPromptDumper',
    description: 'Dump prompt from template',
    execute: async (args: Record<string, any>) => {
      const { template } = args as { template: string }
      try {
        const promptArgs = ['-t', template]
        
        const result = await this.runMulmoCommand('tool prompt', promptArgs)
        
        if (result.success) {
          return {
            success: true,
            prompt: result.output,
            template: args.template
          }
        } else {
          return {
            success: false,
            error: result.error
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // スキーマダンプツール
  schemaDumper: Tool = {
    name: 'mulmocastSchemaDumper',
    description: 'Dump MulmoCast schema',
    execute: async () => {
      try {
        const result = await this.runMulmoCommand('tool schema', [])
        
        if (result.success) {
          return {
            success: true,
            schema: result.output
          }
        } else {
          return {
            success: false,
            error: result.error
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // 完全なワークフローツール（スクリプト生成から動画生成まで）
  completeWorkflow: Tool = {
    name: 'mulmocastCompleteWorkflow',
    description: 'Complete MulmoCast workflow from URLs to final video',
    execute: async (args: Record<string, any>) => {
      const { urls, template, language, force } = args as { 
        urls: string[], 
        template?: string,
        language?: 'en' | 'ja',
        force?: boolean 
      }
      try {
        // Step 1: Generate script
        const scriptResult = await this.scriptGenerator.execute({
          urls: urls,
          template: template,
          outputName: 'workflow_script'
        })
        
        if (!scriptResult.success) {
          return {
            success: false,
            error: `Script generation failed: ${scriptResult.error}`
          }
        }

        // Step 2: Generate audio
        const audioResult = await this.audioGenerator.execute({
          scriptFile: scriptResult.scriptPath,
          language: language,
          force: force
        })
        
        if (!audioResult.success) {
          return {
            success: false,
            error: `Audio generation failed: ${audioResult.error}`
          }
        }

        // Step 3: Generate images
        const imageResult = await this.imageGenerator.execute({
          scriptFile: scriptResult.scriptPath,
          language: language,
          force: force
        })
        
        if (!imageResult.success) {
          return {
            success: false,
            error: `Image generation failed: ${imageResult.error}`
          }
        }

        // Step 4: Generate movie
        const movieResult = await this.movieGenerator.execute({
          scriptFile: scriptResult.scriptPath,
          language: language,
          force: force
        })
        
        if (!movieResult.success) {
          return {
            success: false,
            error: `Movie generation failed: ${movieResult.error}`
          }
        }

        return {
          success: true,
          scriptPath: scriptResult.scriptPath,
          audioDir: audioResult.audioDir,
          imageDir: imageResult.imageDir,
          videoPath: movieResult.videoPath,
          output: 'Complete workflow finished successfully'
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // 利用可能なすべてのツールを取得
  getAllTools(): Tool[] {
    return [
      this.scriptGenerator,
      this.audioGenerator,
      this.imageGenerator,
      this.movieGenerator,
      this.pdfGenerator,
      this.storyToScriptGenerator,
      this.promptDumper,
      this.schemaDumper,
      this.completeWorkflow
    ]
  }
}
