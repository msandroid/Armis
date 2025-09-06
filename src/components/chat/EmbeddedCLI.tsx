import React, { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmbeddedCLIProps {
  className?: string
  onClose?: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
  fontSettings?: {
    fontFamily: string
    fontSize: number
    fontLigatures: boolean
  }
}

export const EmbeddedCLI: React.FC<EmbeddedCLIProps> = ({
  className,
  onClose,
  isMinimized = false,
  onToggleMinimize,
  fontSettings
}) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTerminalInitialized, setIsTerminalInitialized] = useState(false)

  // ターミナルの初期化
  useEffect(() => {
    if (!terminalRef.current || isMinimized) {
      setIsTerminalInitialized(false)
      return
    }

    // 既存のターミナルインスタンスをクリーンアップ
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.dispose()
      terminalInstanceRef.current = null
    }

    let terminal: Terminal | null = null
    let fitAddon: FitAddon | null = null

    try {
      // フォント設定のデフォルト値
      const defaultFontSettings = {
        fontFamily: '"Cascadia Code", "Cascadia Mono", Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: 12,
        fontLigatures: true
      }

      // フォント設定を適用
      const currentFontSettings = fontSettings || defaultFontSettings
      const fontFamily = currentFontSettings.fontFamily.startsWith('"') 
        ? currentFontSettings.fontFamily 
        : `"${currentFontSettings.fontFamily}", monospace`

      // ターミナルインスタンスを作成
      terminal = new Terminal({
        cursorBlink: true,
        fontSize: currentFontSettings.fontSize,
        fontFamily: fontFamily,
        fontLigatures: currentFontSettings.fontLigatures,
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
          cursor: '#ffffff',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#ffffff'
        },
        rows: 15,
        cols: 80
      })

      fitAddon = new FitAddon()
      const webLinksAddon = new WebLinksAddon()

      terminal.loadAddon(fitAddon)
      terminal.loadAddon(webLinksAddon)

      // ターミナルをDOMにマウント
      if (terminalRef.current) {
        terminal.open(terminalRef.current)
        
        // 少し遅延させてからfitを実行（DOMの準備が整うのを待つ）
        setTimeout(() => {
          if (fitAddon && terminal && terminalRef.current) {
            try {
              fitAddon.fit()
            } catch (error) {
              console.warn('FitAddon fit failed:', error)
            }
          }
        }, 100)
      }

      // 初期メッセージを表示
      if (terminal) {
        terminal.writeln('')

        // プロンプトを表示
        writePrompt(terminal)

        // 入力処理
        let currentLine = ''
                 terminal.onData((data) => {
           if (!terminal) return
           
           if (data === '\r') {
             // Enter key pressed
             terminal.writeln('')
             handleCommand(currentLine, terminal)
             currentLine = ''
             writePrompt(terminal)
           } else if (data === '\u007f') {
             // Backspace
             if (currentLine.length > 0) {
               currentLine = currentLine.slice(0, -1)
               terminal.write('\b \b')
             }
           } else if (data >= ' ') {
             // Printable character
             currentLine += data
             terminal.write(data)
           }
         })
      }

      terminalInstanceRef.current = terminal
      fitAddonRef.current = fitAddon
      setIsTerminalInitialized(true)

    } catch (error) {
      console.error('Failed to initialize terminal:', error)
      setIsTerminalInitialized(false)
    }

    // リサイズ処理
    const handleResize = () => {
      if (fitAddon && terminal && isTerminalInitialized && terminalRef.current) {
        try {
          fitAddon.fit()
        } catch (error) {
          console.warn('Resize fit failed:', error)
        }
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (terminal) {
        try {
          terminal.dispose()
        } catch (error) {
          console.warn('Terminal disposal failed:', error)
        }
      }
      terminalInstanceRef.current = null
      fitAddonRef.current = null
      setIsTerminalInitialized(false)
    }
  }, [isMinimized, isTerminalInitialized, fontSettings])

  // ターミナルのクリーンアップ（コンポーネントアンマウント時）
  useEffect(() => {
    return () => {
      if (terminalInstanceRef.current) {
        try {
          terminalInstanceRef.current.dispose()
        } catch (error) {
          console.warn('Terminal cleanup failed:', error)
        }
        terminalInstanceRef.current = null
      }
      fitAddonRef.current = null
      setIsTerminalInitialized(false)
    }
  }, [])

  const writePrompt = (terminal: Terminal) => {
    terminal.write('\x1b[1;32marmis\x1b[0m:\x1b[1;34m~\x1b[0m$ ')
  }

  const handleCommand = async (command: string, terminal: Terminal) => {
    const trimmedCommand = command.trim()
    
    if (!trimmedCommand) return

    // 組み込みコマンドの処理
    switch (trimmedCommand.toLowerCase()) {
      case 'help':
        terminal.writeln('\x1b[1;33mAvailable commands:\x1b[0m')
        terminal.writeln('  help     - Show this help message')
        terminal.writeln('  clear    - Clear the terminal')
        terminal.writeln('  status   - Show system status')
        terminal.writeln('  models   - List available AI models')
        terminal.writeln('  ollama   - Ollama commands')
        terminal.writeln('  chat     - Chat interface info')
        terminal.writeln('  exit     - Close terminal')
        break

      case 'clear':
        terminal.clear()
        break

      case 'status':
        terminal.writeln('\x1b[1;33mSystem Status:\x1b[0m')
        terminal.writeln(`  Connection: ${isConnected ? '\x1b[1;32mConnected\x1b[0m' : '\x1b[1;31mDisconnected\x1b[0m'}`)
        terminal.writeln(`  Ollama: ${isConnected ? '\x1b[1;32mRunning\x1b[0m' : '\x1b[1;31mNot running\x1b[0m'}`)
        break

      case 'models':
        terminal.writeln('\x1b[1;33mAvailable Models:\x1b[0m')
        terminal.writeln('  • gemma3:1b (Ollama)')
        terminal.writeln('  • gemini-2.5-flash-lite (Google)')
        terminal.writeln('  • gpt-4o (OpenAI)')
        terminal.writeln('  • claude-opus-4.1 (Anthropic)')
        break

      case 'ollama':
        terminal.writeln('\x1b[1;33mOllama Commands:\x1b[0m')
        terminal.writeln('  ollama list         - List installed models')
        terminal.writeln('  ollama pull <model> - Download a model')
        terminal.writeln('  ollama run gemma3:1b - Start gemma3:1b model')
        break

      case 'chat':
        terminal.writeln('\x1b[1;33mChat Commands:\x1b[0m')
        terminal.writeln('  Type your message in the chat input above')
        terminal.writeln('  Use "ollama run gemma3:1b" to enable Ollama models')
        break

      case 'exit':
        onClose?.()
        break

      default:
        // 外部コマンドの実行をシミュレート
        if (trimmedCommand.startsWith('ollama ')) {
          await handleOllamaCommand(trimmedCommand, terminal)
        } else {
          terminal.writeln(`\x1b[1;31mCommand not found: ${trimmedCommand}\x1b[0m`)
          terminal.writeln('Type "help" for available commands')
        }
        break
    }
  }

  const handleOllamaCommand = async (command: string, terminal: Terminal) => {
    const subCommand = command.replace('ollama ', '')
    
    switch (subCommand) {
      case 'list':
        setIsLoading(true)
        try {
          const response = await fetch('http://localhost:11434/api/tags')
          if (response.ok) {
            const data = await response.json()
            terminal.writeln('\x1b[1;33mInstalled Models:\x1b[0m')
            data.models.forEach((model: any) => {
              terminal.writeln(`  • ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`)
            })
            setIsConnected(true)
          } else {
            terminal.writeln('\x1b[1;31mFailed to connect to Ollama\x1b[0m')
            setIsConnected(false)
          }
        } catch (error) {
          terminal.writeln('\x1b[1;31mOllama is not running\x1b[0m')
          setIsConnected(false)
        } finally {
          setIsLoading(false)
        }
        break

      case 'run gemma3:1b':
        terminal.writeln('\x1b[1;33mStarting gemma3:1b model...\x1b[0m')
        terminal.writeln('\x1b[1;36mModel is ready! You can now use it in the chat.\x1b[0m')
        break

      case 'pull':
        terminal.writeln('\x1b[1;33mUsage: ollama pull <model-name>\x1b[0m')
        terminal.writeln('Example: ollama pull llama3.2:3b')
        break

      default:
        if (subCommand.startsWith('pull ')) {
          const modelName = subCommand.replace('pull ', '')
          terminal.writeln(`\x1b[1;33mPulling model: ${modelName}\x1b[0m`)
          terminal.writeln('\x1b[1;31mThis feature requires backend integration\x1b[0m')
        } else {
          terminal.writeln(`\x1b[1;31mUnknown ollama command: ${subCommand}\x1b[0m`)
        }
        break
    }
  }

  if (isMinimized) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TerminalIcon className="w-4 h-4" />
              CLI Terminal
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TerminalIcon className="w-4 h-4" />
            CLI Terminal
            {isLoading && <span className="text-xs text-muted-foreground">(Loading...)</span>}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="h-6 w-6 p-0"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={terminalRef} 
          className="w-full h-64 bg-black rounded-b-lg border border-gray-700"
        />
      </CardContent>
    </Card>
  )
}
