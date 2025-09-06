import { FileCreationInfo } from '@/components/ui/file-creation-loader'

// ファイル作成表示機能の使用例
export const fileCreationExamples = {
  // 基本的なファイル作成例
  basicFileCreation: (): FileCreationInfo => ({
    id: 'example_1',
    fileName: 'document.txt',
    fileType: 'text',
    status: 'creating',
    progress: 45,
    startTime: new Date(Date.now() - 30000), // 30秒前から開始
    estimatedDuration: 60000, // 1分
    currentStep: 'ファイル初期化',
    totalSteps: 4,
    currentStepIndex: 1,
    metadata: {
      size: 1024,
      format: 'txt',
      compression: 'none'
    }
  }),

  // 画像ファイル作成例
  imageFileCreation: (): FileCreationInfo => ({
    id: 'example_2',
    fileName: 'generated-image.png',
    fileType: 'image',
    status: 'processing',
    progress: 75,
    startTime: new Date(Date.now() - 15000), // 15秒前から開始
    estimatedDuration: 30000, // 30秒
    currentStep: '画像の後処理',
    totalSteps: 3,
    currentStepIndex: 2,
    metadata: {
      size: 2048576, // 2MB
      format: 'png',
      quality: 'high',
      compression: 'lossless'
    }
  }),

  // 動画ファイル作成例
  videoFileCreation: (): FileCreationInfo => ({
    id: 'example_3',
    fileName: 'video-output.mp4',
    fileType: 'video',
    status: 'processing',
    progress: 20,
    startTime: new Date(Date.now() - 120000), // 2分前から開始
    estimatedDuration: 300000, // 5分
    currentStep: 'エンコーディング',
    totalSteps: 6,
    currentStepIndex: 2,
    metadata: {
      size: 52428800, // 50MB
      format: 'mp4',
      quality: '1080p',
      compression: 'h.264'
    }
  }),

  // 完了したファイル作成例
  completedFileCreation: (): FileCreationInfo => ({
    id: 'example_4',
    fileName: 'processed-data.json',
    fileType: 'document',
    status: 'completed',
    progress: 100,
    startTime: new Date(Date.now() - 45000), // 45秒前から開始
    estimatedDuration: 30000, // 30秒
    currentStep: '完了',
    totalSteps: 3,
    currentStepIndex: 2,
    metadata: {
      size: 5120,
      format: 'json',
      compression: 'gzip'
    }
  }),

  // エラーが発生したファイル作成例
  errorFileCreation: (): FileCreationInfo => ({
    id: 'example_5',
    fileName: 'failed-upload.zip',
    fileType: 'archive',
    status: 'error',
    progress: 60,
    startTime: new Date(Date.now() - 20000), // 20秒前から開始
    estimatedDuration: 15000, // 15秒
    currentStep: 'アップロードエラー',
    totalSteps: 3,
    currentStepIndex: 2,
    metadata: {
      size: 1048576, // 1MB
      format: 'zip',
      compression: 'deflate'
    }
  }),

  // 音声ファイル作成例
  audioFileCreation: (): FileCreationInfo => ({
    id: 'example_6',
    fileName: 'audio-recording.wav',
    fileType: 'audio',
    status: 'creating',
    progress: 0,
    startTime: new Date(),
    estimatedDuration: 45000, // 45秒
    currentStep: '初期化中',
    totalSteps: 4,
    currentStepIndex: 0,
    metadata: {
      size: 10485760, // 10MB
      format: 'wav',
      quality: '44.1kHz',
      compression: 'none'
    }
  })
}

// ファイル作成のシミュレーション例
export const simulateFileCreation = (
  addFileCreation: (fileInfo: Omit<FileCreationInfo, 'id' | 'startTime'>) => string,
  updateFileCreation: (id: string, updates: Partial<FileCreationInfo>) => void,
  completeFileCreation: (id: string, success: boolean) => void
) => {
  // 画像ファイル作成のシミュレーション
  const imageFileId = addFileCreation({
    fileName: 'ai-generated-image.png',
    fileType: 'image',
    status: 'creating',
    progress: 0,
    estimatedDuration: 25000,
    metadata: {
      format: 'png',
      quality: 'high',
      compression: 'lossless'
    }
  })

  // 進捗シミュレーション
  setTimeout(() => updateFileCreation(imageFileId, { status: 'processing', progress: 10, currentStep: '初期化中' }), 500)
  setTimeout(() => updateFileCreation(imageFileId, { progress: 30, currentStep: '画像生成中' }), 2000)
  setTimeout(() => updateFileCreation(imageFileId, { progress: 60, currentStep: '品質調整中' }), 5000)
  setTimeout(() => updateFileCreation(imageFileId, { progress: 90, currentStep: '保存中' }), 8000)
  setTimeout(() => completeFileCreation(imageFileId, true), 10000)

  // テキストファイル作成のシミュレーション
  const textFileId = addFileCreation({
    fileName: 'report.txt',
    fileType: 'text',
    status: 'creating',
    progress: 0,
    estimatedDuration: 15000,
    metadata: {
      format: 'txt',
      compression: 'none'
    }
  })

  setTimeout(() => updateFileCreation(textFileId, { status: 'processing', progress: 20, currentStep: 'テキスト生成中' }), 1000)
  setTimeout(() => updateFileCreation(textFileId, { progress: 50, currentStep: 'フォーマット調整中' }), 3000)
  setTimeout(() => updateFileCreation(textFileId, { progress: 80, currentStep: 'エンコーディング中' }), 6000)
  setTimeout(() => completeFileCreation(textFileId, true), 8000)
}

// リアルタイムファイル作成更新のシミュレーション
export const simulateRealTimeFileCreation = (
  fileCreationId: string,
  updateFileCreation: (id: string, updates: Partial<FileCreationInfo>) => void
) => {
  let progress = 0
  const steps = [
    '初期化中',
    'データ処理中',
    'ファイル生成中',
    '品質チェック中',
    '保存中',
    '完了'
  ]
  let stepIndex = 0

  const interval = setInterval(() => {
    progress += Math.random() * 12 + 8 // 8-20%のランダムな進捗
    
    if (progress >= 100) {
      progress = 100
      clearInterval(interval)
      updateFileCreation(fileCreationId, {
        status: 'completed',
        progress: 100,
        currentStep: '完了',
        currentStepIndex: steps.length - 1
      })
    } else {
      if (progress > (stepIndex + 1) * 16) {
        stepIndex = Math.min(stepIndex + 1, steps.length - 2)
      }
      
      updateFileCreation(fileCreationId, {
        progress,
        currentStep: steps[stepIndex],
        currentStepIndex: stepIndex
      })
    }
  }, 800) // 0.8秒ごとに更新

  return interval
}

// ファイルタイプ別の作成例
export const createFileByType = (
  addFileCreation: (fileInfo: Omit<FileCreationInfo, 'id' | 'startTime'>) => string,
  fileName: string,
  fileType: FileCreationInfo['fileType']
) => {
  const baseConfig = {
    fileName,
    fileType,
    status: 'creating' as const,
    progress: 0,
    estimatedDuration: 20000
  }

  switch (fileType) {
    case 'image':
      return addFileCreation({
        ...baseConfig,
        estimatedDuration: 30000,
        metadata: {
          format: 'png',
          quality: 'high',
          compression: 'lossless'
        }
      })
    
    case 'video':
      return addFileCreation({
        ...baseConfig,
        estimatedDuration: 120000, // 2分
        metadata: {
          format: 'mp4',
          quality: '1080p',
          compression: 'h.264'
        }
      })
    
    case 'audio':
      return addFileCreation({
        ...baseConfig,
        estimatedDuration: 45000,
        metadata: {
          format: 'wav',
          quality: '44.1kHz',
          compression: 'none'
        }
      })
    
    case 'code':
      return addFileCreation({
        ...baseConfig,
        estimatedDuration: 15000,
        metadata: {
          format: 'ts',
          compression: 'none'
        }
      })
    
    case 'archive':
      return addFileCreation({
        ...baseConfig,
        estimatedDuration: 25000,
        metadata: {
          format: 'zip',
          compression: 'deflate'
        }
      })
    
    default:
      return addFileCreation({
        ...baseConfig,
        metadata: {
          format: 'txt',
          compression: 'none'
        }
      })
  }
}
