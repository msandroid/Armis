import React, { useState, useRef } from 'react';
import { FactCheckingService, FactCheckResult, FactCheckOptions } from '../services/llm/fact-checking-service';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';

interface FactCheckComponentProps {
  initialText?: string;
  onResult?: (result: FactCheckResult) => void;
  className?: string;
}

export const FactCheckComponent: React.FC<FactCheckComponentProps> = ({
  initialText = '',
  onResult,
  className = ''
}) => {
  const [text, setText] = useState(initialText);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingResult, setStreamingResult] = useState<Partial<FactCheckResult>>({});
  const [options, setOptions] = useState<FactCheckOptions>({
    model: 'openai',
    temperature: 0.1,
    maxTokens: 1000,
    includeSources: true,
    strictMode: false
  });
  const [activeTab, setActiveTab] = useState('basic');
  const factCheckingService = useRef(new FactCheckingService(options));

  const handleFactCheck = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setResult(null);
    setStreamingResult({});

    try {
      let checkResult: FactCheckResult;

      switch (activeTab) {
        case 'enhanced':
          checkResult = await factCheckingService.current.checkFactsWithSources(text);
          break;
        case 'hallucination':
          const hallucinationResult = await factCheckingService.current.detectHallucinations(text);
          checkResult = {
            isFactual: !hallucinationResult.hasHallucinations,
            confidence: 100 - hallucinationResult.hallucinationScore,
            issues: hallucinationResult.detectedIssues,
            explanation: `Hallucination Score: ${hallucinationResult.hallucinationScore}%. ${hallucinationResult.suggestions.join(', ')}`
          };
          break;
        default:
          checkResult = await factCheckingService.current.checkFacts(text);
      }

      setResult(checkResult);
      onResult?.(checkResult);
    } catch (error) {
      console.error('Fact check failed:', error);
      setResult({
        isFactual: false,
        confidence: 0,
        issues: ['Fact checking failed'],
        explanation: 'An error occurred during fact checking'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamingCheck = async () => {
    if (!text.trim()) return;

    setIsStreaming(true);
    setStreamingResult({});

    try {
      for await (const chunk of factCheckingService.current.checkFactsStream(text)) {
        setStreamingResult(prev => ({ ...prev, ...chunk }));
      }
    } catch (error) {
      console.error('Streaming fact check failed:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleOptionsChange = (newOptions: Partial<FactCheckOptions>) => {
    const updatedOptions = { ...options, ...newOptions };
    setOptions(updatedOptions);
    factCheckingService.current = new FactCheckingService(updatedOptions);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 60) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Fact Check Configuration
          </CardTitle>
          <CardDescription>
            Configure fact checking parameters and select the verification method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={options.model}
                onValueChange={(value) => handleOptionsChange({ model: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="google">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Select
                value={options.temperature?.toString()}
                onValueChange={(value) => handleOptionsChange({ temperature: parseFloat(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1 (Conservative)</SelectItem>
                  <SelectItem value="0.3">0.3 (Balanced)</SelectItem>
                  <SelectItem value="0.5">0.5 (Creative)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="includeSources"
              checked={options.includeSources}
              onCheckedChange={(checked) => handleOptionsChange({ includeSources: checked })}
            />
            <Label htmlFor="includeSources">Include source citations</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="strictMode"
              checked={options.strictMode}
              onCheckedChange={(checked) => handleOptionsChange({ strictMode: checked })}
            />
            <Label htmlFor="strictMode">Strict mode (higher accuracy)</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>
            Enter the text you want to fact-check
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to fact-check..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fact Check Methods</CardTitle>
          <CardDescription>
            Choose the type of fact checking to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
              <TabsTrigger value="streaming">Streaming</TabsTrigger>
              <TabsTrigger value="hallucination">Hallucination</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Basic fact checking using LangChain's built-in fact check chain
                </p>
                <Button 
                  onClick={handleFactCheck} 
                  disabled={isLoading || !text.trim()}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Run Basic Fact Check
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="enhanced" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enhanced fact checking with source verification and detailed analysis
                </p>
                <Button 
                  onClick={handleFactCheck} 
                  disabled={isLoading || !text.trim()}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Run Enhanced Fact Check
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="streaming" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Real-time fact checking with streaming results
                </p>
                <Button 
                  onClick={handleStreamingCheck} 
                  disabled={isStreaming || !text.trim()}
                  className="w-full"
                >
                  {isStreaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Start Streaming Check
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="hallucination" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Specialized detection for AI hallucinations and fabricated information
                </p>
                <Button 
                  onClick={handleFactCheck} 
                  disabled={isLoading || !text.trim()}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Detect Hallucinations
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Display */}
      {(result || streamingResult.explanation) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Fact Check Results
              {result && getConfidenceIcon(result.confidence)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Confidence Score */}
            {(result || streamingResult.confidence) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Confidence Score</Label>
                  <span className={`font-semibold ${getConfidenceColor(result?.confidence || streamingResult.confidence || 0)}`}>
                    {result?.confidence || streamingResult.confidence || 0}%
                  </span>
                </div>
                <Progress value={result?.confidence || streamingResult.confidence || 0} />
              </div>
            )}

            {/* Factual Status */}
            {(result || streamingResult.isFactual !== undefined) && (
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <Badge variant={result?.isFactual || streamingResult.isFactual ? "default" : "destructive"}>
                  {result?.isFactual || streamingResult.isFactual ? "Factual" : "Contains Issues"}
                </Badge>
              </div>
            )}

            {/* Issues */}
            {result?.issues && result.issues.length > 0 && (
              <div className="space-y-2">
                <Label>Issues Found:</Label>
                <div className="space-y-1">
                  {result.issues.map((issue, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Corrected Text */}
            {result?.correctedText && (
              <div className="space-y-2">
                <Label>Corrected Version:</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{result.correctedText}</p>
                </div>
              </div>
            )}

            {/* Sources */}
            {result?.sources && result.sources.length > 0 && (
              <div className="space-y-2">
                <Label>Sources:</Label>
                <div className="space-y-1">
                  {result.sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <ExternalLink className="w-3 h-3" />
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {(result?.explanation || streamingResult.explanation) && (
              <div className="space-y-2">
                <Label>Analysis:</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {result?.explanation || streamingResult.explanation}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FactCheckComponent;
