"use client"

import { useRef, useEffect } from "react"

interface SnippetPlaceholder {
  index: number
  value: string
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

interface SnippetManagerProps {
  editor: any
  snippet: string
  position: { lineNumber: number; column: number }
}

export function SnippetManager({ editor, snippet, position }: SnippetManagerProps) {
  const placeholderRefs = useRef<Map<number, any>>(new Map())
  const currentPlaceholderIndex = useRef<number>(0)

  useEffect(() => {
    if (!editor || !snippet) return

    insertSnippet(snippet, position)
  }, [editor, snippet, position])

  const insertSnippet = (snippetText: string, pos: { lineNumber: number; column: number }) => {
    const model = editor.getModel()
    if (!model) return

    // スニペットのプレースホルダーを解析
    const placeholders = parseSnippetPlaceholders(snippetText)
    
    // プレースホルダーを一時的な値に置換
    let processedSnippet = snippetText
    placeholders.forEach((placeholder, index) => {
      const placeholderRegex = new RegExp(`\\$\\{${placeholder.index}:(.*?)\\}`, 'g')
      processedSnippet = processedSnippet.replace(placeholderRegex, `__PLACEHOLDER_${placeholder.index}__`)
    })

    // スニペットを挿入
    const range = {
      startLineNumber: pos.lineNumber,
      startColumn: pos.column,
      endLineNumber: pos.lineNumber,
      endColumn: pos.column
    }

    model.pushEditOperations(
      [],
      [{
        range,
        text: processedSnippet
      }],
      () => null
    )

    // プレースホルダーを設定
    setTimeout(() => {
      setupPlaceholders(model, placeholders, pos)
    }, 100)
  }

  const parseSnippetPlaceholders = (snippetText: string): SnippetPlaceholder[] => {
    const placeholders: SnippetPlaceholder[] = []
    const placeholderRegex = /\$\{(\d+):([^}]+)\}/g
    let match

    while ((match = placeholderRegex.exec(snippetText)) !== null) {
      placeholders.push({
        index: parseInt(match[1]),
        value: match[2],
        startLine: 0, // 後で計算
        startColumn: 0,
        endLine: 0,
        endColumn: 0
      })
    }

    return placeholders.sort((a, b) => a.index - b.index)
  }

  const setupPlaceholders = (
    model: any, 
    placeholders: SnippetPlaceholder[], 
    startPos: { lineNumber: number; column: number }
  ) => {
    const lines = model.getLinesContent()
    let currentLine = startPos.lineNumber
    let currentColumn = startPos.column

    placeholders.forEach((placeholder, index) => {
      // プレースホルダーの位置を計算
      const placeholderText = `__PLACEHOLDER_${placeholder.index}__`
      let found = false

      for (let lineIndex = currentLine; lineIndex <= lines.length; lineIndex++) {
        const line = lines[lineIndex - 1] || ""
        const placeholderIndex = line.indexOf(placeholderText)
        
        if (placeholderIndex !== -1) {
          placeholder.startLine = lineIndex
          placeholder.startColumn = placeholderIndex + 1
          placeholder.endLine = lineIndex
          placeholder.endColumn = placeholderIndex + 1 + placeholder.value.length
          
          // プレースホルダーを実際の値に置換
          model.pushEditOperations(
            [],
            [{
              range: {
                startLineNumber: lineIndex,
                startColumn: placeholderIndex + 1,
                endLineNumber: lineIndex,
                endColumn: placeholderIndex + 1 + placeholderText.length
              },
              text: placeholder.value
            }],
            () => null
          )
          
          found = true
          currentLine = lineIndex
          currentColumn = placeholderIndex + 1 + placeholder.value.length
          break
        }
      }

      if (!found) {
        console.warn(`Placeholder ${placeholder.index} not found in snippet`)
      }
    })

    // 最初のプレースホルダーにフォーカス
    if (placeholders.length > 0) {
      const firstPlaceholder = placeholders[0]
      editor.setPosition({
        lineNumber: firstPlaceholder.startLine,
        column: firstPlaceholder.startColumn
      })
      editor.setSelection({
        startLineNumber: firstPlaceholder.startLine,
        startColumn: firstPlaceholder.startColumn,
        endLineNumber: firstPlaceholder.endLine,
        endColumn: firstPlaceholder.endColumn
      })
    }

    // プレースホルダー間のナビゲーションを設定
    setupPlaceholderNavigation(placeholders)
  }

  const setupPlaceholderNavigation = (placeholders: SnippetPlaceholder[]) => {
    if (placeholders.length <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        
        if (e.shiftKey) {
          // Shift + Tab: 前のプレースホルダー
          currentPlaceholderIndex.current = 
            currentPlaceholderIndex.current > 0 
              ? currentPlaceholderIndex.current - 1 
              : placeholders.length - 1
        } else {
          // Tab: 次のプレースホルダー
          currentPlaceholderIndex.current = 
            currentPlaceholderIndex.current < placeholders.length - 1 
              ? currentPlaceholderIndex.current + 1 
              : 0
        }

        const placeholder = placeholders[currentPlaceholderIndex.current]
        if (placeholder) {
          editor.setPosition({
            lineNumber: placeholder.startLine,
            column: placeholder.startColumn
          })
          editor.setSelection({
            startLineNumber: placeholder.startLine,
            startColumn: placeholder.startColumn,
            endLineNumber: placeholder.endLine,
            endColumn: placeholder.endColumn
          })
        }
      } else if (e.key === 'Escape') {
        // Escape: プレースホルダーモードを終了
        document.removeEventListener('keydown', handleKeyDown)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
  }

  return null
}

// スニペット挿入のユーティリティ関数
export const insertSnippetIntoEditor = (
  editor: any, 
  snippet: string, 
  position: { lineNumber: number; column: number }
) => {
  if (!editor || !snippet) return

  const model = editor.getModel()
  if (!model) return

  // スニペットを挿入
  model.pushEditOperations(
    [],
    [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      },
      text: snippet
    }],
    () => null
  )

  // プレースホルダーを処理
  const placeholders = parseSnippetPlaceholders(snippet)
  if (placeholders.length > 0) {
    setTimeout(() => {
      setupPlaceholders(model, placeholders, position)
    }, 100)
  }
}

// プレースホルダー解析のヘルパー関数
const parseSnippetPlaceholders = (snippetText: string): SnippetPlaceholder[] => {
  const placeholders: SnippetPlaceholder[] = []
  const placeholderRegex = /\$\{(\d+):([^}]+)\}/g
  let match

  while ((match = placeholderRegex.exec(snippetText)) !== null) {
    placeholders.push({
      index: parseInt(match[1]),
      value: match[2],
      startLine: 0,
      startColumn: 0,
      endLine: 0,
      endColumn: 0
    })
  }

  return placeholders.sort((a, b) => a.index - b.index)
}

// プレースホルダー設定のヘルパー関数
const setupPlaceholders = (
  model: any, 
  placeholders: SnippetPlaceholder[], 
  startPos: { lineNumber: number; column: number }
) => {
  const lines = model.getLinesContent()
  let currentLine = startPos.lineNumber
  let currentColumn = startPos.column

  placeholders.forEach((placeholder) => {
    const placeholderText = `__PLACEHOLDER_${placeholder.index}__`
    let found = false

    for (let lineIndex = currentLine; lineIndex <= lines.length; lineIndex++) {
      const line = lines[lineIndex - 1] || ""
      const placeholderIndex = line.indexOf(placeholderText)
      
      if (placeholderIndex !== -1) {
        placeholder.startLine = lineIndex
        placeholder.startColumn = placeholderIndex + 1
        placeholder.endLine = lineIndex
        placeholder.endColumn = placeholderIndex + 1 + placeholder.value.length
        
        // プレースホルダーを実際の値に置換
        model.pushEditOperations(
          [],
          [{
            range: {
              startLineNumber: lineIndex,
              startColumn: placeholderIndex + 1,
              endLineNumber: lineIndex,
              endColumn: placeholderIndex + 1 + placeholderText.length
            },
            text: placeholder.value
          }],
          () => null
        )
        
        found = true
        currentLine = lineIndex
        currentColumn = placeholderIndex + 1 + placeholder.value.length
        break
      }
    }

    if (!found) {
      console.warn(`Placeholder ${placeholder.index} not found in snippet`)
    }
  })

  // 最初のプレースホルダーにフォーカス
  if (placeholders.length > 0) {
    const editor = model.getEditor()
    const firstPlaceholder = placeholders[0]
    editor.setPosition({
      lineNumber: firstPlaceholder.startLine,
      column: firstPlaceholder.startColumn
    })
    editor.setSelection({
      startLineNumber: firstPlaceholder.startLine,
      startColumn: firstPlaceholder.startColumn,
      endLineNumber: firstPlaceholder.endLine,
      endColumn: firstPlaceholder.endColumn
    })
  }
} 