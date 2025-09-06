import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  FileText, 
  Code, 
  Zap, 
  Square, 
  Settings, 
  Type, 
  List,
  Variable,
  Download,
  Upload,
  ExternalLink,
  Copy,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IndexManager } from '@/services/indexing/index-manager'
import { SearchResult } from '@/services/indexing/embedding-service'

interface CodebaseSearchProps {
  className?: string
  onSelectResult?: (result: SearchResult) => void
}

export const CodebaseSearch: React.FC<CodebaseSearchProps> = ({ 
  className,
  onSelectResult 
}) => {
  const [indexManager] = useState(() => new IndexManager())
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      let results: SearchResult[] = []

      switch (activeTab) {
        case 'symbols':
          results = await indexManager.searchSymbols(searchQuery, 20)
          break
        case 'files':
          results = await indexManager.searchFiles(searchQuery, 20)
          break
        default:
          results = await indexManager.search({
            query: searchQuery,
            maxResults: 20
          })
      }

      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setError(error instanceof Error ? error.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [activeTab, indexManager])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, handleSearch])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (query.trim()) {
      handleSearch(query)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    onSelectResult?.(result)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getSymbolIcon = (type: string) => {
    switch (type) {
          case 'function':
      return <Zap className="w-4 h-4" />
    case 'class':
      return <Square className="w-4 h-4" />
    case 'interface':
      return <Settings className="w-4 h-4" />
    case 'type':
      return <Type className="w-4 h-4" />
    case 'enum':
      return <List className="w-4 h-4" />
    case 'variable':
      return <Variable className="w-4 h-4" />
    case 'import':
      return <Download className="w-4 h-4" />
    case 'export':
      return <Upload className="w-4 h-4" />
      default:
        return <Code className="w-4 h-4" />
    }
  }

  const getSymbolColor = (type: string) => {
    switch (type) {
      case 'function':
        return 'text-blue-500'
      case 'class':
        return 'text-green-500'
      case 'interface':
        return 'text-purple-500'
      case 'type':
        return 'text-orange-500'
      case 'enum':
        return 'text-pink-500'
      case 'variable':
        return 'text-gray-500'
      case 'import':
        return 'text-cyan-500'
      case 'export':
        return 'text-indigo-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Codebase Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search functions, classes, files..."
            className="pl-10"
          />
        </div>

        {/* Search Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="symbols">Symbols</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Results */}
        <div className="space-y-2">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!isSearching && searchResults.length === 0 && query.trim() && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No results found</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {result.metadata.type === 'symbol' && (
                            <div className={cn("flex items-center gap-1", getSymbolColor(result.metadata.symbolType))}>
                              {getSymbolIcon(result.metadata.symbolType)}
                              <span className="text-sm font-medium">{result.metadata.name}</span>
                            </div>
                          )}
                          {result.metadata.type === 'chunk' && (
                            <div className="flex items-center gap-1 text-blue-500">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">{result.metadata.relativePath}</span>
                            </div>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {formatSimilarity(result.similarity)}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground mb-2">
                          {result.metadata.relativePath}
                          {result.metadata.line && `:${result.metadata.line}`}
                        </div>

                        {result.metadata.signature && (
                          <div className="text-xs font-mono bg-muted p-2 rounded mb-2">
                            {result.metadata.signature}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {result.content.substring(0, 200)}
                          {result.content.length > 200 && '...'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(result.content)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Open file in editor
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Search Tips */}
        {!query.trim() && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Search tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Search for function names, class names, or file paths</li>
              <li>Use quotes for exact matches</li>
              <li>Filter by symbol type using the tabs above</li>
              <li>Click on results to view details</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
