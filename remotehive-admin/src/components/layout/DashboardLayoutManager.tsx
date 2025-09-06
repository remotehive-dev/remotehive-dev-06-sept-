'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Monitor,
  Tablet,
  Smartphone,
  Layout,
  Grid3X3,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Download,
  Upload,
  Copy,
  Trash2,
  Plus,
  Edit3,
  Layers,
  Palette,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ResponsiveLayout, { LayoutItem, BreakpointConfig } from './ResponsiveLayout';
import GridContainer, { GridWidget } from './GridContainer';
import MobileDashboard, { MOBILE_BREAKPOINTS } from './MobileDashboard';

export interface DashboardLayoutManagerProps {
  className?: string;
  widgets: GridWidget[];
  layouts?: Record<string, LayoutItem[]>;
  title?: string;
  subtitle?: string;
  enableMobileView?: boolean;
  enableTabletView?: boolean;
  enableDesktopView?: boolean;
  enableLayoutEditor?: boolean;
  enablePresets?: boolean;
  enableExport?: boolean;
  enableImport?: boolean;
  onLayoutChange?: (layouts: Record<string, LayoutItem[]>) => void;
  onWidgetChange?: (widgets: GridWidget[]) => void;
  onViewModeChange?: (mode: ViewMode) => void;
}

export type ViewMode = 'mobile' | 'tablet' | 'desktop' | 'auto';
export type LayoutPreset = 'default' | 'analytics' | 'monitoring' | 'minimal' | 'custom';

interface LayoutManagerState {
  viewMode: ViewMode;
  currentBreakpoint: string;
  isEditing: boolean;
  selectedPreset: LayoutPreset;
  showPreview: boolean;
  showSettings: boolean;
  autoSave: boolean;
  gridSnap: boolean;
  showGrid: boolean;
  compactMode: boolean;
  animations: boolean;
}

// Enhanced breakpoints for all devices
const ALL_BREAKPOINTS: Record<string, BreakpointConfig> = {
  ...MOBILE_BREAKPOINTS,
  xxl: {
    name: 'Large Desktop',
    minWidth: 1536,
    cols: 8,
    margin: 32,
    containerPadding: 40,
    rowHeight: 220
  }
};

// Layout presets
const LAYOUT_PRESETS: Record<LayoutPreset, {
  name: string;
  description: string;
  layouts: Record<string, LayoutItem[]>;
}> = {
  default: {
    name: 'Default Layout',
    description: 'Balanced layout for general use',
    layouts: {
      lg: [
        { i: 'metrics-overview', x: 0, y: 0, w: 4, h: 2 },
        { i: 'performance-chart', x: 4, y: 0, w: 4, h: 2 },
        { i: 'status-indicators', x: 0, y: 2, w: 2, h: 2 },
        { i: 'recent-activity', x: 2, y: 2, w: 6, h: 2 }
      ]
    }
  },
  analytics: {
    name: 'Analytics Focus',
    description: 'Optimized for data analysis and charts',
    layouts: {
      lg: [
        { i: 'main-chart', x: 0, y: 0, w: 6, h: 3 },
        { i: 'kpi-cards', x: 6, y: 0, w: 2, h: 3 },
        { i: 'trend-analysis', x: 0, y: 3, w: 4, h: 2 },
        { i: 'data-table', x: 4, y: 3, w: 4, h: 2 }
      ]
    }
  },
  monitoring: {
    name: 'System Monitoring',
    description: 'Real-time system health and alerts',
    layouts: {
      lg: [
        { i: 'system-health', x: 0, y: 0, w: 3, h: 2 },
        { i: 'alerts-panel', x: 3, y: 0, w: 3, h: 2 },
        { i: 'performance-metrics', x: 6, y: 0, w: 2, h: 2 },
        { i: 'log-viewer', x: 0, y: 2, w: 8, h: 2 }
      ]
    }
  },
  minimal: {
    name: 'Minimal View',
    description: 'Clean and simple layout',
    layouts: {
      lg: [
        { i: 'key-metrics', x: 0, y: 0, w: 8, h: 1 },
        { i: 'main-content', x: 0, y: 1, w: 8, h: 3 }
      ]
    }
  },
  custom: {
    name: 'Custom Layout',
    description: 'User-defined custom layout',
    layouts: {}
  }
};

// Device detection hook
const useDeviceDetection = () => {
  const [device, setDevice] = useState<ViewMode>('desktop');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      if (width < 768) {
        setDevice('mobile');
      } else if (width < 1024) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  return { device, screenSize };
};

// Layout Settings Panel
interface LayoutSettingsPanelProps {
  state: LayoutManagerState;
  onStateChange: (updates: Partial<LayoutManagerState>) => void;
  onPresetChange: (preset: LayoutPreset) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  enableExport?: boolean;
  enableImport?: boolean;
}

const LayoutSettingsPanel: React.FC<LayoutSettingsPanelProps> = ({
  state,
  onStateChange,
  onPresetChange,
  onExport,
  onImport,
  onReset,
  enableExport = true,
  enableImport = true
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Layout Settings</span>
        </CardTitle>
        <CardDescription>
          Customize your dashboard layout and behavior
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* View Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium">View Mode</label>
          <Select
            value={state.viewMode}
            onValueChange={(value: ViewMode) => onStateChange({ viewMode: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Auto Detect</span>
                </div>
              </SelectItem>
              <SelectItem value="mobile">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile</span>
                </div>
              </SelectItem>
              <SelectItem value="tablet">
                <div className="flex items-center space-x-2">
                  <Tablet className="h-4 w-4" />
                  <span>Tablet</span>
                </div>
              </SelectItem>
              <SelectItem value="desktop">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4" />
                  <span>Desktop</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Layout Presets */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Layout Preset</label>
          <Select
            value={state.selectedPreset}
            onValueChange={onPresetChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LAYOUT_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key as LayoutPreset}>
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {preset.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Layout Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Layout Options</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Edit Mode</label>
              <Switch
                checked={state.isEditing}
                onCheckedChange={(checked) => onStateChange({ isEditing: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Show Grid</label>
              <Switch
                checked={state.showGrid}
                onCheckedChange={(checked) => onStateChange({ showGrid: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Grid Snap</label>
              <Switch
                checked={state.gridSnap}
                onCheckedChange={(checked) => onStateChange({ gridSnap: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Auto Save</label>
              <Switch
                checked={state.autoSave}
                onCheckedChange={(checked) => onStateChange({ autoSave: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Animations</label>
              <Switch
                checked={state.animations}
                onCheckedChange={(checked) => onStateChange({ animations: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Compact Mode</label>
              <Switch
                checked={state.compactMode}
                onCheckedChange={(checked) => onStateChange({ compactMode: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Actions</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {enableExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            
            {enableImport && (
              <Button variant="outline" size="sm" onClick={handleImportClick}>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStateChange({ showPreview: !state.showPreview })}
            >
              {state.showPreview ? (
                <EyeOff className="h-4 w-4 mr-1" />
              ) : (
                <Eye className="h-4 w-4 mr-1" />
              )}
              Preview
            </Button>
          </div>
        </div>

        {enableImport && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        )}
      </CardContent>
    </Card>
  );
};

// Main Dashboard Layout Manager
const DashboardLayoutManager: React.FC<DashboardLayoutManagerProps> = ({
  className,
  widgets,
  layouts: initialLayouts = {},
  title = 'Dashboard',
  subtitle,
  enableMobileView = true,
  enableTabletView = true,
  enableDesktopView = true,
  enableLayoutEditor = true,
  enablePresets = true,
  enableExport = true,
  enableImport = true,
  onLayoutChange,
  onWidgetChange,
  onViewModeChange
}) => {
  const { device: detectedDevice, screenSize } = useDeviceDetection();
  
  const [state, setState] = useState<LayoutManagerState>({
    viewMode: 'auto',
    currentBreakpoint: 'lg',
    isEditing: false,
    selectedPreset: 'default',
    showPreview: false,
    showSettings: false,
    autoSave: true,
    gridSnap: true,
    showGrid: false,
    compactMode: false,
    animations: true
  });

  const [layouts, setLayouts] = useState<Record<string, LayoutItem[]>>(initialLayouts);
  const [currentWidgets, setCurrentWidgets] = useState<GridWidget[]>(widgets);

  // Determine effective view mode
  const effectiveViewMode = useMemo(() => {
    return state.viewMode === 'auto' ? detectedDevice : state.viewMode;
  }, [state.viewMode, detectedDevice]);

  // Handle layout changes
  const handleLayoutChange = useCallback((layout: LayoutItem[], layouts: Record<string, LayoutItem[]>) => {
    setLayouts(layouts);
    onLayoutChange?.(layouts);
    
    if (state.autoSave) {
      localStorage.setItem('dashboard-layouts', JSON.stringify(layouts));
    }
  }, [onLayoutChange, state.autoSave]);

  // Handle widget changes
  const handleWidgetChange = useCallback((newWidgets: GridWidget[]) => {
    setCurrentWidgets(newWidgets);
    onWidgetChange?.(newWidgets);
    
    if (state.autoSave) {
      localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets));
    }
  }, [onWidgetChange, state.autoSave]);

  // Handle preset change
  const handlePresetChange = useCallback((preset: LayoutPreset) => {
    setState(prev => ({ ...prev, selectedPreset: preset }));
    
    if (preset !== 'custom') {
      const presetLayouts = LAYOUT_PRESETS[preset].layouts;
      setLayouts(presetLayouts);
      onLayoutChange?.(presetLayouts);
    }
  }, [onLayoutChange]);

  // Handle export
  const handleExport = useCallback(() => {
    const exportData = {
      layouts,
      widgets: currentWidgets,
      settings: state,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-layout-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [layouts, currentWidgets, state]);

  // Handle import
  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.layouts) {
          setLayouts(importData.layouts);
          onLayoutChange?.(importData.layouts);
        }
        
        if (importData.widgets) {
          setCurrentWidgets(importData.widgets);
          onWidgetChange?.(importData.widgets);
        }
        
        if (importData.settings) {
          setState(prev => ({ ...prev, ...importData.settings }));
        }
      } catch (error) {
        console.error('Failed to import layout:', error);
      }
    };
    reader.readAsText(file);
  }, [onLayoutChange, onWidgetChange]);

  // Handle reset
  const handleReset = useCallback(() => {
    const defaultLayouts = LAYOUT_PRESETS.default.layouts;
    setLayouts(defaultLayouts);
    setCurrentWidgets(widgets);
    setState(prev => ({
      ...prev,
      selectedPreset: 'default',
      isEditing: false,
      showGrid: false
    }));
    onLayoutChange?.(defaultLayouts);
    onWidgetChange?.(widgets);
  }, [widgets, onLayoutChange, onWidgetChange]);

  // Load saved data on mount
  useEffect(() => {
    if (state.autoSave) {
      const savedLayouts = localStorage.getItem('dashboard-layouts');
      const savedWidgets = localStorage.getItem('dashboard-widgets');
      
      if (savedLayouts) {
        try {
          const parsedLayouts = JSON.parse(savedLayouts);
          setLayouts(parsedLayouts);
        } catch (error) {
          console.error('Failed to load saved layouts:', error);
        }
      }
      
      if (savedWidgets) {
        try {
          const parsedWidgets = JSON.parse(savedWidgets);
          setCurrentWidgets(parsedWidgets);
        } catch (error) {
          console.error('Failed to load saved widgets:', error);
        }
      }
    }
  }, [state.autoSave]);

  // Notify parent of view mode changes
  useEffect(() => {
    onViewModeChange?.(effectiveViewMode);
  }, [effectiveViewMode, onViewModeChange]);

  // Render mobile view
  if (effectiveViewMode === 'mobile' && enableMobileView) {
    return (
      <MobileDashboard
        className={className}
        widgets={currentWidgets}
        layouts={layouts}
        title={title}
        subtitle={subtitle}
      />
    );
  }

  // Render tablet/desktop view
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="capitalize">
              {effectiveViewMode} • {screenSize.width}×{screenSize.height}
            </Badge>
            
            {enableLayoutEditor && (
              <Button
                variant={state.isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, isEditing: !prev.isEditing }))}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                {state.isEditing ? 'Exit Edit' : 'Edit Layout'}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1">
          {effectiveViewMode === 'tablet' ? (
            <ResponsiveLayout
              layouts={layouts}
              breakpoints={ALL_BREAKPOINTS}
              enableDragDrop={state.isEditing}
              enableResize={state.isEditing}
              onLayoutChange={handleLayoutChange}
              className={cn(
                'min-h-[calc(100vh-80px)]',
                state.compactMode && 'compact-mode',
                !state.animations && 'no-animations'
              )}
            >
              {currentWidgets.map((widget) => {
                const Component = widget.component;
                return (
                  <div key={widget.id}>
                    <Component {...(widget.props || {})} />
                  </div>
                );
              })}
            </ResponsiveLayout>
          ) : (
            <GridContainer
              widgets={currentWidgets}
              layouts={layouts}
              breakpoints={ALL_BREAKPOINTS}
              enableEditing={state.isEditing}
              enableDragDrop={state.isEditing}
              enableResize={state.isEditing}
              enableAddRemove={state.isEditing}
              onLayoutChange={(layouts) => handleLayoutChange([], layouts)}
              onWidgetAdd={handleWidgetChange}
              onWidgetRemove={(widgetId) => {
                const updatedWidgets = currentWidgets.filter(w => w.id !== widgetId);
                setCurrentWidgets(updatedWidgets);
                onWidgetChange?.(updatedWidgets);
              }}
              onWidgetUpdate={(widgetId, updates) => {
                const updatedWidgets = currentWidgets.map(w => 
                  w.id === widgetId ? { ...w, ...updates } : w
                );
                setCurrentWidgets(updatedWidgets);
                onWidgetChange?.(updatedWidgets);
              }}
              className={cn(
                'min-h-[calc(100vh-80px)]',
                state.compactMode && 'compact-mode',
                !state.animations && 'no-animations'
              )}
            />
          )}
        </div>

        {/* Settings Panel */}
        {state.showSettings && (
          <div className="w-80 border-l bg-muted/30 p-4">
            <ScrollArea className="h-[calc(100vh-80px)]">
              <LayoutSettingsPanel
                state={state}
                onStateChange={(updates) => setState(prev => ({ ...prev, ...updates }))}
                onPresetChange={handlePresetChange}
                onExport={handleExport}
                onImport={handleImport}
                onReset={handleReset}
                enableExport={enableExport}
                enableImport={enableImport}
              />
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Preview Mode Overlay */}
      {state.showPreview && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur">
          <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-4xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Layout Preview</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, showPreview: false }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg p-4">
                  {/* Miniature preview of the layout */}
                  <div className="text-center text-muted-foreground">
                    Layout preview would be rendered here
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayoutManager;
export { ALL_BREAKPOINTS, LAYOUT_PRESETS, useDeviceDetection };