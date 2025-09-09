'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { useRetry, retryConditions } from './useRetry';

export interface ScraperMetrics {
  totalConfigurations: number;
  runningScrapers: number;
  jobsScraped: number;
  successRate: number;
  avgResponseTime: number;
  errorRate: number;
  dataProcessed: number;
  activeConnections: number;
}

export interface ScraperStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  currentPage: number;
  totalPages: number;
  jobsFound: number;
  startTime: string;
  eta: string;
  lastUpdate: string;
  errorMessage?: string;
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  queueSize: number;
  workerStatus: 'healthy' | 'warning' | 'critical';
  lastHealthCheck: string;
}

export interface ScrapingActivity {
  id: string;
  scraperName: string;
  action: 'started' | 'completed' | 'failed' | 'paused' | 'resumed';
  timestamp: string;
  details: string;
  jobsFound?: number;
  duration?: number;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface RealTimeData {
  metrics: ScraperMetrics;
  scraperStatuses: ScraperStatus[];
  systemHealth: SystemHealth;
  recentActivity: ScrapingActivity[];
  chartData: {
    jobsOverTime: ChartDataPoint[];
    successRateOverTime: ChartDataPoint[];
    responseTimeOverTime: ChartDataPoint[];
    errorRateOverTime: ChartDataPoint[];
  };
}

interface UseScraperRealTimeOptions {
  wsUrl?: string;
  fallbackApiUrl?: string;
  maxDataPoints?: number;
  updateInterval?: number;
  enableFallback?: boolean;
  // Backward compatibility aliases
  websocketUrl?: string;
  apiUrl?: string;
  refreshInterval?: number;
  enabled?: boolean;
}

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/admin/dashboard?token=admin';
const DEFAULT_API_URL = '/api/scraper';
const DEFAULT_MAX_DATA_POINTS = 50;
const DEFAULT_UPDATE_INTERVAL = 5000;

export const useScraperRealTime = (options: UseScraperRealTimeOptions = {}) => {
  const {
    wsUrl,
    fallbackApiUrl,
    maxDataPoints = DEFAULT_MAX_DATA_POINTS,
    updateInterval,
    enableFallback = true,
    // Aliases
    websocketUrl,
    apiUrl,
    refreshInterval,
    enabled
  } = options;

  // Resolve final options supporting both naming conventions
  const resolvedWsUrl = websocketUrl ?? wsUrl ?? DEFAULT_WS_URL;
  const resolvedApiUrl = apiUrl ?? fallbackApiUrl ?? DEFAULT_API_URL;
  const resolvedUpdateInterval = refreshInterval ?? updateInterval ?? DEFAULT_UPDATE_INTERVAL;
  const resolvedEnableFallback = (enabled ?? enableFallback);

  const [data, setData] = useState<RealTimeData>({
    metrics: {
      totalConfigurations: 0,
      runningScrapers: 0,
      jobsScraped: 0,
      successRate: 0,
      avgResponseTime: 0,
      errorRate: 0,
      dataProcessed: 0,
      activeConnections: 0
    },
    scraperStatuses: [],
    systemHealth: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkLatency: 0,
      queueSize: 0,
      workerStatus: 'healthy',
      lastHealthCheck: new Date().toISOString()
    },
    recentActivity: [],
    chartData: {
      jobsOverTime: [],
      successRateOverTime: [],
      responseTimeOverTime: [],
      errorRateOverTime: []
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'fallback'>('connecting');

  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataHistoryRef = useRef<Map<string, ChartDataPoint[]>>(new Map());

  // WebSocket connection
  const { isConnected, lastMessage, sendMessage, error: wsError, reconnect } = useWebSocket({
    url: resolvedWsUrl,
    reconnectAttempts: 3,
    reconnectInterval: 2000,
    heartbeatInterval: 30000,
    onOpen: () => {
      console.log('Connected to scraper WebSocket');
      setConnectionStatus('connected');
      setError(null);
      // Request initial data
      sendMessage({ type: 'subscribe', channels: ['metrics', 'status', 'health', 'activity'] });
    },
    onClose: () => {
      console.log('Disconnected from scraper WebSocket');
      setConnectionStatus('disconnected');
      if (resolvedEnableFallback) {
        startFallbackPolling();
      }
    },
    onError: () => {
      setError('WebSocket connection failed');
      if (resolvedEnableFallback) {
        startFallbackPolling();
      }
    }
  });

  // Enhanced API fetch with retry logic
  const fetchApiData = useCallback(async () => {
    const [metricsRes, statusRes, healthRes, activityRes] = await Promise.all([
      fetch(`${resolvedApiUrl}/analytics/dashboard`),
      fetch(`${resolvedApiUrl}/status`),
      fetch(`${resolvedApiUrl}/health`),
      fetch(`${resolvedApiUrl}/activity/recent`)
    ]);

    // Check for HTTP errors
    const responses = [metricsRes, statusRes, healthRes, activityRes];
    responses.forEach(res => {
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
        (error as any).status = res.status;
        throw error;
      }
    });

    // Correct JSON parsing from API responses
    const [metrics, statuses, health, activity] = await Promise.all([
      metricsRes.json(),
      statusRes.json(),
      healthRes.json(),
      activityRes.json()
    ]);

    return { metrics, statuses, health, activity };
  }, [resolvedApiUrl]);

  // Retry configuration for API calls
  const apiRetry = useRetry(fetchApiData, {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.warn(`API fetch attempt ${attempt} failed:`, error);
      setError(`Retrying connection... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached:', error);
      setError('Failed to connect after multiple attempts');
    }
  });

  // Fallback API polling with retry
  const fetchFallbackData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { metrics, statuses, health, activity } = await apiRetry.execute();

      // Extract data from API responses that have success/data structure
      const extractData = (response: any) => {
        if (response && typeof response === 'object') {
          if (response.success && response.data) {
            return response.data;
          }
          if (Array.isArray(response)) {
            return response;
          }
          if (response.data && Array.isArray(response.data)) {
            return response.data;
          }
        }
        return response || [];
      };

      updateData({
        type: 'bulk_update',
        data: {
          metrics: extractData(metrics),
          scraperStatuses: extractData(statuses),
          systemHealth: extractData(health),
          recentActivity: extractData(activity)
        },
        timestamp: new Date().toISOString()
      });

      setConnectionStatus('fallback');
      setError(null);
    } catch (err) {
      console.error('Fallback API fetch failed after retries:', err);
      setError('Failed to fetch data from API after multiple attempts');
    } finally {
      setIsLoading(false);
    }
  }, [apiRetry]);

  const startFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }

    if (!resolvedEnableFallback) {
      return;
    }

    if (resolvedUpdateInterval <= 0) {
      // Auto-refresh disabled: do not start polling
      return;
    }
    
    fetchFallbackData(); // Initial fetch
    fallbackIntervalRef.current = setInterval(fetchFallbackData, resolvedUpdateInterval);
  }, [fetchFallbackData, resolvedUpdateInterval, resolvedEnableFallback]);

  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  // Update chart data with new points
  const updateChartData = useCallback((key: string, value: number, timestamp: string) => {
    const history = dataHistoryRef.current.get(key) || [];
    const newPoint: ChartDataPoint = { timestamp, value };
    
    history.push(newPoint);
    
    // Keep only the last maxDataPoints
    if (history.length > maxDataPoints) {
      history.splice(0, history.length - maxDataPoints);
    }
    
    dataHistoryRef.current.set(key, history);
    return [...history];
  }, [maxDataPoints]);

  // Process WebSocket messages
  const updateData = useCallback((message: WebSocketMessage) => {
    const timestamp = message.timestamp || new Date().toISOString();
    
    setData(prevData => {
      const newData = { ...prevData };
      
      switch (message.type) {
        case 'metrics_update':
          newData.metrics = { ...newData.metrics, ...message.data };
          // Update chart data
          newData.chartData.jobsOverTime = updateChartData('jobs', message.data.jobsScraped, timestamp);
          newData.chartData.successRateOverTime = updateChartData('successRate', message.data.successRate, timestamp);
          newData.chartData.responseTimeOverTime = updateChartData('responseTime', message.data.avgResponseTime, timestamp);
          newData.chartData.errorRateOverTime = updateChartData('errorRate', message.data.errorRate, timestamp);
          break;
          
        case 'scraper_status_update':
          const statusIndex = newData.scraperStatuses.findIndex(s => s.id === message.data.id);
          if (statusIndex >= 0) {
            newData.scraperStatuses[statusIndex] = { ...newData.scraperStatuses[statusIndex], ...message.data };
          } else {
            newData.scraperStatuses.push(message.data);
          }
          break;
          
        case 'system_health_update':
          newData.systemHealth = { ...newData.systemHealth, ...message.data };
          break;
          
        case 'activity_update':
          newData.recentActivity = [message.data, ...newData.recentActivity.slice(0, 19)]; // Keep last 20
          break;
          
        case 'bulk_update':
          if (message.data.metrics) newData.metrics = message.data.metrics;
          if (message.data.scraperStatuses) newData.scraperStatuses = message.data.scraperStatuses;
          if (message.data.systemHealth) newData.systemHealth = message.data.systemHealth;
          if (message.data.recentActivity) newData.recentActivity = message.data.recentActivity;
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
      
      return newData;
    });
    
    setLastUpdate(timestamp);
    setIsLoading(false);
  }, [updateChartData]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      updateData(lastMessage);
    }
  }, [lastMessage, updateData]);

  // Handle connection status changes
  useEffect(() => {
    if (isConnected) {
      stopFallbackPolling();
      setConnectionStatus('connected');
    }
  }, [isConnected, stopFallbackPolling]);

  // Handle WebSocket errors
  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFallbackPolling();
    };
  }, [stopFallbackPolling]);

  // Stop polling when update interval is disabled (<= 0)
  useEffect(() => {
    if (resolvedUpdateInterval <= 0) {
      stopFallbackPolling();
    }
  }, [resolvedUpdateInterval, stopFallbackPolling]);

  // Manual refresh function with retry
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    if (isConnected) {
      // If WebSocket is connected, just update the timestamp
      sendMessage({ type: 'refresh', timestamp: new Date().toISOString() });
      setLastUpdate(new Date().toISOString());
      setIsLoading(false);
    } else if (resolvedEnableFallback) {
      // If not connected, try to fetch via API with retry
      try {
        await fetchFallbackData();
      } catch (err) {
        console.error('Manual refresh failed:', err);
      }
    }
  }, [isConnected, sendMessage, resolvedEnableFallback, fetchFallbackData]);

  // Subscribe to specific scraper updates
  const subscribeToScraper = useCallback((scraperId: string) => {
    if (isConnected) {
      sendMessage({ type: 'subscribe_scraper', scraperId, timestamp: new Date().toISOString() });
    }
  }, [isConnected, sendMessage]);

  // Unsubscribe from scraper updates
  const unsubscribeFromScraper = useCallback((scraperId: string) => {
    if (isConnected) {
      sendMessage({ type: 'unsubscribe_scraper', scraperId, timestamp: new Date().toISOString() });
    }
  }, [isConnected, sendMessage]);

  return {
    // Shorthand fields for backward compatibility
    metrics: data.metrics,
    scraperStatuses: data.scraperStatuses,
    systemHealth: data.systemHealth,
    recentActivity: data.recentActivity,
    chartData: data.chartData,

    // Original structured state
    data,
    isLoading,
    error,
    lastUpdate,
    connectionStatus,
    isConnected: connectionStatus === 'connected',

    // Controls
    refresh,
    reconnect,
    subscribeToScraper,
    unsubscribeFromScraper,

    // Utility functions
    getScraperById: (id: string) => {
      const statuses = Array.isArray(data.scraperStatuses) ? data.scraperStatuses : [];
      return statuses.find(s => s.id === id);
    },
    getRunningScrapers: () => {
      const statuses = Array.isArray(data.scraperStatuses) ? data.scraperStatuses : [];
      return statuses.filter(s => s.status === 'running');
    },
    getFailedScrapers: () => {
      const statuses = Array.isArray(data.scraperStatuses) ? data.scraperStatuses : [];
      return statuses.filter(s => s.status === 'failed');
    },
    getTotalJobsToday: () => {
      const today = new Date().toDateString();
      const activities = Array.isArray(data.recentActivity) ? data.recentActivity : [];
      return activities
        .filter(a => new Date(a.timestamp).toDateString() === today)
        .reduce((sum, a) => sum + (a.jobsFound || 0), 0);
    }
  };
};

export default useScraperRealTime;