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
            Gemini Understanding Features
          </CardTitle>
          <CardDescription>
            Experience diverse media understanding features using Gemini AI. Analyze images, videos, audio, and documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Image Understanding
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Understanding
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Audio Understanding
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document Understanding
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
