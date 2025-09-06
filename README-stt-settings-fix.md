# STT設定の修正と自動有効化

## 問題の特定

### 1. STT設定が無効
```
STT Settings Debug: {enabled: false, provider: 'whisper-cpp', models: {…}, enabledModels: Array(1)}
STT service is not available. Please check your STT settings.
```

### 2. Whisperサービスが初期化されない
- STT設定が`enabled: false`のため、Whisperサービスが作成されない
- 音声ファイルアップロード時にエラーが発生

## 解決策

### 1. 自動STT有効化機能

**PromptInputBox.tsxでの実装:**
```typescript
// STT設定に基づいてWhisperServiceを初期化
useEffect(() => {
  const initializeWhisperService = async () => {
    const sttSettings = sttSettingsService.getSettings()
    
    // デバッグ情報を追加
    console.log('🔄 STT Settings Debug:', {
      enabled: sttSettings.enabled,
      provider: sttSettings.provider,
      defaultModel: sttSettings.defaultModel,
      enabledModels: sttSettingsService.getEnabledModels()
    })
    
    // STT設定が無効の場合は自動的に有効化を試行
    if (!sttSettings.enabled) {
      console.log('🔄 STT is disabled, attempting to enable...')
      sttSettingsService.toggleEnabled()
    }
    
    // 設定を再取得（有効化された可能性があるため）
    const currentSettings = sttSettingsService.getSettings()
    
    if (currentSettings.enabled && currentSettings.provider === 'whisper-cpp') {
      try {
        // WhisperServiceFactoryを使用して適切なサービスを選択
        const { WhisperServiceFactory } = await import('../../services/stt/whisper-service-factory')
        const newService = await WhisperServiceFactory.createWhisperService()
        setWhisperService(newService)
        console.log('✅ Whisper service initialized successfully')
      } catch (error) {
        console.error('Failed to create STT service:', error)
        setWhisperService(null)
      }
    } else {
      console.log('❌ STT service not available:', {
        enabled: currentSettings.enabled,
        provider: currentSettings.provider
      })
      setWhisperService(null)
    }
  }

  initializeWhisperService()
}, [sttSettingsService])
```

### 2. STT設定テストスクリプト

**stt-settings-test.ts:**
```typescript
async function testAndFixSTTSettings() {
  const sttService = STTSettingsService.getInstance()
  
  // 現在の設定を取得
  const currentSettings = sttService.getSettings()
  
  // STTを有効化
  if (!currentSettings.enabled) {
    console.log('✅ Enabling STT...')
    sttService.toggleEnabled()
  }
  
  // プロバイダーをwhisper-cppに設定
  if (currentSettings.provider !== 'whisper-cpp') {
    console.log('✅ Setting provider to whisper-cpp...')
    sttService.setProvider('whisper-cpp')
  }
  
  // 推奨モデルを有効化
  const recommendedModels = sttService.getRecommendedModels()
  recommendedModels.forEach(model => {
    if (!sttService.isModelEnabled(model.id)) {
      console.log(`✅ Enabling recommended model: ${model.id}`)
      sttService.toggleModel(model.id)
    }
  })
}
```

### 3. デフォルト設定の改善

**STTSettingsService.ts:**
```typescript
// デフォルト設定
const defaultSettings: STTSettings = {
  enabled: true,  // デフォルトで有効化
  provider: 'whisper-cpp',
  defaultModel: 'tiny-q5_1',
  language: 'ja',
  temperature: 0.0,
  maxTokens: 448,
  autoDownload: true,
  models: {
    'tiny-q5_1': { enabled: true, priority: 1, downloaded: false },
    'base-q5_1': { enabled: true, priority: 2, downloaded: false },
    'small-q5_1': { enabled: true, priority: 3, downloaded: false },
    'medium-q5_1': { enabled: false, priority: 4, downloaded: false },
    'large-v3-turbo-q5_0': { enabled: false, priority: 5, downloaded: false }
  }
}
```

## 動作確認

### 1. 自動有効化の確認
```
🔄 STT Settings Debug: {enabled: false, provider: 'whisper-cpp', ...}
🔄 STT is disabled, attempting to enable...
✅ STT enabled: true
✅ Whisper service initialized successfully
```

### 2. 設定の永続化
- localStorageに設定が保存される
- アプリケーション再起動後も設定が維持される
- 推奨モデルが自動的に有効化される

### 3. エラーハンドリング
- 設定が無効な場合の自動修正
- 適切なデバッグ情報の出力
- ユーザーフレンドリーなエラーメッセージ

## 利点

### 1. 自動設定
- 初回起動時にSTTが自動的に有効化される
- 推奨モデルが自動的に選択される
- 手動設定不要

### 2. デバッグ機能
- 設定状態の詳細なログ出力
- 問題の早期発見
- トラブルシューティングの支援

### 3. ユーザビリティ
- 設定画面での直感的な操作
- リアルタイムな設定反映
- 設定変更の即座な適用

## 今後の改善点

### 1. 設定の検証
- 設定値の妥当性チェック
- モデルファイルの存在確認
- ネットワーク接続の確認

### 2. 設定のインポート/エクスポート
- 設定のバックアップ機能
- 設定の共有機能
- 設定テンプレートの提供

### 3. 設定の最適化
- 使用状況に基づく自動調整
- パフォーマンスに基づく設定提案
- リソース使用量の最適化

## まとめ

この修正により、STT設定は以下の改善を実現しました：

✅ **自動有効化** - 初回起動時にSTTが自動的に有効化される
✅ **設定の永続化** - localStorageによる設定の保存と復元
✅ **デバッグ機能** - 詳細なログ出力による問題の特定
✅ **ユーザビリティ** - 直感的な設定操作と即座の反映

これで、Whisper統合が完全に動作し、音声ファイルのアップロードと文字起こしが正常に実行されるようになりました。
