import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Play, Square, Settings, Wrench, Server, Brain } from 'lucide-react';
import { LangChainMCPAdapter, MultiServerMCPClient, LLMConfig } from '../services/langchain-mcp-adapter';
import { LangGraphMCPAdapter } from '../services/langchain-mcp-langgraph-adapter';
import { PlaywrightMCPAdapter, PlaywrightMCPConfig } from '../services/playwright-mcp-adapter';

interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
}

interface MCPIntegrationProps {
  className?: string;
}

export function MCPIntegration({ className }: MCPIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolInput, setToolInput] = useState<string>('');
  const [toolResult, setToolResult] = useState<string>('');
  const [agentInput, setAgentInput] = useState<string>('');
  const [agentResult, setAgentResult] = useState<string>('');
  const [agentType, setAgentType] = useState<'langchain' | 'langgraph' | 'playwright'>('langchain');
  const [llmType, setLlmType] = useState<'openai' | 'ollama'>('openai');
  const [ollamaModel, setOllamaModel] = useState<string>('gemma3:1b');
  const [logs, setLogs] = useState<string[]>([]);
  const [adapter, setAdapter] = useState<LangChainMCPAdapter | null>(null);
  const [langGraphAdapter, setLangGraphAdapter] = useState<LangGraphMCPAdapter | null>(null);
  const [playwrightAdapter, setPlaywrightAdapter] = useState<PlaywrightMCPAdapter | null>(null);

  // ログを追加する関数
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // モックMCPセッションを作成
  const createMockSession = () => {
    return {
      listTools: async () => ({
        tools: [
          {
            name: 'echo',
            description: 'Echo a message',
            inputSchema: {
              type: 'object',
              properties: { message: { type: 'string' } },
              required: ['message']
            }
          },
          {
            name: 'add',
            description: 'Add two numbers',
            inputSchema: {
              type: 'object',
              properties: { 
                a: { type: 'number' },
                b: { type: 'number' }
              },
              required: ['a', 'b']
            }
          },
          {
            name: 'getTime',
            description: 'Get current time',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'reverse',
            description: 'Reverse a string',
            inputSchema: {
              type: 'object',
              properties: { text: { type: 'string' } },
              required: ['text']
            }
          }
        ]
      }),
      callTool: async (name: string, args: any) => {
        if (name === 'echo') {
          return { content: [{ type: 'text', text: `Echo: ${args.message}` }] };
        } else if (name === 'add') {
          return { content: [{ type: 'text', text: `${args.a} + ${args.b} = ${args.a + args.b}` }] };
        } else if (name === 'getTime') {
          return { content: [{ type: 'text', text: `Current time: ${new Date().toLocaleString()}` }] };
        } else if (name === 'reverse') {
          return { content: [{ type: 'text', text: `Reversed: ${args.text.split('').reverse().join('')}` }] };
        }
        throw new Error(`Unknown tool: ${name}`);
      },
      close: async () => {}
    };
  };

  // MCPサーバーに接続
  const connectToMCPServer = async () => {
    setIsLoading(true);
    addLog('Connecting to MCP server...');

    try {
      const mockSession = createMockSession();
      const newAdapter = new LangChainMCPAdapter(mockSession as any);
      const newLangGraphAdapter = new LangGraphMCPAdapter(mockSession as any);

      // 利用可能なツールを取得
      const tools = await newAdapter.listAvailableTools();
      addLog(`Found ${tools.length} available tools`);

      // ツールの詳細情報を取得
      const toolsList = await newAdapter.convertMCPToolsToLangChain();
      setAvailableTools(toolsList.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: (tool as any).schema
      })));

      // Playwright MCPアダプターを作成
      const playwrightAdapterInstance = new PlaywrightMCPAdapter({
        headless: true,
        browser: 'chromium',
        viewport: { width: 1280, height: 720 }
      });

      setAdapter(newAdapter);
      setLangGraphAdapter(newLangGraphAdapter);
      setPlaywrightAdapter(playwrightAdapterInstance);
      setIsConnected(true);
      addLog('Successfully connected to MCP server');
    } catch (error) {
      addLog(`Error connecting to MCP server: ${error}`);
      console.error('Connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // MCPサーバーから切断
  const disconnectFromMCPServer = async () => {
    setIsLoading(true);
    addLog('Disconnecting from MCP server...');

    try {
      if (adapter) {
        await adapter.close();
      }
      if (langGraphAdapter) {
        await langGraphAdapter.close();
      }
      if (playwrightAdapter) {
        await playwrightAdapter.close();
      }
      setIsConnected(false);
      setAvailableTools([]);
      setAdapter(null);
      setLangGraphAdapter(null);
      setPlaywrightAdapter(null);
      addLog('Successfully disconnected from MCP server');
    } catch (error) {
      addLog(`Error disconnecting: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ツールを実行
  const executeTool = async () => {
    if (!selectedTool || !adapter) return;

    setIsLoading(true);
    addLog(`Executing tool: ${selectedTool}`);

    try {
      let inputObj: any;
      try {
        inputObj = JSON.parse(toolInput);
      } catch {
        addLog('Invalid JSON input, treating as plain text');
        inputObj = { message: toolInput };
      }

      const result = await adapter.callMCPTool(selectedTool, inputObj);
      const resultText = result.content?.[0]?.text || JSON.stringify(result);
      setToolResult(resultText);
      addLog(`Tool execution completed: ${resultText}`);
    } catch (error) {
      const errorMessage = `Error executing tool: ${error}`;
      setToolResult(errorMessage);
      addLog(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // エージェントを実行
  const executeAgent = async () => {
    if (!agentInput || (!adapter && !langGraphAdapter && !playwrightAdapter)) return;

    setIsLoading(true);
    addLog(`Executing ${agentType} agent with ${llmType}...`);

    try {
      if (agentType === 'langchain' && adapter) {
        // LLM設定を作成
        let llmConfig: LLMConfig | undefined;
        
        if (llmType === 'ollama') {
          llmConfig = {
            type: 'ollama',
            modelName: ollamaModel,
            baseUrl: 'http://localhost:11434',
            temperature: 0.1
          };
        } else {
          llmConfig = {
            type: 'openai',
            modelName: 'gpt-3.5-turbo',
            temperature: 0
          };
        }

        // LangChainエージェントを実行
        const agent = await adapter.createReactAgentWithMCPTools(llmConfig);
        const result = await agent.invoke({ input: agentInput });
        setAgentResult(result.output);
        addLog(`LangChain agent completed: ${result.output}`);
      } else if (agentType === 'langgraph' && langGraphAdapter) {
        // LangGraphエージェントを実行
        const graph = await langGraphAdapter.createLangGraphAgentWithMCPTools();
        const result = await graph.invoke({
          messages: [{ role: 'user', content: agentInput }]
        });
        const resultText = result.messages?.[result.messages.length - 1]?.content || JSON.stringify(result);
        setAgentResult(resultText);
        addLog(`LangGraph agent completed: ${resultText}`);
      } else if (agentType === 'playwright' && playwrightAdapter) {
        // Playwright MCPエージェントを実行
        try {
          // Playwright MCPサーバーに接続
          await playwrightAdapter.connect();
          addLog('Connected to Playwright MCP server');

          // LLM設定を作成
          let llmConfig: any;
          
          if (llmType === 'ollama') {
            llmConfig = {
              type: 'ollama',
              modelName: ollamaModel,
              baseUrl: 'http://localhost:11434',
              temperature: 0.1
            };
          } else {
            llmConfig = {
              type: 'openai',
              modelName: 'gpt-3.5-turbo',
              temperature: 0
            };
          }

          // Playwright MCPエージェントを実行
          const agent = await playwrightAdapter.createReactAgentWithPlaywrightTools(llmConfig);
          const result = await agent.invoke({ input: agentInput });
          setAgentResult(result.output);
          addLog(`Playwright MCP agent completed: ${result.output}`);
        } finally {
          // Playwrightセッションを閉じる
          await playwrightAdapter.close();
        }
      }
    } catch (error) {
      const errorMessage = `Error executing agent: ${error}`;
      setAgentResult(errorMessage);
      addLog(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ログをクリア
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            MCP Server Connection
          </CardTitle>
          <CardDescription>
            Connect to MCP servers and manage tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={isConnected ? disconnectFromMCPServer : connectToMCPServer}
              disabled={isLoading}
              variant={isConnected ? "destructive" : "default"}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isConnected ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          {availableTools.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Available Tools ({availableTools.length})</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableTools.map((tool) => (
                  <Badge key={tool.name} variant="outline" className="justify-start">
                    <Wrench className="h-3 w-3 mr-1" />
                    {tool.name}: {tool.description}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tool Execution
              </CardTitle>
              <CardDescription>
                Execute individual MCP tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tool-select">Select Tool</Label>
                  <Select value={selectedTool} onValueChange={setSelectedTool}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a tool" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTools.map((tool) => (
                        <SelectItem key={tool.name} value={tool.name}>
                          {tool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tool-input">Input (JSON format)</Label>
                  <Input
                    id="tool-input"
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    placeholder='{"message": "Hello World"} or {"a": 5, "b": 3}'
                  />
                </div>
              </div>

              <Button onClick={executeTool} disabled={!selectedTool || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Execute Tool
              </Button>

              {toolResult && (
                <div className="space-y-2">
                  <Label>Result</Label>
                  <Textarea value={toolResult} readOnly className="min-h-[100px]" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Agent Execution
              </CardTitle>
              <CardDescription>
                Execute LangChain or LangGraph agents with MCP tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-type">Agent Type</Label>
                  <Select value={agentType} onValueChange={(value: 'langchain' | 'langgraph' | 'playwright') => setAgentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="langchain">LangChain React Agent</SelectItem>
                      <SelectItem value="langgraph">LangGraph Agent</SelectItem>
                      <SelectItem value="playwright">Playwright MCP Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm-type">LLM Type</Label>
                  <Select value={llmType} onValueChange={(value: 'openai' | 'ollama') => setLlmType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {llmType === 'ollama' && (
                  <div className="space-y-2">
                    <Label htmlFor="ollama-model">Ollama Model</Label>
                    <Select value={ollamaModel} onValueChange={setOllamaModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemma3:1b">Gemma 3:1B</SelectItem>
                        <SelectItem value="gemma3:4b">Gemma 3:4B</SelectItem>
                        <SelectItem value="phi3:3.8b">Phi 3:3.8B</SelectItem>
                        <SelectItem value="qwen3:1.7b">Qwen 3:1.7B</SelectItem>
                        <SelectItem value="qwen3:4b">Qwen 3:4B</SelectItem>
                        <SelectItem value="gpt-oss:20b">GPT-OSS 20B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-input">Agent Input</Label>
                <Input
                  id="agent-input"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="Ask the agent to perform tasks using available tools"
                />
              </div>

              <Button onClick={executeAgent} disabled={!agentInput || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Execute Agent
              </Button>

              {agentResult && (
                <div className="space-y-2">
                  <Label>Agent Result</Label>
                  <Textarea value={agentResult} readOnly className="min-h-[100px]" />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Execution Logs
          </CardTitle>
          <CardDescription>
            View execution logs and debug information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Label>Logs ({logs.length})</Label>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No logs yet. Connect to a server to see activity.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
