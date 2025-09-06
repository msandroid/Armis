import { WhisperNodeService } from '../services/stt/whisper-node-service'
import { STTOptions } from '../types/stt'
import path from 'path'

async function testWhisperNode() {
  try {
    // WhisperNodeServiceの設定
    const whisperService = new WhisperNodeService({
      whisperPath: path.join(process.cwd(), 'whisper.cpp/build/bin/whisper-cli'),
      modelPath: path.join(process.cwd(), 'whisper.cpp/models/ggml-tiny.bin'),
      language: 'en',  // 英語に変更
      outputFormat: 'txt'  // テキスト形式に変更
    })

    // テスト用の音声ファイルパス
    const testAudioFile = path.join(process.cwd(), 'whisper.cpp', 'samples', 'jfk.wav')
    
    console.log('Testing whisper.cpp with Node.js...')
    console.log('Test audio file:', testAudioFile)

    // ファイルの存在確認
    const fs = await import('fs')
    if (!fs.existsSync(testAudioFile)) {
      console.log('Test audio file not found. Please provide a test audio file.')
      return
    }

    // 音声認識を実行
    const result = await whisperService.transcribeFile(testAudioFile, {
      language: 'en'  // 英語に変更
    })

    console.log('Transcription result:')
    console.log('Text:', result.text)
    console.log('Language:', result.language)
    console.log('Confidence:', result.confidence)

  } catch (error) {
    console.error('Error testing whisper.cpp:', error)
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testWhisperNode()
}

export { testWhisperNode }
