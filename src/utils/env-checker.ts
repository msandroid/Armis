/**
 * 環境変数の設定状況を確認するユーティリティ
 */

export interface EnvConfig {
  googleApiKey: string | undefined
  googleProjectId: string | undefined
  googleLocation: string | undefined
  isConfigured: boolean
  missingKeys: string[]
  googleCredentialsPath?: string
  googleAuthStatus?: {
    success: boolean
    hasCredentials: boolean
    projectId?: string
    error?: string
  }
  isGeminiImageGenerationConfigured?: boolean
}

/**
 * Google AI APIの設定状況を確認
 */
export async function checkGoogleAIConfig(): Promise<EnvConfig> {
  // Electron環境かどうかをチェック
  const isElectron = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
  
  let googleApiKey: string | undefined
  let googleProjectId: string | undefined
  let googleLocation: string | undefined
  let googleCredentialsPath: string | undefined
  let googleAuthStatus: any = undefined

  if (isElectron) {
    // Electron環境の場合、メインプロセスから環境変数を取得
    try {
      const envVars = await (window as any).electronAPI.getEnvVars()
      googleApiKey = envVars.VITE_GOOGLE_API_KEY
      googleProjectId = envVars.VITE_GOOGLE_PROJECT_ID
      googleLocation = envVars.VITE_GOOGLE_LOCATION || 'us-central1'
      googleCredentialsPath = envVars.GOOGLE_APPLICATION_CREDENTIALS

      // Google Cloud認証状況を確認
      try {
        googleAuthStatus = await (window as any).electronAPI.checkGoogleAuth()
      } catch (error) {
        console.error('Google Cloud認証確認エラー:', error)
        googleAuthStatus = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    } catch (error) {
      console.error('環境変数取得エラー:', error)
    }
  } else {
    // ブラウザ環境の場合、従来の方法で環境変数を取得
    googleApiKey = (import.meta as any).env.VITE_GOOGLE_API_KEY
    googleProjectId = (import.meta as any).env.VITE_GOOGLE_PROJECT_ID
    googleLocation = (import.meta as any).env.VITE_GOOGLE_LOCATION || 'us-central1'
    googleCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  }

  const missingKeys: string[] = []
  
  if (!googleApiKey) {
    missingKeys.push('VITE_GOOGLE_API_KEY')
  }
  
  if (!googleProjectId) {
    missingKeys.push('VITE_GOOGLE_PROJECT_ID')
  }

  // Google Cloud認証情報の確認
  const hasGoogleCredentials = googleCredentialsPath || 
    (isElectron && googleAuthStatus?.success && googleAuthStatus?.hasCredentials)

  // Gemini APIの画像生成機能はAPI Keyのみで利用可能
  const isGeminiImageGenerationConfigured = !!googleApiKey

  return {
    googleApiKey,
    googleProjectId,
    googleLocation,
    isConfigured: missingKeys.length === 0 && (hasGoogleCredentials || isGeminiImageGenerationConfigured),
    missingKeys,
    googleCredentialsPath,
    googleAuthStatus,
    isGeminiImageGenerationConfigured
  }
}

/**
 * 画像生成に必要な設定が完了しているかチェック
 */
export async function isImageGenerationConfigured(): Promise<boolean> {
  const config = await checkGoogleAIConfig()
  return config.isConfigured
}

/**
 * 設定状況の詳細レポートを生成
 */
export async function generateConfigReport(): Promise<string> {
  const config = await checkGoogleAIConfig()
  
  if (config.isConfigured) {
    let report = `✅ Google AI API設定完了\n`
    report += `- API Key: ${config.googleApiKey ? '設定済み' : '未設定'}\n`
    report += `- Project ID: ${config.googleProjectId}\n`
    report += `- Location: ${config.googleLocation}\n`
    
    if (config.googleCredentialsPath) {
      report += `- Google Cloud認証: サービスアカウント認証情報\n`
    } else if (config.googleAuthStatus?.success && config.googleAuthStatus?.hasCredentials) {
      report += `- Google Cloud認証: Electron環境 (${config.googleAuthStatus.projectId || 'プロジェクトID未取得'})\n`
    } else {
      report += `- Google Cloud認証: Electron環境\n`
    }
    
    return report
  } else {
    let report = `❌ Google AI API設定未完了\n`
    
    if (config.missingKeys.length > 0) {
      report += `不足している設定:\n${config.missingKeys.map(key => `- ${key}`).join('\n')}\n\n`
    }
    
    if (!config.googleCredentialsPath && (!config.googleAuthStatus?.success || !config.googleAuthStatus?.hasCredentials)) {
      report += `Google Cloud認証情報が設定されていません。\n`
      if (config.googleAuthStatus?.error) {
        report += `認証エラー: ${config.googleAuthStatus.error}\n`
      }
      report += `以下のいずれかの方法で設定してください：\n`
      report += `1. サービスアカウント認証情報ファイルのパスをGOOGLE_APPLICATION_CREDENTIALS環境変数に設定\n`
      report += `2. gcloud auth application-default loginを実行\n\n`
    }
    
    report += `設定方法については、README.mdの「Gemini Image Generation Integration」セクションを参照してください。`
    
    return report
  }
}

/**
 * 環境変数の設定状況をコンソールに出力
 */
export async function logConfigStatus(): Promise<void> {
  console.log('🔧 Environment Configuration Status:')
  const config = await checkGoogleAIConfig()
  
  console.log('Google AI API Key:', config.googleApiKey ? '✅ 設定済み' : '❌ 未設定')
  console.log('Google Project ID:', config.googleProjectId ? '✅ 設定済み' : '❌ 未設定')
  console.log('Google Location:', config.googleLocation)
  
  if (config.googleCredentialsPath) {
    console.log('Google Cloud認証:', '✅ サービスアカウント認証情報')
  } else if (config.googleAuthStatus?.success && config.googleAuthStatus?.hasCredentials) {
    console.log('Google Cloud認証:', `✅ Electron環境 (${config.googleAuthStatus.projectId || 'プロジェクトID未取得'})`)
  } else {
    console.log('Google Cloud認証:', '❌ 未設定')
    if (config.googleAuthStatus?.error) {
      console.log('認証エラー:', config.googleAuthStatus.error)
    }
  }
  
  if (config.isConfigured) {
    if (config.isGeminiImageGenerationConfigured) {
      console.log('🎨 Image Generation: ✅ Gemini API設定完了')
    } else if (config.googleCredentialsPath || (config.googleAuthStatus?.success && config.googleAuthStatus?.hasCredentials)) {
      console.log('🎨 Image Generation: ✅ Imagen API設定完了')
    } else {
      console.log('🎨 Image Generation: ✅ 設定完了')
    }
  } else {
    console.log('🎨 Image Generation: ❌ 設定未完了')
    console.log('不足している設定:', config.missingKeys)
  }
}
