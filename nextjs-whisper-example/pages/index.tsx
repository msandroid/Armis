import { useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [transcription, setTranscription] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
    }
  }

  const handleTranscribe = async () => {
    if (!file) {
      setError('Please select an audio file')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('audio', file)

      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setTranscription(data.result.text)
      } else {
        setError(data.error || 'Transcription failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Whisper.cpp with Next.js</title>
        <meta name="description" content="Speech to text using whisper.cpp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Whisper.cpp Speech to Text
          </h1>

          <div className="space-y-6">
            {/* ファイルアップロード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio File
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 変換ボタン */}
            <button
              onClick={handleTranscribe}
              disabled={!file || isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Transcribing...
                </div>
              ) : (
                'Transcribe Audio'
              )}
            </button>

            {/* 結果表示 */}
            {transcription && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transcription Result
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{transcription}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
