"use client"

import * as React from "react"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: 'light' | 'dark' | 'system'
  storageKey?: string
}

const ThemeContext = React.createContext<{
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
  mounted: boolean
}>({
  theme: 'system',
  setTheme: () => {},
  toggleTheme: () => {},
  mounted: false
})

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>(() => {
    // 初期化時にlocalStorageから読み込み
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(storageKey) as 'light' | 'dark' | 'system'
      return savedTheme || defaultTheme
    }
    return defaultTheme
  })
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // 初期テーマを適用
    applyTheme(theme)
  }, [theme])

  // システムテーマの変更を監視
  React.useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // テーマを適用する関数
  const applyTheme = React.useCallback((currentTheme: 'light' | 'dark' | 'system') => {
    if (typeof window === 'undefined') return

    if (currentTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      if (systemTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }, [theme, storageKey])

  const setThemeMode = React.useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }, [storageKey])

  const value = {
    theme,
    setTheme: setThemeMode,
    toggleTheme,
    mounted
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
