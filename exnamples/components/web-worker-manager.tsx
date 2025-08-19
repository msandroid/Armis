"use client"

import { useEffect, useRef } from "react"

interface WebWorkerManagerProps {
  editor: any
  language: string
  onWorkerMessage?: (message: any) => void
}

export function WebWorkerManager({ 
  editor, 
  language, 
  onWorkerMessage 
}: WebWorkerManagerProps) {
  const workerRef = useRef<Worker | null>(null)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor || !language) return

    // Web Workerの作成
    createLanguageWorker(language)
  }, [editor, language])

  const createLanguageWorker = (lang: string) => {
    try {
      // 言語別のWeb Workerを作成
      const workerCode = getWorkerCode(lang)
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)
      
      workerRef.current = new Worker(workerUrl)
      
      // メッセージハンドラーの設定
      workerRef.current.onmessage = (event) => {
        handleWorkerMessage(event.data)
      }
      
      // エラーハンドラーの設定
      workerRef.current.onerror = (error) => {
        console.error('Web Worker error:', error)
      }
      
      // 初期化メッセージの送信
      workerRef.current.postMessage({
        type: 'init',
        language: lang,
        config: {
          // 言語固有の設定
        }
      })
      
    } catch (error) {
      console.error('Failed to create Web Worker:', error)
    }
  }

  const getWorkerCode = (lang: string): string => {
    // 言語別のWorkerコード
    const baseWorkerCode = `
      self.onmessage = function(e) {
        const { type, data, language } = e.data;
        
        switch (type) {
          case 'init':
            console.log('Language worker initialized for:', language);
            break;
            
          case 'validate':
            const problems = validateCode(data.code, language);
            self.postMessage({
              type: 'validation',
              problems: problems
            });
            break;
            
          case 'completion':
            const suggestions = getCompletions(data.code, data.position, language);
            self.postMessage({
              type: 'completion',
              suggestions: suggestions
            });
            break;
            
          case 'definition':
            const definitions = findDefinitions(data.code, data.position, language);
            self.postMessage({
              type: 'definition',
              definitions: definitions
            });
            break;
            
          case 'references':
            const references = findReferences(data.code, data.position, language);
            self.postMessage({
              type: 'references',
              references: references
            });
            break;
            
          default:
            console.log('Unknown message type:', type);
        }
      };
      
      function validateCode(code, language) {
        const problems = [];
        const lines = code.split('\\n');
        
        lines.forEach((line, lineIndex) => {
          // 言語固有の検証ロジック
          if (language === 'javascript' || language === 'typescript') {
            // JavaScript/TypeScript固有の検証
            if (line.includes('const ') && !line.includes('console.log') && !line.includes('return')) {
              const match = line.match(/const\\s+(\\w+)/);
              if (match && !code.includes(match[1])) {
                problems.push({
                  id: \`unused-\${lineIndex}\`,
                  type: 'warning',
                  message: \`未使用の変数 '\${match[1]}'\`,
                  line: lineIndex + 1,
                  column: line.indexOf(match[1]) + 1,
                  source: 'TypeScript'
                });
              }
            }
            
            if (line.includes('function') && !line.includes('{')) {
              problems.push({
                id: \`syntax-\${lineIndex}\`,
                type: 'error',
                message: '関数の構文が不完全です',
                line: lineIndex + 1,
                column: 1,
                source: 'TypeScript'
              });
            }
          }
        });
        
        return problems;
      }
      
      function getCompletions(code, position, language) {
        const suggestions = [];
        
        if (language === 'javascript' || language === 'typescript') {
          // JavaScript/TypeScript固有の補完
          suggestions.push(
            { label: 'console.log', kind: 'function', detail: 'console.log()' },
            { label: 'function', kind: 'keyword', detail: 'function declaration' },
            { label: 'const', kind: 'keyword', detail: 'const declaration' },
            { label: 'let', kind: 'keyword', detail: 'let declaration' },
            { label: 'var', kind: 'keyword', detail: 'var declaration' }
          );
        }
        
        return suggestions;
      }
      
      function findDefinitions(code, position, language) {
        const definitions = [];
        const lines = code.split('\\n');
        
        // 簡易的な定義検索
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('function') || line.includes('const') || line.includes('let') || line.includes('var')) {
            definitions.push({
              line: i + 1,
              column: 1,
              file: 'current',
              content: line.trim()
            });
          }
        }
        
        return definitions;
      }
      
      function findReferences(code, position, language) {
        const references = [];
        const lines = code.split('\\n');
        
        // 簡易的な参照検索
        lines.forEach((line, lineIndex) => {
          if (line.includes('function') || line.includes('const') || line.includes('let') || line.includes('var')) {
            references.push({
              line: lineIndex + 1,
              column: 1,
              file: 'current',
              content: line.trim()
            });
          }
        });
        
        return references;
      }
    `

    return baseWorkerCode
  }

  const handleWorkerMessage = (message: any) => {
    switch (message.type) {
      case 'validation':
        // バリデーション結果の処理
        console.log('Validation problems:', message.problems)
        onWorkerMessage?.(message)
        break
        
      case 'completion':
        // 補完結果の処理
        console.log('Completion suggestions:', message.suggestions)
        onWorkerMessage?.(message)
        break
        
      case 'definition':
        // 定義検索結果の処理
        console.log('Definitions found:', message.definitions)
        onWorkerMessage?.(message)
        break
        
      case 'references':
        // 参照検索結果の処理
        console.log('References found:', message.references)
        onWorkerMessage?.(message)
        break
        
      default:
        console.log('Unknown worker message:', message)
    }
  }

  const sendMessageToWorker = (type: string, data: any) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type,
        data,
        language
      })
    }
  }

  const validateCode = (code: string) => {
    sendMessageToWorker('validate', { code })
  }

  const getCompletions = (code: string, position: any) => {
    sendMessageToWorker('completion', { code, position })
  }

  const findDefinitions = (code: string, position: any) => {
    sendMessageToWorker('definition', { code, position })
  }

  const findReferences = (code: string, position: any) => {
    sendMessageToWorker('references', { code, position })
  }

  useEffect(() => {
    return () => {
      // クリーンアップ
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  return null
}

// エクスポート用のユーティリティ関数
export const createLanguageWorker = (language: string): Worker | null => {
  try {
    const workerCode = `
      self.onmessage = function(e) {
        console.log('Worker received:', e.data);
        // 言語固有の処理をここに実装
      };
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    return new Worker(workerUrl)
  } catch (error) {
    console.error('Failed to create language worker:', error)
    return null
  }
} 