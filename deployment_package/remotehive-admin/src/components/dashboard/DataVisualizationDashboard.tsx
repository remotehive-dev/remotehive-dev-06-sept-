'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RealTimeChart } from './widgets';
import AdvancedChart, { ChartDataPoint, ChartSeries } from '../charts/AdvancedCharts';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Activity,
  Filter,
  Download,
  Settings,
  Maximize2,
  RefreshCw,
  Search,
  Calendar,
  Database,
  Layers,
  Grid3X3,
  Zap,
  Target,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataVisualizationProps {
  className?: string;
  data?: ChartDataPoint[];
  enableDrillDown?: boolean;
  enableFiltering?: boolean;
  enableExport?: boolean;
  enableRealTime?: boolean;
  refreshInterval?: number;
  onDataLoad?: () => Promise<ChartDataPoint[]>;
  onDrillDown?: (data: any, level: number) => Promise<ChartDataPoint[]>;
  onExport?: (data: ChartDataPoint[], format: string) => void;
}

interface DrillDownLevel {
  level: number;
  title: string;
  data: ChartDataPoint[];
  filters: Record<string, any>;
}

interface VisualizationConfig {
  chartType: string;
  title: string;
  description: string;
  dataKey: string;
  colorScheme: string;
  showLegend: boolean;
  showGrid: boolean;
  interactive: boolean;
  height: number;
}

const CHART_TYPES = [
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'area', label: 'Area Chart', icon: Activity },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'scatter', label: 'Scatter Plot', icon: Target },
  { value: 'heatmap', label: 'Heatmap', icon: Grid3X3 },
  { value: 'treemap', label: 'Treemap', icon: Layers },
  { value: 'funnel', label: 'Funnel Chart', icon: TrendingUp },
  { value: 'radial', label: 'Radial Chart', icon: Zap },
  { value: 'bubble', label: 'Bubble Chart', icon: Database },
  { value: 'candlestick', label: 'Candlestick', icon: BarChart3 }
];

const COLOR_SCHEMES = [
  { value: 'default', label: 'Default' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'dark', label: 'Dark' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'monochrome', label: 'Monochrome' }
];

// Sample data generators
const generateSampleData = (type: string, count: number = 50): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const categories = ['Web Scraping', 'Data Processing', 'API Calls', 'Database', 'Analytics'];
  const sources = ['Amazon', 'eBay', 'Google', 'Facebook', 'Twitter'];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - (count - i) * 3600000).toISOString();
    const category = categories[i % categories.length];
    const source = sources[i % sources.length];
    
    switch (type) {
      case 'performance':
        data.push({
          timestamp,
          responseTime: Math.random() * 1000 + 100,
          throughput: Math.random() * 100 + 50,
          errorRate: Math.random() * 10,
          category,
          source
        });
        break;
      case 'usage':
        data.push({
          timestamp,
          users: Math.floor(Math.random() * 1000),
          sessions: Math.floor(Math.random() * 500),
          pageViews: Math.floor(Math.random() * 2000),
          category,
          source
        });
        break;
      case 'financial':
        data.push({
          timestamp,
          open: Math.random() * 100 + 50,
          high: Math.random() * 120 + 60,
          low: Math.random() * 80 + 40,
          close: Math.random() * 110 + 55,
          volume: Math.floor(Math.random() * 10000),
          category,
          source
        });
        break;
      case 'geographic':
        data.push({
          timestamp,
          x: Math.random() * 100,
          y: Math.random() * 100,
          z: Math.random() * 50,
          size: Math.random() * 20 + 5,
          value: Math.random() * 1000,
          category,
          source,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
        break;
      default:
        data.push({
          timestamp,
          value: Math.random() * 100,
          category,
          source
        });
    }
  }
  
  return data;
};

const DataVisualizationDashboard: React.FC<DataVisualizationProps> = ({
  className,
  data: initialData,
  enableDrillDown = true,
  enableFiltering = true,
  enableExport = true,
  enableRealTime = false,
  refreshInterval = 30000,
  onDataLoad,
  onDrillDown,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<ChartDataPoint[]>(initialData || generateSampleData('performance'));
  const [filteredData, setFilteredData] = useState<ChartDataPoint[]>(data);
  const [drillDownStack, setDrillDownStack] = useState<DrillDownLevel[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Visualization configurations
  const [configs, setConfigs] = useState<Record<string, VisualizationConfig>>({
    performance: {
      chartType: 'line',
      title: 'Performance Metrics',
      description: 'Response time and throughput analysis',
      dataKey: 'responseTime',
      colorScheme: 'default',
      showLegend: true,
      showGrid: true,
      interactive: true,
      height: 300
    },
    distribution: {
      chartType: 'pie',
      title: 'Data Distribution',
      description: 'Distribution by category and source',
      dataKey: 'value',
      colorScheme: 'vibrant',
      showLegend: true,
      showGrid: false,
      interactive: true,
      height: 350
    },
    trends: {
      chartType: 'area',
      title: 'Trend Analysis',
      description: 'Historical trends and patterns',
      dataKey: 'value',
      colorScheme: 'pastel',
      showLegend: true,
      showGrid: true,
      interactive: true,
      height: 400
    },
    correlation: {
      chartType: 'scatter',
      title: 'Correlation Analysis',
      description: 'Relationship between variables',
      dataKey: 'value',
      colorScheme: 'default',
      showLegend: false,
      showGrid: true,
      interactive: true,
      height: 350
    }
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (onDataLoad) {
        const newData = await onDataLoad();
        setData(newData);
      } else {
        // Generate sample data based on active tab
        const sampleData = generateSampleData(activeTab === 'financial' ? 'financial' : 'performance');
        setData(sampleData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoad, activeTab]);

  // Filter data based on search and filters
  useEffect(() => {
    let filtered = [...data];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Apply selected filters
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(item => item[key] === value);
      }
    });
    
    setFilteredData(filtered);
  }, [data, searchQuery, selectedFilters]);

  // Auto-refresh data
  useEffect(() => {
    if (enableRealTime && refreshInterval > 0) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [enableRealTime, refreshInterval, loadData]);

  // Handle drill down
  const handleDrillDown = async (dataPoint: any, chartId: string) => {
    if (!enableDrillDown || !onDrillDown) return;
    
    try {
      setIsLoading(true);
      const drillDownData = await onDrillDown(dataPoint, drillDownStack.length + 1);
      
      const newLevel: DrillDownLevel = {
        level: drillDownStack.length + 1,
        title: `${configs[chartId]?.title} - ${dataPoint.category || 'Details'}`,
        data: drillDownData,
        filters: { ...selectedFilters, drillDown: dataPoint }
      };
      
      setDrillDownStack([...drillDownStack, newLevel]);
      setData(drillDownData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Drill down failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drill up
  const handleDrillUp = (level: number) => {
    const newStack = drillDownStack.slice(0, level);
    setDrillDownStack(newStack);
    
    if (newStack.length === 0) {
      loadData();
    } else {
      setData(newStack[newStack.length - 1].data);
    }
  };

  // Update chart configuration
  const updateConfig = (chartId: string, updates: Partial<VisualizationConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [chartId]: { ...prev[chartId], ...updates }
    }));
  };

  // Get unique values for filters
  const getUniqueValues = (key: string) => {
    const values = [...new Set(data.map(item => item[key]).filter(Boolean))];
    return values.sort();
  };

  // Export data
  const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
    if (onExport) {
      onExport(filteredData, format);
    } else {
      // Default export implementation
      const filename = `visualization-data-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        const headers = Object.keys(filteredData[0] || {});
        const csv = [headers.join(','), ...filteredData.map(row => headers.map(h => row[h]).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
      } else if (format === 'json') {
        const json = JSON.stringify(filteredData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
      }
    }
  };

  // Render filter controls
  const renderFilters = () => {
    if (!enableFiltering) return null;
    
    const categories = getUniqueValues('category');
    const sources = getUniqueValues('source');
    
    return (
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48"
          />
        </div>
        
        {categories.length > 0 && (
          <Select
            value={selectedFilters.category || 'all'}
            onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {sources.length > 0 && (
          <Select
            value={selectedFilters.source || 'all'}
            onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, source: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchQuery('');
            setSelectedFilters({});
          }}
        >
          Clear Filters
        </Button>
        
        <Badge variant="secondary">
          {filteredData.length} of {data.length} items
        </Badge>
      </div>
    );
  };

  // Render drill down breadcrumb
  const renderBreadcrumb = () => {
    if (drillDownStack.length === 0) return null;
    
    return (
      <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDrillUp(0)}
        >
          Overview
        </Button>
        {drillDownStack.map((level, index) => (
          <React.Fragment key={level.level}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDrillUp(index + 1)}
            >
              {level.title}
            </Button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render chart configuration panel
  const renderConfigPanel = (chartId: string) => {
    const config = configs[chartId];
    if (!config) return null;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">Chart Configuration</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Chart Type</Label>
            <Select
              value={config.chartType}
              onValueChange={(value) => updateConfig(chartId, { chartType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Color Scheme</Label>
            <Select
              value={config.colorScheme}
              onValueChange={(value) => updateConfig(chartId, { colorScheme: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_SCHEMES.map(scheme => (
                  <SelectItem key={scheme.value} value={scheme.value}>
                    {scheme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Show Legend</Label>
            <Switch
              checked={config.showLegend}
              onCheckedChange={(checked) => updateConfig(chartId, { showLegend: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Show Grid</Label>
            <Switch
              checked={config.showGrid}
              onCheckedChange={(checked) => updateConfig(chartId, { showGrid: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Interactive</Label>
            <Switch
              checked={config.interactive}
              onCheckedChange={(checked) => updateConfig(chartId, { interactive: checked })}
            />
          </div>
        </div>
        
        <div>
          <Label>Height: {config.height}px</Label>
          <Slider
            value={[config.height]}
            onValueChange={([value]) => updateConfig(chartId, { height: value })}
            min={200}
            max={600}
            step={50}
            className="mt-2"
          />
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Visualization</h1>
            <p className="text-muted-foreground">
              Interactive charts and advanced analytics with drill-down capabilities
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
            
            {enableExport && (
              <Select onValueChange={handleExport}>
                <SelectTrigger className="w-32">
                  <Download className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">Export CSV</SelectItem>
                  <SelectItem value="json">Export JSON</SelectItem>
                  <SelectItem value="xlsx">Export Excel</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Breadcrumb */}
        {renderBreadcrumb()}

        {/* Filters */}
        {renderFilters()}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeChart
                title={configs.performance.title}
                description={configs.performance.description}
                data={filteredData}
                type={configs.performance.chartType as any}
                height={configs.performance.height}
                showLegend={configs.performance.showLegend}
                showGrid={configs.performance.showGrid}
                onDataPointClick={(data) => handleDrillDown(data, 'performance')}
              />
              
              <AdvancedChart
                title={configs.distribution.title}
                description={configs.distribution.description}
                data={filteredData}
                type={configs.distribution.chartType as any}
                height={configs.distribution.height}
                showLegend={configs.distribution.showLegend}
                colorScheme={configs.distribution.colorScheme}
                onDataPointClick={(data) => handleDrillDown(data, 'distribution')}
              />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <RealTimeChart
                  title="Performance Analysis"
                  description="Detailed performance metrics and trends"
                  data={filteredData}
                  type="composed"
                  height={400}
                  showControls={true}
                  enableCrosshair={true}
                  onDataPointClick={(data) => handleDrillDown(data, 'performance')}
                />
              </div>
              <div>
                {renderConfigPanel('performance')}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <AdvancedChart
                  title="Trend Analysis"
                  description="Historical patterns and forecasting"
                  data={filteredData}
                  type="line"
                  height={450}
                  showLegend={true}
                  interactive={true}
                  onDataPointClick={(data) => handleDrillDown(data, 'trends')}
                />
              </div>
              <div>
                {renderConfigPanel('trends')}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedChart
                title="Correlation Matrix"
                description="Variable relationships and dependencies"
                data={generateSampleData('geographic', 100)}
                type="bubble"
                height={350}
                interactive={true}
                onDataPointClick={(data) => handleDrillDown(data, 'correlation')}
              />
              
              <AdvancedChart
                title="Distribution Heatmap"
                description="Data density and pattern visualization"
                data={generateSampleData('performance', 200)}
                type="heatmap"
                height={350}
                colorScheme="vibrant"
              />
              
              <AdvancedChart
                title="Hierarchical Data"
                description="Nested data structure visualization"
                data={filteredData.slice(0, 20)}
                type="treemap"
                height={350}
                colorScheme="pastel"
              />
              
              <AdvancedChart
                title="Process Flow"
                description="Conversion funnel analysis"
                data={filteredData.slice(0, 10)}
                type="funnel"
                height={350}
                colorScheme="default"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default DataVisualizationDashboard;