"use client"

import { useEffect, useRef, useState } from "react"

interface CodeLensItem {
  id: string
  line: number
  column: number
  text: string
  command?: {
    id: string
    title: string
    arguments?: any[]
  }
  references?: number
  implementations?: number
  definitions?: number
}

interface CodeLensProps {
  editor: any
  enabled?: boolean
  onCodeLensClick?: (item: CodeLensItem) => void
}

export function CodeLens({ 
  editor, 
  enabled = true, 
  onCodeLensClick 
}: CodeLensProps) {
  const [codeLensItems, setCodeLensItems] = useState<CodeLensItem[]>([])
  const decorationsRef = useRef<string[]>([])
  const editorRef = useRef<any>(null)

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor || !enabled) return

    const model = editor.getModel()
    if (!model) return

    // モデル変更時のCodeLens更新
    const disposable = model.onDidChangeContent(() => {
      updateCodeLens(model)
    })

    // 初期化
    updateCodeLens(model)

    return () => {
      disposable.dispose()
      clearCodeLens()
    }
  }, [editor, enabled])

  const updateCodeLens = (model: any) => {
    // 既存のCodeLensをクリア
    clearCodeLens()

    if (!enabled) return

    // CodeLensアイテムを検出
    const items = detectCodeLensItems(model)
    setCodeLensItems(items)

    // CodeLens装飾を適用
    applyCodeLensDecorations(model, items)
  }

  const detectCodeLensItems = (model: any): CodeLensItem[] => {
    const items: CodeLensItem[] = []
    const lines = model.getLinesContent()

    lines.forEach((line: string, lineIndex: number) => {
      const lineNumber = lineIndex + 1

      // 関数定義の検出
      const functionMatches = line.match(/(?:function\s+)?(\w+)\s*\(/g)
      if (functionMatches) {
        functionMatches.forEach((match, index) => {
          const functionName = match.replace(/(?:function\s+)?(\w+)\s*\(/, '$1')
          const column = line.indexOf(functionName) + 1
          
          items.push({
            id: `function-${lineNumber}-${index}`,
            line: lineNumber,
            column: column,
            text: `function ${functionName}`,
            command: {
              id: 'editor.action.revealDefinition',
              title: '定義を表示',
              arguments: [functionName]
            },
            references: countReferences(model, functionName),
            implementations: 0,
            definitions: 1
          })
        })
      }

      // クラス定義の検出
      const classMatches = line.match(/class\s+(\w+)/g)
      if (classMatches) {
        classMatches.forEach((match, index) => {
          const className = match.replace(/class\s+(\w+)/, '$1')
          const column = line.indexOf(className) + 1
          
          items.push({
            id: `class-${lineNumber}-${index}`,
            line: lineNumber,
            column: column,
            text: `class ${className}`,
            command: {
              id: 'editor.action.revealDefinition',
              title: '定義を表示',
              arguments: [className]
            },
            references: countReferences(model, className),
            implementations: 0,
            definitions: 1
          })
        })
      }

      // インターフェース定義の検出
      const interfaceMatches = line.match(/interface\s+(\w+)/g)
      if (interfaceMatches) {
        interfaceMatches.forEach((match, index) => {
          const interfaceName = match.replace(/interface\s+(\w+)/, '$1')
          const column = line.indexOf(interfaceName) + 1
          
          items.push({
            id: `interface-${lineNumber}-${index}`,
            line: lineNumber,
            column: column,
            text: `interface ${interfaceName}`,
            command: {
              id: 'editor.action.revealDefinition',
              title: '定義を表示',
              arguments: [interfaceName]
            },
            references: countReferences(model, interfaceName),
            implementations: countImplementations(model, interfaceName),
            definitions: 1
          })
        })
      }

      // 変数定義の検出
      const variableMatches = line.match(/(?:const|let|var)\s+(\w+)/g)
      if (variableMatches) {
        variableMatches.forEach((match, index) => {
          const variableName = match.replace(/(?:const|let|var)\s+(\w+)/, '$1')
          const column = line.indexOf(variableName) + 1
          
          items.push({
            id: `variable-${lineNumber}-${index}`,
            line: lineNumber,
            column: column,
            text: `variable ${variableName}`,
            command: {
              id: 'editor.action.revealDefinition',
              title: '定義を表示',
              arguments: [variableName]
            },
            references: countReferences(model, variableName),
            implementations: 0,
            definitions: 1
          })
        })
      }
    })

    return items
  }

  const countReferences = (model: any, symbol: string): number => {
    const lines = model.getLinesContent()
    let count = 0
    
    lines.forEach((line: string) => {
      const regex = new RegExp(`\\b${symbol}\\b`, 'g')
      const matches = line.match(regex)
      if (matches) {
        count += matches.length
      }
    })
    
    return count
  }

  const countImplementations = (model: any, interfaceName: string): number => {
    const lines = model.getLinesContent()
    let count = 0
    
    lines.forEach((line: string) => {
      if (line.includes(`implements ${interfaceName}`) || line.includes(`extends ${interfaceName}`)) {
        count++
      }
    })
    
    return count
  }

  const applyCodeLensDecorations = (model: any, items: CodeLensItem[]) => {
    const decorations: any[] = []

    items.forEach(item => {
      const referencesText = item.references ? ` ${item.references} 参照` : ''
      const implementationsText = item.implementations ? ` ${item.implementations} 実装` : ''
      const definitionsText = item.definitions ? ` ${item.definitions} 定義` : ''
      
      const lensText = `${referencesText}${implementationsText}${definitionsText}`.trim()

      if (lensText) {
        decorations.push({
          range: {
            startLineNumber: item.line,
            startColumn: 1,
            endLineNumber: item.line,
            endColumn: 1
          },
          options: {
            after: {
              content: lensText,
              color: '#6A9955',
              backgroundColor: '#1E1E1E',
              margin: '0 0 0 10px',
              fontStyle: 'italic',
              fontSize: '12px'
            },
            hoverMessage: {
              value: `${item.text}${lensText}`
            }
          }
        })
      }
    })

    // 装飾を適用
    if (decorations.length > 0) {
      const decorationIds = model.deltaDecorations([], decorations)
      decorationsRef.current = decorationIds
    }
  }

  const clearCodeLens = () => {
    if (editor && decorationsRef.current.length > 0) {
      const model = editor.getModel()
      if (model) {
        model.deltaDecorations(decorationsRef.current, [])
        decorationsRef.current = []
      }
    }
  }

  const handleCodeLensClick = (item: CodeLensItem) => {
    if (item.command) {
      onCodeLensClick?.(item)
      
      // コマンド実行
      switch (item.command.id) {
        case 'editor.action.revealDefinition':
          revealDefinition(item.command.arguments?.[0])
          break
        case 'editor.action.findReferences':
          findReferences(item.command.arguments?.[0])
          break
        case 'editor.action.findImplementations':
          findImplementations(item.command.arguments?.[0])
          break
      }
    }
  }

  const revealDefinition = (symbol: string) => {
    if (!editor) return
    
    const model = editor.getModel()
    if (!model) return

    const lines = model.getLinesContent()
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const definitionPatterns = [
        new RegExp(`(?:function|const|let|var|class|interface)\\s+${symbol}\\b`),
        new RegExp(`\\b${symbol}\\s*[:=]`),
        new RegExp(`\\b${symbol}\\s*\\(`)
      ]

      for (const pattern of definitionPatterns) {
        if (pattern.test(line)) {
          editor.setPosition({
            lineNumber: i + 1,
            column: line.indexOf(symbol) + 1
          })
          editor.revealLine(i + 1)
          return
        }
      }
    }
  }

  const findReferences = (symbol: string) => {
    if (!editor) return
    
    const model = editor.getModel()
    if (!model) return

    const lines = model.getLinesContent()
    const references: any[] = []
    
    lines.forEach((line: string, lineIndex: number) => {
      const wordRegex = new RegExp(`\\b${symbol}\\b`, 'g')
      let match
      
      while ((match = wordRegex.exec(line)) !== null) {
        references.push({
          line: lineIndex + 1,
          column: match.index + 1,
          file: 'current',
          context: line.trim()
        })
      }
    })

    console.log(`Found ${references.length} references for ${symbol}`)
  }

  const findImplementations = (interfaceName: string) => {
    if (!editor) return
    
    const model = editor.getModel()
    if (!model) return

    const lines = model.getLinesContent()
    const implementations: any[] = []
    
    lines.forEach((line: string, lineIndex: number) => {
      if (line.includes(`implements ${interfaceName}`) || line.includes(`extends ${interfaceName}`)) {
        implementations.push({
          line: lineIndex + 1,
          column: 1,
          file: 'current',
          context: line.trim()
        })
      }
    })

    console.log(`Found ${implementations.length} implementations for ${interfaceName}`)
  }

  const getCodeLensItems = (): CodeLensItem[] => {
    return [...codeLensItems]
  }

  const refreshCodeLens = () => {
    if (editor) {
      const model = editor.getModel()
      if (model) {
        updateCodeLens(model)
      }
    }
  }

  return null
}

// ユーティリティ関数
export const createCodeLens = (
  editor: any, 
  options: {
    enabled?: boolean
    onCodeLensClick?: (item: CodeLensItem) => void
  } = {}
) => {
  const { enabled = true, onCodeLensClick } = options
  
  return {
    enable: () => {
      console.log('CodeLens enabled')
    },
    disable: () => {
      console.log('CodeLens disabled')
    },
    refresh: () => {
      console.log('CodeLens refreshed')
    },
    getItems: () => {
      return []
    }
  }
}

// デフォルトエクスポート
export default CodeLens 