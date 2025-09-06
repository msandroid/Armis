import React from 'react'
import { Search, ExternalLink, Clock, BarChart3 } from 'lucide-react'

interface SearchResult {
  title: string
  url: string
  snippet: string
  relevance: number
}

interface SearchResultsProps {
  query: string
  results: SearchResult[]
  totalResults: number
  searchTime: number
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results,
  totalResults,
  searchTime
}) => {
  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.9) return 'text-green-600 dark:text-green-400'
    if (relevance >= 0.7) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRelevanceLabel = (relevance: number) => {
    if (relevance >= 0.9) return 'High'
    if (relevance >= 0.7) return 'Medium'
    return 'Low'
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900 dark:to-cyan-900 rounded-lg p-6 shadow-lg border border-teal-200 dark:border-teal-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Search Results
        </h2>
        <Search className="w-6 h-6 text-teal-600 dark:text-teal-400" />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4">
        <div className="mb-3">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Search Query
          </div>
          <div className="text-gray-800 dark:text-gray-200 font-medium">
            "{query}"
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Results: {totalResults.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Search Time: {searchTime.toFixed(2)}s
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-teal-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Displayed Results: {results.length} items
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200">
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                  <span>{result.title}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${getRelevanceColor(result.relevance)}`}>
                  {getRelevanceLabel(result.relevance)}
                </span>
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      result.relevance >= 0.9 ? 'bg-green-500' : result.relevance >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.relevance * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-2">
              {result.snippet}
            </p>
            
            <div className="flex items-center justify-between">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200 truncate flex-1"
              >
                {result.url}
              </a>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                Relevance: {Math.round(result.relevance * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {results.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No search results found.
          </p>
        </div>
      )}
    </div>
  )
}
