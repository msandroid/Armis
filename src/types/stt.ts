export interface STTResult {
  text: string
  segments?: STTSegment[]
  language?: string
  duration: number
  confidence?: number
}

export interface STTSegment {
  start: number
  end: number
  text: string
  confidence?: number
}

export interface STTOptions {
  language?: string
  model?: string
  temperature?: number
  maxTokens?: number
  prompt?: string
}

export interface STTService {
  transcribe(audioData: ArrayBuffer | string, options?: STTOptions): Promise<STTResult>
  isAvailable(): boolean
  getSupportedFormats(): string[]
}

export interface WhisperConfig {
  modelPath: string
  language?: string
  temperature?: number
  maxTokens?: number
}

export interface WhisperNodeConfig {
  whisperPath: string
  modelPath: string
  language?: string
  outputFormat?: 'txt' | 'json' | 'srt' | 'vtt'
}
