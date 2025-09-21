'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useAuthStore } from '@/hooks/use-auth';

export default function DebugAuth() {
  const { data: session, status } = useSession();
  const { user, isAuthenticated, hasInitialized, isLoading } = useAuthStore();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingAuth, setIsTestingAuth] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testCredentialsLogin = async () => {
    setIsTestingAuth(true);
    addTestResult('🧪 Testing credentials login...');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: 'shaan@gmail.com', // Your admin email
        password: 'your-password-here', // Replace with actual password
      });
      
      addTestResult(`NextAuth signIn result: ${JSON.stringify(result)}`);
      
      if (result?.error) {
        addTestResult(`❌ Login failed: ${result.error}`);
      } else {
        addTestResult('✅ Login successful');
      }
    } catch (error) {
      addTestResult(`❌ Error during login: ${error}`);
    } finally {
      setIsTestingAuth(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Authentication Debug Page</h1>
          
          {/* Current State */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Authentication State</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">NextAuth Session</h3>
                <div className="text-sm">
                  <p><strong>Status:</strong> {status}</p>
                  <p><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</p>
                  {session && (
                    <>
                      <p><strong>Email:</strong> {session.user?.email}</p>
                      <p><strong>Name:</strong> {session.user?.name}</p>
                      <p><strong>Role:</strong> {(session.user as any)?.role}</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Zustand Auth Store</h3>
                <div className="text-sm">
                  <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                  <p><strong>Has Initialized:</strong> {hasInitialized ? 'Yes' : 'No'}</p>
                  <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                  {user && (
                    <>
                      <p><strong>User Email:</strong> {user.email}</p>
                      <p><strong>User Role:</strong> {user.role}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={testCredentialsLogin}
                disabled={isTestingAuth}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isTestingAuth ? 'Testing...' : 'Test Credentials Login'}
              </button>
              
              <button
                onClick={() => signOut({ redirect: false })}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Sign Out
              </button>
              
              <button
                onClick={clearResults}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Clear Results
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p>No test results yet. Click "Test Credentials Login" to start debugging.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index}>{result}</div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Instructions:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Update the test email/password in the code above</li>
              <li>2. Click "Test Credentials Login" to see what happens</li>
              <li>3. Check the console for any error messages</li>
              <li>4. Compare NextAuth session vs Zustand store state</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}