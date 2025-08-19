"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Download, 
  Trash2, 
  Settings, 
  Star,
  Download as DownloadIcon,
  Package,
  Code,
  Palette,
  Languages,
  Database,
  Webhook,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Github,
  Globe,
  FileText,
  Users,
  Calendar,
  Tag
} from "lucide-react"
import { Extension, ExtensionManager } from "@/lib/extensions"

interface ExtensionsPanelProps {
  onExtensionInstall?: (extension: Extension) => void
  onExtensionUninstall?: (extensionId: string) => void
  onExtensionEnable?: (extensionId: string) => void
  onExtensionDisable?: (extensionId: string) => void
}

export function ExtensionsPanel({
  onExtensionInstall,
  onExtensionUninstall,
  onExtensionEnable,
  onExtensionDisable
}: ExtensionsPanelProps) {
  const [extensionManager] = useState(() => new ExtensionManager())
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("installed")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadExtensions()
  }, [])

  const loadExtensions = () => {
    const installedExtensions = extensionManager.getInstalledExtensions()
    setExtensions(installedExtensions)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = extensionManager.searchExtensions(query)
      setExtensions(results)
    } else {
      loadExtensions()
    }
  }

  const handleInstallExtension = async (extension: Extension) => {
    setIsLoading(true)
    try {
      await extensionManager.installExtension(extension.id)
      onExtensionInstall?.(extension)
      loadExtensions()
    } catch (error) {
      console.error('Error installing extension:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUninstallExtension = async (extensionId: string) => {
    setIsLoading(true)
    try {
      await extensionManager.uninstallExtension(extensionId)
      onExtensionUninstall?.(extensionId)
      loadExtensions()
    } catch (error) {
      console.error('Error uninstalling extension:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableExtension = async (extensionId: string) => {
    setIsLoading(true)
    try {
      await extensionManager.enableExtension(extensionId)
      onExtensionEnable?.(extensionId)
      loadExtensions()
    } catch (error) {
      console.error('Error enabling extension:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableExtension = async (extensionId: string) => {
    setIsLoading(true)
    try {
      await extensionManager.disableExtension(extensionId)
      onExtensionDisable?.(extensionId)
      loadExtensions()
    } catch (error) {
      console.error('Error disabling extension:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'programming languages':
        return <Code className="h-4 w-4" />
      case 'themes':
        return <Palette className="h-4 w-4" />
      case 'language packs':
        return <Languages className="h-4 w-4" />
      case 'databases':
        return <Database className="h-4 w-4" />
      case 'web':
        return <Webhook className="h-4 w-4" />
      case 'other':
        return <Package className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusIcon = (extension: Extension) => {
    if (!extension.isInstalled) {
      return <DownloadIcon className="h-4 w-4 text-blue-500" />
    }
    if (extension.isEnabled) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <XCircle className="h-4 w-4 text-gray-400" />
  }

  const renderExtensionCard = (extension: Extension) => (
    <Card key={extension.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {getCategoryIcon(extension.categories[0] || 'other')}
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">{extension.displayName}</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {extension.publisher}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(extension)}
            {extension.isBuiltin && (
              <Badge variant="secondary" className="text-xs">
                Built-in
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3">{extension.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              v{extension.version}
            </Badge>
            {extension.categories.map(category => (
              <Badge key={category} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center space-x-1">
            {extension.isInstalled ? (
              <>
                {extension.isEnabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisableExtension(extension.id)}
                    disabled={isLoading || extension.isBuiltin}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEnableExtension(extension.id)}
                    disabled={isLoading}
                  >
                    Enable
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUninstallExtension(extension.id)}
                  disabled={isLoading || extension.isBuiltin}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => handleInstallExtension(extension)}
                disabled={isLoading}
              >
                <Download className="h-3 w-3 mr-1" />
                Install
              </Button>
            )}
          </div>
        </div>

        {extension.repository && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {extension.repository && (
                <a
                  href={extension.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-blue-500"
                >
                  <Github className="h-3 w-3" />
                  <span>Repository</span>
                </a>
              )}
              {extension.homepage && (
                <a
                  href={extension.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-blue-500"
                >
                  <Globe className="h-3 w-3" />
                  <span>Homepage</span>
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const installedExtensions = extensions.filter(ext => ext.isInstalled)
  const enabledExtensions = extensions.filter(ext => ext.isEnabled)
  const disabledExtensions = extensions.filter(ext => ext.isInstalled && !ext.isEnabled)

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Extensions</h2>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Extension Settings
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search extensions..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="installed">
              Installed ({installedExtensions.length})
            </TabsTrigger>
            <TabsTrigger value="enabled">
              Enabled ({enabledExtensions.length})
            </TabsTrigger>
            <TabsTrigger value="disabled">
              Disabled ({disabledExtensions.length})
            </TabsTrigger>
            <TabsTrigger value="marketplace">
              Marketplace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="p-4">
            {installedExtensions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Extensions Installed</h3>
                <p className="text-sm">Install extensions to enhance your development experience</p>
              </div>
            ) : (
              installedExtensions.map(renderExtensionCard)
            )}
          </TabsContent>

          <TabsContent value="enabled" className="p-4">
            {enabledExtensions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Enabled Extensions</h3>
                <p className="text-sm">Enable extensions to start using them</p>
              </div>
            ) : (
              enabledExtensions.map(renderExtensionCard)
            )}
          </TabsContent>

          <TabsContent value="disabled" className="p-4">
            {disabledExtensions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Disabled Extensions</h3>
                <p className="text-sm">All installed extensions are enabled</p>
              </div>
            ) : (
              disabledExtensions.map(renderExtensionCard)
            )}
          </TabsContent>

          <TabsContent value="marketplace" className="p-4">
            <div className="text-center py-8 text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Extension Marketplace</h3>
              <p className="text-sm">Browse and install extensions from the marketplace</p>
              <Button className="mt-4">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Marketplace
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 