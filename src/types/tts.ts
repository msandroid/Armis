export interface TTSResult {
  audioData: ArrayBuffer
  format: string
  duration?: number
  sampleRate?: number
  channels?: number
  audioUrl?: string // ブラウザで再生可能なURL
}

export interface TTSSpeaker {
  id: string
  name: string
  voiceName: string
  language?: string
  description?: string
  gender?: 'male' | 'female'
  style?: string
}

export interface TTSSpeakerConfig {
  voiceName: string
  language?: string
  style?: string
  speed?: number
  pitch?: number
}

export interface TTSOptions {
  speaker?: TTSSpeakerConfig
  format?: 'wav' | 'mp3' | 'ogg'
  sampleRate?: number
  channels?: number
  speed?: number
  pitch?: number
  volume?: number
}

export interface TTSService {
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>
  getAvailableSpeakers(): Promise<TTSSpeaker[]>
  isAvailable(): boolean
  getSupportedFormats(): string[]
  getSupportedLanguages(): string[]
}

export interface GeminiTTSConfig {
  apiKey?: string
  model?: string
  defaultVoice?: string
  defaultLanguage?: string
}

export interface InworldTTSConfig {
  apiKey?: string
  model?: string
  defaultVoice?: string
  defaultLanguage?: string
  workspace?: string
}

export interface LocalInworldTTSConfig extends InworldTTSConfig {
  pythonPath?: string
  modelsDir?: string
  autoSetup?: boolean
}

export interface TTSManagerConfig {
  primaryService?: 'gemini' | 'openai' | 'web-speech' | 'inworld' | 'local-inworld'
  enableFallback?: boolean
  geminiApiKey?: string
  openaiApiKey?: string
  inworldApiKey?: string
  localInworldConfig?: LocalInworldTTSConfig
}
