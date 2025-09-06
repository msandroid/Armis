// STT Provider Models
export interface STTModel {
  id: string
  name: string
  size: string
  description: string
  provider: 'whisper-cpp' | 'openai' | 'google'
  category: string
  language: 'multilingual' | 'english-only' | 'auto'
  quantization?: 'none' | 'q5_0' | 'q5_1' | 'q8_0'
  recommended: boolean
  url?: string
}

// Whisper.cpp Models
export const WHISPER_CPP_MODELS: STTModel[] = [
  // Tiny Models (Lightweight) - Recommended for web applications
  {
    id: 'tiny-q5_1',
    name: 'Tiny Q5_1',
    size: '32.2MB',
    description: 'Multilingual, quantized, lightweight',
    provider: 'whisper-cpp',
    category: 'Tiny',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: true,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin'
  },
  {
    id: 'tiny.en-q5_1',
    name: 'Tiny EN Q5_1',
    size: '32.2MB',
    description: 'English only, quantized',
    provider: 'whisper-cpp',
    category: 'Tiny',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q5_1.bin'
  },
  {
    id: 'tiny-q8_0',
    name: 'Tiny Q8_0',
    size: '43.5MB',
    description: 'Multilingual, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Tiny',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q8_0.bin'
  },
  {
    id: 'tiny.en-q8_0',
    name: 'Tiny EN Q8_0',
    size: '43.6MB',
    description: 'English only, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Tiny',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q8_0.bin'
  },
  {
    id: 'tiny',
    name: 'Tiny',
    size: '77.7MB',
    description: 'Multilingual, standard version',
    provider: 'whisper-cpp',
    category: 'Tiny',
    language: 'multilingual',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin'
  },
  {
    id: 'tiny.en',
    name: 'Tiny EN',
    size: '77.7MB',
    description: 'English only, standard version',
    provider: 'whisper-cpp',
    category: 'Tiny',
    language: 'english-only',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin'
  },

  // Base Models (Standard)
  {
    id: 'base-q5_1',
    name: 'Base Q5_1',
    size: '59.7MB',
    description: 'Multilingual, quantized',
    provider: 'whisper-cpp',
    category: 'Base',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin'
  },
  {
    id: 'base.en-q5_1',
    name: 'Base EN Q5_1',
    size: '59.7MB',
    description: 'English only, quantized',
    provider: 'whisper-cpp',
    category: 'Base',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q5_1.bin'
  },
  {
    id: 'base-q8_0',
    name: 'Base Q8_0',
    size: '76.8MB',
    description: 'Multilingual, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Base',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q8_0.bin'
  },
  {
    id: 'base.en-q8_0',
    name: 'Base EN Q8_0',
    size: '76.8MB',
    description: 'English only, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Base',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q8_0.bin'
  },
  {
    id: 'base',
    name: 'Base',
    size: '148MB',
    description: 'Multilingual, standard version',
    provider: 'whisper-cpp',
    category: 'Base',
    language: 'multilingual',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin'
  },
  {
    id: 'base.en',
    name: 'Base EN',
    size: '148MB',
    description: 'English only, standard version',
    provider: 'whisper-cpp',
    category: 'Base',
    language: 'english-only',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin'
  },

  // Small Models (Balanced)
  {
    id: 'small-q5_1',
    name: 'Small Q5_1',
    size: '244MB',
    description: 'Multilingual, quantized',
    provider: 'whisper-cpp',
    category: 'Small',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin'
  },
  {
    id: 'small.en-q5_1',
    name: 'Small EN Q5_1',
    size: '244MB',
    description: 'English only, quantized',
    provider: 'whisper-cpp',
    category: 'Small',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q5_1.bin'
  },
  {
    id: 'small-q8_0',
    name: 'Small Q8_0',
    size: '312MB',
    description: 'Multilingual, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Small',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q8_0.bin'
  },
  {
    id: 'small.en-q8_0',
    name: 'Small EN Q8_0',
    size: '312MB',
    description: 'English only, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Small',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q8_0.bin'
  },
  {
    id: 'small',
    name: 'Small',
    size: '488MB',
    description: 'Multilingual, standard version',
    provider: 'whisper-cpp',
    category: 'Small',
    language: 'multilingual',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin'
  },
  {
    id: 'small.en',
    name: 'Small EN',
    size: '488MB',
    description: 'English only, standard version',
    provider: 'whisper-cpp',
    category: 'Small',
    language: 'english-only',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin'
  },

  // Medium Models (High precision)
  {
    id: 'medium-q5_1',
    name: 'Medium Q5_1',
    size: '769MB',
    description: 'Multilingual, quantized',
    provider: 'whisper-cpp',
    category: 'Medium',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_1.bin'
  },
  {
    id: 'medium.en-q5_1',
    name: 'Medium EN Q5_1',
    size: '769MB',
    description: 'English only, quantized',
    provider: 'whisper-cpp',
    category: 'Medium',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en-q5_1.bin'
  },
  {
    id: 'medium-q8_0',
    name: 'Medium Q8_0',
    size: '985MB',
    description: 'Multilingual, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Medium',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q8_0.bin'
  },
  {
    id: 'medium.en-q8_0',
    name: 'Medium EN Q8_0',
    size: '985MB',
    description: 'English only, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Medium',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en-q8_0.bin'
  },
  {
    id: 'medium',
    name: 'Medium',
    size: '1.54GB',
    description: 'Multilingual, standard version',
    provider: 'whisper-cpp',
    category: 'Medium',
    language: 'multilingual',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin'
  },
  {
    id: 'medium.en',
    name: 'Medium EN',
    size: '1.54GB',
    description: 'English only, standard version',
    provider: 'whisper-cpp',
    category: 'Medium',
    language: 'english-only',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin'
  },

  // Large Models (Highest precision)
  {
    id: 'large-v3-q5_0',
    name: 'Large V3 Q5_0',
    size: '1.55GB',
    description: 'Multilingual, v3 version, quantized',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-q5_0.bin'
  },
  {
    id: 'large-v3-q8_0',
    name: 'Large V3 Q8_0',
    size: '2.39GB',
    description: 'Multilingual, v3 version, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-q8_0.bin'
  },
  {
    id: 'large-v3',
    name: 'Large V3',
    size: '3.1GB',
    description: 'Multilingual, v3 version, standard version',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin'
  },
  {
    id: 'large-v2-q5_0',
    name: 'Large V2 Q5_0',
    size: '1.08GB',
    description: 'Multilingual, v2 version, quantized',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q5_0.bin'
  },
  {
    id: 'large-v2-q8_0',
    name: 'Large V2 Q8_0',
    size: '1.66GB',
    description: 'Multilingual, v2 version, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q8_0.bin'
  },
  {
    id: 'large-v2',
    name: 'Large V2',
    size: '3.09GB',
    description: 'Multilingual, v2 version, standard version',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2.bin'
  },
  {
    id: 'large-v3-turbo-q5_0',
    name: 'Large V3 Turbo Q5_0',
    size: '574MB',
    description: 'Latest technology, multilingual, quantized',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin'
  },
  {
    id: 'large-v3-turbo-q8_0',
    name: 'Large V3 Turbo Q8_0',
    size: '874MB',
    description: 'Latest technology, multilingual, high-precision quantized',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q8_0.bin'
  },
  {
    id: 'large-v3-turbo',
    name: 'Large V3 Turbo',
    size: '1.62GB',
    description: 'Latest technology, multilingual, standard version',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin'
  },

  {
    id: 'large-v1',
    name: 'Large V1',
    size: '3.09GB',
    description: 'Multilingual, v1 version, standard version',
    provider: 'whisper-cpp',
    category: 'Large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v1.bin'
  }
]

// OpenAI Whisper Models
export const OPENAI_WHISPER_MODELS: STTModel[] = [
  {
    id: 'whisper-1',
    name: 'Whisper-1',
    size: 'N/A',
    description: 'OpenAI Whisper API, high-precision speech recognition',
    provider: 'openai',
    category: 'API',
    language: 'multilingual',
    recommended: true
  }
]

// Google Speech-to-Text Models
export const GOOGLE_SPEECH_MODELS: STTModel[] = [
  {
    id: 'google-speech-v1',
    name: 'Speech-to-Text V1',
    size: 'N/A',
    description: 'Google Cloud Speech-to-Text API',
    provider: 'google',
    category: 'API',
    language: 'multilingual',
    recommended: false
  },
  {
    id: 'google-speech-v2',
    name: 'Speech-to-Text V2',
    size: 'N/A',
    description: 'Google Cloud Speech-to-Text API V2',
    provider: 'google',
    category: 'API',
    language: 'multilingual',
    recommended: true
  }
]

// Integrate all models
export const ALL_STT_MODELS: STTModel[] = [
  ...WHISPER_CPP_MODELS,
  ...OPENAI_WHISPER_MODELS,
  ...GOOGLE_SPEECH_MODELS
]

// Group models by provider
export const getSTTModelsByProvider = () => {
  const grouped = {
    'whisper-cpp': WHISPER_CPP_MODELS,
    'openai': OPENAI_WHISPER_MODELS,
    'google': GOOGLE_SPEECH_MODELS
  }
  return grouped
}

// Provider information
export const STT_PROVIDERS = {
  'whisper-cpp': {
    name: 'Whisper.cpp (Local)',
    description: 'Lightweight speech recognition running locally',
    icon: 'Mic'
  },
  'openai': {
    name: 'OpenAI Whisper',
    description: 'High-precision speech recognition API',
    icon: 'Globe'
  },
  'google': {
    name: 'Google Speech-to-Text',
    description: 'Google Cloud Speech-to-Text API',
    icon: 'Globe'
  }
}

// Get model information by model ID
export const getSTTModelById = (id: string): STTModel | undefined => {
  return ALL_STT_MODELS.find(m => m.id === id)
}

// Get recommended models by provider
export const getRecommendedModelsByProvider = (provider: string): STTModel[] => {
  return ALL_STT_MODELS.filter(m => m.provider === provider && m.recommended)
}
