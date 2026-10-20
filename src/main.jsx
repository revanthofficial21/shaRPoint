import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import { ConfigScreen, ErrorBoundary } from './components/BootScreens.jsx'
import './index.css'

/* --------------------------------------------------------------------------
 * Boot configuration
 *
 * Only two variables are needed. If either is missing we render a clear
 * explanation instead of throwing — a thrown error at module scope is what
 * turns the app into a blank white page.
 * ------------------------------------------------------------------------ */

// VITE_* is the standard Vite name; __SUPABASE_*__ is injected by
// vite.config.js for hosts that store the values under a plain name.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || __SUPABASE_URL__
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || __SUPABASE_ANON_KEY__

const missingEnv = [
  ['VITE_SUPABASE_URL', supabaseUrl],
  ['VITE_SUPABASE_ANON_KEY', supabaseAnonKey],
]
  .filter(([, value]) => !value)
  .map(([name]) => name)

const root = ReactDOM.createRoot(document.getElementById('root'))

if (missingEnv.length > 0) {
  console.error('[shaRPoint] missing environment variables:', missingEnv.join(', '))
  root.render(<ConfigScreen missing={missingEnv} />)
} else {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1e2a3a',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  borderRadius: '12px',
                  padding: '12px 18px',
                },
                duration: 3500,
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}
