import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Chrome拡張機能のエラーをフィルタリングする関数
export function filterChromeExtensionErrors(error: any): boolean {
  // Chrome拡張機能のエラーを無視
  if (error && typeof error === 'string') {
    const chromeExtensionPatterns = [
      'chrome-extension://',
      'FrameDoesNotExistError',
      'utils.js',
      'extensionState.js',
      'heuristicsRedefinitions.js'
    ]
    
    return !chromeExtensionPatterns.some(pattern => error.includes(pattern))
  }
  
  return true
}

// コンソールエラーのフィルタリング
export function createFilteredConsole() {
  const originalError = console.error
  const originalWarn = console.warn
  
  console.error = (...args: any[]) => {
    const filteredArgs = args.filter(arg => filterChromeExtensionErrors(arg))
    if (filteredArgs.length > 0) {
      originalError.apply(console, filteredArgs)
    }
  }
  
  console.warn = (...args: any[]) => {
    const filteredArgs = args.filter(arg => filterChromeExtensionErrors(arg))
    if (filteredArgs.length > 0) {
      originalWarn.apply(console, filteredArgs)
    }
  }
}
