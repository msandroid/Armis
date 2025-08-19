"use client"

import { useState, useEffect } from "react"
import { 
  Package, 
  Download, 
  Trash2, 
  Settings, 
  Search,
  Star,
  Shield,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { extensionManager, ExtensionManifest } from "@/lib/extensions/extension-manager"

interface ExtensionManagerPanelProps {
  className?: string
}

interface ExtensionInfo extends ExtensionManifest {
  isInstalled: boolean
  isActive: boolean
  downloadCount?: number
  rating?: number
  lastUpdated?: Date
}

export function ExtensionManagerPanel({ className }: ExtensionManagerPanelProps) {
  const [installedExtensions, setInstalledExtensions] = useState<ExtensionInfo[]>([])
  const [availableExtensions, setAvailableExtensions] = useState<ExtensionInfo[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedExtension, setSelectedExtension] = useState<ExtensionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadExtensions()
  }, [])

  const loadExtensions = async () => {
    setIsLoading(true)
    try {
      // インストール済み拡張機能を取得
      const loaded = extensionManager.getLoadedExtensions()
      const active = extensionManager.getActiveExtensions()
      
      const installed = loaded.map(ext => ({
        ...ext,
        isInstalled: true,
        isActive: active.some(activeExt => activeExt.name === ext.name)
      }))
      
      setInstalledExtensions(installed)
      
      // 利用可能な拡張機能を取得（モックデータ）
      const available = getSampleExtensions()
      setAvailableExtensions(available)
      
    } catch (error) {
      console.error('Failed to load extensions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSampleExtensions = (): ExtensionInfo[] => {
    return [
      {
        name: "prettier-vscode",
        displayName: "Prettier - Code formatter",
        description: "コードフォーマッター",
        version: "10.1.0",
        publisher: "esbenp",
        engines: { vscode: "^1.87.0" },
        categories: ["Formatters"],
        keywords: ["prettier", "formatter", "javascript", "typescript"],
        activationEvents: ["onLanguage:javascript", "onLanguage:typescript"],
        isInstalled: false,
        isActive: false,
        downloadCount: 25000000,
        rating: 4.5,
        lastUpdated: new Date('2024-01-15')
      },
      {
        name: "eslint-vscode",
        displayName: "ESLint",
        description: "JavaScriptとTypeScriptのリンター",
        version: "2.4.2",
        publisher: "microsoft",
        engines: { vscode: "^1.87.0" },
        categories: ["Linters"],
        keywords: ["eslint", "linter", "javascript", "typescript"],
        activationEvents: ["onLanguage:javascript", "onLanguage:typescript"],
        isInstalled: false,
        isActive: false,
        downloadCount: 23000000,
        rating: 4.3,
        lastUpdated: new Date('2024-01-10')
      },
      {
        name: "auto-rename-tag",
        displayName: "Auto Rename Tag",
        description: "HTMLとJSXタグの自動リネーム",
        version: "0.1.10",
        publisher: "formulahendry",
        engines: { vscode: "^1.87.0" },
        categories: ["Other"],
        keywords: ["html", "jsx", "tag", "rename"],
        activationEvents: ["onLanguage:html", "onLanguage:jsx"],
        isInstalled: false,
        isActive: false,
        downloadCount: 8000000,
        rating: 4.6,
        lastUpdated: new Date('2023-12-20')
      },
      {
        name: "bracket-pair-colorizer",
        displayName: "Bracket Pair Colorizer",
        description: "括弧のペアを色分け",
        version: "1.0.62",
        publisher: "coenraads",
        engines: { vscode: "^1.87.0" },
        categories: ["Other"],
        keywords: ["bracket", "colorizer", "matching"],
        activationEvents: ["*"],
        isInstalled: false,
        isActive: false,
        downloadCount: 6000000,
        rating: 4.2,
        lastUpdated: new Date('2023-11-15')
      },
      {
        name: "live-server",
        displayName: "Live Server",
        description: "ローカル開発サーバー",
        version: "5.7.9",
        publisher: "ritwickdey",
        engines: { vscode: "^1.87.0" },
        categories: ["Other"],
        keywords: ["live", "server", "preview", "http"],
        activationEvents: ["onLanguage:html"],
        isInstalled: false,
        isActive: false,
        downloadCount: 18000000,
        rating: 4.4,
        lastUpdated: new Date('2024-01-05')
      }
    ]
  }

  const filteredExtensions = (extensions: ExtensionInfo[]) => {
    if (!searchQuery) return extensions
    return extensions.filter(ext => 
      ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.keywords?.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const toggleExtension = async (extension: ExtensionInfo) => {
    try {
      if (extension.isActive) {
        await extensionManager.deactivateExtension(extension.name)
      } else {
        await extensionManager.activateExtension(extension.name)
      }
      await loadExtensions()
    } catch (error) {
      console.error('Failed to toggle extension:', error)
    }
  }

  const installExtension = async (extension: ExtensionInfo) => {
    try {
      setIsLoading(true)
      
      // サンプルの拡張機能コードを生成
      const extensionCode = generateSampleExtensionCode(extension)
      
      await extensionManager.loadExtension(extension, extensionCode)
      await extensionManager.activateExtension(extension.name)
      await loadExtensions()
      
    } catch (error) {
      console.error('Failed to install extension:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const uninstallExtension = async (extension: ExtensionInfo) => {
    try {
      await extensionManager.deactivateExtension(extension.name)
      await loadExtensions()
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
    }
  }

  const generateSampleExtensionCode = (extension: ExtensionInfo): string => {
    return `
function activate(context) {
  console.log('Extension "${extension.displayName}" is now active!');
  
  // コマンドを登録
  const disposable = vscode.commands.registerCommand('${extension.name}.helloWorld', function () {
    vscode.window.showInformationMessage('Hello World from ${extension.displayName}!');
  });
  
  context.subscriptions.push(disposable);
}

function deactivate() {
  console.log('Extension "${extension.displayName}" is now deactivated!');
}

module.exports = {
  activate,
  deactivate
};`
  }

  const renderExtensionCard = (extension: ExtensionInfo) => (
    <div
      key={extension.name}
      className="p-4 border border-[#454545] rounded-lg bg-[#252526] hover:bg-[#2a2a2a] cursor-pointer"
      onClick={() => setSelectedExtension(extension)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-4 w-4 text-[#007acc]" />
            <h3 className="font-medium text-[#cccccc]">{extension.displayName}</h3>
            <Badge variant="outline" className="text-xs">
              v{extension.version}
            </Badge>
          </div>
          <p className="text-sm text-[#969696] mb-2">{extension.description}</p>
          <div className="flex items-center space-x-4 text-xs text-[#969696]">
            <span>{extension.publisher}</span>
            {extension.downloadCount && (
              <span>{extension.downloadCount.toLocaleString()} downloads</span>
            )}
            {extension.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{extension.rating}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {extension.isInstalled ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExtension(extension)
                }}
                className="h-8 px-2 text-xs"
              >
                {extension.isActive ? (
                  <ToggleRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-[#969696]" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  uninstallExtension(extension)
                }}
                className="h-8 px-2 text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                installExtension(extension)
              }}
              className="h-8 px-2 text-xs text-[#007acc] hover:text-[#1177bb]"
              disabled={isLoading}
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`h-full flex flex-col bg-[#252526] text-[#cccccc] ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-3 border-b border-[#2d2d30]">
        <h3 className="text-sm font-medium text-[#cccccc] uppercase tracking-wide">
          拡張機能
        </h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadExtensions}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2a2a2a]"
            title="更新"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 検索バー */}
      <div className="p-3 border-b border-[#2d2d30]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[#969696]" />
          <Input
            placeholder="拡張機能を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-[#3c3c3c] border-[#454545] text-[#cccccc] placeholder-[#969696]"
          />
        </div>
      </div>

      {/* タブ */}
      <Tabs defaultValue="installed" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-[#2d2d30] border-b border-[#454545]">
          <TabsTrigger 
            value="installed" 
            className="data-[state=active]:bg-[#007acc] data-[state=active]:text-white text-[#cccccc]"
          >
            インストール済み ({installedExtensions.length})
          </TabsTrigger>
          <TabsTrigger 
            value="marketplace" 
            className="data-[state=active]:bg-[#007acc] data-[state=active]:text-white text-[#cccccc]"
          >
            マーケットプレース
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {filteredExtensions(installedExtensions).length > 0 ? (
                filteredExtensions(installedExtensions).map(renderExtensionCard)
              ) : (
                <div className="text-center py-8 text-[#969696]">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>インストールされた拡張機能がありません</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="marketplace" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {filteredExtensions(availableExtensions).length > 0 ? (
                filteredExtensions(availableExtensions).map(renderExtensionCard)
              ) : (
                <div className="text-center py-8 text-[#969696]">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>拡張機能が見つかりません</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* 拡張機能詳細ダイアログ */}
      {selectedExtension && (
        <Dialog open={!!selectedExtension} onOpenChange={() => setSelectedExtension(null)}>
          <DialogContent className="bg-[#252526] border-[#454545] text-[#cccccc] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-[#007acc]" />
                <span>{selectedExtension.displayName}</span>
                <Badge variant="outline">v{selectedExtension.version}</Badge>
              </DialogTitle>
              <DialogDescription className="text-[#969696]">
                {selectedExtension.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm">
                <span><strong>Publisher:</strong> {selectedExtension.publisher}</span>
                {selectedExtension.downloadCount && (
                  <span><strong>Downloads:</strong> {selectedExtension.downloadCount.toLocaleString()}</span>
                )}
                {selectedExtension.rating && (
                  <div className="flex items-center space-x-1">
                    <strong>Rating:</strong>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{selectedExtension.rating}</span>
                  </div>
                )}
              </div>
              
              {selectedExtension.keywords && (
                <div>
                  <strong className="text-sm">Keywords:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedExtension.keywords.map(keyword => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {selectedExtension.isInstalled ? (
                  <>
                    <Button
                      onClick={() => toggleExtension(selectedExtension)}
                      className={selectedExtension.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                    >
                      {selectedExtension.isActive ? '無効化' : '有効化'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => uninstallExtension(selectedExtension)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      アンインストール
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => installExtension(selectedExtension)}
                    className="bg-[#007acc] hover:bg-[#1177bb]"
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    インストール
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
