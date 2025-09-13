import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Check if we have a valid Clerk key (not placeholder)
const hasValidClerkKey = PUBLISHABLE_KEY && !PUBLISHABLE_KEY.includes('placeholder')

if (hasValidClerkKey) {
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
} else {
  // Development mode without Clerk
  console.warn('Running in development mode without Clerk authentication')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
