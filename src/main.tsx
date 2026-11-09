import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Recursive con todos sus ejes (CASL y MONO se usan en los roles tipográficos)
import '@fontsource-variable/recursive/full.css'
import './styles/tokens.css'
import './index.css'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
