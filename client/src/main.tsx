import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './store/settingsStore'

/**
 * Starts the mock API (MSW) unless VITE_USE_MOCKS=false, e.g. once the real
 * backend exists in Phase 6.
 */
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS === 'false') return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
}

initTheme()

// If the mock API can't start (e.g. service workers are blocked), still render the app;
// pages then show their normal "couldn't load" states instead of a blank screen.
enableMocking()
  .catch((err) => console.error('Mock API failed to start:', err))
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
