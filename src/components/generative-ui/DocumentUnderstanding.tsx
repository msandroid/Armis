import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, FileText, Eye } from 'lucide-react'
import { GoogleDirectService, DocumentResponse } from '@/services/llm/google-direct-service'

interface DocumentUnderstandingProps {
  googleService: GoogleDirectService
}

export function DocumentUnderstanding({ googleService }: DocumentUnderstandingProps) {
  const [documentData, setDocumentData] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<string>('')
  const [textPrompt, setTextPrompt] = useState('このドキュメントの内容を詳しく説明してください。')
  const [analysis, setAnalysis] = useState<DocumentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!documentData || !documentType) {
      setError('ドキュメントをアップロードしてください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await googleService.analyzeDocument(documentData, documentType, textPrompt)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ドキュメント分析中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeDocumentOnly = async () => {
    if (!documentData || !documentType) {
      setError('ドキュメントをアップロードしてください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await googleService.analyzeDocument(documentData, documentType)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ドキュメント分析中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Understanding
          </CardTitle>
          <CardDescription>
            Upload documents and get AI-powered analysis and understanding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ドキュメントアップロードエリア */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop documents here</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Click to select documents or drag & drop
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOCX, DOC, TXT, CSV formats
                </p>
              </div>
            )}
          </div>

          {/* アップロードされたドキュメントの情報 */}
          {documentData && documentType && (
            <div className="space-y-2">
              <Label>Uploaded Document:</Label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    File Type: {documentType}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Document uploaded successfully
                </p>
              </div>
            </div>
          )}

          {/* テキストプロンプト入力 */}
          <div className="space-y-2">
            <Label htmlFor="text-prompt">Analysis Prompt:</Label>
            <Textarea
              id="text-prompt"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Enter what you want to analyze in the document..."
              rows={3}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              onClick={analyzeDocument}
              disabled={!documentData || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Analyze Document (Custom Prompt)
            </Button>
            <Button
              onClick={analyzeDocumentOnly}
              disabled={!documentData || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Analyze Document Automatically
            </Button>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分析結果 */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Processing Time: {analysis.duration}ms | Tokens: {analysis.tokens}
              {analysis.documentType && ` | File Type: ${analysis.documentType}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Document Analysis:</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{analysis.analysis}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Generated Text:</Label>
                <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 whitespace-pre-wrap">{analysis.text}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
