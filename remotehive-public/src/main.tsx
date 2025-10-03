import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// For development, we'll conditionally render with or without Clerk
const AppWithProvider = () => {
  if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY === 'pk_test_development_key_placeholder') {
    // Render without Clerk for development
    console.warn('Clerk not configured - running without authentication')
    return <App />
  }

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/clerk-login"
      signUpUrl="/clerk-register"
    >
      <App />
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppWithProvider />
    </ErrorBoundary>
  </StrictMode>,
)
