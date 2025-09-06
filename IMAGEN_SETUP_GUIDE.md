# 画像生成機能（Imagen API）設定ガイド

## 概要

このアプリケーションでは、GoogleのImagen APIを使用して画像生成機能を提供しています。この機能を使用するには、Google Cloud Platformでの設定が必要です。

**重要**: Vertex AI Imagen APIは、APIキーではなくOAuth2認証を要求します。以下の手順に従って適切な認証を設定してください。

**Electronアプリケーションについて**: このアプリケーションはElectronを使用しているため、ブラウザ環境での制限を回避し、Node.js環境で画像生成APIを実行できます。

## 設定手順

### 1. Google Cloud Projectの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択
3. プロジェクトIDをメモしておく（例: `my-ai-project-123456`）

### 2. Vertex AI APIの有効化

1. Google Cloud Consoleで「APIとサービス」→「ライブラリ」を開く
2. 「Vertex AI API」を検索して有効化
3. 「Imagen API」も検索して有効化

### 3. 認証方法の選択

Vertex AI Imagen APIは以下の認証方法をサポートしています：

#### 方法A: サービスアカウント認証情報（推奨）

1. **サービスアカウントの作成**:
   - Google Cloud Consoleで「IAM & Admin」→「サービスアカウント」を開く
   - 「サービスアカウントを作成」をクリック
   - 名前を入力（例: `imagen-api-service`）
   - 「作成して続行」をクリック

2. **権限の付与**:
   - 「役割を選択」で「Vertex AI User」を選択
   - 「完了」をクリック

3. **認証情報のダウンロード**:
   - 作成したサービスアカウントをクリック
   - 「キー」タブを開く
   - 「鍵を追加」→「新しい鍵を作成」→「JSON」を選択
   - ダウンロードされたJSONファイルを安全な場所に保存

4. **環境変数の設定**:
   ```bash
   # サービスアカウント認証情報ファイルのパス
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
   ```

#### 方法B: Application Default Credentials (ADC)

1. **Google Cloud CLIのインストール**:
   - [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)をインストール

2. **認証の設定**:
   ```bash
   gcloud auth application-default login
   ```

3. **プロジェクトの設定**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

### 4. 環境変数の設定

プロジェクトのルートディレクトリに`.env`ファイルを作成し、以下を追加：

```bash
# Google AI API Key for Gemini File Upload (テキスト生成用)
VITE_GOOGLE_API_KEY=your_google_api_key_here

# Google Cloud Project ID for Vertex AI Image Generation
VITE_GOOGLE_PROJECT_ID=my-ai-project-123456

# Google Cloud Location for Vertex AI (default: us-central1)
VITE_GOOGLE_LOCATION=us-central1

# サービスアカウント認証情報ファイルのパス（方法Aを使用する場合）
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

### 5. アプリケーションの再起動

環境変数を設定した後、アプリケーションを再起動してください：

```bash
npm run dev
```

## 使用方法

### 1. 設定確認

1. アプリケーションの右下にある「画像生成テスト」を開く
2. 「設定確認」ボタンをクリック
3. ✅ 設定完了が表示されることを確認

### 2. 画像生成テスト

1. プロンプト欄に生成したい画像の説明を入力（例: 美しい夕日の風景）
2. 「画像を生成」ボタンをクリック
3. 生成された画像が表示されることを確認

### 3. チャット機能での使用

チャット画面で以下のようなメッセージを送信すると、画像生成が実行されます：

- 「美しい夕日を画像で生成」
- 「create image of a beautiful sunset」
- 「generate image of a cat」

## アーキテクチャの説明

### Electron環境での動作

このアプリケーションはElectronを使用しており、以下のような構成になっています：

1. **レンダラープロセス（ブラウザ環境）**: UIの表示とユーザーインタラクション
2. **メインプロセス（Node.js環境）**: Vertex AI Imagen APIの呼び出し

### 画像生成の流れ

1. ユーザーが画像生成を要求
2. レンダラープロセスからメインプロセスにIPC通信でリクエスト送信
3. メインプロセスでGoogle Cloud認証を実行
4. Vertex AI Imagen APIを呼び出し
5. 生成された画像をレンダラープロセスに返送
6. UIに画像を表示

この構成により、ブラウザ環境での制限を回避し、安全にGoogle Cloud認証を使用できます。

## トラブルシューティング

### よくある問題と解決方法

1. **401エラー: API keys are not supported**
   - **原因**: APIキーを使用しているが、Vertex AIはOAuth2認証を要求
   - **解決**: サービスアカウント認証情報またはADCを使用

2. **認証エラー**
   - **原因**: 認証情報が正しく設定されていない
   - **解決**: 
     - サービスアカウントJSONファイルのパスを確認
     - `gcloud auth application-default login`を実行
     - プロジェクトIDが正しいことを確認

3. **権限エラー**
   - **原因**: サービスアカウントに適切な権限がない
   - **解決**: 「Vertex AI User」役割を付与

4. **Project IDが間違っている**
   - **原因**: 環境変数のProject IDが間違っている
   - **解決**: Google Cloud Consoleで正しいProject IDを確認

5. **APIが有効化されていない**
   - **原因**: Vertex AI APIとImagen APIが有効化されていない
   - **解決**: Google Cloud ConsoleでAPIを有効化

6. **地域制限**
   - **原因**: 一部の地域ではImagen APIが利用できない
   - **解決**: `VITE_GOOGLE_LOCATION`を`us-central1`に設定

7. **Electron環境での問題**
   - **原因**: メインプロセスでの認証情報が正しく設定されていない
   - **解決**: 
     - アプリケーションを完全に再起動
     - 環境変数が正しく読み込まれているか確認
     - 開発者ツールでエラーメッセージを確認

### エラーメッセージの確認

ブラウザの開発者ツール（F12）のコンソールタブで詳細なエラーメッセージを確認できます。

## セキュリティに関する注意事項

- **サービスアカウントキー**: JSONファイルは秘密情報です。公開リポジトリにコミットしないでください
- **環境変数**: `.env`ファイルは`.gitignore`に追加してください
- **権限**: 必要最小限の権限のみを付与してください
- **課金**: Imagen APIの使用には料金が発生します。使用量を確認してください

## サポート

問題が解決しない場合は、以下を確認してください：

1. [Google Cloud Console](https://console.cloud.google.com/)でAPIの状態
2. [Google Cloud認証ドキュメント](https://cloud.google.com/docs/authentication)
3. [Vertex AI認証ドキュメント](https://cloud.google.com/vertex-ai/docs/authentication)
