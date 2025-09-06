/**
 * 音声ファイル処理のユーティリティ関数
 */

export interface AudioFormat {
  format: string
  mimeType: string
  extensions: string[]
}

export const SUPPORTED_AUDIO_FORMATS: AudioFormat[] = [
  { format: 'wav', mimeType: 'audio/wav', extensions: ['.wav'] },
  { format: 'mp3', mimeType: 'audio/mpeg', extensions: ['.mp3'] },
  { format: 'ogg', mimeType: 'audio/ogg', extensions: ['.ogg'] },
  { format: 'flac', mimeType: 'audio/flac', extensions: ['.flac'] },
  { format: 'm4a', mimeType: 'audio/mp4', extensions: ['.m4a'] },
  { format: 'aac', mimeType: 'audio/aac', extensions: ['.aac'] }
]

/**
 * ファイル拡張子から音声形式を判定
 */
export function getAudioFormatFromExtension(filename: string): AudioFormat | null {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  
  return SUPPORTED_AUDIO_FORMATS.find(format => 
    format.extensions.includes(extension)
  ) || null
}

/**
 * MIMEタイプから音声形式を判定
 */
export function getAudioFormatFromMimeType(mimeType: string): AudioFormat | null {
  return SUPPORTED_AUDIO_FORMATS.find(format => 
    format.mimeType === mimeType
  ) || null
}

/**
 * Base64データからArrayBufferに変換
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  return bytes.buffer
}

/**
 * ArrayBufferからBase64に変換
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  
  return btoa(binary)
}

/**
 * ファイルをBase64に変換
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // Base64データからヘッダー部分を除去
      const base64Data = result.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * 音声ファイルをWAV形式に変換
 * Web Audio APIを使用して16kHz、16bit、モノラルのWAV形式に変換
 */
export async function convertToWav(audioData: ArrayBuffer, originalFormat: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const blob = new Blob([audioData], { type: `audio/${originalFormat}` })
      const url = URL.createObjectURL(blob)
      
      fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          // 16kHz、16bit、モノラルに変換
          const targetSampleRate = 16000
          const targetChannels = 1
          const targetBitDepth = 16
          
          // リサンプリング
          const resampledBuffer = resampleAudioBuffer(audioBuffer, targetSampleRate, targetChannels)
          
          // WAV形式に変換
          const wavBuffer = audioBufferToWav(resampledBuffer, targetBitDepth)
          
          URL.revokeObjectURL(url)
          resolve(wavBuffer)
        })
        .catch(error => {
          URL.revokeObjectURL(url)
          console.warn('Audio conversion failed, using original format:', error)
          resolve(audioData) // フォールバック
        })
    } catch (error) {
      console.warn('Audio conversion not supported, using original format:', error)
      resolve(audioData) // フォールバック
    }
  })
}

/**
 * AudioBufferをリサンプリング
 */
function resampleAudioBuffer(audioBuffer: AudioBuffer, targetSampleRate: number, targetChannels: number): AudioBuffer {
  const sourceSampleRate = audioBuffer.sampleRate
  const sourceChannels = audioBuffer.numberOfChannels
  const sourceLength = audioBuffer.length
  
  // リサンプリング比率
  const ratio = targetSampleRate / sourceSampleRate
  const targetLength = Math.round(sourceLength * ratio)
  
  // 新しいAudioBufferを作成
  const targetBuffer = new AudioContext().createBuffer(targetChannels, targetLength, targetSampleRate)
  
  // 各チャンネルを処理
  for (let channel = 0; channel < Math.min(sourceChannels, targetChannels); channel++) {
    const sourceData = audioBuffer.getChannelData(channel)
    const targetData = targetBuffer.getChannelData(channel)
    
    // 線形補間によるリサンプリング
    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = i / ratio
      const sourceIndexFloor = Math.floor(sourceIndex)
      const sourceIndexCeil = Math.min(sourceIndexFloor + 1, sourceLength - 1)
      const fraction = sourceIndex - sourceIndexFloor
      
      targetData[i] = sourceData[sourceIndexFloor] * (1 - fraction) + sourceData[sourceIndexCeil] * fraction
    }
  }
  
  return targetBuffer
}

/**
 * AudioBufferをWAV形式に変換
 */
function audioBufferToWav(audioBuffer: AudioBuffer, bitDepth: number): ArrayBuffer {
  const channels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const length = audioBuffer.length
  
  const bytesPerSample = bitDepth / 8
  const blockAlign = channels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = length * blockAlign
  const fileSize = 44 + dataSize
  
  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  
  // WAVヘッダー
  let offset = 0
  
  // RIFFヘッダー
  view.setUint32(offset, 0x52494646, false) // "RIFF"
  offset += 4
  view.setUint32(offset, fileSize - 8, true) // ファイルサイズ - 8
  offset += 4
  view.setUint32(offset, 0x57415645, false) // "WAVE"
  offset += 4
  
  // fmtチャンク
  view.setUint32(offset, 0x666d7420, false) // "fmt "
  offset += 4
  view.setUint32(offset, 16, true) // fmtチャンクサイズ
  offset += 4
  view.setUint16(offset, 1, true) // PCM形式
  offset += 2
  view.setUint16(offset, channels, true) // チャンネル数
  offset += 2
  view.setUint32(offset, sampleRate, true) // サンプルレート
  offset += 4
  view.setUint32(offset, byteRate, true) // バイトレート
  offset += 4
  view.setUint16(offset, blockAlign, true) // ブロックアライメント
  offset += 2
  view.setUint16(offset, bitDepth, true) // ビット深度
  offset += 2
  
  // dataチャンク
  view.setUint32(offset, 0x64617461, false) // "data"
  offset += 4
  view.setUint32(offset, dataSize, true) // データサイズ
  offset += 4
  
  // 音声データ
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i]
      const intSample = Math.max(-1, Math.min(1, sample))
      
      if (bitDepth === 16) {
        view.setInt16(offset, intSample * 0x7FFF, true)
        offset += 2
      } else if (bitDepth === 32) {
        view.setFloat32(offset, intSample, true)
        offset += 4
      }
    }
  }
  
  return buffer
}

/**
 * 音声ファイルの情報を取得
 */
export async function getAudioInfo(audioData: ArrayBuffer): Promise<{
  duration: number
  sampleRate: number
  channels: number
  format: string
}> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const blob = new Blob([audioData], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      
      fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          resolve({
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            format: 'wav'
          })
          URL.revokeObjectURL(url)
        })
        .catch(error => {
          URL.revokeObjectURL(url)
          // フォールバック
          const audio = new Audio()
          audio.onloadedmetadata = () => {
            resolve({
              duration: audio.duration,
              sampleRate: 16000,
              channels: 1,
              format: 'wav'
            })
          }
          audio.onerror = () => {
            reject(new Error('Failed to load audio file'))
          }
          audio.src = url
        })
    } catch (error) {
      reject(new Error('Failed to load audio file'))
    }
  })
}

/**
 * 音声ファイルのサイズを人間が読みやすい形式に変換
 */
export function formatAudioFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 音声ファイルの長さを人間が読みやすい形式に変換
 */
export function formatAudioDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * 音声理解機能のテスト用ユーティリティ
 */
export const audioUnderstandingUtils = {
  /**
   * 音声ファイルの形式を判定
   */
  detectAudioFormat(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type
    
    // MIMEタイプによる判定
    if (mimeType) {
      return mimeType
    }
    
    // 拡張子による判定
    switch (extension) {
      case 'mp3':
        return 'audio/mpeg'
      case 'wav':
        return 'audio/wav'
      case 'ogg':
        return 'audio/ogg'
      case 'flac':
        return 'audio/flac'
      case 'aac':
        return 'audio/aac'
      case 'm4a':
        return 'audio/mp4'
      case 'aiff':
        return 'audio/aiff'
      default:
        return 'audio/mpeg'
    }
  },

  /**
   * 音声ファイルがGemini APIでサポートされているかチェック
   */
  isSupportedAudioFormat(mimeType: string): boolean {
    const supportedFormats = [
      'audio/wav',
      'audio/mp3',
      'audio/aiff',
      'audio/aac',
      'audio/ogg',
      'audio/flac'
    ]
    return supportedFormats.includes(mimeType)
  },

  /**
   * 音声ファイルのサイズ制限をチェック（制限なし）
   */
  checkAudioSizeLimit(file: File): { isValid: boolean; duration?: number; error?: string } {
    // 概算の音声長を計算（16Kbpsでダウンサンプリングされる）
    const fileSizeInBytes = file.size
    const bitrate = 16000 // 16Kbps
    const durationInSeconds = (fileSizeInBytes * 8) / bitrate
    const durationInHours = durationInSeconds / 3600
    
    // 制限を削除 - 任意の長さの音声ファイルを許可
    console.log(`音声ファイル情報: ${durationInHours.toFixed(2)}時間 (${durationInSeconds.toFixed(2)}秒)`)
    
    return {
      isValid: true,
      duration: durationInHours
    }
  },

  /**
   * 音声ファイルの情報を取得
   */
  getAudioFileInfo(file: File): {
    name: string
    size: number
    mimeType: string
    format: string
    duration?: number
    isValid: boolean
    error?: string
  } {
    const mimeType = this.detectAudioFormat(file)
    const sizeCheck = this.checkAudioSizeLimit(file)
    
    return {
      name: file.name,
      size: file.size,
      mimeType: mimeType,
      format: mimeType.split('/')[1] || 'unknown',
      duration: sizeCheck.duration,
      isValid: sizeCheck.isValid && this.isSupportedAudioFormat(mimeType),
      error: sizeCheck.error || (!this.isSupportedAudioFormat(mimeType) ? 'サポートされていない音声形式です' : undefined)
    }
  }
}
