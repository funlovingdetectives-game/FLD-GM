// Force new build hash - v2.1
console.log('Build-time VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Build-time VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)