import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#FDFBF0',
          color: '#2a3828',
          border: '1px solid #ddd9c4',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#465940', secondary: '#FDFBF0' },
        },
        error: {
          iconTheme: { primary: '#c0392b', secondary: '#FDFBF0' },
        },
      }}
    />
  </React.StrictMode>,
)
