'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Download, 
  RefreshCw,
  Settings,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import ErrorBoundary from '@/components/error/ErrorBoundary';

export type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'scatter' | 'composed';
export type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface ChartDataPoint {
  timestamp: string | number;
  value: number;
  label?: string;
  category?: string;
  x?: number;
  y?: number;
  size?: number;
  fill?: string;
  [key: string]: any;
}

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  type?: 'line' | 'area' | 'bar';
  yAxisId?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  visible?: boolean;
}

export interface ChartAnnotation {
  x?: number | string;
  y?: number;
  label: string;
  color?: string;
  strokeDasharray?: string;
}

export interface ChartZoom {
  enabled: boolean;
  startIndex?: number;
  endIndex?: number;
}

export interface RealTimeChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  series?: ChartSeries[];
  chartType?: ChartType;
  height?: number;
  loading?: boolean;
  error?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  aggregation?: AggregationType;
  smoothing?: boolean;
  annotations?: ChartAnnotation[];
  zoom?: ChartZoom;
  onRefresh?: () => void;
  onExport?: (format: 'png' | 'svg' | 'csv' | 'json') => void;
  onFullscreen?: () => void;
  className?: string;
  timeRange?: TimeRange;
  customTimeRange?: { start: Date; end: Date };
  onTimeRangeChange?: (range: TimeRange) => void;
  onDataPointClick?: (data: ChartDataPoint) => void;
  onZoomChange?: (zoom: ChartZoom) => void;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
    significance?: 'high' | 'medium' | 'low';
  };
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  customTooltip?: (props: any) => React.ReactNode;
  thresholds?: {
    value: number;
    label: string;
    color: string;
  }[];
  realTimeUpdates?: boolean;
  maxDataPoints?: number;
  showControls?: boolean;
  enableBrushing?: boolean;
  enableCrosshair?: boolean;
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
];

const TIME_RANGES = [
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
];

export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  title,
  description,
  data,
  series,
  chartType = 'line',
  height = 300,
  loading = false,
  error,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  animated = true,
  autoRefresh = false,
  refreshInterval = 30000,
  aggregation = 'avg',
  smoothing = false,
  annotations = [],
  zoom,
  onRefresh,
  onExport,
  onFullscreen,
  className,
  timeRange,
  customTimeRange,
  onTimeRangeChange,
  onDataPointClick,
  onZoomChange,
  trend,
  badge,
  customTooltip,
  thresholds = [],
  realTimeUpdates = false,
  maxDataPoints = 1000,
  showControls = true,
  enableBrushing = false,
  enableCrosshair = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [chartSettings, setChartSettings] = useState({
    showGrid,
    showLegend,
    smoothing,
    enableCrosshair
  });
  const [zoomState, setZoomState] = useState<ChartZoom>(zoom || { enabled: false });
  const chartRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval && onRefresh) {
      refreshIntervalRef.current = setInterval(onRefresh, refreshInterval);
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Process and filter data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let result = [...data];
    
    // Sort by timestamp
    result.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
      const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
      return timeA - timeB;
    });
    
    // Apply time range filter
    if (timeRange !== 'custom' && timeRange !== '30d') {
      const now = new Date();
      const timeRangeMs = {
        '5m': 5 * 60 * 1000,
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }[timeRange];
      
      if (timeRangeMs) {
        const cutoff = now.getTime() - timeRangeMs;
        result = result.filter(item => {
          const itemTime = typeof item.timestamp === 'string' ? new Date(item.timestamp).getTime() : item.timestamp;
          return itemTime >= cutoff;
        });
      }
    }
    
    // Apply custom time range filter
    if (timeRange === 'custom' && customTimeRange) {
      const { start, end } = customTimeRange;
      result = result.filter(item => {
        const itemTime = typeof item.timestamp === 'string' ? new Date(item.timestamp).getTime() : item.timestamp;
        return itemTime >= start.getTime() && itemTime <= end.getTime();
      });
    }
    
    // Limit data points for performance
    if (result.length > maxDataPoints) {
      const step = Math.ceil(result.length / maxDataPoints);
      result = result.filter((_, index) => index % step === 0);
    }
    
    return result.map((item, index) => ({
      ...item,
      index,
      formattedTime: item.timestamp ? 
        new Date(item.timestamp).toLocaleTimeString() : 
        `Point ${index + 1}`
    }));
  }, [data, maxDataPoints, timeRange, customTimeRange]);

  // Calculate trend if not provided
  const calculatedTrend = useMemo(() => {
    if (trend || processedData.length < 2) return trend;
    
    const recent = processedData.slice(-10);
    const older = processedData.slice(-20, -10);
    
    if (recent.length === 0 || older.length === 0) return undefined;
    
    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
      percentage: Math.abs(change),
      period: 'vs previous period',
      significance: Math.abs(change) > 10 ? 'high' : Math.abs(change) > 5 ? 'medium' : 'low'
    };
  }, [trend, processedData]);

  // Handle chart interactions
  const handleDataPointClick = useCallback((data: any) => {
    if (onDataPointClick) {
      onDataPointClick(data);
    }
  }, [onDataPointClick]);

  const handleZoomChange = useCallback((newZoom: any) => {
    const updatedZoom = { ...zoomState, ...newZoom };
    setZoomState(updatedZoom);
    if (onZoomChange) {
      onZoomChange(updatedZoom);
    }
  }, [zoomState, onZoomChange]);

  const handleExport = useCallback((format: 'png' | 'svg' | 'csv' | 'json') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export logic
      if (format === 'csv' || format === 'json') {
        const dataStr = format === 'csv' 
          ? processedData.map(item => Object.values(item).join(',')).join('\n')
          : JSON.stringify(processedData, null, 2);
        
        const blob = new Blob([dataStr], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart-data.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [onExport, processedData]);

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (customTooltip) {
      return customTooltip({ active, payload, label });
    }

    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
              <span className="font-medium">{formatValue(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading chart data...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (!processedData || processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">No data available</p>
            <p className="text-xs text-muted-foreground">Try adjusting the time range or refreshing the data</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: processedData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
      onClick: handleDataPointClick
    };

    const renderTooltip = (props: any) => {
      if (!showTooltip) return null;
      
      if (props.active && props.payload && props.payload.length) {
        const data = props.payload[0];
        return (
          <div className="bg-background border rounded-lg shadow-lg p-3 max-w-xs">
            <p className="font-medium text-sm mb-1">
              {data.payload.label || formatValue(data.payload.timestamp)}
            </p>
            {props.payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name || 'Value'}
                </span>
                <span className="font-medium">{formatValue(entry.value)}</span>
              </div>
            ))}
            {data.payload.category && (
              <p className="text-xs text-muted-foreground mt-1">
                Category: {data.payload.category}
              </p>
            )}
          </div>
        );
      }
      return null;
    };

    const renderAnnotations = () => {
      if (!annotations || annotations.length === 0) return null;
      
      return annotations.map((annotation, index) => (
        <text
          key={index}
          x={annotation.x}
          y={annotation.y}
          fill={annotation.color || '#666'}
          fontSize="12"
          textAnchor="middle"
        >
          {annotation.label}
        </text>
      ));
    };

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis 
                dataKey="formattedTime" 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={formatValue}
                tick={{ fontSize: 11 }}
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {chartSettings.showLegend && <Legend />}
              {thresholds.map((threshold, index) => (
                <ReferenceLine 
                  key={index}
                  y={threshold.value} 
                  stroke={threshold.color}
                  strokeDasharray="5 5"
                  label={threshold.label}
                />
              ))}
              {series && series.length > 0 ? (
                series
                  .filter(s => !selectedSeries.length || selectedSeries.includes(s.key))
                  .map((s, index) => (
                    <Area
                      key={s.key}
                      type={chartSettings.smoothing ? "monotone" : "linear"}
                      dataKey={s.key}
                      name={s.name}
                      stroke={s.color || COLORS[index % COLORS.length]}
                      fill={s.color || COLORS[index % COLORS.length]}
                      fillOpacity={s.fillOpacity || 0.3}
                      strokeWidth={s.strokeWidth || 2}
                      animationDuration={animated ? 1000 : 0}
                    />
                  ))
              ) : (
                <Area
                  type={chartSettings.smoothing ? "monotone" : "linear"}
                  dataKey="value"
                  stroke={COLORS[0]}
                  fill={COLORS[0]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  animationDuration={animated ? 1000 : 0}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis 
                dataKey="formattedTime" 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={formatValue}
                tick={{ fontSize: 11 }}
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {chartSettings.showLegend && <Legend />}
              {thresholds.map((threshold, index) => (
                <ReferenceLine 
                  key={index}
                  y={threshold.value} 
                  stroke={threshold.color}
                  strokeDasharray="5 5"
                  label={threshold.label}
                />
              ))}
              {series && series.length > 0 ? (
                series
                  .filter(s => !selectedSeries.length || selectedSeries.includes(s.key))
                  .map((s, index) => (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      name={s.name}
                      fill={s.color || COLORS[index % COLORS.length]}
                      animationDuration={animated ? 1000 : 0}
                    />
                  ))
              ) : (
                <Bar
                  dataKey="value"
                  fill={COLORS[0]}
                  animationDuration={animated ? 1000 : 0}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = series && series.length > 0 ? series.map((s, index) => ({
          name: s.name,
          value: processedData.reduce((sum, item) => sum + (item[s.key] || 0), 0),
          color: s.color
        })) : processedData.map((item, index) => ({
          name: item.label || `Item ${index + 1}`,
          value: item.value,
          color: item.fill || COLORS[index % COLORS.length]
        }));

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={Math.min(height * 0.35, 120)}
                fill="#8884d8"
                dataKey="value"
                onClick={handleDataPointClick}
                animationDuration={animated ? 1000 : 0}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {chartSettings.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart {...commonProps}>
              {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis 
                type="number"
                dataKey="x"
                name="X"
                tickFormatter={formatValue}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                type="number"
                dataKey="y"
                name="Y"
                tickFormatter={formatValue}
                tick={{ fontSize: 11 }}
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />}
              {chartSettings.showLegend && <Legend />}
              <Scatter 
                name="Data Points" 
                data={processedData} 
                fill={COLORS[0]}
                onClick={handleDataPointClick}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart {...commonProps}>
              {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis 
                dataKey="formattedTime" 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={formatValue}
                tick={{ fontSize: 11 }}
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {chartSettings.showLegend && <Legend />}
              {thresholds.map((threshold, index) => (
                <ReferenceLine 
                  key={index}
                  y={threshold.value} 
                  stroke={threshold.color}
                  strokeDasharray="5 5"
                  label={threshold.label}
                />
              ))}
              {series && series.length > 0 ? (
                series
                  .filter(s => !selectedSeries.length || selectedSeries.includes(s.key))
                  .map((s, index) => {
                    const Component = s.type === 'bar' ? Bar : s.type === 'area' ? Area : Line;
                    return (
                      <Component
                        key={s.key}
                        type={s.type === 'line' ? (chartSettings.smoothing ? "monotone" : "linear") : undefined}
                        dataKey={s.key}
                        stroke={s.color || COLORS[index % COLORS.length]}
                        fill={s.type === 'area' || s.type === 'bar' ? (s.color || COLORS[index % COLORS.length]) : undefined}
                        fillOpacity={s.type === 'area' ? (s.fillOpacity || 0.3) : undefined}
                        strokeWidth={s.strokeWidth || 2}
                        name={s.name}
                        yAxisId={s.yAxisId}
                        animationDuration={animated ? 1000 : 0}
                      />
                    );
                  })
              ) : (
                <Line 
                  type={chartSettings.smoothing ? "monotone" : "linear"}
                  dataKey="value" 
                  stroke={COLORS[0]} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={animated ? 1000 : 0}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        );

      default: // line
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis 
                dataKey="formattedTime" 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={formatValue}
                tick={{ fontSize: 11 }}
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {chartSettings.showLegend && <Legend />}
              {thresholds.map((threshold, index) => (
                <ReferenceLine 
                  key={index}
                  y={threshold.value} 
                  stroke={threshold.color}
                  strokeDasharray="5 5"
                  label={threshold.label}
                />
              ))}
              {series && series.length > 0 ? (
                series
                  .filter(s => !selectedSeries.length || selectedSeries.includes(s.key))
                  .map((s, index) => (
                    <Line
                      key={s.key}
                      type={chartSettings.smoothing ? "monotone" : "linear"}
                      dataKey={s.key}
                      name={s.name}
                      stroke={s.color || COLORS[index % COLORS.length]}
                      strokeWidth={s.strokeWidth || 2}
                      dot={false}
                      activeDot={{ r: 6, stroke: s.color, strokeWidth: 2 }}
                      animationDuration={animated ? 1000 : 0}
                    />
                  ))
              ) : (
                <Line
                  type={chartSettings.smoothing ? "monotone" : "linear"}
                  dataKey="value"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  animationDuration={animated ? 1000 : 0}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderControls = () => {
    if (!showControls) return null;
    
    return (
      <div className="flex items-center space-x-2 mb-4">
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5m">5 minutes</SelectItem>
            <SelectItem value="15m">15 minutes</SelectItem>
            <SelectItem value="1h">1 hour</SelectItem>
            <SelectItem value="6h">6 hours</SelectItem>
            <SelectItem value="24h">24 hours</SelectItem>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-2">
          <Switch 
            checked={chartSettings.showGrid} 
            onCheckedChange={(checked) => setChartSettings(prev => ({ ...prev, showGrid: checked }))}
          />
          <Label className="text-xs">Grid</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            checked={chartSettings.smoothing} 
            onCheckedChange={(checked) => setChartSettings(prev => ({ ...prev, smoothing: checked }))}
          />
          <Label className="text-xs">Smooth</Label>
        </div>
        
        {zoomState.enabled && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const resetZoom = { enabled: true, startIndex: undefined, endIndex: undefined };
              setZoomState(resetZoom);
              if (onZoomChange) onZoomChange(resetZoom);
            }}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset Zoom
          </Button>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <Card className={cn("w-full", className)} ref={chartRef}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {calculatedTrend && (
              <div className="flex items-center space-x-1">
                {calculatedTrend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : calculatedTrend.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  calculatedTrend.direction === 'up' ? "text-green-500" : 
                  calculatedTrend.direction === 'down' ? "text-red-500" : "text-gray-500"
                )}>
                  {calculatedTrend.percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">{calculatedTrend.period}</span>
                {calculatedTrend.significance && (
                  <Badge 
                    variant={calculatedTrend.significance === 'high' ? 'destructive' : 
                            calculatedTrend.significance === 'medium' ? 'default' : 'secondary'}
                    className="text-xs px-1 py-0"
                  >
                    {calculatedTrend.significance}
                  </Badge>
                )}
              </div>
            )}
            {badge && (
              <Badge variant={badge.variant}>{badge.text}</Badge>
            )}
            {realTimeUpdates && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onExport && (
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleExport('csv')}
                  title="Export as CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
            {onFullscreen && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                  if (onFullscreen) onFullscreen();
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderControls()}
          {renderChart()}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default RealTimeChart;