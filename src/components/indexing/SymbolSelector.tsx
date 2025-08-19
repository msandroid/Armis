import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AtSign, 
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
  X,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IndexManager } from '@/services/indexing/index-manager'
import { SearchResult } from '@/services/indexing/embedding-service'

export interface SelectedSymbol {
  id: string
  name: string
  type: string
  filePath: string
  relativePath: string
  line: number
  content: string
}

interface SymbolSelectorProps {
  className?: string
  onSymbolsSelected?: (symbols: SelectedSymbol[]) => void
  selectedSymbols?: SelectedSymbol[]
}

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({ 
  className,
  onSymbolsSelected,
  selectedSymbols = []
}) => {
  const [indexManager] = useState(() => new IndexManager())
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const results = await indexManager.searchSymbols(searchQuery, 10)
      setSearchResults(results)
      setShowResults(true)
    } catch (error) {
      console.error('Symbol search failed:', error)
      setError(error instanceof Error ? error.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [indexManager])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query)
      } else {
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, handleSearch])

  const handleSymbolSelect = (result: SearchResult) => {
    const symbol: SelectedSymbol = {
      id: result.id,
      name: result.metadata.name,
      type: result.metadata.symbolType,
      filePath: result.metadata.filePath,
      relativePath: result.metadata.relativePath,
      line: result.metadata.line,
      content: result.content
    }

    const isAlreadySelected = selectedSymbols.some(s => s.id === symbol.id)
    
    if (!isAlreadySelected) {
      const newSelectedSymbols = [...selectedSymbols, symbol]
      onSymbolsSelected?.(newSelectedSymbols)
    }

    setQuery('')
    setShowResults(false)
  }

  const handleSymbolRemove = (symbolId: string) => {
    const newSelectedSymbols = selectedSymbols.filter(s => s.id !== symbolId)
    onSymbolsSelected?.(newSelectedSymbols)
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

  return (
    <div className={cn("space-y-4", className)}>
      {/* Symbol Input */}
      <div className="relative">
        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type @ to search symbols..."
          className="pl-10"
          onFocus={() => {
            if (query.trim()) {
              setShowResults(true)
            }
          }}
        />

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 border-b border-border">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!isSearching && searchResults.length === 0 && query.trim() && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No symbols found</p>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <ScrollArea className="max-h-64">
                <div className="p-1">
                  {searchResults.map((result) => {
                    const isSelected = selectedSymbols.some(s => s.id === result.id)
                    
                    return (
                      <div
                        key={result.id}
                        className={cn(
                          "p-2 rounded cursor-pointer transition-colors",
                          isSelected 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-accent"
                        )}
                        onClick={() => handleSymbolSelect(result)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("flex items-center gap-1", getSymbolColor(result.metadata.symbolType))}>
                            {getSymbolIcon(result.metadata.symbolType)}
                            <span className="text-sm font-medium">{result.metadata.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.metadata.relativePath}:{result.metadata.line}
                        </div>
                        {result.metadata.signature && (
                          <div className="text-xs font-mono bg-muted/50 p-1 rounded mt-1">
                            {result.metadata.signature}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Selected Symbols */}
      {selectedSymbols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Symbols ({selectedSymbols.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedSymbols.map((symbol) => (
                <div
                  key={symbol.id}
                  className="flex items-center justify-between p-2 bg-accent rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("flex items-center gap-1", getSymbolColor(symbol.type))}>
                      {getSymbolIcon(symbol.type)}
                      <span className="text-sm font-medium">{symbol.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {symbol.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {symbol.relativePath}:{symbol.line}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSymbolRemove(symbol.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {selectedSymbols.length === 0 && !query.trim() && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">How to use:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Type @ followed by a symbol name to search</li>
            <li>Click on a symbol to add it to your selection</li>
            <li>Selected symbols will be included in your context</li>
            <li>Remove symbols by clicking the X button</li>
          </ul>
        </div>
      )}
    </div>
  )
}
