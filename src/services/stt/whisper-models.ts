// whisper.cppの利用可能なモデル一覧
export interface WhisperModel {
  id: string
  name: string
  size: string
  description: string
  url: string
  category: 'tiny' | 'base' | 'small' | 'medium' | 'large'
  language: 'multilingual' | 'english-only'
  quantization: 'none' | 'q5_0' | 'q5_1' | 'q8_0'
  recommended: boolean
}

export const WHISPER_MODELS: WhisperModel[] = [
  // Tiny Models (軽量) - Webアプリケーション推奨
  {
    id: 'tiny-q5_1',
    name: 'Tiny Q5_1',
    size: '32.2MB',
    description: '多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin',
    category: 'tiny',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: true
  },
  {
    id: 'tiny.en-q5_1',
    name: 'Tiny EN Q5_1',
    size: '32.2MB',
    description: '英語専用、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q5_1.bin',
    category: 'tiny',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'tiny-q8_0',
    name: 'Tiny Q8_0',
    size: '43.5MB',
    description: '多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q8_0.bin',
    category: 'tiny',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'tiny.en-q8_0',
    name: 'Tiny EN Q8_0',
    size: '43.6MB',
    description: '英語専用、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q8_0.bin',
    category: 'tiny',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'tiny',
    name: 'Tiny',
    size: '77.7MB',
    description: '多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    category: 'tiny',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'tiny.en',
    name: 'Tiny EN',
    size: '77.7MB',
    description: '英語専用、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
    category: 'tiny',
    language: 'english-only',
    quantization: 'none',
    recommended: false
  },

  // Base Models (標準)
  {
    id: 'base-q5_1',
    name: 'Base Q5_1',
    size: '59.7MB',
    description: '多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin',
    category: 'base',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'base.en-q5_1',
    name: 'Base EN Q5_1',
    size: '59.7MB',
    description: '英語専用、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q5_1.bin',
    category: 'base',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'base-q8_0',
    name: 'Base Q8_0',
    size: '81.8MB',
    description: '多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q8_0.bin',
    category: 'base',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'base.en-q8_0',
    name: 'Base EN Q8_0',
    size: '81.8MB',
    description: '英語専用、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q8_0.bin',
    category: 'base',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'base',
    name: 'Base',
    size: '148MB',
    description: '多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    category: 'base',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'base.en',
    name: 'Base EN',
    size: '148MB',
    description: '英語専用、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
    category: 'base',
    language: 'english-only',
    quantization: 'none',
    recommended: false
  },

  // Small Models (中規模)
  {
    id: 'small-q5_1',
    name: 'Small Q5_1',
    size: '190MB',
    description: '多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin',
    category: 'small',
    language: 'multilingual',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'small.en-q5_1',
    name: 'Small EN Q5_1',
    size: '190MB',
    description: '英語専用、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q5_1.bin',
    category: 'small',
    language: 'english-only',
    quantization: 'q5_1',
    recommended: false
  },
  {
    id: 'small-q8_0',
    name: 'Small Q8_0',
    size: '264MB',
    description: '多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q8_0.bin',
    category: 'small',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'small.en-q8_0',
    name: 'Small EN Q8_0',
    size: '264MB',
    description: '英語専用、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q8_0.bin',
    category: 'small',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'small',
    name: 'Small',
    size: '488MB',
    description: '多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    category: 'small',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'small.en',
    name: 'Small EN',
    size: '488MB',
    description: '英語専用、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
    category: 'small',
    language: 'english-only',
    quantization: 'none',
    recommended: false
  },

  // Medium Models (大規模)
  {
    id: 'medium-q5_0',
    name: 'Medium Q5_0',
    size: '539MB',
    description: '多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin',
    category: 'medium',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'medium.en-q5_0',
    name: 'Medium EN Q5_0',
    size: '539MB',
    description: '英語専用、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en-q5_0.bin',
    category: 'medium',
    language: 'english-only',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'medium-q8_0',
    name: 'Medium Q8_0',
    size: '823MB',
    description: '多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q8_0.bin',
    category: 'medium',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'medium.en-q8_0',
    name: 'Medium EN Q8_0',
    size: '823MB',
    description: '英語専用、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en-q8_0.bin',
    category: 'medium',
    language: 'english-only',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'medium',
    name: 'Medium',
    size: '1.53GB',
    description: '多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    category: 'medium',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'medium.en',
    name: 'Medium EN',
    size: '1.53GB',
    description: '英語専用、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin',
    category: 'medium',
    language: 'english-only',
    quantization: 'none',
    recommended: false
  },

  // Large Models (超大規模) - 高精度要求
  {
    id: 'large-v3-turbo-q5_0',
    name: 'Large V3 Turbo Q5_0',
    size: '574MB',
    description: '最新技術、多言語対応、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'large-v3-turbo-q8_0',
    name: 'Large V3 Turbo Q8_0',
    size: '874MB',
    description: '最新技術、多言語対応、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q8_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'large-v3-turbo',
    name: 'Large V3 Turbo',
    size: '1.62GB',
    description: '最新技術、多言語対応、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'large-v3-q5_0',
    name: 'Large V3 Q5_0',
    size: '1.08GB',
    description: '多言語対応、v3版、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-q5_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'large-v3',
    name: 'Large V3',
    size: '3.1GB',
    description: '多言語対応、v3版、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'large-v2-q5_0',
    name: 'Large V2 Q5_0',
    size: '1.08GB',
    description: '多言語対応、v2版、量子化済み',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q5_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q5_0',
    recommended: false
  },
  {
    id: 'large-v2-q8_0',
    name: 'Large V2 Q8_0',
    size: '1.66GB',
    description: '多言語対応、v2版、高精度量子化',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q8_0.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'q8_0',
    recommended: false
  },
  {
    id: 'large-v2',
    name: 'Large V2',
    size: '3.09GB',
    description: '多言語対応、v2版、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  },
  {
    id: 'large-v1',
    name: 'Large V1',
    size: '3.09GB',
    description: '多言語対応、v1版、標準版',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v1.bin',
    category: 'large',
    language: 'multilingual',
    quantization: 'none',
    recommended: false
  }
]

// モデルをカテゴリ別にグループ化
export const getWhisperModelsByCategory = () => {
  const grouped = {
    tiny: WHISPER_MODELS.filter(m => m.category === 'tiny'),
    base: WHISPER_MODELS.filter(m => m.category === 'base'),
    small: WHISPER_MODELS.filter(m => m.category === 'small'),
    medium: WHISPER_MODELS.filter(m => m.category === 'medium'),
    large: WHISPER_MODELS.filter(m => m.category === 'large')
  }
  return grouped
}

// 推奨モデルを取得
export const getRecommendedWhisperModels = () => {
  return WHISPER_MODELS.filter(m => m.recommended)
}

// モデルIDからモデル情報を取得
export const getWhisperModelById = (id: string): WhisperModel | undefined => {
  return WHISPER_MODELS.find(m => m.id === id)
}

// モデルがダウンロード済みかチェック
export const checkWhisperModelDownloaded = async (modelId: string): Promise<boolean> => {
  try {
    const model = getWhisperModelById(modelId)
    if (!model) return false
    
    const response = await fetch(`/whisper/models/ggml-${modelId}.bin`, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('Error checking model download status:', error)
    return false
  }
}
