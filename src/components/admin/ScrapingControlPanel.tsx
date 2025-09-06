import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Activity, Clock, CheckCircle, AlertTriangle, Settings, Download, Globe } from 'lucide-react';

interface ScrapingSession {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'stopping';
  startTime?: string;
  endTime?: string;
  totalWebsites: number;
  processedWebsites: number;
  successfulScrapes: number;
  failedScrapes: number;
  currentWebsite?: string;
  estimatedTimeRemaining?: number;
  averageTimePerSite?: number;
  memoryLoaded?: boolean;
  memoryFile?: string;
}

interface RealTimeMetrics {
  activeWorkers: number;
  queueSize: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  throughputPerMinute: number;
}

interface ScrapingControlPanelProps {
  onSessionStart?: (sessionId: string) => void;
  onSessionStop?: (sessionId: string) => void;
  onSessionPause?: (sessionId: string) => void;
  onSessionResume?: (sessionId: string) => void;
}

const ScrapingControlPanel: React.FC<ScrapingControlPanelProps> = ({
  onSessionStart,
  onSessionStop,
  onSessionPause,
  onSessionResume
}) => {
  const [currentSession, setCurrentSession] = useState<ScrapingSession | null>(null);
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeWorkers: 0,
    queueSize: 0,
    successRate: 0,
    averageResponseTime: 0,
    errorRate: 0,
    throughputPerMinute: 0
  });
  const [sessionHistory, setSessionHistory] = useState<ScrapingSession[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [concurrentWorkers, setConcurrentWorkers] = useState(5);
  const [requestDelay, setRequestDelay] = useState(1000);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [timeout, setTimeout] = useState(30000);

  // Simulate real-time updates
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (currentSession?.status === 'running') {
      interval = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev || prev.status !== 'running') return prev;
          
          const newProcessed = Math.min(prev.processedWebsites + Math.floor(Math.random() * 3), prev.totalWebsites);
          const newSuccessful = prev.successfulScrapes + Math.floor(Math.random() * 2);
          const newFailed = newProcessed - newSuccessful;
          
          const elapsedTime = Date.now() - new Date(prev.startTime!).getTime();
          const averageTime = elapsedTime / newProcessed;
          const remainingTime = (prev.totalWebsites - newProcessed) * averageTime;
          
          return {
            ...prev,
            processedWebsites: newProcessed,
            successfulScrapes: newSuccessful,
            failedScrapes: newFailed,
            currentWebsite: `https://example${Math.floor(Math.random() * 1000)}.com`,
            estimatedTimeRemaining: remainingTime,
            averageTimePerSite: averageTime,
            status: newProcessed >= prev.totalWebsites ? 'completed' : 'running'
          };
        });
        
        setMetrics(() => ({
          activeWorkers: Math.floor(Math.random() * concurrentWorkers) + 1,
          queueSize: Math.floor(Math.random() * 50),
          successRate: 85 + Math.random() * 10,
          averageResponseTime: 800 + Math.random() * 400,
          errorRate: Math.random() * 5,
          throughputPerMinute: 15 + Math.random() * 10
        }));
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession?.status, concurrentWorkers]);

  const startSession = useCallback(() => {
    const sessionId = `session_${Date.now()}`;
    const newSession: ScrapingSession = {
      id: sessionId,
      name: `Scraping Session ${new Date().toLocaleString()}`,
      status: 'running',
      startTime: new Date().toISOString(),
      totalWebsites: 150 + Math.floor(Math.random() * 100),
      processedWebsites: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      memoryLoaded: true,
      memoryFile: 'memory_data_2024.csv'
    };
    
    setCurrentSession(newSession);
    onSessionStart?.(sessionId);
  }, [onSessionStart]);

  const pauseSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => prev ? { ...prev, status: 'paused' } : null);
      onSessionPause?.(currentSession.id);
    }
  }, [currentSession, onSessionPause]);

  const resumeSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => prev ? { ...prev, status: 'running' } : null);
      onSessionResume?.(currentSession.id);
    }
  }, [currentSession, onSessionResume]);

  const stopSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => {
        if (!prev) return null;
        const stoppedSession = {
          ...prev,
          status: 'completed' as const,
          endTime: new Date().toISOString()
        };
        setSessionHistory(history => [stoppedSession, ...history.slice(0, 9)]);
        return null;
      });
      onSessionStop?.(currentSession.id);
    }
  }, [currentSession, onSessionStop]);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (status: ScrapingSession['status']) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'stopping':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: ScrapingSession['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'stopping':
        return <Square className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Scraping Control Center</h2>
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {/* Advanced Settings */}
      {showAdvancedSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Advanced Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Concurrent Workers</label>
              <input
                type="number"
                min="1"
                max="20"
                value={concurrentWorkers}
                onChange={(e) => setConcurrentWorkers(parseInt(e.target.value))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Request Delay (ms)</label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={requestDelay}
                onChange={(e) => setRequestDelay(parseInt(e.target.value))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Retry Attempts</label>
              <input
                type="number"
                min="0"
                max="10"
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(parseInt(e.target.value))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Timeout (ms)</label>
              <input
                type="number"
                min="5000"
                max="120000"
                step="1000"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-3 mb-6">
        {!currentSession || currentSession.status === 'completed' ? (
          <button
            onClick={startSession}
            className="flex items-center gap-2 px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Play className="h-5 w-5" />
            Start Scraping
          </button>
        ) : (
          <>
            {currentSession.status === 'running' ? (
              <button
                onClick={pauseSession}
                className="flex items-center gap-2 px-6 py-3 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                <Pause className="h-5 w-5" />
                Pause
              </button>
            ) : (
              <button
                onClick={resumeSession}
                className="flex items-center gap-2 px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Play className="h-5 w-5" />
                Resume
              </button>
            )}
            <button
              onClick={stopSession}
              className="flex items-center gap-2 px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Square className="h-5 w-5" />
              Stop
            </button>
          </>
        )}
        
        {currentSession && (
          <button
            className="flex items-center gap-2 px-4 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Results
          </button>
        )}
      </div>

      {/* Current Session Status */}
      {currentSession && (
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSession.status)}`}>
                  {getStatusIcon(currentSession.status)}
                  {currentSession.status.charAt(0).toUpperCase() + currentSession.status.slice(1)}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{currentSession.name}</h3>
              </div>
              {currentSession.memoryLoaded && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Memory Loaded: {currentSession.memoryFile}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">
                  {currentSession.processedWebsites} / {currentSession.totalWebsites} websites
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(currentSession.processedWebsites / currentSession.totalWebsites) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{Math.round((currentSession.processedWebsites / currentSession.totalWebsites) * 100)}% complete</span>
                {currentSession.estimatedTimeRemaining && (
                  <span>ETA: {formatTime(currentSession.estimatedTimeRemaining)}</span>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentSession.successfulScrapes}</div>
                <div className="text-xs text-gray-500">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{currentSession.failedScrapes}</div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentSession.averageTimePerSite ? formatTime(currentSession.averageTimePerSite) : '-'}
                </div>
                <div className="text-xs text-gray-500">Avg Time/Site</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentSession.startTime ? formatTime(Date.now() - new Date(currentSession.startTime).getTime()) : '-'}
                </div>
                <div className="text-xs text-gray-500">Elapsed Time</div>
              </div>
            </div>

            {/* Current Website */}
            {currentSession.currentWebsite && currentSession.status === 'running' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="h-4 w-4" />
                <span>Currently scraping: </span>
                <span className="font-medium">{currentSession.currentWebsite}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.activeWorkers}</div>
            <div className="text-xs text-blue-700">Active Workers</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics.queueSize}</div>
            <div className="text-xs text-purple-700">Queue Size</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</div>
            <div className="text-xs text-green-700">Success Rate</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{metrics.averageResponseTime.toFixed(0)}ms</div>
            <div className="text-xs text-yellow-700">Avg Response</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{metrics.errorRate.toFixed(1)}%</div>
            <div className="text-xs text-red-700">Error Rate</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{metrics.throughputPerMinute.toFixed(1)}</div>
            <div className="text-xs text-indigo-700">Sites/Min</div>
          </div>
        </div>
      </div>

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {sessionHistory.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                    {getStatusIcon(session.status)}
                    {session.status}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{session.name}</div>
                    <div className="text-sm text-gray-500">
                      {session.processedWebsites}/{session.totalWebsites} websites • 
                      {session.successfulScrapes} successful • 
                      {session.failedScrapes} failed
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {session.startTime && (
                    <div>{new Date(session.startTime).toLocaleDateString()}</div>
                  )}
                  {session.endTime && session.startTime && (
                    <div>
                      Duration: {formatTime(new Date(session.endTime).getTime() - new Date(session.startTime).getTime())}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrapingControlPanel;