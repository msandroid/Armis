import React from 'react'
import { ChatWindow } from './components/chat/ChatWindow'
import './App.css'

function App() {

  return (
    <div className="min-h-screen bg-cascade">
      <div className="cascade-sidebar">
                {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>

        
      </div>
    </div>
  )
}

export default App
