import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { getSettings, loadCustomExercises } from './lib/db'
import { applyAccent } from './lib/theme'

async function boot() {
  // Custom exercises and the accent colour must be in place before the first
  // paint, so lookups are synchronous and the theme doesn't flash.
  try {
    const [settings] = await Promise.all([getSettings(), loadCustomExercises()])
    applyAccent(settings.accent)
  } catch {
    /* storage unavailable — the app still renders with defaults */
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <div className="app-backdrop">
        <div className="device-frame">
          <div className="app-scroll">
            <App />
          </div>
        </div>
      </div>
    </StrictMode>,
  )
}

void boot()
