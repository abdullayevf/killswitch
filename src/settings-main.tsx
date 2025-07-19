import React from 'react'
import ReactDOM from 'react-dom/client'
import Settings from './Settings.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('settings-root')!).render(
  <React.StrictMode>
    <Settings />
  </React.StrictMode>,
)