import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Upload, 
  FileText, 
  Eye, 
  Search, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Hash,
  Users,
  Building,
  MapPin,
  Heart,
  ThumbsDown,
  Minus
} from 'lucide-react'
import { HaystackDocumentService, DocumentAnalysisResult, DocumentSearchResult, DocumentQAResult } from '@/services/document/haystack-document-service'

interface EnhancedDocumentUnderstandingProps {
  haystackService: HaystackDocumentService
}

export function EnhancedDocumentUnderstanding({ haystackService }: EnhancedDocumentUnderstandingProps) {
  const [documentData, setDocumentData] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<string>('')
  const [textPrompt, setTextPrompt] = useState('Please explain the content of this document in detail.')
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([])
  const [qaQuestion, setQaQuestion] = useState('')
  const [qaResult, setQaResult] = useState<DocumentQAResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('analysis')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // Base64データからヘッダー部分を除去
        const base64Data = result.split(',')[1]
        setDocumentData(base64Data)
        setDocumentType(file.type)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    multiple: false
  })

  const analyzeDocument = async () => {
    if (!documentData) {
      setError('Please upload a document')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Base64データをテキストに変換（簡易的な実装）
      const textContent = atob(documentData)
      const result = await haystackService.analyzeDocument(textContent, {
        type: documentType,
        prompt: textPrompt
      })
      setAnalysis(result)
      setActiveTab('analysis')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during document analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const searchDocuments = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const results = await haystackService.searchDocuments(searchQuery, 10)
      setSearchResults(results)
      setActiveTab('search')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during document search')
    } finally {
      setIsLoading(false)
    }
  }

  const askQuestion = async () => {
    if (!qaQuestion.trim()) {
      setError('Please enter a question')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await haystackService.answerQuestion(qaQuestion)
      setQaResult(result)
      setActiveTab('qa')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during question answering')
    } finally {
      setIsLoading(false)
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <Heart className="h-4 w-4 text-green-500" />
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'person':
        return <Users className="h-4 w-4" />
      case 'organization':
        return <Building className="h-4 w-4" />
      case 'location':
        return <MapPin className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enhanced Document Understanding & Analysis (Haystack)
          </CardTitle>
          <CardDescription>
            Experience advanced document understanding, search, and Q&A functionality using Haystack
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ファイルアップロード */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop files here' : 'Drag & drop files or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, DOCX, DOC, TXT, CSV
            </p>
          </div>

          {documentData && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Eye className="h-4 w-4" />
              Document uploaded successfully
            </div>
          )}

          {/* 分析プロンプト */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Analysis Prompt</Label>
            <Textarea
              id="prompt"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Specify the analysis content for the document"
              rows={2}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button 
              onClick={analyzeDocument} 
              disabled={!documentData || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Analyze Document
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 検索機能 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Document Search
          </CardTitle>
          <CardDescription>
            Search for related information from saved documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter what you want to search for"
              className="flex-1"
              rows={2}
            />
            <Button 
              onClick={searchDocuments} 
              disabled={!searchQuery.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Search Results ({searchResults.length})</h4>
              {searchResults.map((result, index) => (
                <Card key={result.id} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">Score: {result.score.toFixed(2)}</Badge>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">{result.content}</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 質問応答機能 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Question & Answer
          </CardTitle>
          <CardDescription>
            Ask questions about the document and get AI answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              value={qaQuestion}
              onChange={(e) => setQaQuestion(e.target.value)}
              placeholder="Ask a question about the document"
              className="flex-1"
              rows={2}
            />
            <Button 
              onClick={askQuestion} 
              disabled={!qaQuestion.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </Button>
          </div>

          {qaResult && (
            <Card className="p-4 bg-blue-50">
              <h4 className="font-medium mb-2">Answer</h4>
              <p className="text-sm text-gray-700 mb-3">{qaResult.answer}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Confidence: {(qaResult.confidence * 100).toFixed(1)}%</span>
                <span>{new Date(qaResult.metadata.answerTimestamp).toLocaleString()}</span>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* 分析結果 */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              分析結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">Basic Analysis</TabsTrigger>
                <TabsTrigger value="entities">Entities</TabsTrigger>
                <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{analysis.summary}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Language</h4>
                  <Badge variant="outline">{analysis.language === 'ja' ? 'Japanese' : 'English'}</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="entities" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Extracted Entities</h4>
                  <div className="space-y-2">
                    {analysis.entities.map((entity, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        {getEntityIcon(entity.type)}
                        <span className="font-medium">{entity.text}</span>
                        <Badge variant="outline" className="text-xs">{entity.type}</Badge>
                        <span className="text-xs text-gray-500">
                          Confidence: {(entity.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sentiment" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Sentiment Analysis Results</h4>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                    {getSentimentIcon(analysis.sentiment.label)}
                    <span className="font-medium">{analysis.sentiment.label}</span>
                    <Badge variant="outline">
                      Score: {analysis.sentiment.score.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="topics" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Main Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.topics.map((topic, index) => (
                      <Badge key={index} variant="default">{topic}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />
            
            <div className="text-xs text-gray-500">
              Analysis Time: {new Date(analysis.metadata.analysisTimestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
