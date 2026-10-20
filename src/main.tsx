import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/styles/globals.css'
import App from '@/app/App'
import { AppProviders } from '@/app/providers'
import { ConfigScreen, ErrorBoundary } from '@/components/common/BootScreens'
import { missingEnvKeys } from '@/lib/env'

const container = document.getElementById('root')
if (!container) throw new Error('#root element is missing from index.html')

ReactDOM.createRoot(container).render(
  missingEnvKeys.length > 0 ? (
    <ConfigScreen missing={missingEnvKeys} />
  ) : (
    <React.StrictMode>
      <ErrorBoundary>
        <AppProviders>
          <App />
        </AppProviders>
      </ErrorBoundary>
    </React.StrictMode>
  ),
)
