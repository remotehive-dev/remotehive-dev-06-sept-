'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

function DebugAuthPageContent() {
  const { user, loading, isAuthenticated, isAdminUser } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check what's in localStorage
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      try {
        // Decode JWT token (just the payload, not verifying signature)
        const payload = JSON.parse(atob(adminToken.split('.')[1]));
        setTokenInfo(payload);
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    // Test the verify endpoint directly
    fetch('/api/auth/verify', {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => setVerifyResult(data))
    .catch(err => setVerifyResult({ error: err instanceof Error ? err.message : 'Unknown error' }));
  }, []);

  const testCookieAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      setVerifyResult(data);
    } catch (error) {
      setVerifyResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Auth Context State</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify({
              loading,
              isAuthenticated,
              isAdminUser,
              user
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">LocalStorage Token</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Verify Endpoint Result</h2>
          <button 
            onClick={testCookieAuth}
            className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Cookie Auth
          </button>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(verifyResult, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Browser Cookies</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {mounted ? (document.cookie || 'No cookies found') : 'Loading...'}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Export with dynamic import to prevent SSR issues
const DebugAuthPage = dynamic(() => Promise.resolve(DebugAuthPageContent), {
  ssr: false,
  loading: () => <div className="p-8">Loading debug page...</div>
});

export default DebugAuthPage;