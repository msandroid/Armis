import React, { useState } from 'react';
import { FactCheckComponent } from './FactCheckComponent';
import { FactCheckResult } from '../services/llm/fact-checking-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, 
  History, 
  Settings, 
  Download, 
  Share2, 
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface FactCheckHistory {
  id: string;
  timestamp: Date;
  text: string;
  result: FactCheckResult;
}

export const FactCheckPage: React.FC = () => {
  const [history, setHistory] = useState<FactCheckHistory[]>([]);
  const [activeTab, setActiveTab] = useState('checker');

  const handleFactCheckResult = (result: FactCheckResult) => {
    const newHistoryItem: FactCheckHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      text: '', // This will be set by the component
      result
    };
    
    setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]); // Keep last 10 items
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fact-check-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareResult = (historyItem: FactCheckHistory) => {
    const shareText = `Fact Check Result:
Text: ${historyItem.text.substring(0, 100)}...
Factual: ${historyItem.result.isFactual ? 'Yes' : 'No'}
Confidence: ${historyItem.result.confidence}%
Issues: ${historyItem.result.issues.join(', ')}`;

    if (navigator.share) {
      navigator.share({
        title: 'Fact Check Result',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const getStatusIcon = (isFactual: boolean) => {
    return isFactual ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Fact Checker
          </h1>
          <p className="text-muted-foreground mt-2">
            Verify the accuracy of information using AI-powered fact checking
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportHistory} disabled={history.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export History
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checker" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Fact Checker
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checker" className="space-y-6">
          <FactCheckComponent onResult={handleFactCheckResult} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                <p className="text-muted-foreground text-center">
                  Your fact check results will appear here once you start using the fact checker.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.result.isFactual)}
                        <CardTitle className="text-lg">
                          Fact Check Result
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getConfidenceColor(item.result.confidence)}>
                          {item.result.confidence}% Confidence
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareResult(item)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {item.timestamp.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Checked Text:</h4>
                      <p className="text-sm bg-muted p-3 rounded-md">
                        {item.text || "Text not available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Status:</h4>
                        <Badge variant={item.result.isFactual ? "default" : "destructive"}>
                          {item.result.isFactual ? "Factual" : "Contains Issues"}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Issues Found:</h4>
                        {item.result.issues.length > 0 ? (
                          <div className="space-y-1">
                            {item.result.issues.map((issue, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-green-600">No issues found</span>
                        )}
                      </div>
                    </div>

                    {item.result.correctedText && (
                      <div>
                        <h4 className="font-semibold mb-2">Corrected Version:</h4>
                        <p className="text-sm bg-green-50 p-3 rounded-md border border-green-200">
                          {item.result.correctedText}
                        </p>
                      </div>
                    )}

                    {item.result.sources && item.result.sources.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Sources:</h4>
                        <div className="space-y-1">
                          {item.result.sources.map((source, index) => (
                            <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                              {source}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Analysis:</h4>
                      <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                        {item.result.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How to Use Fact Checker</CardTitle>
              <CardDescription>
                Learn how to effectively use the fact checking features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Basic Fact Check</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the basic fact check for quick verification of factual claims. 
                    This method uses LangChain's built-in fact checking chain.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. Enhanced Fact Check</h3>
                  <p className="text-sm text-muted-foreground">
                    For more detailed analysis, use the enhanced fact check. 
                    This includes source verification and provides corrections for inaccuracies.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Streaming Fact Check</h3>
                  <p className="text-sm text-muted-foreground">
                    Get real-time feedback as the AI analyzes your text. 
                    This is useful for longer documents or when you want immediate results.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4. Hallucination Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Specifically designed to detect AI-generated hallucinations and fabricated information. 
                    This is particularly useful for verifying AI-generated content.
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Tips for Better Results:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Provide specific, factual claims rather than opinions</li>
                  <li>• Include context when possible</li>
                  <li>• Use different models for comparison</li>
                  <li>• Check the confidence scores and explanations</li>
                  <li>• Review the suggested corrections and sources</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FactCheckPage;
