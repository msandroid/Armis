import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Image, Video, Volume2, FileText, Brain } from 'lucide-react'
import { GoogleDirectService } from '@/services/llm/google-direct-service'
import { ImageAnalyzer } from './ImageAnalyzer'
import { VideoUnderstanding } from './VideoUnderstanding'
import { AudioUnderstanding } from './AudioUnderstanding'
import { DocumentUnderstanding } from './DocumentUnderstanding'

interface GeminiUnderstandingInterfaceProps {
  googleService: GoogleDirectService
}

export function GeminiUnderstandingInterface({ googleService }: GeminiUnderstandingInterfaceProps) {
  const [activeTab, setActiveTab] = useState('image')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Gemini Understanding 機能
          </CardTitle>
          <CardDescription>
            Gemini AIを使用した多様なメディア理解機能を体験できます。画像、ビデオ、音声、ドキュメントの分析が可能です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                画像理解
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                ビデオ理解
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                音声理解
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                ドキュメント理解
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-6">
              <ImageAnalyzer googleService={googleService} />
            </TabsContent>

            <TabsContent value="video" className="mt-6">
              <VideoUnderstanding googleService={googleService} />
            </TabsContent>

            <TabsContent value="audio" className="mt-6">
              <AudioUnderstanding googleService={googleService} />
            </TabsContent>

            <TabsContent value="document" className="mt-6">
              <DocumentUnderstanding googleService={googleService} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
