import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createFilteredConsole } from './lib/utils'

// Buffer polyfill for browser environment
import { Buffer } from 'buffer'
;(window as any).Buffer = Buffer
;(globalThis as any).Buffer = Buffer
;(global as any).Buffer = Buffer

// Util polyfill for browser environment
const util = {
  debuglog: () => () => {},
  inspect: (obj: any) => JSON.stringify(obj, null, 2),
  format: (...args: any[]) => args.join(' '),
  inherits: (ctor: any, superCtor: any) => {
    ctor.super_ = superCtor
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype)
  }
}
;(window as any).util = util
;(globalThis as any).util = util
;(global as any).util = util

// Chrome拡張機能のエラーをフィルタリング
createFilteredConsole()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
