import { NextApiRequest, NextApiResponse } from 'next'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import formidable from 'formidable'

export const config = {
  api: {
    bodyParser: false, // ファイルアップロードのため無効化
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ファイルアップロード処理
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'temp'),
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    })

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const audioFile = files.audio?.[0]
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    // whisper.cppの設定
    const whisperPath = path.join(process.cwd(), 'whisper.cpp', 'build', 'bin', 'whisper-cli')
    const modelPath = path.join(process.cwd(), 'public', 'whisper', 'models', 'ggml-base-q5_1.bin')
    const outputDir = path.join(process.cwd(), 'temp')
    const outputBase = `output_${Date.now()}`

    // whisper.cppコマンド実行
    const result = await runWhisper(whisperPath, modelPath, audioFile.filepath, outputDir, outputBase)

    // 一時ファイル削除
    await fs.unlink(audioFile.filepath).catch(() => {})
    await fs.unlink(path.join(outputDir, `${outputBase}.txt`)).catch(() => {})

    res.status(200).json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Whisper API error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function runWhisper(
  whisperPath: string,
  modelPath: string,
  inputFile: string,
  outputDir: string,
  outputBase: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const args = [
      '-f', inputFile,
      '-m', modelPath,
      '-of', path.join(outputDir, outputBase),
      '-otxt',
      '-l', 'ja'
    ]

    console.log(`Running whisper: ${whisperPath} ${args.join(' ')}`)

    const whisper = spawn(whisperPath, args, {
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
          const outputFile = path.join(outputDir, `${outputBase}.txt`)
          const content = await fs.readFile(outputFile, 'utf-8')
          
          resolve({
            text: content.trim(),
            language: 'ja',
            confidence: 1.0
          })
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
