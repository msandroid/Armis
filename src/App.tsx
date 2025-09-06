import React, { useEffect, useState } from 'react'
import './App.css'
import { ChatWindow } from './components/chat/ChatWindow'
import { ThemeProvider } from './components/theme-provider'

function App() {
  useEffect(() => {
    // Node.jsポリフィルの動作確認
    console.log('=== Node.js Polyfills Check ===')
    console.log('Buffer available:', typeof (window as any).Buffer !== 'undefined')
    console.log('util available:', typeof (window as any).util !== 'undefined')
    console.log('process available:', typeof (window as any).process !== 'undefined')
    console.log('crypto available:', typeof window.crypto !== 'undefined')
    console.log('global available:', typeof (window as any).global !== 'undefined')
    
    if ((window as any).util) {
      console.log('util.inspect test:', (window as any).util.inspect({ test: 'value' }))
    }
    
    console.log('=== Polyfills Check Complete ===')
  }, [])

  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <div className="min-h-screen bg-cascade">
        <div className="cascade-sidebar">
          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow useEnhancedPreview={true} />
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
