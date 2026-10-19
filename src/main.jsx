import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { ConfigScreen, ErrorBoundary } from './components/BootScreens.jsx'
import './index.css'

/* --------------------------------------------------------------------------
 * Boot configuration
 *
 * If any required variable is missing we render a clear, styled explanation
 * instead of throwing — a thrown error at module scope is exactly what turns
 * the whole app into a blank white page.
 * ------------------------------------------------------------------------ */

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const MISSING = [
  ['VITE_CLERK_PUBLISHABLE_KEY', CLERK_KEY],
  ['VITE_SUPABASE_URL', SUPABASE_URL],
  ['VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY],
]
  .filter(([, value]) => !value)
  .map(([name]) => name)

const root = ReactDOM.createRoot(document.getElementById('root'))

if (MISSING.length > 0) {
  console.error('[shaRPoint] missing environment variables:', MISSING.join(', '))
  root.render(<ConfigScreen missing={MISSING} />)
} else {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ClerkProvider publishableKey={CLERK_KEY}>
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
        </ClerkProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}
