'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { useSession } from 'next-auth/react';
import { getAuthDebugInfo, authDebugger, logAuthEvent } from '@/lib/auth-debug';

interface AuthDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthDebugPanel({ isOpen, onClose }: AuthDebugPanelProps) {
  const { data: session, status } = useSession();
  const authStore = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isOpen && autoRefresh) {
      const interval = setInterval(() => {
        setDebugInfo(getAuthDebugInfo());
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh]);

  useEffect(() => {
    if (isOpen) {
      setDebugInfo(getAuthDebugInfo());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearLogs = () => {
    authDebugger.clearLogs();
    setDebugInfo(getAuthDebugInfo());
    logAuthEvent('persistence', { action: 'clear-debug-logs' });
  };

  const handleExportLogs = () => {
    const logs = authDebugger.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-debug-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">🔍 Authentication Debug Panel</h2>
          <button 
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
          {/* Current State */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">📊 Current State</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">NextAuth Session</h4>
                <div className="text-sm">
                  <div><strong>Status:</strong> {status}</div>
                  <div><strong>User:</strong> {session?.user?.email || 'None'}</div>
                  <div><strong>ID:</strong> {(session?.user as any)?.id || 'None'}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Zustand Store</h4>
                <div className="text-sm">
                  <div><strong>Authenticated:</strong> {authStore.isAuthenticated ? '✅' : '❌'}</div>
                  <div><strong>Initialized:</strong> {authStore.hasInitialized ? '✅' : '❌'}</div>
                  <div><strong>Loading:</strong> {authStore.isLoading ? '⏳' : '✅'}</div>
                  <div><strong>User:</strong> {authStore.user?.email || 'None'}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Summary & Issues */}
          {debugInfo && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">📈 Summary & Issues</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Logs</div>
                    <div className="text-xl font-bold">{debugInfo.summary.totalLogs}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Recent Activity</div>
                    <div className="text-xl font-bold">{debugInfo.summary.recentActivity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Last Login</div>
                    <div className="text-sm">{debugInfo.summary.lastLogin ? new Date(debugInfo.summary.lastLogin).toLocaleTimeString() : 'None'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Last Sync</div>
                    <div className="text-sm">{debugInfo.summary.lastSessionSync ? new Date(debugInfo.summary.lastSessionSync).toLocaleTimeString() : 'None'}</div>
                  </div>
                </div>
                
                {debugInfo.issues.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-red-600 mb-2">⚠️ Issues Detected</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {debugInfo.issues.map((issue: string, index: number) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Controls */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">🔧 Controls</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  autoRefresh 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {autoRefresh ? '⏹️ Stop Auto-Refresh' : '▶️ Start Auto-Refresh'}
              </button>
              
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 bg-yellow-500 text-white rounded text-sm font-medium hover:bg-yellow-600"
              >
                🗑️ Clear Logs
              </button>
              
              <button
                onClick={handleExportLogs}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
              >
                📥 Export Logs
              </button>
              
              <button
                onClick={() => {
                  authStore.resetAuthState();
                  setDebugInfo(getAuthDebugInfo());
                }}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
              >
                🔄 Reset Auth State
              </button>
            </div>
          </section>

          {/* Recent Logs */}
          {debugInfo && (
            <section>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">📝 Recent Logs</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto">
                {debugInfo.recentLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No logs available</p>
                ) : (
                  <div className="space-y-2">
                    {debugInfo.recentLogs.map((log: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border-l-4 border-gray-300">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium text-sm text-gray-800">
                            {log.event}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        {log.userEmail && (
                          <div className="text-xs text-blue-600 mb-1">
                            User: {log.userEmail}
                          </div>
                        )}
                        {Object.keys(log.details).length > 0 && (
                          <div className="text-xs text-gray-600 font-mono">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to easily use the debug panel
export function useAuthDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  return {
    isOpen,
    toggle,
    open,
    close,
    DebugPanel: () => <AuthDebugPanel isOpen={isOpen} onClose={close} />,
  };
}