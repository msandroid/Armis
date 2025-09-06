import { FileInfo } from './file-scanner'

export interface Symbol {
  name: string
  type: 'function' | 'class' | 'variable' | 'import' | 'export' | 'interface' | 'type' | 'enum'
  line: number
  column: number
  filePath: string
  relativePath: string
  language: string
  signature?: string
  description?: string
  scope?: string
  exports?: string[]
  imports?: string[]
}

export interface CodeChunk {
  id: string
  content: string
  filePath: string
  relativePath: string
  language: string
  startLine: number
  endLine: number
  symbols: Symbol[]
  type: 'function' | 'class' | 'interface' | 'module' | 'file'
}

export class ASTParser {
  private supportedLanguages = ['typescript', 'javascript']

  parseFile(fileInfo: FileInfo): { symbols: Symbol[], chunks: CodeChunk[] } {
    if (!this.supportedLanguages.includes(fileInfo.language)) {
      return this.parseGenericFile(fileInfo)
    }

    try {
      // ブラウザ環境では簡易的なパースを使用
      return this.parseSimpleAST(fileInfo)
    } catch (error) {
      console.error(`Error parsing file ${fileInfo.path}:`, error)
      return this.parseGenericFile(fileInfo)
    }
  }

  private parseSimpleAST(fileInfo: FileInfo): { symbols: Symbol[], chunks: CodeChunk[] } {
    const symbols: Symbol[] = []
    const chunks: CodeChunk[] = []
    const lines = fileInfo.content.split('\n')
    let chunkId = 0

    // 簡易的な正規表現ベースのパース
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      // 関数宣言の検出
      const functionMatch = line.match(/^(export\s+)?(async\s+)?function\s+(\w+)/)
      if (functionMatch) {
        const name = functionMatch[3]
        const symbol: Symbol = {
          name,
          type: 'function',
          line: lineNumber,
          column: line.indexOf(name),
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          signature: `function ${name}()`,
          scope: 'global'
        }
        symbols.push(symbol)

        // 関数のチャンクを作成
        const functionContent = this.extractFunctionContent(lines, i)
        chunks.push({
          id: `chunk_${chunkId++}`,
          content: functionContent,
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          startLine: lineNumber,
          endLine: lineNumber + functionContent.split('\n').length - 1,
          symbols: [symbol],
          type: 'function'
        })
      }

      // クラス宣言の検出
      const classMatch = line.match(/^(export\s+)?class\s+(\w+)/)
      if (classMatch) {
        const name = classMatch[2]
        const symbol: Symbol = {
          name,
          type: 'class',
          line: lineNumber,
          column: line.indexOf(name),
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          signature: `class ${name}`,
          scope: 'global'
        }
        symbols.push(symbol)

        // クラスのチャンクを作成
        const classContent = this.extractClassContent(lines, i)
        chunks.push({
          id: `chunk_${chunkId++}`,
          content: classContent,
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          startLine: lineNumber,
          endLine: lineNumber + classContent.split('\n').length - 1,
          symbols: [symbol],
          type: 'class'
        })
      }

      // インターフェース宣言の検出
      const interfaceMatch = line.match(/^(export\s+)?interface\s+(\w+)/)
      if (interfaceMatch) {
        const name = interfaceMatch[2]
        const symbol: Symbol = {
          name,
          type: 'interface',
          line: lineNumber,
          column: line.indexOf(name),
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          signature: `interface ${name}`,
          scope: 'global'
        }
        symbols.push(symbol)

        // インターフェースのチャンクを作成
        const interfaceContent = this.extractInterfaceContent(lines, i)
        chunks.push({
          id: `chunk_${chunkId++}`,
          content: interfaceContent,
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          startLine: lineNumber,
          endLine: lineNumber + interfaceContent.split('\n').length - 1,
          symbols: [symbol],
          type: 'interface'
        })
      }

      // 変数宣言の検出
      const varMatch = line.match(/^(export\s+)?(const|let|var)\s+(\w+)/)
      if (varMatch) {
        const name = varMatch[3]
        const symbol: Symbol = {
          name,
          type: 'variable',
          line: lineNumber,
          column: line.indexOf(name),
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          scope: 'global'
        }
        symbols.push(symbol)
      }

      // インポート文の検出
      const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/)
      if (importMatch) {
        const moduleName = importMatch[1]
        const symbol: Symbol = {
          name: moduleName.split('/').pop() || moduleName,
          type: 'import',
          line: lineNumber,
          column: 0,
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          imports: [moduleName]
        }
        symbols.push(symbol)
      }

      // エクスポート文の検出
      const exportMatch = line.match(/^export\s+(default\s+)?(function|class|const|let|var)\s+(\w+)/)
      if (exportMatch) {
        const name = exportMatch[3]
        const type = exportMatch[2] === 'function' ? 'function' : 
                    exportMatch[2] === 'class' ? 'class' : 'variable'
        const symbol: Symbol = {
          name,
          type: 'export',
          line: lineNumber,
          column: line.indexOf(name),
          filePath: fileInfo.path,
          relativePath: fileInfo.relativePath,
          language: fileInfo.language,
          exports: [name]
        }
        symbols.push(symbol)
      }
    }

    return { symbols, chunks }
  }

  private extractFunctionContent(lines: string[], startIndex: number): string {
    let braceCount = 0
    let content = ''
    let inFunction = false

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      content += line + '\n'

      if (!inFunction) {
        if (line.includes('{')) {
          inFunction = true
          braceCount = 1
        }
      } else {
        for (const char of line) {
          if (char === '{') braceCount++
          if (char === '}') braceCount--
        }
        if (braceCount === 0) break
      }
    }

    return content.trim()
  }

  private extractClassContent(lines: string[], startIndex: number): string {
    let braceCount = 0
    let content = ''
    let inClass = false

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      content += line + '\n'

      if (!inClass) {
        if (line.includes('{')) {
          inClass = true
          braceCount = 1
        }
      } else {
        for (const char of line) {
          if (char === '{') braceCount++
          if (char === '}') braceCount--
        }
        if (braceCount === 0) break
      }
    }

    return content.trim()
  }

  private extractInterfaceContent(lines: string[], startIndex: number): string {
    let braceCount = 0
    let content = ''
    let inInterface = false

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      content += line + '\n'

      if (!inInterface) {
        if (line.includes('{')) {
          inInterface = true
          braceCount = 1
        }
      } else {
        for (const char of line) {
          if (char === '{') braceCount++
          if (char === '}') braceCount--
        }
        if (braceCount === 0) break
      }
    }

    return content.trim()
  }

  private parseGenericFile(fileInfo: FileInfo): { symbols: Symbol[], chunks: CodeChunk[] } {
    // For non-JavaScript/TypeScript files, create a simple chunk
    const symbols: Symbol[] = []
    const chunks: CodeChunk[] = [{
      id: 'chunk_0',
      content: fileInfo.content,
      filePath: fileInfo.path,
      relativePath: fileInfo.relativePath,
      language: fileInfo.language,
      startLine: 1,
      endLine: fileInfo.content.split('\n').length,
      symbols: [],
      type: 'file'
    }]

    return { symbols, chunks }
  }

  extractImports(content: string): string[] {
    const imports: string[] = []
    const lines = content.split('\n')

    for (const line of lines) {
      const match = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/)
      if (match) {
        imports.push(match[1])
      }
    }

    return imports
  }

  extractExports(content: string): string[] {
    const exports: string[] = []
    const lines = content.split('\n')

    for (const line of lines) {
      const match = line.match(/^export\s+(default\s+)?(function|class|const|let|var)\s+(\w+)/)
      if (match) {
        exports.push(match[3])
      }
    }

    return exports
  }
}
