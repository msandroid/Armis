"use client"

import { useEffect, useRef } from "react"

interface BracketPair {
  open: { line: number; column: number }
  close: { line: number; column: number }
  level: number
}

interface BracketColorizationProps {
  editor: any
  enabled?: boolean
  colors?: string[]
  maxLevel?: number
}

const defaultColors = [
  '#FF6B6B', // 赤
  '#4ECDC4', // シアン
  '#45B7D1', // 青
  '#96CEB4', // 緑
  '#FFEAA7', // 黄
  '#DDA0DD'  // 紫
]

export function BracketColorization({ 
  editor, 
  enabled = true, 
  colors = defaultColors,
  maxLevel = 6
}: BracketColorizationProps) {
  const decorationsRef = useRef<string[]>([])
  const bracketPairsRef = useRef<BracketPair[]>([])

  useEffect(() => {
    if (!editor || !enabled) return

    const model = editor.getModel()
    if (!model) return

    // モデル変更時の括弧ペア検出
    const disposable = model.onDidChangeContent(() => {
      updateBracketColorization(model)
    })

    // 初期化
    updateBracketColorization(model)

    return () => {
      disposable.dispose()
      clearDecorations()
    }
  }, [editor, enabled, colors, maxLevel])

  const updateBracketColorization = (model: any) => {
    // 既存の装飾をクリア
    clearDecorations()

    if (!enabled) return

    // 括弧ペアを検出
    const pairs = findBracketPairs(model)
    bracketPairsRef.current = pairs

    // 装飾を適用
    applyBracketDecorations(model, pairs)
  }

  const findBracketPairs = (model: any): BracketPair[] => {
    const pairs: BracketPair[] = []
    const stack: Array<{ bracket: string; line: number; column: number; level: number }> = []
    
    const bracketMap: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '<': '>'
    }

    const lines = model.getLinesContent()
    
    lines.forEach((line: string, lineIndex: number) => {
      for (let colIndex = 0; colIndex < line.length; colIndex++) {
        const char = line[colIndex]
        
        if (bracketMap[char]) {
          // 開き括弧
          stack.push({
            bracket: char,
            line: lineIndex + 1,
            column: colIndex + 1,
            level: stack.length
          })
        } else if (Object.values(bracketMap).includes(char)) {
          // 閉じ括弧
          const openBracket = Object.keys(bracketMap).find(key => bracketMap[key] === char)
          
          if (openBracket) {
            // 対応する開き括弧を探す
            for (let i = stack.length - 1; i >= 0; i--) {
              if (stack[i].bracket === openBracket) {
                const open = stack.splice(i, 1)[0]
                pairs.push({
                  open: { line: open.line, column: open.column },
                  close: { line: lineIndex + 1, column: colIndex + 1 },
                  level: open.level
                })
                break
              }
            }
          }
        }
      }
    })

    return pairs
  }

  const applyBracketDecorations = (model: any, pairs: BracketPair[]) => {
    const decorations: any[] = []

    pairs.forEach(pair => {
      const colorIndex = pair.level % Math.min(colors.length, maxLevel)
      const color = colors[colorIndex]

      // 開き括弧の装飾
      decorations.push({
        range: {
          startLineNumber: pair.open.line,
          startColumn: pair.open.column,
          endLineNumber: pair.open.line,
          endColumn: pair.open.column + 1
        },
        options: {
          inlineClassName: `bracket-open-${colorIndex}`,
          className: `bracket-open-${colorIndex}`,
          hoverMessage: {
            value: `括弧レベル ${pair.level + 1}`
          }
        }
      })

      // 閉じ括弧の装飾
      decorations.push({
        range: {
          startLineNumber: pair.close.line,
          startColumn: pair.close.column,
          endLineNumber: pair.close.line,
          endColumn: pair.close.column + 1
        },
        options: {
          inlineClassName: `bracket-close-${colorIndex}`,
          className: `bracket-close-${colorIndex}`,
          hoverMessage: {
            value: `括弧レベル ${pair.level + 1}`
          }
        }
      })
    })

    // 装飾を適用
    if (decorations.length > 0) {
      const decorationIds = model.deltaDecorations([], decorations)
      decorationsRef.current = decorationIds
    }
  }

  const clearDecorations = () => {
    if (editor && decorationsRef.current.length > 0) {
      const model = editor.getModel()
      if (model) {
        model.deltaDecorations(decorationsRef.current, [])
        decorationsRef.current = []
      }
    }
  }

  const getBracketLevel = (line: number, column: number): number => {
    const pair = bracketPairsRef.current.find(p => 
      (p.open.line === line && p.open.column === column) ||
      (p.close.line === line && p.close.column === column)
    )
    return pair ? pair.level : -1
  }

  const getBracketPairs = (): BracketPair[] => {
    return [...bracketPairsRef.current]
  }

  // CSSスタイルを動的に追加
  useEffect(() => {
    const styleId = 'bracket-colorization-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    // 色分けスタイルを生成
    const styles = colors.map((color, index) => `
      .bracket-open-${index} {
        color: ${color} !important;
        font-weight: bold;
      }
      .bracket-close-${index} {
        color: ${color} !important;
        font-weight: bold;
      }
    `).join('\n')

    styleElement.textContent = styles

    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement)
      }
    }
  }, [colors])

  return null
}

// ユーティリティ関数
export const createBracketColorization = (
  editor: any, 
  options: {
    enabled?: boolean
    colors?: string[]
    maxLevel?: number
  } = {}
) => {
  const { enabled = true, colors = defaultColors, maxLevel = 6 } = options
  
  return {
    enable: () => {
      // 括弧色分けを有効化
      console.log('Bracket colorization enabled')
    },
    disable: () => {
      // 括弧色分けを無効化
      console.log('Bracket colorization disabled')
    },
    updateColors: (newColors: string[]) => {
      // 色を更新
      console.log('Bracket colors updated:', newColors)
    },
    getPairs: () => {
      // 括弧ペアを取得
      return []
    }
  }
}

// デフォルトエクスポート
export default BracketColorization 