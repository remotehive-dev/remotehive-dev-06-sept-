'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Activity,
  Pause,
  Play,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Clock,
  Terminal,
  X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/advanced/glass-card';
import { autoScraperApi } from '@/lib/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  source: string;
  message: string;
  jobId?: string;
  jobName?: string;
  details?: Record<string, any>;
}



interface LiveLogsProps {
  isStreaming?: boolean;
  onStreamToggle?: (streaming: boolean) => void;
}

export function LiveLogs({ isStreaming = true, onStreamToggle }: LiveLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [streaming, setStreaming] = useState(isStreaming);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<EventSource | null>(null);

  // Fetch initial logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await autoScraperApi.getLiveLogs({ limit: 100 });
      const initialLogs = response.data || [];
      setLogs(initialLogs);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  // Initialize SSE connection for real-time logs
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      wsRef.current = autoScraperApi.connectToLiveLogs(
        (newLog: LogEntry) => {
          setLogs(prev => {
            const updated = [...prev, newLog];
            // Keep only last 100 logs for performance
            return updated.slice(-100);
          });
        },
        (error) => {
          console.error('SSE connection error:', error);
          setError('SSE connection failed');
          setConnectionStatus('disconnected');
        }
      );

      if (wsRef.current) {
        wsRef.current.onopen = () => {
          setConnectionStatus('connected');
          setError(null);
        };

        wsRef.current.onerror = () => {
          setConnectionStatus('disconnected');
        };
      }
    } catch (err) {
      console.error('Failed to connect SSE:', err);
      setError('Failed to establish SSE connection');
      setConnectionStatus('disconnected');
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  // Initialize component
  useEffect(() => {
    fetchLogs();
    if (streaming) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Handle streaming toggle
  useEffect(() => {
    if (streaming) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
  }, [streaming]);

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.jobName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(log => log.source === sourceFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, sourceFilter]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const handleStreamToggle = () => {
    const newStreaming = !streaming;
    setStreaming(newStreaming);
    onStreamToggle?.(newStreaming);
  };

  const handleClearLogs = async () => {
    try {
      await autoScraperApi.clearLogs();
      setLogs([]);
      setFilteredLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
      setError('Failed to clear logs');
    }
  };

  const handleExportLogs = async () => {
    try {
      const response = await autoScraperApi.exportLogs();
      
      // If API returns a blob directly
      if (response instanceof Blob) {
        const url = URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `autoscraper-logs-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback: export filtered logs as JSON
        const logData = filteredLogs.map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          source: log.source,
          message: log.message,
          jobName: log.jobName,
          details: log.details
        }));
        
        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `autoscraper-logs-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export logs:', err);
      setError('Failed to export logs');
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
      case 'debug': return Terminal;
      default: return Info;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'debug': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const uniqueSources = Array.from(new Set(logs.map(log => log.source)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Logs</h2>
          <p className="text-slate-400">Real-time scraping activity and system logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className={
              connectionStatus === 'connected' ? 'bg-green-600' : 
              connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-gray-600'
            }
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'
            }`} />
            {connectionStatus === 'connected' ? 'Live' : 
             connectionStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
          </Badge>
          {error && (
            <Badge variant="destructive" className="bg-red-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleStreamToggle}
          >
            {streaming ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {streaming ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="all">All Sources</SelectItem>
              {uniqueSources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label className="text-sm text-slate-300">Auto-scroll</Label>
          </div>
          
          <Button size="sm" variant="outline" onClick={handleExportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleClearLogs}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </GlassCard>

      {/* Logs Display */}
      <GlassCard className="p-0 overflow-hidden">
        <div 
          ref={logsContainerRef}
          className="h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
        >
          <div className="p-4 space-y-2">
            <AnimatePresence initial={false}>
              {filteredLogs.map((log) => {
                const LevelIcon = getLevelIcon(log.level);
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <LevelIcon className={`w-4 h-4 ${getLevelColor(log.level)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={`text-xs px-2 py-0.5 ${getLevelBadgeColor(log.level || 'info')}`}>
                          {(log.level || 'info').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-400">{log.timestamp}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.source}
                        </Badge>
                        {log.jobName && (
                          <Badge variant="secondary" className="text-xs">
                            {log.jobName}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-white mb-1">{log.message}</p>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="text-xs text-slate-400">
                          <summary className="cursor-pointer hover:text-slate-300">Details</summary>
                          <pre className="mt-1 p-2 bg-slate-900/50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Terminal className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No logs found</h3>
                <p className="text-slate-400">
                  {searchTerm || levelFilter !== 'all' || sourceFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Logs will appear here when scraping activities occur'
                  }
                </p>
              </div>
            )}
            
            <div ref={logsEndRef} />
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Logs</p>
              <p className="text-xl font-bold text-white">{logs.length}</p>
            </div>
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Errors</p>
              <p className="text-xl font-bold text-red-400">
                {logs.filter(log => log.level === 'error').length}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Warnings</p>
              <p className="text-xl font-bold text-yellow-400">
                {logs.filter(log => log.level === 'warning').length}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Success</p>
              <p className="text-xl font-bold text-green-400">
                {logs.filter(log => log.level === 'success').length}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}