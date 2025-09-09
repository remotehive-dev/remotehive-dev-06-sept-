import React, { useState } from 'react'
import { SignIn } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

const ClerkLogin: React.FC = () => {
  const [clerkError, setClerkError] = useState<string | null>(null)
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your RemoteHive account</p>
        </div>
        
        {clerkError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  {clerkError === 'ERROR_ZERO_BALANCE' 
                    ? 'Sign in is temporarily unavailable. Please try again later or contact support.'
                    : clerkError
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SignIn 
            routing="path"
            path="/clerk-login"
            signUpUrl="/clerk-register"
            onError={(error) => {
              console.error('Clerk signin error:', error)
              setClerkError(error.message || 'An error occurred during sign in')
            }}
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                formFieldInput: 'border border-gray-300 rounded-lg px-3 py-2',
                footerActionLink: 'text-blue-600 hover:text-blue-700'
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}

export default ClerkLogin