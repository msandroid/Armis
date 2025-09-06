# Fact Checking Module

LangChainのfact-checkingモジュールを使用してLLMの生成のハルシネーションチェックを実装した機能です。

## 概要

このモジュールは、AIが生成したテキストの事実確認とハルシネーション検出を行うための包括的なソリューションを提供します。

## 機能

### 1. 基本的なファクトチェック
- LangChainの`createFactCheckChain`を使用
- 事実の正確性を検証
- 信頼度スコアの提供

### 2. 高度なファクトチェック
- ソース検証付きの詳細分析
- 不正確な情報の修正提案
- 信頼できるソースの引用

### 3. リアルタイムストリーミング
- リアルタイムでのファクトチェック
- 長文書の段階的分析
- 即座のフィードバック

### 4. ハルシネーション検出
- AI生成コンテンツの専用検出
- 矛盾する情報の特定
- 検証不可能な主張の検出

### 5. 一括処理
- 複数テキストの同時検証
- 効率的なバッチ処理

## インストール

必要な依存関係は既に`package.json`に含まれています：

```json
{
  "@langchain/core": "^0.3.72",
  "@langchain/openai": "^0.6.9",
  "@langchain/anthropic": "^0.3.26",
  "@langchain/google-genai": "^0.2.16",
  "langchain": "^0.3.31"
}
```

## 使用方法

### 基本的な使用例

```typescript
import { FactCheckingService } from './src/services/llm/fact-checking-service';

// サービスの初期化
const factChecker = new FactCheckingService({
  model: 'openai',
  temperature: 0.1,
  includeSources: true
});

// 基本的なファクトチェック
const result = await factChecker.checkFacts(
  "The Earth orbits around the Sun. The capital of Japan is Tokyo."
);

console.log(`Factual: ${result.isFactual}`);
console.log(`Confidence: ${result.confidence}%`);
console.log(`Issues: ${result.issues.join(', ')}`);
```

### ハルシネーション検出

```typescript
const hallucinationResult = await factChecker.detectHallucinations(
  "In 2024, scientists discovered flying elephants in the Amazon rainforest."
);

console.log(`Has Hallucinations: ${hallucinationResult.hasHallucinations}`);
console.log(`Hallucination Score: ${hallucinationResult.hallucinationScore}%`);
```

### ストリーミングファクトチェック

```typescript
for await (const chunk of factChecker.checkFactsStream(text)) {
  if (chunk.explanation) {
    console.log(chunk.explanation);
  }
}
```

### 高度なファクトチェック

```typescript
const enhancedResult = await factChecker.checkFactsWithSources(text);
console.log(`Sources: ${enhancedResult.sources?.join(', ')}`);
console.log(`Corrected: ${enhancedResult.correctedText}`);
```

## Reactコンポーネント

### FactCheckComponent

基本的なファクトチェック機能を提供するコンポーネント：

```tsx
import { FactCheckComponent } from './src/components/FactCheckComponent';

<FactCheckComponent
  initialText="Your text here"
  onResult={(result) => console.log(result)}
/>
```

### FactCheckPage

完全なファクトチェックページ：

```tsx
import { FactCheckPage } from './src/components/FactCheckPage';

<FactCheckPage />
```

## API リファレンス

### FactCheckingService

#### コンストラクタ

```typescript
new FactCheckingService(options: FactCheckOptions)
```

#### オプション

```typescript
interface FactCheckOptions {
  model?: "openai" | "anthropic" | "google";
  temperature?: number;
  maxTokens?: number;
  includeSources?: boolean;
  strictMode?: boolean;
}
```

#### メソッド

##### checkFacts(text: string): Promise<FactCheckResult>
基本的なファクトチェックを実行します。

##### checkFactsWithSources(text: string): Promise<FactCheckResult>
ソース検証付きの高度なファクトチェックを実行します。

##### checkFactsStream(text: string): AsyncGenerator<Partial<FactCheckResult>>
ストリーミングファクトチェックを実行します。

##### detectHallucinations(text: string): Promise<HallucinationResult>
ハルシネーション検出を実行します。

##### batchCheckFacts(texts: string[]): Promise<FactCheckResult[]>
複数テキストの一括ファクトチェックを実行します。

### FactCheckResult

```typescript
interface FactCheckResult {
  isFactual: boolean;
  confidence: number;
  issues: string[];
  correctedText?: string;
  sources?: string[];
  explanation: string;
}
```

## 実行例

### コマンドラインでの実行

```bash
# 基本的な例の実行
npm run fact-check:example

# テストの実行
npm run fact-check:test
```

### プログラムでの実行

```typescript
import { runFactCheckingExamples, compareModels } from './src/examples/fact-checking-example';

// 例の実行
await runFactCheckingExamples();

// モデル比較
await compareModels();
```

## 設定

### 環境変数

以下の環境変数を設定してください：

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google
GOOGLE_API_KEY=your_google_api_key
```

### モデル設定

各モデルの推奨設定：

- **OpenAI GPT-4**: 高精度、高コスト
- **Anthropic Claude**: バランス型、中コスト
- **Google Gemini**: 高速、低コスト

## ベストプラクティス

### 1. テキストの準備
- 具体的な事実主張を含める
- 文脈を提供する
- 意見と事実を区別する

### 2. モデルの選択
- 用途に応じて適切なモデルを選択
- コストと精度のバランスを考慮
- 複数モデルでの比較検証

### 3. 結果の解釈
- 信頼度スコアを参考にする
- 指摘された問題を確認する
- 提供されたソースを検証する

### 4. 継続的な改善
- 結果の履歴を保存する
- 定期的にモデルの性能を評価する
- 新しい検証手法を試す

## トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - 環境変数が正しく設定されているか確認
   - APIキーの有効性を確認

2. **タイムアウトエラー**
   - テキストの長さを調整
   - モデルの設定を変更

3. **不正確な結果**
   - より具体的なテキストを使用
   - 異なるモデルで比較
   - 設定を調整

### デバッグ

```typescript
// デバッグモードでの実行
const factChecker = new FactCheckingService({
  model: 'openai',
  temperature: 0.1,
  verbose: true // デバッグ情報を表示
});
```

## 貢献

このモジュールの改善に貢献したい場合は：

1. 新しい検証手法の提案
2. バグレポートの提出
3. ドキュメントの改善
4. テストケースの追加

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
