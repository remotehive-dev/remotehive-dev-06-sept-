'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Plus,
  Minus,
  Move,
  RotateCcw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Settings,
  Grid3X3,
  Layers,
  Trash2,
  Copy,
  Edit3,
  Save,
  Download,
  Upload,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ResponsiveLayout, { LayoutItem, BreakpointConfig } from './ResponsiveLayout';

export interface GridWidget {
  id: string;
  type: string;
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  defaultW?: number;
  defaultH?: number;
  category?: string;
  icon?: React.ComponentType<any>;
  isLocked?: boolean;
  isVisible?: boolean;
  isMinimized?: boolean;
}

export interface GridContainerProps {
  className?: string;
  widgets: GridWidget[];
  layouts?: Record<string, LayoutItem[]>;
  breakpoints?: Record<string, BreakpointConfig>;
  enableEditing?: boolean;
  enableDragDrop?: boolean;
  enableResize?: boolean;
  enableAddRemove?: boolean;
  autoSave?: boolean;
  storageKey?: string;
  onLayoutChange?: (layouts: Record<string, LayoutItem[]>) => void;
  onWidgetAdd?: (widget: GridWidget) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetUpdate?: (widgetId: string, updates: Partial<GridWidget>) => void;
}

interface GridState {
  widgets: GridWidget[];
  layouts: Record<string, LayoutItem[]>;
  editMode: boolean;
  selectedWidget: string | null;
  draggedWidget: GridWidget | null;
}

// Widget Categories
const WIDGET_CATEGORIES = {
  metrics: {
    name: 'Metrics',
    icon: BarChart3,
    color: 'bg-blue-500'
  },
  charts: {
    name: 'Charts',
    icon: LineChart,
    color: 'bg-green-500'
  },
  status: {
    name: 'Status',
    icon: Activity,
    color: 'bg-yellow-500'
  },
  data: {
    name: 'Data',
    icon: Database,
    color: 'bg-purple-500'
  },
  system: {
    name: 'System',
    icon: Settings,
    color: 'bg-red-500'
  }
};

// Default widget library
const DEFAULT_WIDGET_LIBRARY: GridWidget[] = [
  {
    id: 'metrics-card',
    type: 'MetricsCard',
    title: 'Metrics Card',
    description: 'Display key performance metrics',
    component: ({ title = 'Metric', value = '0', change = '+0%' }) => (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{change} from last period</p>
        </CardContent>
      </Card>
    ),
    category: 'metrics',
    defaultW: 3,
    defaultH: 2,
    minW: 2,
    minH: 2
  },
  {
    id: 'line-chart',
    type: 'LineChart',
    title: 'Line Chart',
    description: 'Display trends over time',
    component: ({ title = 'Chart' }) => (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="text-muted-foreground">Line Chart Placeholder</div>
        </CardContent>
      </Card>
    ),
    category: 'charts',
    defaultW: 6,
    defaultH: 4,
    minW: 4,
    minH: 3
  },
  {
    id: 'status-indicator',
    type: 'StatusIndicator',
    title: 'Status Indicator',
    description: 'Show system status',
    component: ({ status = 'online', label = 'System Status' }) => (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-3 h-3 rounded-full',
              status === 'online' ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="capitalize">{status}</span>
          </div>
        </CardContent>
      </Card>
    ),
    category: 'status',
    defaultW: 3,
    defaultH: 2,
    minW: 2,
    minH: 2
  },
  {
    id: 'data-table',
    type: 'DataTable',
    title: 'Data Table',
    description: 'Display tabular data',
    component: ({ title = 'Data Table' }) => (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="text-muted-foreground">Data Table Placeholder</div>
        </CardContent>
      </Card>
    ),
    category: 'data',
    defaultW: 8,
    defaultH: 6,
    minW: 4,
    minH: 4
  }
];

// Widget Toolbar Component
interface WidgetToolbarProps {
  widget: GridWidget;
  isSelected: boolean;
  editMode: boolean;
  onSelect: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  onToggleMinimize: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onEdit: () => void;
}

const WidgetToolbar: React.FC<WidgetToolbarProps> = ({
  widget,
  isSelected,
  editMode,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onToggleMinimize,
  onDuplicate,
  onRemove,
  onEdit
}) => {
  if (!editMode) return null;

  return (
    <div className={cn(
      'absolute top-2 right-2 z-10 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity',
      isSelected && 'opacity-100'
    )}>
      <Button
        variant="secondary"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onToggleLock}
      >
        {widget.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onToggleVisibility}
      >
        {widget.isVisible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onToggleMinimize}
      >
        {widget.isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onDuplicate}
      >
        <Copy className="h-3 w-3" />
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onEdit}
      >
        <Edit3 className="h-3 w-3" />
      </Button>
      
      <Button
        variant="destructive"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

// Widget Library Panel
interface WidgetLibraryProps {
  widgets: GridWidget[];
  onAddWidget: (widget: GridWidget) => void;
}

const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ widgets, onAddWidget }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categorizedWidgets = useMemo(() => {
    const categories: Record<string, GridWidget[]> = {};
    
    widgets.forEach(widget => {
      const category = widget.category || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(widget);
    });
    
    return categories;
  }, [widgets]);

  const filteredWidgets = selectedCategory
    ? categorizedWidgets[selectedCategory] || []
    : widgets;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Widget Library</h3>
        <Badge variant="outline">{widgets.length} widgets</Badge>
      </div>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {Object.entries(WIDGET_CATEGORIES).map(([key, category]) => {
          const count = categorizedWidgets[key]?.length || 0;
          if (count === 0) return null;
          
          return (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              <category.icon className="h-3 w-3 mr-1" />
              {category.name} ({count})
            </Button>
          );
        })}
      </div>
      
      {/* Widget Grid */}
      <div className="grid grid-cols-1 gap-2">
        {filteredWidgets.map(widget => {
          const category = WIDGET_CATEGORIES[widget.category as keyof typeof WIDGET_CATEGORIES];
          
          return (
            <div
              key={widget.id}
              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onAddWidget(widget)}
            >
              <div className="flex items-start space-x-2">
                {category && (
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-2',
                    category.color
                  )} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{widget.title}</p>
                  {widget.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {widget.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {widget.defaultW}×{widget.defaultH}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {widget.type}
                    </Badge>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Grid Container Component
const GridContainer: React.FC<GridContainerProps> = ({
  className,
  widgets: initialWidgets = [],
  layouts: initialLayouts = {},
  breakpoints,
  enableEditing = true,
  enableDragDrop = true,
  enableResize = true,
  enableAddRemove = true,
  autoSave = true,
  storageKey = 'dashboard-grid-state',
  onLayoutChange,
  onWidgetAdd,
  onWidgetRemove,
  onWidgetUpdate
}) => {
  const [state, setState] = useState<GridState>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            widgets: parsed.widgets || initialWidgets,
            layouts: parsed.layouts || initialLayouts,
            editMode: false,
            selectedWidget: null,
            draggedWidget: null
          };
        }
      } catch (error) {
        console.warn('Failed to load grid state from localStorage:', error);
      }
    }
    
    return {
      widgets: initialWidgets,
      layouts: initialLayouts,
      editMode: false,
      selectedWidget: null,
      draggedWidget: null
    };
  });

  // Auto-save to localStorage
  useEffect(() => {
    if (autoSave && storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          widgets: state.widgets,
          layouts: state.layouts
        }));
      } catch (error) {
        console.warn('Failed to save grid state to localStorage:', error);
      }
    }
  }, [state.widgets, state.layouts, autoSave, storageKey]);

  // Generate layout items from widgets
  const generateLayoutItems = useCallback((widgets: GridWidget[], breakpoint: string = 'lg'): LayoutItem[] => {
    return widgets.map((widget, index) => ({
      i: widget.id,
      x: (index * 3) % 12,
      y: Math.floor((index * 3) / 12) * 2,
      w: widget.defaultW || 3,
      h: widget.defaultH || 2,
      minW: widget.minW,
      maxW: widget.maxW,
      minH: widget.minH,
      maxH: widget.maxH,
      static: widget.isLocked,
      isDraggable: !widget.isLocked && enableDragDrop,
      isResizable: !widget.isLocked && enableResize
    }));
  }, [enableDragDrop, enableResize]);

  // Handle layout change
  const handleLayoutChange = useCallback((layout: LayoutItem[], layouts: Record<string, LayoutItem[]>) => {
    setState(prev => ({ ...prev, layouts }));
    onLayoutChange?.(layouts);
  }, [onLayoutChange]);

  // Add widget
  const addWidget = useCallback((widget: GridWidget) => {
    const newWidget: GridWidget = {
      ...widget,
      id: `${widget.id}-${Date.now()}`,
      isVisible: true,
      isLocked: false,
      isMinimized: false
    };

    setState(prev => {
      const newWidgets = [...prev.widgets, newWidget];
      const newLayouts = { ...prev.layouts };
      
      // Generate layout for current breakpoint if not exists
      Object.keys(breakpoints || {}).forEach(bp => {
        if (!newLayouts[bp]) {
          newLayouts[bp] = generateLayoutItems(newWidgets, bp);
        } else {
          // Add new item to existing layout
          const existingLayout = newLayouts[bp];
          const maxY = existingLayout.length > 0 ? Math.max(...existingLayout.map(item => item.y + item.h)) : 0;
          
          newLayouts[bp] = [
            ...existingLayout,
            {
              i: newWidget.id,
              x: 0,
              y: maxY,
              w: newWidget.defaultW || 3,
              h: newWidget.defaultH || 2,
              minW: newWidget.minW,
              maxW: newWidget.maxW,
              minH: newWidget.minH,
              maxH: newWidget.maxH,
              static: newWidget.isLocked,
              isDraggable: !newWidget.isLocked && enableDragDrop,
              isResizable: !newWidget.isLocked && enableResize
            }
          ];
        }
      });
      
      return {
        ...prev,
        widgets: newWidgets,
        layouts: newLayouts
      };
    });

    onWidgetAdd?.(newWidget);
  }, [generateLayoutItems, breakpoints, enableDragDrop, enableResize, onWidgetAdd]);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    setState(prev => {
      const newWidgets = prev.widgets.filter(w => w.id !== widgetId);
      const newLayouts = { ...prev.layouts };
      
      // Remove from all layouts
      Object.keys(newLayouts).forEach(bp => {
        newLayouts[bp] = newLayouts[bp].filter(item => item.i !== widgetId);
      });
      
      return {
        ...prev,
        widgets: newWidgets,
        layouts: newLayouts,
        selectedWidget: prev.selectedWidget === widgetId ? null : prev.selectedWidget
      };
    });

    onWidgetRemove?.(widgetId);
  }, [onWidgetRemove]);

  // Update widget
  const updateWidget = useCallback((widgetId: string, updates: Partial<GridWidget>) => {
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w)
    }));

    onWidgetUpdate?.(widgetId, updates);
  }, [onWidgetUpdate]);

  // Duplicate widget
  const duplicateWidget = useCallback((widgetId: string) => {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (widget) {
      addWidget({
        ...widget,
        title: `${widget.title} (Copy)`
      });
    }
  }, [state.widgets, addWidget]);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      editMode: !prev.editMode,
      selectedWidget: null
    }));
  }, []);

  // Reset layouts
  const resetLayouts = useCallback(() => {
    setState(prev => ({
      ...prev,
      layouts: {}
    }));
  }, []);

  // Export configuration
  const exportConfig = useCallback(() => {
    const config = {
      widgets: state.widgets,
      layouts: state.layouts,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-config-${Date.now()}.json`;
    link.click();
  }, [state.widgets, state.layouts]);

  // Visible widgets (filter out hidden ones)
  const visibleWidgets = useMemo(() => {
    return state.widgets.filter(widget => widget.isVisible !== false);
  }, [state.widgets]);

  return (
    <div className={cn('relative', className)}>
      {/* Edit Mode Controls */}
      {enableEditing && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
          <Button
            variant={state.editMode ? 'default' : 'outline'}
            size="sm"
            onClick={toggleEditMode}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {state.editMode ? 'Exit Edit' : 'Edit Mode'}
          </Button>
          
          {state.editMode && (
            <>
              <Button variant="outline" size="sm" onClick={resetLayouts}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportConfig}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      )}

      <ResponsiveLayout
        layouts={state.layouts}
        breakpoints={breakpoints}
        enableDragDrop={enableDragDrop && state.editMode}
        enableResize={enableResize && state.editMode}
        onLayoutChange={handleLayoutChange}
        className={cn(
          state.editMode && 'ring-2 ring-primary/20 ring-offset-2'
        )}
      >
        {visibleWidgets.map(widget => {
          const Component = widget.component;
          const isSelected = state.selectedWidget === widget.id;
          
          return (
            <div
              key={widget.id}
              className={cn(
                'group relative h-full',
                state.editMode && 'cursor-move',
                isSelected && 'ring-2 ring-primary',
                widget.isMinimized && 'opacity-50'
              )}
              onClick={() => {
                if (state.editMode) {
                  setState(prev => ({
                    ...prev,
                    selectedWidget: prev.selectedWidget === widget.id ? null : widget.id
                  }));
                }
              }}
            >
              <WidgetToolbar
                widget={widget}
                isSelected={isSelected}
                editMode={state.editMode}
                onSelect={() => setState(prev => ({ ...prev, selectedWidget: widget.id }))}
                onToggleLock={() => updateWidget(widget.id, { isLocked: !widget.isLocked })}
                onToggleVisibility={() => updateWidget(widget.id, { isVisible: !widget.isVisible })}
                onToggleMinimize={() => updateWidget(widget.id, { isMinimized: !widget.isMinimized })}
                onDuplicate={() => duplicateWidget(widget.id)}
                onRemove={() => removeWidget(widget.id)}
                onEdit={() => {/* TODO: Open widget editor */}}
              />
              
              {widget.isMinimized ? (
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{widget.title}</CardTitle>
                  </CardHeader>
                </Card>
              ) : (
                <Component {...(widget.props || {})} />
              )}
            </div>
          );
        })}
      </ResponsiveLayout>

      {/* Widget Library Sidebar (Edit Mode) */}
      {state.editMode && enableAddRemove && (
        <div className="fixed left-0 top-0 h-full w-80 bg-background/95 backdrop-blur border-r z-40 overflow-y-auto">
          <div className="p-4">
            <WidgetLibrary
              widgets={DEFAULT_WIDGET_LIBRARY}
              onAddWidget={addWidget}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GridContainer;
export { DEFAULT_WIDGET_LIBRARY, WIDGET_CATEGORIES };