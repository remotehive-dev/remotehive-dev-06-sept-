import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        signInUrl="/clerk-login"
        signUpUrl="/clerk-register"
      >
        <App />
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
)
