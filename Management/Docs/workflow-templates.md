# Armis ワークフロー & スクリプト管理 テンプレート

## 📋 概要

フェーズ5で実装された機能：
- **mulmocast-cli統合**: マルチモーダルスクリプト実行
- **graphaiタスク可視化**: タスク依存関係の可視化
- **cocoindexコードベース検索**: RAG対応検索
- **ワークフローJSONテンプレート**: 再利用可能なテンプレート

## 🎬 動画制作ワークフロー

### 1. 基本的な動画生成ワークフロー

```json
{
  "id": "basic-video-generation",
  "name": "Basic Video Generation",
  "description": "テキストから動画を生成する基本的なワークフロー",
  "version": "1.0.0",
  "author": "Armis",
  "createdAt": "2024-12-01T00:00:00Z",
  "updatedAt": "2024-12-01T00:00:00Z",
  "steps": [
    {
      "id": "step1",
      "name": "Text Analysis",
      "type": "text",
      "description": "入力テキストを分析して動画生成に適したプロンプトを作成",
      "parameters": {
        "model": "gpt-4",
        "prompt": "以下のテキストを動画生成用のプロンプトに変換してください: {{input.text}}",
        "maxTokens": 500
      },
      "dependencies": [],
      "outputs": ["enhancedPrompt"]
    },
    {
      "id": "step2",
      "name": "Video Generation",
      "type": "video",
      "description": "プロンプトから動画を生成",
      "parameters": {
        "model": "arc-hunyuan-video-7b",
        "prompt": "{{step1.enhancedPrompt}}",
        "duration": 5,
        "width": 512,
        "height": 512
      },
      "dependencies": ["step1"],
      "outputs": ["videoUrl"]
    },
    {
      "id": "step3",
      "name": "Audio Synthesis",
      "type": "audio",
      "description": "テキストから音声を生成",
      "parameters": {
        "model": "coqui-tts",
        "text": "{{input.text}}",
        "voice": "en-us-1"
      },
      "dependencies": [],
      "outputs": ["audioUrl"]
    },
    {
      "id": "step4",
      "name": "Video-Audio Merge",
      "type": "video",
      "description": "動画と音声を合成",
      "parameters": {
        "videoUrl": "{{step2.videoUrl}}",
        "audioUrl": "{{step3.audioUrl}}",
        "outputFormat": "mp4"
      },
      "dependencies": ["step2", "step3"],
      "outputs": ["finalVideoUrl"]
    }
  ],
  "metadata": {
    "tags": ["video", "generation", "basic"],
    "category": "video-generation",
    "difficulty": "beginner",
    "estimatedTime": 300,
    "requirements": ["video-generation-model", "tts-model"]
  }
}
```

### 2. 高度な動画編集ワークフロー

```json
{
  "id": "advanced-video-editing",
  "name": "Advanced Video Editing",
  "description": "複数の動画を結合し、エフェクトを追加する高度なワークフロー",
  "version": "1.0.0",
  "author": "Armis",
  "createdAt": "2024-12-01T00:00:00Z",
  "updatedAt": "2024-12-01T00:00:00Z",
  "steps": [
    {
      "id": "step1",
      "name": "Video Analysis",
      "type": "video",
      "description": "入力動画を分析してメタデータを抽出",
      "parameters": {
        "model": "llava-video-7b-qwen2",
        "videoUrl": "{{input.videoUrl}}",
        "analysisType": "scene-detection"
      },
      "dependencies": [],
      "outputs": ["sceneData", "videoMetadata"]
    },
    {
      "id": "step2",
      "name": "Scene Segmentation",
      "type": "video",
      "description": "動画をシーンごとに分割",
      "parameters": {
        "videoUrl": "{{input.videoUrl}}",
        "sceneData": "{{step1.sceneData}}",
        "minSceneDuration": 2
      },
      "dependencies": ["step1"],
      "outputs": ["sceneUrls"]
    },
    {
      "id": "step3",
      "name": "Effect Application",
      "type": "video",
      "description": "各シーンにエフェクトを適用",
      "parameters": {
        "sceneUrls": "{{step2.sceneUrls}}",
        "effects": ["{{input.effects}}"],
        "intensity": 0.5
      },
      "dependencies": ["step2"],
      "outputs": ["processedSceneUrls"]
    },
    {
      "id": "step4",
      "name": "Video Composition",
      "type": "video",
      "description": "処理済みシーンを結合",
      "parameters": {
        "sceneUrls": "{{step3.processedSceneUrls}}",
        "transitions": ["fade", "dissolve"],
        "outputFormat": "mp4"
      },
      "dependencies": ["step3"],
      "outputs": ["finalVideoUrl"]
    }
  ],
  "metadata": {
    "tags": ["video", "editing", "advanced"],
    "category": "video-editing",
    "difficulty": "advanced",
    "estimatedTime": 600,
    "requirements": ["video-analysis-model", "video-processing"]
  }
}
```

## 🎵 音声制作ワークフロー

### 3. 音声合成ワークフロー

```json
{
  "id": "audio-synthesis-workflow",
  "name": "Audio Synthesis Workflow",
  "description": "テキストから自然な音声を生成するワークフロー",
  "version": "1.0.0",
  "author": "Armis",
  "createdAt": "2024-12-01T00:00:00Z",
  "updatedAt": "2024-12-01T00:00:00Z",
  "steps": [
    {
      "id": "step1",
      "name": "Text Preprocessing",
      "type": "text",
      "description": "テキストを音声合成用に前処理",
      "parameters": {
        "model": "gpt-4",
        "prompt": "以下のテキストを音声合成に適した形式に変換してください: {{input.text}}",
        "maxTokens": 200
      },
      "dependencies": [],
      "outputs": ["processedText"]
    },
    {
      "id": "step2",
      "name": "Voice Selection",
      "type": "api",
      "description": "適切な音声を選択",
      "parameters": {
        "text": "{{step1.processedText}}",
        "language": "{{input.language}}",
        "gender": "{{input.gender}}",
        "age": "{{input.age}}"
      },
      "dependencies": ["step1"],
      "outputs": ["selectedVoice"]
    },
    {
      "id": "step3",
      "name": "Audio Synthesis",
      "type": "audio",
      "description": "テキストから音声を生成",
      "parameters": {
        "model": "style-bert-vits2",
        "text": "{{step1.processedText}}",
        "voice": "{{step2.selectedVoice}}",
        "emotion": "{{input.emotion}}"
      },
      "dependencies": ["step1", "step2"],
      "outputs": ["audioUrl"]
    },
    {
      "id": "step4",
      "name": "Audio Post-processing",
      "type": "audio",
      "description": "音声の後処理（ノイズ除去、音量調整など）",
      "parameters": {
        "audioUrl": "{{step3.audioUrl}}",
        "noiseReduction": true,
        "volumeNormalization": true,
        "outputFormat": "wav"
      },
      "dependencies": ["step3"],
      "outputs": ["finalAudioUrl"]
    }
  ],
  "metadata": {
    "tags": ["audio", "synthesis", "tts"],
    "category": "audio-synthesis",
    "difficulty": "intermediate",
    "estimatedTime": 120,
    "requirements": ["tts-model", "audio-processing"]
  }
}
```

## 🖼️ 画像生成ワークフロー

### 4. 画像生成・編集ワークフロー

```json
{
  "id": "image-generation-workflow",
  "name": "Image Generation Workflow",
  "description": "テキストから画像を生成し、編集するワークフロー",
  "version": "1.0.0",
  "author": "Armis",
  "createdAt": "2024-12-01T00:00:00Z",
  "updatedAt": "2024-12-01T00:00:00Z",
  "steps": [
    {
      "id": "step1",
      "name": "Prompt Enhancement",
      "type": "text",
      "description": "プロンプトを画像生成用に最適化",
      "parameters": {
        "model": "gpt-4",
        "prompt": "以下のテキストを画像生成用のプロンプトに変換してください: {{input.text}}",
        "style": "{{input.style}}",
        "maxTokens": 300
      },
      "dependencies": [],
      "outputs": ["enhancedPrompt"]
    },
    {
      "id": "step2",
      "name": "Image Generation",
      "type": "image",
      "description": "プロンプトから画像を生成",
      "parameters": {
        "model": "comfyui",
        "prompt": "{{step1.enhancedPrompt}}",
        "width": 1024,
        "height": 1024,
        "steps": 50,
        "cfg": 7.5
      },
      "dependencies": ["step1"],
      "outputs": ["generatedImageUrl"]
    },
    {
      "id": "step3",
      "name": "Image Analysis",
      "type": "image",
      "description": "生成された画像を分析",
      "parameters": {
        "model": "yolo-v8",
        "imageUrl": "{{step2.generatedImageUrl}}",
        "analysisType": "object-detection"
      },
      "dependencies": ["step2"],
      "outputs": ["detectedObjects"]
    },
    {
      "id": "step4",
      "name": "Image Enhancement",
      "type": "image",
      "description": "画像を自動的に改善",
      "parameters": {
        "imageUrl": "{{step2.generatedImageUrl}}",
        "enhancements": ["upscale", "denoise", "color-correction"],
        "outputFormat": "png"
      },
      "dependencies": ["step2"],
      "outputs": ["finalImageUrl"]
    }
  ],
  "metadata": {
    "tags": ["image", "generation", "editing"],
    "category": "image-generation",
    "difficulty": "intermediate",
    "estimatedTime": 180,
    "requirements": ["image-generation-model", "image-analysis"]
  }
}
```

## 🔍 コードベース検索ワークフロー

### 5. コードベース検索・分析ワークフロー

```json
{
  "id": "codebase-search-workflow",
  "name": "Codebase Search Workflow",
  "description": "コードベースを検索・分析するワークフロー",
  "version": "1.0.0",
  "author": "Armis",
  "createdAt": "2024-12-01T00:00:00Z",
  "updatedAt": "2024-12-01T00:00:00Z",
  "steps": [
    {
      "id": "step1",
      "name": "Codebase Indexing",
      "type": "api",
      "description": "コードベースをインデックス化",
      "parameters": {
        "path": "{{input.codebasePath}}",
        "languages": ["typescript", "javascript", "python", "java"],
        "includePatterns": ["**/*.{ts,js,py,java}"],
        "excludePatterns": ["**/node_modules/**", "**/dist/**"]
      },
      "dependencies": [],
      "outputs": ["indexId"]
    },
    {
      "id": "step2",
      "name": "Semantic Search",
      "type": "api",
      "description": "セマンティック検索を実行",
      "parameters": {
        "indexId": "{{step1.indexId}}",
        "query": "{{input.searchQuery}}",
        "maxResults": 20,
        "useRAG": true,
        "contextWindow": 1000
      },
      "dependencies": ["step1"],
      "outputs": ["searchResults"]
    },
    {
      "id": "step3",
      "name": "Code Analysis",
      "type": "api",
      "description": "検索結果を分析",
      "parameters": {
        "results": "{{step2.searchResults}}",
        "analysisType": "complexity",
        "includeMetrics": ["cyclomatic-complexity", "lines-of-code", "dependencies"]
      },
      "dependencies": ["step2"],
      "outputs": ["analysisResults"]
    },
    {
      "id": "step4",
      "name": "Report Generation",
      "type": "text",
      "description": "分析結果をレポートとして生成",
      "parameters": {
        "model": "gpt-4",
        "prompt": "以下のコードベース分析結果をレポートとしてまとめてください: {{step3.analysisResults}}",
        "format": "markdown",
        "maxTokens": 1000
      },
      "dependencies": ["step3"],
      "outputs": ["reportContent"]
    }
  ],
  "metadata": {
    "tags": ["codebase", "search", "analysis"],
    "category": "code-analysis",
    "difficulty": "intermediate",
    "estimatedTime": 240,
    "requirements": ["code-indexing", "semantic-search"]
  }
}
```

## 🎯 使用方法

### 1. ワークフローの実行

```typescript
// mulmocast-cliを使用したワークフロー実行
const mulmocastService = new MulmocastService();

// ワークフローを作成
const scriptId = await mulmocastService.createScript({
  name: "My Custom Workflow",
  description: "カスタムワークフロー",
  version: "1.0.0",
  author: "User",
  steps: [
    // ステップ定義
  ],
  metadata: {
    tags: ["custom"],
    category: "custom",
    difficulty: "beginner",
    estimatedTime: 300,
    requirements: []
  }
});

// ワークフローを実行
const executionId = await mulmocastService.executeScript({
  scriptId,
  inputs: {
    text: "動画を生成してください",
    style: "realistic"
  },
  options: {
    parallel: false,
    timeout: 300000,
    debug: true,
    saveOutputs: true
  }
});
```

### 2. GraphAI可視化

```typescript
// graphaiを使用したタスク可視化
const graphaiService = new GraphaiVisualizationService();

// グラフを作成
const graphId = await graphaiService.createGraph({
  name: "Video Generation Graph",
  description: "動画生成のタスク依存関係",
  version: "1.0.0",
  nodes: [
    {
      id: "text-analysis",
      label: "Text Analysis",
      type: "task",
      position: { x: 100, y: 100 },
      data: {
        description: "テキスト分析",
        parameters: {},
        status: "pending",
        progress: 0,
        outputs: {},
        metadata: {
          estimatedTime: 30,
          priority: "high",
          tags: ["text"],
          dependencies: []
        }
      }
    }
    // 他のノード...
  ],
  edges: [
    {
      id: "edge1",
      source: "text-analysis",
      target: "video-generation",
      type: "data-flow",
      data: {
        dataMapping: {
          "enhancedPrompt": "prompt"
        },
        priority: 1,
        metadata: {
          description: "テキスト分析結果を動画生成に渡す",
          validation: []
        }
      }
    }
  ],
  metadata: {
    author: "User",
    tags: ["video", "generation"],
    category: "video-generation",
    difficulty: "intermediate",
    estimatedTime: 300,
    requirements: [],
    settings: {
      autoLayout: true,
      showProgress: true,
      showTiming: true,
      theme: "dark"
    }
  }
});
```

### 3. CocoIndex検索

```typescript
// cocoindexを使用したコードベース検索
const cocoindexService = new CocoindexService();

// インデックスを作成
const indexId = await cocoindexService.createIndex({
  name: "My Project Index",
  path: "/path/to/project",
  description: "プロジェクトのコードベースインデックス",
  languages: ["typescript", "javascript"],
  settings: {
    includePatterns: ["**/*.{ts,js}"],
    excludePatterns: ["**/node_modules/**"],
    maxFileSize: 1024 * 1024,
    embeddingModel: "text-embedding-ada-002"
  }
});

// 検索を実行
const results = await cocoindexService.search({
  query: "React component with hooks",
  filters: {
    language: ["typescript"],
    tags: ["react", "hooks"]
  },
  options: {
    maxResults: 10,
    includeContent: true,
    includeMetadata: true,
    sortBy: "relevance",
    sortOrder: "desc",
    useRAG: true,
    contextWindow: 1000
  }
});
```

## 📊 パフォーマンス最適化

### 1. 並列実行

```json
{
  "options": {
    "parallel": true,
    "maxConcurrent": 4,
    "timeout": 300000
  }
}
```

### 2. キャッシュ設定

```json
{
  "caching": {
    "enableCache": true,
    "cacheExpiry": 3600,
    "cacheKey": "{{input.hash}}"
  }
}
```

### 3. エラーハンドリング

```json
{
  "errorHandling": {
    "retry": true,
    "maxRetries": 3,
    "retryDelay": 1000,
    "fallback": "alternative-step"
  }
}
```

## 🔧 カスタマイズ

### 1. カスタムステップタイプ

```typescript
interface ICustomStep extends IMulmocastStep {
  type: 'custom';
  customHandler: string;
  customParameters: Record<string, any>;
}
```

### 2. プラグイン統合

```typescript
interface IWorkflowPlugin {
  name: string;
  version: string;
  steps: IMulmocastStep[];
  dependencies: string[];
  install(): Promise<void>;
  uninstall(): Promise<void>;
}
```

---

これらのテンプレートを使用して、Armisで効率的なワークフローを作成・実行できます。各ワークフローは再利用可能で、カスタマイズも簡単に行えます。
