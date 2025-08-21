import React from 'react'
import { ChatWindow } from './components/chat/ChatWindow'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-cascade">
      <div className="cascade-sidebar">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow useEnhancedPreview={true} />
        </div>
      </div>
    </div>
  )
}

export default App
