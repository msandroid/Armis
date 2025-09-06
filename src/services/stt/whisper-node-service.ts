// Node.js環境でのみ利用可能なモジュールを動的にインポート
let spawn: any
let fs: any
let path: any

// 環境チェック関数
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         process.versions && 
         process.versions.node !== undefined
}

// Node.js環境でのみモジュールを読み込む
async function loadNodeModules() {
  if (!isNodeEnvironment()) {
    throw new Error('WhisperNodeService is only available in Node.js environment')
  }
  
  if (!spawn) {
    const childProcess = await import('child_process')
    spawn = childProcess.spawn
  }
  
  if (!fs) {
    const fsModule = await import('fs')
    fs = fsModule.promises
  }
  
  if (!path) {
    const pathModule = await import('path')
    path = pathModule.default
  }
}

import { STTService, STTResult, STTOptions } from '../../types/stt'

export interface WhisperNodeConfig {
  whisperPath: string
  modelPath: string
  language?: string
  outputFormat?: 'txt' | 'json' | 'srt' | 'vtt'
}

export class WhisperNodeService implements STTService {
  private config: WhisperNodeConfig
  private modulesLoaded = false

  constructor(config: WhisperNodeConfig) {
    this.config = {
      language: 'ja',
      outputFormat: 'txt',
      ...config
    }
  }

  isAvailable(): boolean {
    return isNodeEnvironment()
  }

  getSupportedFormats(): string[] {
    if (!this.isAvailable()) {
      return []
    }
    return ['wav', 'mp3', 'flac', 'ogg']
  }

  async transcribe(audioData: ArrayBuffer, options?: STTOptions): Promise<STTResult> {
    if (!this.isAvailable()) {
      throw new Error('WhisperNodeService is not available in browser environment. Use WhisperLocalService instead.')
    }

    try {
      await this.ensureModulesLoaded()
      
      // 一時ファイルに音声データを保存
      const tempDir = path.join(process.cwd(), 'temp')
      await fs.mkdir(tempDir, { recursive: true })
      
      const inputFile = path.join(tempDir, `input_${Date.now()}.wav`)
      const outputFile = path.join(tempDir, `output_${Date.now()}.${this.config.outputFormat}`)
      
      // ArrayBufferをファイルに保存
      await fs.writeFile(inputFile, Buffer.from(audioData))

      // whisper.cppコマンドを実行
      const result = await this.runWhisper(inputFile, outputFile, options)

      // 一時ファイルを削除
      await fs.unlink(inputFile).catch(() => {})
      await fs.unlink(outputFile).catch(() => {})

      return result
    } catch (error) {
      console.error('Whisper transcription error:', error)
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async transcribeFile(filePath: string, options?: STTOptions): Promise<STTResult> {
    if (!this.isAvailable()) {
      throw new Error('WhisperNodeService is not available in browser environment. Use WhisperLocalService instead.')
    }

    try {
      await this.ensureModulesLoaded()
      
      const outputFile = path.join(path.dirname(filePath), `output_${Date.now()}.${this.config.outputFormat}`)
      
      const result = await this.runWhisper(filePath, outputFile, options)
      
      // 一時ファイルを削除
      await fs.unlink(outputFile).catch(() => {})
      
      return result
    } catch (error) {
      console.error('Whisper file transcription error:', error)
      throw new Error(`File transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async ensureModulesLoaded(): Promise<void> {
    if (!this.modulesLoaded) {
      await loadNodeModules()
      this.modulesLoaded = true
    }
  }

  private async runWhisper(inputFile: string, outputFile: string, options?: STTOptions): Promise<STTResult> {
    return new Promise((resolve, reject) => {
      const outputDir = path.dirname(outputFile)
      const outputBase = path.basename(outputFile, path.extname(outputFile))
      
      const args = [
        '-f', inputFile,
        '-m', this.config.modelPath,
        '-of', path.join(outputDir, outputBase)
      ]

      // 出力形式に応じてフラグを追加
      if (this.config.outputFormat === 'txt') {
        args.push('-otxt')
      } else if (this.config.outputFormat === 'json') {
        args.push('-oj')
      } else if (this.config.outputFormat === 'srt') {
        args.push('-osrt')
      } else if (this.config.outputFormat === 'vtt') {
        args.push('-ovtt')
      }

      // 言語設定
      if (this.config.language) {
        args.push('-l', this.config.language)
      }

      // 追加オプション
      if (options?.language) {
        args.push('-l', options.language)
      }

      console.log(`Running whisper: ${this.config.whisperPath} ${args.join(' ')}`)

      const whisper = spawn(this.config.whisperPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      whisper.stdout.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      whisper.stderr.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      whisper.on('close', async (code: number) => {
        if (code === 0) {
          try {
            // 出力ファイルを読み取り
            const outputContent = await fs.readFile(outputFile, 'utf-8')
            
            const result: STTResult = {
              text: this.extractTextFromOutput(outputContent),
              segments: this.parseSegments(outputContent),
              language: this.config.language || 'ja',
              duration: 0, // whisper.cppから取得する必要がある
              confidence: 1.0 // whisper.cppから取得する必要がある
            }

            resolve(result)
          } catch (error) {
            reject(new Error(`Failed to read output file: ${error}`))
          }
        } else {
          reject(new Error(`Whisper process failed with code ${code}: ${stderr}`))
        }
      })

      whisper.on('error', (error: Error) => {
        reject(new Error(`Failed to start whisper process: ${error.message}`))
      })
    })
  }

  private parseSegments(content: string): any[] {
    // 出力形式に応じてセグメントを解析
    if (this.config.outputFormat === 'json') {
      try {
        const jsonData = JSON.parse(content)
        if (jsonData.transcription && Array.isArray(jsonData.transcription)) {
          return jsonData.transcription.map((segment: any) => ({
            start: segment.offsets?.from || 0,
            end: segment.offsets?.to || 0,
            text: segment.text || '',
            timestamps: segment.timestamps || {}
          }))
        }
      } catch (error) {
        console.warn('Failed to parse JSON output:', error)
      }
    }
    return []
  }

  private extractTextFromOutput(content: string): string {
    // 出力形式に応じてテキストを抽出
    if (this.config.outputFormat === 'json') {
      try {
        const jsonData = JSON.parse(content)
        if (jsonData.transcription && Array.isArray(jsonData.transcription)) {
          return jsonData.transcription
            .map((segment: any) => segment.text || '')
            .join(' ')
            .trim()
        }
      } catch (error) {
        console.warn('Failed to parse JSON output:', error)
      }
    }
    
    // デフォルト：テキストとして扱う
    return content.trim()
  }
}

export function createWhisperNodeService(config: WhisperNodeConfig): WhisperNodeService {
  return new WhisperNodeService(config)
}
