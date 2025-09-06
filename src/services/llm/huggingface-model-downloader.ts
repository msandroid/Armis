export interface HuggingFaceModel {
  id: string
  name: string
  description: string
  downloads: number
  likes: number
  tags: string[]
  model_type: string
  size: number
  format: string
  quantization: string
}

export interface DownloadProgress {
  modelId: string
  downloaded: number
  total: number
  percentage: number
  speed: number
  eta: number
  status: 'downloading' | 'completed' | 'error'
  error?: string
}

export interface ModelDownloadOptions {
  modelId: string
  targetPath?: string
  onProgress?: (progress: DownloadProgress) => void
  onComplete?: (modelPath: string) => void
  onError?: (error: string) => void
}

export class HuggingFaceModelDownloader {
  private baseUrl = 'https://huggingface.co/api'
  private modelsCache: HuggingFaceModel[] = []
  private downloadQueue: Map<string, AbortController> = new Map()

  async searchLlamaCppModels(query: string = '', limit: number = 50): Promise<HuggingFaceModel[]> {
    try {
      console.log(`🔍 Searching for LlamaCpp models with query: "${query}"`)
      
      // より柔軟な検索のため、複数の検索パターンを試す
      const searchQueries = [
        query,
        query.replace('-', ' '),
        query.replace('_', ' '),
        query.toLowerCase(),
        query.toUpperCase()
      ]
      
      // 完全なモデルIDの場合は、モデル名部分のみを抽出して検索
      if (query.includes('/')) {
        const modelName = query.split('/').pop() || query
        searchQueries.push(
          modelName,
          modelName.replace('-', ' '),
          modelName.replace('_', ' '),
          modelName.toLowerCase(),
          modelName.toUpperCase()
        )
      }
      
      let allModels: HuggingFaceModel[] = []
      
      for (const searchQuery of searchQueries) {
        try {
          // Search for GGUF models with llama.cpp tag
          const searchParams = new URLSearchParams({
            search: searchQuery,
            filter: 'other:llama.cpp',
            sort: 'downloads',
            direction: '-1',
            limit: limit.toString()
          })

          const response = await fetch(`${this.baseUrl}/models?${searchParams}`)
          
          if (!response.ok) {
            continue // この検索クエリをスキップして次を試す
          }

          const data = await response.json()
          const models: HuggingFaceModel[] = []

          for (const model of data) {
            // Filter for GGUF models
            const hasGGUF = model.siblings?.some((sibling: any) => 
              sibling.rfilename.endsWith('.gguf')
            )

            if (hasGGUF) {
              const ggufFiles = model.siblings?.filter((sibling: any) => 
                sibling.rfilename.endsWith('.gguf')
              ) || []

              // Get the largest GGUF file (usually the main model)
              const mainFile = ggufFiles.reduce((largest: any, current: any) => 
                (current.size || 0) > (largest.size || 0) ? current : largest
              )

              models.push({
                id: model.id,
                name: model.modelId || model.id,
                description: model.description || 'No description available',
                downloads: model.downloads || 0,
                likes: model.likes || 0,
                tags: model.tags || [],
                model_type: model.model_type || 'unknown',
                size: mainFile?.size || 0,
                format: 'GGUF',
                quantization: this.extractQuantization(mainFile?.rfilename || '')
              })
            }
          }
          
          allModels = allModels.concat(models)
        } catch (error) {
          console.warn(`Warning: Search query "${searchQuery}" failed:`, error)
          continue
        }
      }
      
      // 重複を除去してダウンロード数でソート
      const uniqueModels = allModels.filter((model, index, self) => 
        index === self.findIndex(m => m.id === model.id)
      ).sort((a, b) => b.downloads - a.downloads)

      // モデルが見つからない場合は、フォールバックモデルを追加
      if (uniqueModels.length === 0) {
        console.log(`⚠️ No models found for query "${query}", adding fallback models`)
        const fallbackModels = this.generateFallbackModels(query)
        uniqueModels.push(...fallbackModels)
      }

      this.modelsCache = uniqueModels
      console.log(`✅ Found ${uniqueModels.length} unique LlamaCpp models`)
      return uniqueModels

    } catch (error) {
      console.error('❌ Error searching models:', error)
      throw error
    }
  }

  async getModelDetails(modelId: string): Promise<HuggingFaceModel | null> {
    try {
      const response = await fetch(`${this.baseUrl}/models/${modelId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch model details: ${response.statusText}`)
      }

      const model = await response.json()
      
      // Find GGUF files
      const ggufFiles = model.siblings?.filter((sibling: any) => 
        sibling.rfilename.endsWith('.gguf')
      ) || []

      if (ggufFiles.length === 0) {
        return null
      }

      const mainFile = ggufFiles.reduce((largest: any, current: any) => 
        (current.size || 0) > (largest.size || 0) ? current : largest
      )

      return {
        id: model.id,
        name: model.modelId || model.id,
        description: model.description || 'No description available',
        downloads: model.downloads || 0,
        likes: model.likes || 0,
        tags: model.tags || [],
        model_type: model.model_type || 'unknown',
        size: mainFile?.size || 0,
        format: 'GGUF',
        quantization: this.extractQuantization(mainFile?.rfilename || '')
      }

    } catch (error) {
      console.error('❌ Error fetching model details:', error)
      return null
    }
  }

  async downloadModel(options: ModelDownloadOptions): Promise<string> {
    const { modelId, targetPath, onProgress, onComplete, onError } = options

    try {
      console.log(`🚀 ===== HUGGING FACE: MODEL DOWNLOAD STARTED =====`)
      console.log(`📥 Model: ${modelId}`)
      console.log(`⏰ Start time: ${new Date().toLocaleString()}`)
      console.log(`🔗 Base URL: ${this.baseUrl}`)
      console.log(`🔧 Service: Hugging Face`)
      console.log(`===================================================`)

      // Get model details to find the GGUF file
      const modelDetails = await this.getModelDetails(modelId)
      if (!modelDetails) {
        throw new Error('Model not found or no GGUF files available')
      }

      // Find the main GGUF file
      const response = await fetch(`${this.baseUrl}/models/${modelId}`)
      const model = await response.json()
      
      const ggufFiles = model.siblings?.filter((sibling: any) => 
        sibling.rfilename.endsWith('.gguf')
      ) || []

      if (ggufFiles.length === 0) {
        throw new Error('No GGUF files found for this model')
      }

      // 量子化レベルの優先順位を定義
      const quantizationPriority = ['Q4_K_M', 'Q5_K_M', 'Q4_K_S', 'Q5_K_S', 'Q8_0', 'Q4_0', 'Q5_0']
      
      // 優先順位に基づいてファイルを選択
      let mainFile = null
      for (const quant of quantizationPriority) {
        mainFile = ggufFiles.find((file: any) => 
          file.rfilename.includes(quant)
        )
        if (mainFile) {
          console.log(`✅ Selected ${quant} quantization: ${mainFile.rfilename}`)
          break
        }
      }
      
      // 見つからない場合は最大サイズのファイルを使用
      if (!mainFile) {
        mainFile = ggufFiles.reduce((largest: any, current: any) => 
          (current.size || 0) > (largest.size || 0) ? current : largest
        )
        console.log(`⚠️ No preferred quantization found, using largest file: ${mainFile.rfilename}`)
      }

      const downloadUrl = `https://huggingface.co/${modelId}/resolve/main/${mainFile.rfilename}`
      const fileName = mainFile.rfilename
      const fileSize = mainFile.size
      
      // Create proper directory structure for the model
      const modelDir = modelId.replace('/', '/')
      const modelName = modelId.split('/').pop() || modelId
      const finalTargetPath = targetPath || `./models/${modelDir}/${fileName}`
      
      console.log(`📁 Model directory: ${modelDir}`)
      console.log(`📁 Model name: ${modelName}`)
      console.log(`📁 File: ${fileName}`)
      console.log(`📊 Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)
      console.log(`🔧 Quantization: ${this.extractQuantization(fileName)}`)
      console.log(`🔗 Download URL: ${downloadUrl}`)
      console.log(`📂 Target path: ${finalTargetPath}`)

      // Create abort controller for this download
      const abortController = new AbortController()
      this.downloadQueue.set(modelId, abortController)

      // Check if we're in Electron environment
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI

      if (isElectron) {
        // Use Electron IPC for file download
        return await this.downloadWithElectron(
          modelId,
          downloadUrl,
          fileName,
          fileSize,
          finalTargetPath,
          onProgress,
          onComplete,
          onError,
          abortController
        )
      } else {
        // Fallback to browser download (simulated)
        return await this.downloadInBrowser(
          modelId,
          downloadUrl,
          fileName,
          fileSize,
          finalTargetPath,
          onProgress,
          onComplete,
          onError,
          abortController
        )
      }

    } catch (error) {
      console.error('❌ Download failed:', error)
      
      // Remove from download queue
      this.downloadQueue.delete(modelId)

      const errorProgress: DownloadProgress = {
        modelId,
        downloaded: 0,
        total: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      onProgress?.(errorProgress)
      onError?.(error instanceof Error ? error.message : 'Unknown error')
      
      throw error
    }
  }

  private async downloadWithElectron(
    modelId: string,
    downloadUrl: string,
    fileName: string,
    fileSize: number,
    targetPath: string,
    onProgress?: (progress: DownloadProgress) => void,
    onComplete?: (modelPath: string) => void,
    onError?: (error: string) => void,
    abortController?: AbortController
  ): Promise<string> {
    try {
      // Use Electron's IPC to download file
      const electronAPI = (window as any).electronAPI
      
      if (!electronAPI?.downloadFile) {
        throw new Error('Electron download API not available')
      }

      // Set up progress listener
      if (onProgress) {
        electronAPI.onDownloadProgress((progress: any) => {
          if (progress.modelId === modelId) {
            const downloadProgress: DownloadProgress = {
              modelId,
              downloaded: progress.downloaded,
              total: progress.total,
              percentage: progress.percentage,
              speed: progress.speed,
              eta: progress.eta,
              status: progress.status,
              error: progress.error
            }
            
            // 詳細なプログレス情報をコンソールに出力
            const downloadedMB = (progress.downloaded / 1024 / 1024).toFixed(2)
            const totalMB = (progress.total / 1024 / 1024).toFixed(2)
            const speedMBps = progress.speed ? (progress.speed / 1024 / 1024).toFixed(2) : '0'
            const etaMinutes = progress.eta ? Math.round(progress.eta / 60) : 0
            
            console.log(`📊 [Electron] ${modelId}: ${progress.percentage}% (${downloadedMB}MB/${totalMB}MB) - ${speedMBps}MB/s - ETA: ${etaMinutes}min`)
            
            onProgress(downloadProgress)
          }
        })
      }

      // Start download through Electron
      const result = await electronAPI.downloadFile({
        modelId,
        url: downloadUrl,
        targetPath,
        fileName,
        fileSize
      })

      if (result.success) {
        // Remove from download queue
        this.downloadQueue.delete(modelId)

        const finalProgress: DownloadProgress = {
          modelId,
          downloaded: fileSize,
          total: fileSize,
          percentage: 100,
          speed: 0,
          eta: 0,
          status: 'completed'
        }

        onProgress?.(finalProgress)
        onComplete?.(result.path)

        console.log(`🎉 ===== HUGGING FACE: DOWNLOAD COMPLETED =====`)
        console.log(`✅ Download completed: ${modelId}`)
        console.log(`📁 File: ${fileName}`)
        console.log(`📂 Path: ${result.path}`)
        console.log(`⏰ End time: ${new Date().toLocaleString()}`)
        console.log(`📊 Final size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)
        console.log(`================================================`)
        return result.path
      } else {
        throw new Error(result.error || 'Download failed')
      }

    } catch (error) {
      console.error(`💥 ===== HUGGING FACE: DOWNLOAD FAILED =====`)
      console.error(`❌ Electron download failed: ${error}`)
      console.error(`📥 Model: ${modelId}`)
      console.error(`📁 File: ${fileName}`)
      console.error(`⏰ Time: ${new Date().toLocaleString()}`)
      console.error(`==============================================`)
      throw error
    }
  }

  private async downloadInBrowser(
    modelId: string,
    downloadUrl: string,
    fileName: string,
    fileSize: number,
    targetPath: string,
    onProgress?: (progress: DownloadProgress) => void,
    onComplete?: (modelPath: string) => void,
    onError?: (error: string) => void,
    abortController?: AbortController
  ): Promise<string> {
    try {
      // Start download
      const downloadResponse = await fetch(downloadUrl, {
        signal: abortController?.signal
      })

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.statusText}`)
      }

      const reader = downloadResponse.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      let downloadedBytes = 0
      const chunks: Uint8Array[] = []
      const startTime = Date.now()

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        downloadedBytes += value.length

        // Calculate progress
        const percentage = (downloadedBytes / fileSize) * 100
        const elapsedTime = (Date.now() - startTime) / 1000
        const speed = downloadedBytes / elapsedTime // bytes per second
        const remainingBytes = fileSize - downloadedBytes
        const eta = remainingBytes / speed // seconds

        const progress: DownloadProgress = {
          modelId,
          downloaded: downloadedBytes,
          total: fileSize,
          percentage: Math.round(percentage * 100) / 100,
          speed: Math.round(speed),
          eta: Math.round(eta),
          status: 'downloading'
        }

        // 詳細なプログレス情報をコンソールに出力
        const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2)
        const totalMB = (fileSize / 1024 / 1024).toFixed(2)
        const speedMBps = (speed / 1024 / 1024).toFixed(2)
        const etaMinutes = Math.round(eta / 60)
        
        console.log(`📊 [Browser] ${modelId}: ${Math.round(percentage * 100) / 100}% (${downloadedMB}MB/${totalMB}MB) - ${speedMBps}MB/s - ETA: ${etaMinutes}min`)
        
        onProgress?.(progress)
      }

      // Combine chunks and create blob
      const blob = new Blob(chunks as BlobPart[])
      
      // In browser environment, we can't save to filesystem directly
      // So we'll create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Remove from download queue
      this.downloadQueue.delete(modelId)

      const finalProgress: DownloadProgress = {
        modelId,
        downloaded: fileSize,
        total: fileSize,
        percentage: 100,
        speed: 0,
        eta: 0,
        status: 'completed'
      }

      onProgress?.(finalProgress)
      onComplete?.(targetPath)

      console.log(`🎉 ===== HUGGING FACE: BROWSER DOWNLOAD COMPLETED =====`)
      console.log(`✅ Download completed: ${modelId}`)
      console.log(`📁 File: ${fileName}`)
      console.log(`📂 Path: ${targetPath}`)
      console.log(`⏰ End time: ${new Date().toLocaleString()}`)
      console.log(`📊 Final size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)
      console.log(`========================================================`)
      return targetPath

    } catch (error) {
      console.error(`💥 ===== HUGGING FACE: BROWSER DOWNLOAD FAILED =====`)
      console.error(`❌ Browser download failed: ${error}`)
      console.error(`📥 Model: ${modelId}`)
      console.error(`📁 File: ${fileName}`)
      console.error(`⏰ Time: ${new Date().toLocaleString()}`)
      console.error(`====================================================`)
      throw error
    }
  }

  async cancelDownload(modelId: string): Promise<void> {
    const abortController = this.downloadQueue.get(modelId)
    if (abortController) {
      abortController.abort()
      this.downloadQueue.delete(modelId)
      console.log(`❌ Download cancelled for: ${modelId}`)
    }
  }

  isDownloading(modelId: string): boolean {
    return this.downloadQueue.has(modelId)
  }

  getDownloadingModels(): string[] {
    return Array.from(this.downloadQueue.keys())
  }

  private extractQuantization(filename: string): string {
    // より詳細な量子化レベルの認識
    if (filename.includes('Q4_K_M')) return 'Q4_K_M'
    if (filename.includes('Q4_K_S')) return 'Q4_K_S'
    if (filename.includes('Q5_K_M')) return 'Q5_K_M'
    if (filename.includes('Q5_K_S')) return 'Q5_K_S'
    if (filename.includes('Q6_K')) return 'Q6_K'
    if (filename.includes('Q8_0')) return 'Q8_0'
    if (filename.includes('Q4_0')) return 'Q4_0'
    if (filename.includes('Q4_1')) return 'Q4_1'
    if (filename.includes('Q5_0')) return 'Q5_0'
    if (filename.includes('Q5_1')) return 'Q5_1'
    if (filename.includes('f16')) return 'F16'
    if (filename.includes('f32')) return 'F32'
    return 'Unknown'
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  formatSpeed(bytesPerSecond: number): string {
    return this.formatFileSize(bytesPerSecond) + '/s'
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  private generateFallbackModels(query: string): HuggingFaceModel[] {
    const fallbackModels: HuggingFaceModel[] = []
    
    // qwen3関連のフォールバックモデル
    if (query.toLowerCase().includes('qwen3')) {
      fallbackModels.push(
        {
          id: 'unsloth/Qwen3-0.6B-GGUF',
          name: 'Qwen3-0.6B-GGUF',
          description: 'Qwen3 0.6B model optimized with Unsloth, GGUF format for ultra-lightweight inference',
          downloads: 34452,
          likes: 74,
          tags: ['gguf', 'qwen3', 'lightweight'],
          model_type: 'qwen3',
          size: 0,
          format: 'GGUF',
          quantization: 'Q4_K_M'
        },
        {
          id: 'unsloth/Qwen3-1.7B-GGUF',
          name: 'Qwen3-1.7B-GGUF',
          description: 'Qwen3 1.7B model optimized with Unsloth, GGUF format for lightweight inference',
          downloads: 31364,
          likes: 41,
          tags: ['gguf', 'qwen3', 'lightweight'],
          model_type: 'qwen3',
          size: 0,
          format: 'GGUF',
          quantization: 'Q4_K_M'
        },
        {
          id: 'unsloth/Qwen3-4B-Instruct-2507-GGUF',
          name: 'Qwen3-4B-Instruct-2507-GGUF',
          description: 'Qwen3 4B Instruct model optimized with Unsloth, GGUF format for local inference',
          downloads: 67000,
          likes: 47,
          tags: ['gguf', 'qwen3', 'instruct'],
          model_type: 'qwen3',
          size: 0,
          format: 'GGUF',
          quantization: 'Q4_K_M'
        },
        {
          id: 'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF',
          name: 'DeepSeek-R1-0528-Qwen3-8B-GGUF',
          description: 'Qwen3 8B model optimized with Unsloth, GGUF format',
          downloads: 256000,
          likes: 295,
          tags: ['gguf', 'qwen3', 'deepseek'],
          model_type: 'qwen3',
          size: 0,
          format: 'GGUF',
          quantization: 'Q4_K_M'
        },
        {
          id: 'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF',
          name: 'Qwen3-30B-A3B-Instruct-2507-GGUF',
          description: 'Qwen3 30B Instruct model optimized with Unsloth, GGUF format',
          downloads: 263000,
          likes: 209,
          tags: ['gguf', 'qwen3', 'instruct'],
          model_type: 'qwen3',
          size: 0,
          format: 'GGUF',
          quantization: 'Q4_K_M'
        }
      )
    }
    
    // その他の一般的なフォールバックモデル
    fallbackModels.push(
      {
        id: 'unsloth/gpt-oss-20b-GGUF',
        name: 'GPT-OSS-20B-GGUF',
        description: 'OpenAI GPT-OSS-20B model for powerful reasoning and agentic tasks',
        downloads: 658000,
        likes: 336,
        tags: ['gguf', 'gpt', 'oss'],
        model_type: 'gpt',
        size: 0,
        format: 'GGUF',
        quantization: 'Q4_K_M'
      },
      {
        id: 'TheBloke/Llama-2-7B-Chat-GGUF',
        name: 'Llama-2-7B-Chat-GGUF',
        description: 'Meta Llama 2 7B Chat model in GGUF format',
        downloads: 1000000,
        likes: 500,
        tags: ['gguf', 'llama2', 'chat'],
        model_type: 'llama',
        size: 0,
        format: 'GGUF',
        quantization: 'Q4_K_M'
      }
    )
    
    return fallbackModels
  }

  // ダウンロード完了後のディレクトリ構造確認
  private async verifyDownloadStructure(modelId: string, targetPath: string): Promise<void> {
    try {
      console.log(`🔍 Verifying download structure for: ${modelId}`)
      
      // Electron環境では実際にファイルの存在を確認
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.verifyFile({ path: targetPath })
        if (result.exists) {
          console.log(`✅ Download verified: ${targetPath}`)
        } else {
          console.warn(`⚠️ Download verification failed: ${targetPath}`)
        }
      } else {
        // ブラウザ環境では構造の提案のみ
        const modelDir = this.generateModelDirectory(modelId)
        console.log(`📁 Expected directory structure: ${modelDir}`)
        console.log(`📂 Expected file path: ${targetPath}`)
      }
    } catch (error) {
      console.warn(`⚠️ Download verification failed:`, error)
    }
  }

  private generateModelDirectory(modelId: string): string {
    const modelName = modelId.split('/').pop() || modelId
    return `./models/${modelName}`
  }
}
