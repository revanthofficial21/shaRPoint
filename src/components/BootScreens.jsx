import React from 'react'

/*
 * Boot-time screens.
 *
 * These render when the app cannot start normally — missing configuration or a
 * render error — so the user always sees an explanation instead of a blank page.
 */

const shellStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#04091a',
  padding: 24,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  color: '#e8edf5',
}

const cardStyle = {
  maxWidth: 640,
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(240,192,64,.25)',
  borderRadius: 18,
  padding: '28px 30px',
  lineHeight: 1.65,
}

const codeStyle = {
  display: 'inline-block',
  background: '#0d1b3a',
  border: '1px solid #1e3a5f',
  borderRadius: 6,
  padding: '1px 7px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 13,
  color: '#f0c040',
}

export function ConfigScreen({ missing }) {
  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🔧</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>
          Configuration required
        </h1>
        <p style={{ color: '#8a96aa', margin: '0 0 18px', fontSize: 14 }}>
          shaRPoint loaded, but it can&apos;t start without its environment variables.
          Set the following in your host (Vercel → Settings → Environment Variables),
          then redeploy:
        </p>
        <ul style={{ margin: '0 0 18px', paddingLeft: 20, color: '#fecaca', fontSize: 14 }}>
          {missing.map((name) => (
            <li key={name}>
              <code style={codeStyle}>{name}</code>
            </li>
          ))}
        </ul>
        <p style={{ color: '#8a96aa', fontSize: 13, margin: 0 }}>
          Values come from Clerk (API Keys) and Supabase (Settings → API). Local dev
          reads them from a <code style={codeStyle}>.env</code> file — copy{' '}
          <code style={codeStyle}>.env.example</code> to get started.
        </p>
      </div>
    </div>
  )
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[shaRPoint] render error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={shellStyle}>
        <div style={{ ...cardStyle, borderColor: 'rgba(239,68,68,.4)' }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>
            Something went wrong
          </h1>
          <pre
            style={{
              background: '#1a0f14',
              border: '1px solid #7f1d1d',
              color: '#fecaca',
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: 13,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg,#f0c040,#f97316)',
              color: '#1a0800',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
