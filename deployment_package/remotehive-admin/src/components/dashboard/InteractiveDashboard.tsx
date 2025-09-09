'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RealTimeChart } from './widgets';
import { MetricsCard, StatusIndicator, ProgressTracker } from './widgets';
import AdvancedChart from '../charts/AdvancedCharts';
import DataVisualizationDashboard from './DataVisualizationDashboard';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import {
  Plus,
  Settings,
  Maximize2,
  Minimize2,
  X,
  GripVertical,
  Layout,
  Grid3X3,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  Download,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit3,
  Move,
  Palette,
  Layers,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  TrendingUp,
  Users,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  visible: boolean;
  locked: boolean;
  minimized: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  gridSize: { cols: number; rows: number };
  responsive: boolean;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface InteractiveDashboardProps {
  className?: string;
  initialLayout?: DashboardLayout;
  enableEditing?: boolean;
  enableResponsive?: boolean;
  enableExport?: boolean;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onWidgetAdd?: (widget: DashboardWidget) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetUpdate?: (widget: DashboardWidget) => void;
}

interface WidgetTemplate {
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  defaultSize: { width: number; height: number };
  defaultConfig: Record<string, any>;
  category: string;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    type: 'metrics-card',
    name: 'Metrics Card',
    description: 'Display key performance indicators',
    icon: BarChart3,
    defaultSize: { width: 2, height: 1 },
    defaultConfig: { metric: 'total_scrapers', showTrend: true },
    category: 'metrics'
  },
  {
    type: 'line-chart',
    name: 'Line Chart',
    description: 'Time series data visualization',
    icon: LineChart,
    defaultSize: { width: 4, height: 2 },
    defaultConfig: { dataKey: 'value', showGrid: true, showLegend: true },
    category: 'charts'
  },
  {
    type: 'pie-chart',
    name: 'Pie Chart',
    description: 'Categorical data distribution',
    icon: PieChart,
    defaultSize: { width: 3, height: 2 },
    defaultConfig: { dataKey: 'value', showLegend: true },
    category: 'charts'
  },
  {
    type: 'status-indicator',
    name: 'Status Indicator',
    description: 'System health and status',
    icon: Activity,
    defaultSize: { width: 2, height: 1 },
    defaultConfig: { status: 'healthy', showDetails: true },
    category: 'status'
  },
  {
    type: 'progress-tracker',
    name: 'Progress Tracker',
    description: 'Task and job progress',
    icon: TrendingUp,
    defaultSize: { width: 3, height: 1 },
    defaultConfig: { showPercentage: true, showETA: true },
    category: 'progress'
  },
  {
    type: 'advanced-chart',
    name: 'Advanced Chart',
    description: 'Complex data visualizations',
    icon: Layers,
    defaultSize: { width: 4, height: 3 },
    defaultConfig: { chartType: 'heatmap', interactive: true },
    category: 'charts'
  },
  {
    type: 'data-table',
    name: 'Data Table',
    description: 'Tabular data display',
    icon: Database,
    defaultSize: { width: 6, height: 3 },
    defaultConfig: { pagination: true, sorting: true, filtering: true },
    category: 'data'
  },
  {
    type: 'real-time-feed',
    name: 'Real-time Feed',
    description: 'Live activity stream',
    icon: Zap,
    defaultSize: { width: 3, height: 4 },
    defaultConfig: { maxItems: 50, autoScroll: true },
    category: 'realtime'
  }
];

const GRID_BREAKPOINTS = {
  xs: { cols: 2, width: 480 },
  sm: { cols: 4, width: 640 },
  md: { cols: 6, width: 768 },
  lg: { cols: 8, width: 1024 },
  xl: { cols: 12, width: 1280 }
};

const THEMES = [
  { value: 'default', label: 'Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' }
];

// Sortable Widget Component
interface SortableWidgetProps {
  widget: DashboardWidget;
  isEditing: boolean;
  onUpdate: (widget: DashboardWidget) => void;
  onRemove: (widgetId: string) => void;
  onToggleMinimize: (widgetId: string) => void;
  onToggleLock: (widgetId: string) => void;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({
  widget,
  isEditing,
  onUpdate,
  onRemove,
  onToggleMinimize,
  onToggleLock
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id, disabled: !isEditing || widget.locked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`
  };

  const renderWidget = () => {
    if (widget.minimized) {
      return (
        <div className="p-2 text-center text-sm text-muted-foreground">
          Widget minimized
        </div>
      );
    }

    switch (widget.type) {
      case 'metrics-card':
        return (
          <MetricsCard
            title={widget.title}
            value={widget.config.value || 0}
            change={widget.config.change || 0}
            trend={widget.config.trend || 'up'}
            icon={widget.config.icon}
          />
        );
      case 'line-chart':
      case 'area-chart':
      case 'bar-chart':
        return (
          <RealTimeChart
            title={widget.title}
            description={widget.description}
            data={widget.config.data || []}
            type={widget.type.replace('-chart', '') as any}
            height={200}
            showLegend={widget.config.showLegend}
            showGrid={widget.config.showGrid}
          />
        );
      case 'pie-chart':
        return (
          <AdvancedChart
            title={widget.title}
            description={widget.description}
            data={widget.config.data || []}
            type="pie"
            height={200}
            showLegend={widget.config.showLegend}
          />
        );
      case 'status-indicator':
        return (
          <StatusIndicator
            title={widget.title}
            status={widget.config.status || 'unknown'}
            message={widget.config.message}
            details={widget.config.details}
          />
        );
      case 'progress-tracker':
        return (
          <ProgressTracker
            title={widget.title}
            progress={widget.config.progress || 0}
            total={widget.config.total || 100}
            status={widget.config.status}
            eta={widget.config.eta}
          />
        );
      case 'advanced-chart':
        return (
          <AdvancedChart
            title={widget.title}
            description={widget.description}
            data={widget.config.data || []}
            type={widget.config.chartType || 'heatmap'}
            height={250}
            interactive={widget.config.interactive}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2" />
              <p>Unknown widget type: {widget.type}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        widget.locked && 'ring-2 ring-yellow-500',
        !widget.visible && 'opacity-50'
      )}
    >
      <Card className={cn(
        'h-full transition-all duration-200',
        isDragging && 'shadow-lg scale-105',
        !widget.visible && 'bg-muted'
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium truncate">
                {widget.title}
              </CardTitle>
              {widget.description && (
                <CardDescription className="text-xs truncate">
                  {widget.description}
                </CardDescription>
              )}
            </div>
            
            {isEditing && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onToggleMinimize(widget.id)}
                >
                  {widget.minimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onToggleLock(widget.id)}
                >
                  {widget.locked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onRemove(widget.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-move p-1 hover:bg-muted rounded"
                >
                  <GripVertical className="h-3 w-3" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {renderWidget()}
        </CardContent>
      </Card>
    </div>
  );
};

// Main Interactive Dashboard Component
const InteractiveDashboard: React.FC<InteractiveDashboardProps> = ({
  className,
  initialLayout,
  enableEditing = true,
  enableResponsive = true,
  enableExport = true,
  onLayoutChange,
  onWidgetAdd,
  onWidgetRemove,
  onWidgetUpdate
}) => {
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || {
      id: 'default',
      name: 'Default Dashboard',
      widgets: [],
      gridSize: { cols: 12, rows: 8 },
      responsive: true,
      theme: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [gridCols, setGridCols] = useState(12);

  // Update grid columns based on view mode
  useEffect(() => {
    if (enableResponsive) {
      switch (viewMode) {
        case 'mobile':
          setGridCols(GRID_BREAKPOINTS.xs.cols);
          break;
        case 'tablet':
          setGridCols(GRID_BREAKPOINTS.md.cols);
          break;
        default:
          setGridCols(GRID_BREAKPOINTS.xl.cols);
      }
    }
  }, [viewMode, enableResponsive]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = layout.widgets.findIndex(w => w.id === active.id);
      const newIndex = layout.widgets.findIndex(w => w.id === over?.id);
      
      const newWidgets = arrayMove(layout.widgets, oldIndex, newIndex);
      const newLayout = { ...layout, widgets: newWidgets, updatedAt: new Date().toISOString() };
      
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    }
  };

  // Add widget
  const addWidget = (template: WidgetTemplate) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: template.type,
      title: template.name,
      description: template.description,
      position: { x: 0, y: 0 },
      size: template.defaultSize,
      config: template.defaultConfig,
      visible: true,
      locked: false,
      minimized: false
    };
    
    const newLayout = {
      ...layout,
      widgets: [...layout.widgets, newWidget],
      updatedAt: new Date().toISOString()
    };
    
    setLayout(newLayout);
    onWidgetAdd?.(newWidget);
    onLayoutChange?.(newLayout);
    setShowAddWidget(false);
  };

  // Remove widget
  const removeWidget = (widgetId: string) => {
    const newLayout = {
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date().toISOString()
    };
    
    setLayout(newLayout);
    onWidgetRemove?.(widgetId);
    onLayoutChange?.(newLayout);
  };

  // Update widget
  const updateWidget = (updatedWidget: DashboardWidget) => {
    const newLayout = {
      ...layout,
      widgets: layout.widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w),
      updatedAt: new Date().toISOString()
    };
    
    setLayout(newLayout);
    onWidgetUpdate?.(updatedWidget);
    onLayoutChange?.(newLayout);
  };

  // Toggle widget minimize
  const toggleMinimize = (widgetId: string) => {
    const widget = layout.widgets.find(w => w.id === widgetId);
    if (widget) {
      updateWidget({ ...widget, minimized: !widget.minimized });
    }
  };

  // Toggle widget lock
  const toggleLock = (widgetId: string) => {
    const widget = layout.widgets.find(w => w.id === widgetId);
    if (widget) {
      updateWidget({ ...widget, locked: !widget.locked });
    }
  };

  // Export layout
  const exportLayout = () => {
    const dataStr = JSON.stringify(layout, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-layout-${layout.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
  };

  // Import layout
  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedLayout = JSON.parse(e.target?.result as string);
          setLayout(importedLayout);
          onLayoutChange?.(importedLayout);
        } catch (error) {
          console.error('Failed to import layout:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Reset layout
  const resetLayout = () => {
    const defaultLayout: DashboardLayout = {
      id: 'default',
      name: 'Default Dashboard',
      widgets: [],
      gridSize: { cols: 12, rows: 8 },
      responsive: true,
      theme: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setLayout(defaultLayout);
    onLayoutChange?.(defaultLayout);
  };

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    return WIDGET_TEMPLATES.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, WidgetTemplate[]>);
  }, []);

  return (
    <ErrorBoundary>
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{layout.name}</h1>
            <p className="text-muted-foreground">
              Interactive dashboard with {layout.widgets.length} widgets
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {enableResponsive && (
              <div className="flex items-center space-x-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {enableEditing && (
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Done' : 'Edit'}
              </Button>
            )}
            
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddWidget(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            )}
            
            {enableExport && (
              <div className="flex items-center space-x-1">
                <Button variant="outline" size="sm" onClick={exportLayout}>
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" size="sm" asChild>
                  <label>
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept=".json"
                      onChange={importLayout}
                      className="hidden"
                    />
                  </label>
                </Button>
                
                <Button variant="outline" size="sm" onClick={resetLayout}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="relative">
          {isEditing && (
            <div className="absolute top-0 right-0 z-10 bg-background/80 backdrop-blur-sm border rounded-lg p-2">
              <Badge variant="secondary">
                {gridCols} columns • {layout.widgets.length} widgets
              </Badge>
            </div>
          )}
          
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={layout.widgets.map(w => w.id)}
              strategy={rectSortingStrategy}
            >
              <div
                className={cn(
                  'grid gap-4 auto-rows-fr',
                  `grid-cols-${gridCols}`
                )}
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
                }}
              >
                {layout.widgets.map(widget => (
                  <SortableWidget
                    key={widget.id}
                    widget={widget}
                    isEditing={isEditing}
                    onUpdate={updateWidget}
                    onRemove={removeWidget}
                    onToggleMinimize={toggleMinimize}
                    onToggleLock={toggleLock}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          {layout.widgets.length === 0 && (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No widgets added</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your dashboard by adding widgets
                </p>
                {enableEditing && (
                  <Button onClick={() => setShowAddWidget(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Widget
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Widget Dialog */}
        <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Widget</DialogTitle>
              <DialogDescription>
                Choose a widget type to add to your dashboard
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue={Object.keys(templatesByCategory)[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {Object.keys(templatesByCategory).map(category => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Object.entries(templatesByCategory).map(([category, templates]) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => {
                      const Icon = template.icon;
                      return (
                        <Card
                          key={template.type}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addWidget(template)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <CardTitle className="text-sm">{template.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground mb-2">
                              {template.description}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline">
                                {template.defaultSize.width}×{template.defaultSize.height}
                              </Badge>
                              <span className="text-muted-foreground capitalize">
                                {template.category}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default InteractiveDashboard;