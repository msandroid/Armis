import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { browserWebSearchService, WebSearchResult } from '../../services/web-search/browser-web-search';

export const WebSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEngine, setSearchEngine] = useState('google');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<WebSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectToWebSearch = async () => {
    try {
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError('Failed to initialize web search service');
      console.error('接続エラー:', err);
    }
  };

  const disconnectFromWebSearch = async () => {
    setIsConnected(false);
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Search query is not entered');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const result = await browserWebSearchService.performWebSearch(searchQuery, searchEngine);
      setSearchResult(result);
    } catch (err) {
      setError('Search execution failed');
      console.error('検索エラー:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      performSearch();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Web Search
          </CardTitle>
          <CardDescription>
            Execute web search in browser environment (provides search URL and metadata)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 接続状態 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            {!isConnected ? (
              <Button onClick={connectToWebSearch} size="sm">
                Connect
              </Button>
            ) : (
              <Button onClick={disconnectFromWebSearch} variant="outline" size="sm">
                Disconnect
              </Button>
            )}
          </div>

          <Separator />

          {/* 検索フォーム */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Input
                  placeholder="Enter search query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isConnected || isSearching}
                />
              </div>
              <div>
                <Select value={searchEngine} onValueChange={setSearchEngine}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="bing">Bing</SelectItem>
                    <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={performSearch}
              disabled={!isConnected || isSearching || !searchQuery.trim()}
              className="w-full"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </div>
              ) : (
                "Execute Search"
              )}
            </Button>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 検索結果 */}
      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Searched for "{searchResult.searchQuery}" on {searchResult.searchEngine}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Search Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Search Engine:</span> {searchResult.searchEngine}
                  </div>
                  <div>
                    <span className="font-medium">Search Query:</span> {searchResult.searchQuery}
                  </div>
                  <div>
                    <span className="font-medium">URL:</span>
                    <a
                      href={searchResult.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      {searchResult.searchUrl}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Search Result Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {searchResult.title || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">URL:</span> {searchResult.searchUrl || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Execution Time:</span> {searchResult.timestamp || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* 検索結果の詳細 */}
            {searchResult.content && (
              <div>
                <h4 className="font-medium mb-2">Search Result Details</h4>
                <div className="max-h-96 overflow-y-auto border rounded-md p-4 bg-gray-50">
                  <pre className="text-xs whitespace-pre-wrap">
                    {searchResult.content}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

