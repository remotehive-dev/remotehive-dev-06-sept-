'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  TreeMap,
  Sankey,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Maximize2,
  Settings,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Filter,
  Palette,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChartDataPoint {
  [key: string]: any;
  timestamp?: string | number;
  value?: number;
  category?: string;
  x?: number;
  y?: number;
  z?: number;
  size?: number;
  fill?: string;
}

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  type?: 'line' | 'area' | 'bar' | 'scatter';
  yAxisId?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  dot?: boolean;
  connectNulls?: boolean;
}

export interface ChartAnnotation {
  x: string | number;
  y: number;
  label: string;
  color?: string;
  type?: 'line' | 'point' | 'area';
}

export interface AdvancedChartProps {
  title?: string;
  description?: string;
  data: ChartDataPoint[];
  type: 'heatmap' | 'treemap' | 'sankey' | 'funnel' | 'radial' | 'bubble' | 'candlestick';
  width?: number;
  height?: number;
  className?: string;
  series?: ChartSeries[];
  annotations?: ChartAnnotation[];
  colorScheme?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  interactive?: boolean;
  onDataPointClick?: (data: any) => void;
  onExport?: (format: 'png' | 'svg' | 'csv' | 'json') => void;
}

// Color schemes
const COLOR_SCHEMES = {
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
  pastel: ['#fecaca', '#fed7d7', '#fef3c7', '#d1fae5', '#dbeafe', '#e0e7ff', '#f3e8ff', '#fce7f3'],
  dark: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f9fafb'],
  vibrant: ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#7c3aed', '#c026d3'],
  monochrome: ['#000000', '#404040', '#808080', '#a0a0a0', '#c0c0c0', '#e0e0e0', '#f0f0f0', '#ffffff']
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Heatmap component
const HeatmapChart: React.FC<{
  data: ChartDataPoint[];
  width: number;
  height: number;
  colorScheme: string[];
}> = ({ data, width, height, colorScheme }) => {
  const cellSize = 20;
  const maxValue = Math.max(...data.map(d => d.value || 0));
  
  return (
    <svg width={width} height={height}>
      {data.map((item, index) => {
        const intensity = (item.value || 0) / maxValue;
        const color = colorScheme[Math.floor(intensity * (colorScheme.length - 1))];
        const x = (index % Math.floor(width / cellSize)) * cellSize;
        const y = Math.floor(index / Math.floor(width / cellSize)) * cellSize;
        
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={cellSize - 1}
            height={cellSize - 1}
            fill={color}
            opacity={0.3 + intensity * 0.7}
          />
        );
      })}
    </svg>
  );
};

// Bubble chart component
const BubbleChart: React.FC<{
  data: ChartDataPoint[];
  width: number;
  height: number;
  colorScheme: string[];
  onDataPointClick?: (data: any) => void;
}> = ({ data, width, height, colorScheme, onDataPointClick }) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <ScatterChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" type="number" />
        <YAxis dataKey="y" type="number" />
        <Tooltip content={<CustomTooltip />} />
        <Scatter
          dataKey="z"
          fill={colorScheme[0]}
          onClick={onDataPointClick}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill || colorScheme[index % colorScheme.length]} 
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

// Candlestick chart component
const CandlestickChart: React.FC<{
  data: ChartDataPoint[];
  width: number;
  height: number;
  colorScheme: string[];
}> = ({ data, width, height, colorScheme }) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="volume" fill={colorScheme[1]} opacity={0.3} />
        <Line 
          type="monotone" 
          dataKey="high" 
          stroke={colorScheme[0]} 
          strokeWidth={1}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="low" 
          stroke={colorScheme[2]} 
          strokeWidth={1}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={colorScheme[3]}
          fill={colorScheme[3]}
          fillOpacity={0.2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const AdvancedChart: React.FC<AdvancedChartProps> = ({
  title,
  description,
  data,
  type,
  width = 400,
  height = 300,
  className,
  series = [],
  annotations = [],
  colorScheme = COLOR_SCHEMES.default,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  interactive = true,
  onDataPointClick,
  onExport
}) => {
  const [selectedColorScheme, setSelectedColorScheme] = useState('default');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartSettings, setChartSettings] = useState({
    showGrid,
    showLegend,
    showTooltip,
    interactive
  });
  
  const chartRef = useRef<HTMLDivElement>(null);
  const colors = COLOR_SCHEMES[selectedColorScheme as keyof typeof COLOR_SCHEMES] || colorScheme;

  const handleExport = (format: 'png' | 'svg' | 'csv' | 'json') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export implementation
      if (format === 'csv') {
        const csv = data.map(row => Object.values(row).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'chart'}.csv`;
        a.click();
      } else if (format === 'json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'chart'}.json`;
        a.click();
      }
    }
  };

  const renderChart = () => {
    const chartWidth = isFullscreen ? window.innerWidth - 100 : width;
    const chartHeight = isFullscreen ? window.innerHeight - 200 : height;

    switch (type) {
      case 'heatmap':
        return (
          <HeatmapChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            colorScheme={colors}
          />
        );

      case 'treemap':
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <TreeMap
              data={data}
              dataKey="value"
              ratio={4/3}
              stroke="#fff"
              fill={colors[0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </TreeMap>
          </ResponsiveContainer>
        );

      case 'funnel':
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <FunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel
                dataKey="value"
                data={data}
                isAnimationActive
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
                <LabelList position="center" fill="#fff" stroke="none" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );

      case 'radial':
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="10%"
              outerRadius="80%"
              data={data}
            >
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                clockWise
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </RadialBar>
              <Legend iconSize={18} layout="vertical" verticalAlign="middle" align="right" />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case 'bubble':
        return (
          <BubbleChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            colorScheme={colors}
            onDataPointClick={onDataPointClick}
          />
        );

      case 'candlestick':
        return (
          <CandlestickChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            colorScheme={colors}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  const renderControls = () => (
    <div className="flex items-center space-x-2">
      <Select value={selectedColorScheme} onValueChange={setSelectedColorScheme}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="pastel">Pastel</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="vibrant">Vibrant</SelectItem>
          <SelectItem value="monochrome">Monochrome</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('png')}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {renderControls()}
            <Button
              variant="outline"
              onClick={() => setIsFullscreen(false)}
            >
              Exit Fullscreen
            </Button>
          </div>
        </div>
        <div className="p-4 h-full">
          {renderChart()}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          {renderControls()}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedChart;
export { CustomTooltip, HeatmapChart, BubbleChart, CandlestickChart, COLOR_SCHEMES };