import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { reloadForNewBuild } from './utils/chunkReload'

// Vite fires this when a lazy chunk (or its CSS) fails to preload, typically
// because a new deploy replaced the old hashed files. Reload to get the new build.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
