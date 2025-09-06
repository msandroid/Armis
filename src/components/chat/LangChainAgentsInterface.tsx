import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { CircleSpinner } from '../ui/circle-spinner';
import LangChainAgentsService, { LangChainAgentConfig, AgentCreationOptions } from '../../services/agent/langchain-agents-service';

interface AgentResult {
  name: string;
  result?: any;
  error?: string;
  success: boolean;
  executionTime?: number;
}

interface AgentConfig {
  name: string;
  type: string;
  config: LangChainAgentConfig;
  options: AgentCreationOptions;
}

const LangChainAgentsInterface: React.FC = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [results, setResults] = useState<AgentResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [service, setService] = useState<LangChainAgentsService | null>(null);

  // 新しいエージェント設定
  const [newAgentConfig, setNewAgentConfig] = useState<LangChainAgentConfig>({
    modelType: 'openai',
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
    maxTokens: 1000,
  });

  const [newAgentOptions, setNewAgentOptions] = useState<AgentCreationOptions>({
    verbose: false,
    maxIterations: 10,
    returnIntermediateSteps: false,
  });

  const agentTypes = [
    { value: 'basic', label: 'Basic Agent' },
    { value: 'chat', label: 'Chat Agent' },
    { value: 'chat-conversational', label: 'Chat Conversational Agent' },
    { value: 'zero-shot', label: 'Zero-Shot Agent' },
    { value: 'structured-chat', label: 'Structured Chat Agent' },
    { value: 'openai-functions', label: 'OpenAI Functions Agent' },
    { value: 'openai-tools', label: 'OpenAI Tools Agent' },
    { value: 'tool-calling', label: 'Tool Calling Agent' },
    { value: 'xml', label: 'XML Agent' },
    { value: 'react', label: 'ReAct Agent' },
    { value: 'json', label: 'JSON Agent' },
    { value: 'openapi', label: 'OpenAPI Agent' },
    { value: 'vectorstore', label: 'VectorStore Agent' },
    { value: 'vectorstore-router', label: 'VectorStore Router Agent' },
  ];

  const modelTypes = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'llama-cpp', label: 'Llama.cpp' },
  ];

  // サービス初期化
  useEffect(() => {
    if (newAgentConfig.apiKey || newAgentConfig.baseUrl) {
      setService(new LangChainAgentsService(newAgentConfig));
    }
  }, [newAgentConfig]);

  // エージェント作成
  const createAgent = useCallback(async () => {
    if (!service) return;

    setIsCreating(true);
    try {
      const agentName = `Agent_${Date.now()}`;
      let agent;

      switch (newAgentConfig.modelType) {
        case 'basic':
          agent = await service.createBasicAgent(newAgentOptions);
          break;
        case 'chat':
          agent = await service.createChatAgent(newAgentOptions);
          break;
        case 'chat-conversational':
          agent = await service.createChatConversationalAgent(newAgentOptions);
          break;
        case 'zero-shot':
          agent = await service.createZeroShotAgent(newAgentOptions);
          break;
        case 'structured-chat':
          agent = await service.createStructuredChatAgent(newAgentOptions);
          break;
        case 'openai-functions':
          agent = await service.createOpenAIFunctionsAgent(newAgentOptions);
          break;
        case 'openai-tools':
          agent = await service.createOpenAIToolsAgent(newAgentOptions);
          break;
        case 'tool-calling':
          agent = await service.createToolCallingAgent(newAgentOptions);
          break;
        case 'xml':
          agent = await service.createXmlAgent(newAgentOptions);
          break;
        case 'react':
          agent = await service.createReactAgent(newAgentOptions);
          break;
        case 'json':
          agent = await service.createJsonAgent(newAgentOptions);
          break;
        case 'openapi':
          agent = await service.createOpenApiAgent(newAgentOptions);
          break;
        case 'vectorstore':
          agent = await service.createVectorStoreAgent(newAgentOptions);
          break;
        case 'vectorstore-router':
          agent = await service.createVectorStoreRouterAgent(newAgentOptions);
          break;
        default:
          throw new Error(`Unknown agent type: ${newAgentConfig.modelType}`);
      }

      const newAgent: AgentConfig = {
        name: agentName,
        type: newAgentConfig.modelType,
        config: { ...newAgentConfig },
        options: { ...newAgentOptions },
      };

      setAgents(prev => [...prev, newAgent]);
      setSelectedAgent(agentName);
    } catch (error) {
      console.error('Agent creation error:', error);
    } finally {
      setIsCreating(false);
    }
  }, [service, newAgentConfig, newAgentOptions]);

  // エージェント実行
  const runAgent = useCallback(async () => {
    if (!service || !selectedAgent || !input.trim()) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const selectedAgentConfig = agents.find(a => a.name === selectedAgent);
      if (!selectedAgentConfig) return;

      // エージェントを再作成（状態を保持するため）
      let agent;
      switch (selectedAgentConfig.type) {
        case 'basic':
          agent = await service.createBasicAgent(selectedAgentConfig.options);
          break;
        case 'chat':
          agent = await service.createChatAgent(selectedAgentConfig.options);
          break;
        case 'chat-conversational':
          agent = await service.createChatConversationalAgent(selectedAgentConfig.options);
          break;
        case 'zero-shot':
          agent = await service.createZeroShotAgent(selectedAgentConfig.options);
          break;
        case 'structured-chat':
          agent = await service.createStructuredChatAgent(selectedAgentConfig.options);
          break;
        case 'openai-functions':
          agent = await service.createOpenAIFunctionsAgent(selectedAgentConfig.options);
          break;
        case 'openai-tools':
          agent = await service.createOpenAIToolsAgent(selectedAgentConfig.options);
          break;
        case 'tool-calling':
          agent = await service.createToolCallingAgent(selectedAgentConfig.options);
          break;
        case 'xml':
          agent = await service.createXmlAgent(selectedAgentConfig.options);
          break;
        case 'react':
          agent = await service.createReactAgent(selectedAgentConfig.options);
          break;
        case 'json':
          agent = await service.createJsonAgent(selectedAgentConfig.options);
          break;
        case 'openapi':
          agent = await service.createOpenApiAgent(selectedAgentConfig.options);
          break;
        case 'vectorstore':
          agent = await service.createVectorStoreAgent(selectedAgentConfig.options);
          break;
        case 'vectorstore-router':
          agent = await service.createVectorStoreRouterAgent(selectedAgentConfig.options);
          break;
        default:
          throw new Error(`Unknown agent type: ${selectedAgentConfig.type}`);
      }

      const result = await service.runAgent(agent, input);
      const executionTime = Date.now() - startTime;

      const agentResult: AgentResult = {
        name: selectedAgent,
        result,
        success: true,
        executionTime,
      };

      setResults(prev => [...prev, agentResult]);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const agentResult: AgentResult = {
        name: selectedAgent,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        executionTime,
      };

      setResults(prev => [...prev, agentResult]);
    } finally {
      setIsLoading(false);
    }
  }, [service, selectedAgent, input, agents]);

  // 全エージェント実行
  const runAllAgents = useCallback(async () => {
    if (!service || !input.trim() || agents.length === 0) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const agentExecutors = [];
      
      for (const agentConfig of agents) {
        let agent;
        switch (agentConfig.type) {
          case 'basic':
            agent = await service.createBasicAgent(agentConfig.options);
            break;
          case 'chat':
            agent = await service.createChatAgent(agentConfig.options);
            break;
          case 'chat-conversational':
            agent = await service.createChatConversationalAgent(agentConfig.options);
            break;
          case 'zero-shot':
            agent = await service.createZeroShotAgent(agentConfig.options);
            break;
          case 'structured-chat':
            agent = await service.createStructuredChatAgent(agentConfig.options);
            break;
          case 'openai-functions':
            agent = await service.createOpenAIFunctionsAgent(agentConfig.options);
            break;
          case 'openai-tools':
            agent = await service.createOpenAIToolsAgent(agentConfig.options);
            break;
          case 'tool-calling':
            agent = await service.createToolCallingAgent(agentConfig.options);
            break;
          case 'xml':
            agent = await service.createXmlAgent(agentConfig.options);
            break;
          case 'react':
            agent = await service.createReactAgent(agentConfig.options);
            break;
          case 'json':
            agent = await service.createJsonAgent(agentConfig.options);
            break;
          case 'openapi':
            agent = await service.createOpenApiAgent(agentConfig.options);
            break;
          case 'vectorstore':
            agent = await service.createVectorStoreAgent(agentConfig.options);
            break;
          case 'vectorstore-router':
            agent = await service.createVectorStoreRouterAgent(agentConfig.options);
            break;
          default:
            continue;
        }
        
        agentExecutors.push({ name: agentConfig.name, agent });
      }

      const results = await service.runMultipleAgents(agentExecutors, input);
      const executionTime = Date.now() - startTime;

      const agentResults: AgentResult[] = results.map(result => ({
        ...result,
        executionTime,
      }));

      setResults(prev => [...prev, ...agentResults]);
    } catch (error) {
      console.error('Run all agents error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [service, input, agents]);

  // エージェント削除
  const deleteAgent = useCallback((agentName: string) => {
    setAgents(prev => prev.filter(a => a.name !== agentName));
    if (selectedAgent === agentName) {
      setSelectedAgent('');
    }
  }, [selectedAgent]);

  // 結果クリア
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🤖 LangChain Agents Interface</span>
            <Badge variant="secondary">Experimental</Badge>
          </CardTitle>
          <CardDescription>
            LangChain.jsの様々なエージェントを作成・実行できます
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">エージェント作成</TabsTrigger>
          <TabsTrigger value="execute">エージェント実行</TabsTrigger>
          <TabsTrigger value="results">実行結果</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>新しいエージェントを作成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelType">モデルタイプ</Label>
                  <Select
                    value={newAgentConfig.modelType}
                    onValueChange={(value) => setNewAgentConfig(prev => ({ ...prev, modelType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelName">モデル名</Label>
                  <Input
                    id="modelName"
                    value={newAgentConfig.modelName || ''}
                    onChange={(e) => setNewAgentConfig(prev => ({ ...prev, modelName: e.target.value }))}
                    placeholder="モデル名を入力"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={newAgentConfig.temperature || 0}
                    onChange={(e) => setNewAgentConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">最大トークン数</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    value={newAgentConfig.maxTokens || 1000}
                    onChange={(e) => setNewAgentConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={newAgentConfig.apiKey || ''}
                    onChange={(e) => setNewAgentConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="API Keyを入力"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={newAgentConfig.baseUrl || ''}
                    onChange={(e) => setNewAgentConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="Base URLを入力"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentType">エージェントタイプ</Label>
                  <Select
                    value={newAgentConfig.modelType}
                    onValueChange={(value) => setNewAgentConfig(prev => ({ ...prev, modelType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {agentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxIterations">最大反復回数</Label>
                  <Input
                    id="maxIterations"
                    type="number"
                    min="1"
                    max="50"
                    value={newAgentOptions.maxIterations || 10}
                    onChange={(e) => setNewAgentOptions(prev => ({ ...prev, maxIterations: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="verbose"
                  type="checkbox"
                  checked={newAgentOptions.verbose || false}
                  onChange={(e) => setNewAgentOptions(prev => ({ ...prev, verbose: e.target.checked }))}
                />
                <Label htmlFor="verbose">詳細ログ出力</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="returnIntermediateSteps"
                  type="checkbox"
                  checked={newAgentOptions.returnIntermediateSteps || false}
                  onChange={(e) => setNewAgentOptions(prev => ({ ...prev, returnIntermediateSteps: e.target.checked }))}
                />
                <Label htmlFor="returnIntermediateSteps">中間ステップを返す</Label>
              </div>

              <Button
                onClick={createAgent}
                disabled={isCreating || !newAgentConfig.apiKey}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <CircleSpinner className="mr-2" />
                    エージェント作成中
                  </>
                ) : (
                  'エージェントを作成'
                )}
              </Button>
            </CardContent>
          </Card>

          {agents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>作成済みエージェント</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-500">
                          {agent.type} - {agent.config.modelType}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAgent(agent.name)}
                      >
                        削除
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="execute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>エージェント実行</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentSelect">エージェント選択</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="エージェントを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.name} value={agent.name}>
                        {agent.name} ({agent.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="input">入力</Label>
                <Input
                  id="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="エージェントに入力するテキストを入力してください"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={runAgent}
                  disabled={isLoading || !selectedAgent || !input.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <CircleSpinner size="sm" className="mr-2" />
                      実行中
                    </>
                  ) : (
                    'エージェント実行'
                  )}
                </Button>

                <Button
                  onClick={runAllAgents}
                  disabled={isLoading || agents.length === 0 || !input.trim()}
                  variant="outline"
                >
                  全エージェント実行
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>実行結果</CardTitle>
                <Button variant="outline" size="sm" onClick={clearResults}>
                  結果をクリア
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  実行結果がありません
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{result.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? '成功' : '失敗'}
                          </Badge>
                          {result.executionTime && (
                            <Badge variant="outline">
                              {result.executionTime}ms
                            </Badge>
                          )}
                        </div>
                      </div>

                      {result.success ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">出力:</div>
                          <pre className="text-sm bg-white p-2 rounded border overflow-auto max-h-40">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          エラー: {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LangChainAgentsInterface;
