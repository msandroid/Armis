"use client"

import React, { useState } from "react"
import { Play, Download, RefreshCw, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { processChatTTSInstruction, TTSGenerationResult, ChatMessage } from "@/lib/chat-tts-processor"
import { AudioGenerationResult, AudioGenerationLoading } from "@/components/audio-generation-result"

const SAMPLE_CONTENT = "Armisは文書や画像、音声、動画、記事やブログを材料に\"言葉で指示して\"メディアを編集できるアプリケーションです。"

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: SAMPLE_CONTENT,
    createdAt: new Date()
  }
]

const SAMPLE_INSTRUCTIONS = [
  "上記の文章を音声にしてください",
  "前の内容を音声化してください", 
  "この文章を読み上げてください",
  "音声で再生してください",
  "mp3を生成してください"
]

interface TTSDemoPanelProps {
  className?: string
}

export function TTSDemoPanel({ className = '' }: TTSDemoPanelProps) {
  const [selectedInstruction, setSelectedInstruction] = useState(SAMPLE_INSTRUCTIONS[0])
  const [customInstruction, setCustomInstruction] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<TTSGenerationResult | null>(null)

  const handleTestInstruction = async (instruction: string) => {
    try {
      setIsGenerating(true)
      setResult(null)
      
      console.log('Testing TTS instruction:', instruction)
      console.log('With sample messages:', SAMPLE_MESSAGES)
      
      const generationResult = await processChatTTSInstruction(
        instruction,
        SAMPLE_MESSAGES
      )
      
      console.log('TTS generation result:', generationResult)
      setResult(generationResult)
      
    } catch (error) {
      console.error('TTS test failed:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'テストに失敗しました'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setCustomInstruction("")
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>チャットTTS機能テスト</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* サンプルコンテンツ表示 */}
          <div>
            <h4 className="text-sm font-medium mb-2">サンプルコンテンツ（前のメッセージ）</h4>
            <div className="p-3 bg-muted rounded-lg text-sm">
              {SAMPLE_CONTENT}
            </div>
          </div>

          {/* 指示文選択 */}
          <div>
            <h4 className="text-sm font-medium mb-2">音声生成指示をテスト</h4>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_INSTRUCTIONS.map((instruction, index) => (
                <Button
                  key={index}
                  variant={selectedInstruction === instruction ? "default" : "outline"}
                  className="justify-start text-left h-auto p-3"
                  onClick={() => {
                    setSelectedInstruction(instruction)
                    handleTestInstruction(instruction)
                  }}
                  disabled={isGenerating}
                >
                  <span className="text-sm">{instruction}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* カスタム指示入力 */}
          <div>
            <h4 className="text-sm font-medium mb-2">カスタム指示</h4>
            <div className="flex space-x-2">
              <Textarea
                placeholder="独自の音声生成指示を入力してください..."
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="flex-1 min-h-[60px]"
                disabled={isGenerating}
              />
              <Button
                onClick={() => handleTestInstruction(customInstruction)}
                disabled={!customInstruction.trim() || isGenerating}
                className="self-end"
              >
                <Play className="h-4 w-4 mr-1" />
                テスト
              </Button>
            </div>
          </div>

          {/* リセットボタン */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              リセット
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 生成中表示 */}
      {isGenerating && (
        <AudioGenerationLoading text="指示文を解析して音声を生成中..." />
      )}

      {/* 結果表示 */}
      {result && (
        <AudioGenerationResult 
          result={result}
          onPlay={() => console.log('Demo audio started playing')}
          onPause={() => console.log('Demo audio paused')}
        />
      )}

      {/* 使用方法説明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">使用方法</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            <Badge variant="secondary" className="text-xs mr-1">1</Badge>
            上記のサンプル指示をクリックするか、カスタム指示を入力
          </p>
          <p>
            <Badge variant="secondary" className="text-xs mr-1">2</Badge>
            システムが指示を解析し、前のメッセージ内容を音声化
          </p>
          <p>
            <Badge variant="secondary" className="text-xs mr-1">3</Badge>
            生成されたmp3音声を再生またはダウンロード
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
