'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  Globe, 
  FileText, 
  Calendar, 
  ExternalLink, 
  Copy, 
  Check, 
  BarChart3, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Brain,
  Send,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface ScrapedContent {
  title: string
  description: string
  content: string
  url: string
  timestamp: string
  status: 'success' | 'partial' | 'error'
  message?: string
  readabilityScore?: number
  wordCount?: number
  readingTime?: number
}

interface ContentAnalysis {
  wordCount: number
  characterCount: number
  sentenceCount: number
  paragraphCount: number
  averageWordsPerSentence: number
  readingTime: number
}

export function WebScraper() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setScrapedContent(null)
    setAiResponse('')

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape URL')
      }

      setScrapedContent(data)
      
      // ステータスに応じてメッセージを表示
      if (data.status === 'success') {
        toast.success('Content scraped successfully!')
      } else if (data.status === 'partial') {
        toast.warning('Partial content extracted. Some content may be missing.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleScrape()
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${type} copied to clipboard!`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const analyzeContent = (content: string): ContentAnalysis => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
    const paragraphs = content.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0)
    
    const wordCount = words.length
    const characterCount = content.length
    const sentenceCount = sentences.length
    const paragraphCount = paragraphs.length
    const averageWordsPerSentence = sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0
    const readingTime = Math.ceil(wordCount / 200) // 平均的な読書速度（200語/分）

    return {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence,
      readingTime
    }
  }

  const handleAiAnalysis = async () => {
    if (!scrapedContent || !aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI analysis')
      return
    }

    setIsAiLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `${aiPrompt}\n\nContent from ${scrapedContent.url}:\n\n${scrapedContent.content}`,
          history: []
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiResponse(data.response)
        toast.success('AI analysis completed!')
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      toast.error('Failed to analyze content with AI')
    } finally {
      setIsAiLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-500">Partial</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getReadabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const analysis = scrapedContent ? analyzeContent(scrapedContent.content) : null

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Web Content Reader
          </CardTitle>
          <CardDescription>
            Enter a URL to extract and analyze its content with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleScrape} 
              disabled={isLoading || !url.trim()}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reading...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Read Page
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {scrapedContent && (
        <div className="space-y-4">
          {/* Status Alert */}
          {scrapedContent.status !== 'success' && scrapedContent.message && (
            <Alert variant={scrapedContent.status === 'partial' ? 'default' : 'destructive'}>
              {getStatusIcon(scrapedContent.status)}
              <AlertDescription>{scrapedContent.message}</AlertDescription>
            </Alert>
          )}

          {/* Title and Meta Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {scrapedContent.title}
                </CardTitle>
                {getStatusBadge(scrapedContent.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(scrapedContent.timestamp)}
                </div>
                <a 
                  href={scrapedContent.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Original
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {scrapedContent.description}
              </p>
            </CardContent>
          </Card>

          {/* Readability Score */}
          {scrapedContent.readabilityScore && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Content Quality Analysis
                </CardTitle>
                <CardDescription>
                  Analysis of content extraction quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className={`text-2xl font-bold ${getReadabilityColor(scrapedContent.readabilityScore)}`}>
                      {scrapedContent.readabilityScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Readability Score</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{scrapedContent.wordCount || analysis?.wordCount}</div>
                    <div className="text-sm text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{scrapedContent.readingTime || analysis?.readingTime} min</div>
                    <div className="text-sm text-muted-foreground">Reading Time</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{analysis?.sentenceCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Sentences</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content and AI Analysis */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="ai">AI Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Extracted Content</CardTitle>
                      <CardDescription>
                        Main content extracted from the webpage
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(scrapedContent.content, 'Content')}
                        className="flex items-center gap-1"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={scrapedContent.content}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="No content extracted..."
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Content length: {scrapedContent.content.length} characters
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Content Analysis
                  </CardTitle>
                  <CardDescription>
                    Analyze the extracted content with AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">AI Prompt</label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Summarize this content, Translate to Japanese, Extract key points..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleAiAnalysis} 
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="w-full"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                  
                  {aiResponse && (
                    <div className="mt-4">
                      <label className="text-sm font-medium">AI Response</label>
                      <div className="mt-2 p-4 bg-muted rounded-lg">
                        <p className="whitespace-pre-wrap text-sm">{aiResponse}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* URL Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Source URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md">
                <code className="text-sm break-all">{scrapedContent.url}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 