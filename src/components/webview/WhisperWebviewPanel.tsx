import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { useDropzone } from 'react-dropzone'
import { Mic, FileAudio, Settings, Play, Square, Upload, Download } from 'lucide-react'

interface TranscriptionResult {
  text: string
  language: string
  confidence: number
  duration: number
  segments?: any[]
  error?: string
}

interface WhisperWebviewPanelProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void
}

export function WhisperWebviewPanel({ onTranscriptionComplete }: WhisperWebviewPanelProps) {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<TranscriptionResult[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [selectedModel, setSelectedModel] = useState('ggml-tiny.bin')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isRealtimeActive, setIsRealtimeActive] = useState(false)
  const [watchDirectory, setWatchDirectory] = useState('')

  // ファイルドロップゾーンの設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac']
    },
    onDrop: handleFileDrop
  })

  // 初期化時に利用可能なモデルを取得
  useEffect(() => {
    loadAvailableModels()
  }, [])

  /**
   * 利用可能なモデルを読み込み
   */
  async function loadAvailableModels() {
    try {
      // VSCodium拡張のコマンドを呼び出し
      const models = await window.vscode?.postMessage({
        command: 'getAvailableModels'
      })
      
      if (models && Array.isArray(models)) {
        setAvailableModels(models)
      }
    } catch (error) {
      console.error('Failed to load available models:', error)
    }
  }

  /**
   * ファイルドロップ時の処理
   */
  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return

    setIsTranscribing(true)
    setProgress(0)

    try {
      const results: TranscriptionResult[] = []

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        
        // 進捗を更新
        setProgress((i / acceptedFiles.length) * 100)

        // ファイルを一時的にアップロード
        const filePath = await uploadFile(file)
        
        // VSCodium拡張のコマンドを呼び出して音声認識を実行
        const result = await window.vscode?.postMessage({
          command: 'transcribeAudio',
          filePath,
          options: {
            language: selectedLanguage
          }
        })

        if (result) {
          results.push(result)
        }
      }

      setResults(prev => [...prev, ...results])
      setProgress(100)

      // 完了コールバックを呼び出し
      if (onTranscriptionComplete && results.length > 0) {
        onTranscriptionComplete(results[0])
      }

    } catch (error) {
      console.error('Transcription failed:', error)
      setResults(prev => [...prev, {
        text: '',
        language: selectedLanguage,
        confidence: 0,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }])
    } finally {
      setIsTranscribing(false)
      setProgress(0)
    }
  }

  /**
   * ファイルをアップロード
   */
  async function uploadFile(file: File): Promise<string> {
    // 実際の実装では、ファイルをExtension Hostに送信
    // ここでは簡略化のため、ファイル名を返す
    return file.name
  }

  /**
   * リアルタイム音声認識を開始
   */
  async function startRealtimeTranscription() {
    if (!watchDirectory) {
      alert('Please enter a watch directory')
      return
    }

    try {
      setIsRealtimeActive(true)
      
      await window.vscode?.postMessage({
        command: 'startRealtimeTranscription',
        watchDirectory
      })

    } catch (error) {
      console.error('Failed to start real-time transcription:', error)
      setIsRealtimeActive(false)
    }
  }

  /**
   * リアルタイム音声認識を停止
   */
  async function stopRealtimeTranscription() {
    try {
      setIsRealtimeActive(false)
      
      await window.vscode?.postMessage({
        command: 'stopRealtimeTranscription'
      })

    } catch (error) {
      console.error('Failed to stop real-time transcription:', error)
    }
  }

  /**
   * Whisper設定を更新
   */
  async function updateWhisperConfig() {
    try {
      await window.vscode?.postMessage({
        command: 'updateWhisperConfig',
        config: {
          language: selectedLanguage,
          modelPath: selectedModel
        }
      })

    } catch (error) {
      console.error('Failed to update Whisper config:', error)
    }
  }

  /**
   * 結果をエクスポート
   */
  function exportResults() {
    const content = results.map((result, index) => 
      `Result ${index + 1}:
Language: ${result.language}
Confidence: ${result.confidence}
Duration: ${result.duration}ms
Text: ${result.text}
${result.error ? `Error: ${result.error}` : ''}
`
    ).join('\n---\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcription-results.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 結果をクリア
   */
  function clearResults() {
    setResults([])
  }

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Whisper Audio Transcription</h1>
          <p className="text-muted-foreground">
            Transcribe audio files using whisper.cpp in VSCodium
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isRealtimeActive ? "default" : "secondary"}>
            {isRealtimeActive ? "Real-time Active" : "Ready"}
          </Badge>
        </div>
      </div>

      {/* 設定パネル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </CardTitle>
          <CardDescription>
            Configure Whisper transcription settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={updateWhisperConfig} variant="outline">
            Update Configuration
          </Button>
        </CardContent>
      </Card>

      {/* ファイルアップロード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Audio Files</span>
          </CardTitle>
          <CardDescription>
            Drag and drop audio files or click to select
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
          >
            <input {...getInputProps()} />
            <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">Drop the audio files here...</p>
            ) : (
              <div>
                <p className="text-muted-foreground mb-2">
                  Drag & drop audio files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports: WAV, MP3, FLAC, OGG, M4A, AAC
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* リアルタイム音声認識 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Real-time Transcription</span>
          </CardTitle>
          <CardDescription>
            Monitor a directory for new audio files and transcribe them automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="watchDirectory">Watch Directory</Label>
            <Input
              id="watchDirectory"
              placeholder="/path/to/audio/files"
              value={watchDirectory}
              onChange={(e) => setWatchDirectory(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={startRealtimeTranscription}
              disabled={isRealtimeActive || !watchDirectory}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Monitoring</span>
            </Button>
            <Button
              onClick={stopRealtimeTranscription}
              disabled={!isRealtimeActive}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Square className="h-4 w-4" />
              <span>Stop Monitoring</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 進捗表示 */}
      {isTranscribing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Transcribing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 結果表示 */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transcription Results</CardTitle>
              <div className="flex space-x-2">
                <Button onClick={exportResults} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={clearResults} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={result.error ? "destructive" : "default"}>
                      {result.error ? "Error" : "Success"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Language: {result.language}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {result.confidence.toFixed(2)}
                    </span>
                  </div>
                </div>
                {result.error ? (
                  <p className="text-destructive">{result.error}</p>
                ) : (
                  <Textarea
                    value={result.text}
                    readOnly
                    className="min-h-[100px]"
                    placeholder="Transcription text will appear here..."
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// VSCodium拡張のメッセージング用の型定義
declare global {
  interface Window {
    vscode?: {
      postMessage: (message: any) => Promise<any>
    }
  }
}
