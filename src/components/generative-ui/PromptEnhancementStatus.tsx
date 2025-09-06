import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Sparkles, 
  Brain, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Settings,
  Lightbulb,
  Palette,
  Languages
} from 'lucide-react'

interface PromptEnhancementStatusProps {
  isEnabled: boolean
  isAvailable: boolean
  modelName?: string
  features: {
    qualityEvaluation: boolean
    styleTransfer: boolean
    multiLanguage: boolean
  }
  onToggle: (enabled: boolean) => void
  onConfigure?: () => void
}

export function PromptEnhancementStatus({
  isEnabled,
  isAvailable,
  modelName,
  features,
  onToggle,
  onConfigure
}: PromptEnhancementStatusProps) {
  const getStatusIcon = () => {
    if (!isAvailable) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    if (isEnabled) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <Settings className="h-4 w-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (!isAvailable) {
      return '利用不可'
    }
    if (isEnabled) {
      return '有効'
    }
    return '無効'
  }

  const getStatusColor = () => {
    if (!isAvailable) {
      return 'bg-red-100 text-red-800'
    }
    if (isEnabled) {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">プロンプト補完エージェント</CardTitle>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>
        <CardDescription>
          LangChainベースの高度なプロンプト補完機能
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">モデル:</span>
            <span className="ml-2">{modelName || '未設定'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">状態:</span>
            <span className="ml-2">{isAvailable ? '利用可能' : '利用不可'}</span>
          </div>
        </div>

        {/* 機能一覧 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">利用可能な機能:</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-blue-500" />
              <span className="text-sm">プロンプト解析</span>
              <Badge variant="outline" className="text-xs">
                {isAvailable ? '利用可能' : '利用不可'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">プロンプト強化</span>
              <Badge variant="outline" className="text-xs">
                {isAvailable ? '利用可能' : '利用不可'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">品質評価</span>
              <Badge variant="outline" className="text-xs">
                {features.qualityEvaluation ? '有効' : '無効'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4 text-purple-500" />
              <span className="text-sm">スタイル転送</span>
              <Badge variant="outline" className="text-xs">
                {features.styleTransfer ? '有効' : '無効'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Languages className="h-4 w-4 text-indigo-500" />
              <span className="text-sm">多言語対応</span>
              <Badge variant="outline" className="text-xs">
                {features.multiLanguage ? '有効' : '無効'}
              </Badge>
            </div>
          </div>
        </div>

        {/* 制御ボタン */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="prompt-enhancement"
              checked={isEnabled}
              onCheckedChange={onToggle}
              disabled={!isAvailable}
            />
            <Label htmlFor="prompt-enhancement" className="text-sm">
              プロンプト補完を有効にする
            </Label>
          </div>
          
          {onConfigure && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConfigure}
              disabled={!isAvailable}
            >
              <Settings className="h-4 w-4 mr-1" />
              設定
            </Button>
          )}
        </div>

        {/* 説明 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <Lightbulb className="h-3 w-3 inline mr-1" />
            不完全なプロンプト（例：「コアラのしてください。」）を自動的に補完し、
            高品質な画像生成を実現します。
          </p>
          <p>
            T2I-Copilotの概念を取り入れた三段構成（解析→強化→評価）により、
            より効果的なプロンプトを生成します。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
