'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Menu,
  X,
  Settings,
  Layout,
  Grid3X3,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Layers,
  Palette,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Users,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreakpointConfig {
  name: string;
  minWidth: number;
  maxWidth?: number;
  cols: number;
  margin: number;
  containerPadding: number;
  rowHeight: number;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface ResponsiveLayoutProps {
  className?: string;
  children: React.ReactNode;
  layouts?: Record<string, LayoutItem[]>;
  breakpoints?: Record<string, BreakpointConfig>;
  enableResponsive?: boolean;
  enableDragDrop?: boolean;
  enableResize?: boolean;
  autoSize?: boolean;
  preventCollision?: boolean;
  compactType?: 'vertical' | 'horizontal' | null;
  margin?: [number, number];
  containerPadding?: [number, number];
  rowHeight?: number;
  onLayoutChange?: (layout: LayoutItem[], layouts: Record<string, LayoutItem[]>) => void;
  onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
  onWidthChange?: (containerWidth: number, margin: [number, number], cols: number, containerPadding: [number, number]) => void;
}

interface ResponsiveState {
  currentBreakpoint: string;
  containerWidth: number;
  cols: number;
  layouts: Record<string, LayoutItem[]>;
  mounted: boolean;
}

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

// Default breakpoint configurations
const DEFAULT_BREAKPOINTS: Record<string, BreakpointConfig> = {
  lg: {
    name: 'Large Desktop',
    minWidth: 1200,
    cols: 12,
    margin: 16,
    containerPadding: 16,
    rowHeight: 150
  },
  md: {
    name: 'Desktop',
    minWidth: 996,
    maxWidth: 1199,
    cols: 10,
    margin: 16,
    containerPadding: 16,
    rowHeight: 150
  },
  sm: {
    name: 'Tablet',
    minWidth: 768,
    maxWidth: 995,
    cols: 6,
    margin: 12,
    containerPadding: 12,
    rowHeight: 120
  },
  xs: {
    name: 'Mobile',
    minWidth: 0,
    maxWidth: 767,
    cols: 4,
    margin: 8,
    containerPadding: 8,
    rowHeight: 100
  },
  xxs: {
    name: 'Small Mobile',
    minWidth: 0,
    maxWidth: 479,
    cols: 2,
    margin: 4,
    containerPadding: 4,
    rowHeight: 80
  }
};

// Mobile Navigation Component
const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose, children }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Dashboard navigation and controls
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Collapsible Section Component
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-4 w-4" />}
            <span className="font-medium">{title}</span>
            {badge && (
              <Badge variant="secondary" className="ml-auto mr-2">
                {badge}
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2 ml-6">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Responsive Grid Item Component
interface ResponsiveGridItemProps {
  children: React.ReactNode;
  layout: LayoutItem;
  breakpoint: string;
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  isDragging?: boolean;
  isResizing?: boolean;
  className?: string;
}

const ResponsiveGridItem: React.FC<ResponsiveGridItemProps> = ({
  children,
  layout,
  breakpoint,
  cols,
  rowHeight,
  margin,
  containerPadding,
  isDragging = false,
  isResizing = false,
  className
}) => {
  const style = useMemo(() => {
    const colWidth = `calc((100% - ${(cols - 1) * margin[0]}px) / ${cols})`;
    const left = `calc(${layout.x} * (${colWidth} + ${margin[0]}px))`;
    const top = `${layout.y * (rowHeight + margin[1])}px`;
    const width = `calc(${layout.w} * ${colWidth} + ${(layout.w - 1) * margin[0]}px)`;
    const height = `${layout.h * rowHeight + (layout.h - 1) * margin[1]}px`;

    return {
      position: 'absolute' as const,
      left,
      top,
      width,
      height,
      transition: isDragging || isResizing ? 'none' : 'all 200ms ease',
      zIndex: isDragging ? 1000 : 1
    };
  }, [layout, cols, rowHeight, margin, isDragging, isResizing]);

  return (
    <div
      className={cn(
        'relative',
        isDragging && 'opacity-50',
        isResizing && 'ring-2 ring-primary',
        className
      )}
      style={style}
      data-grid={JSON.stringify(layout)}
    >
      {children}
    </div>
  );
};

// Main Responsive Layout Component
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  className,
  children,
  layouts: initialLayouts = {},
  breakpoints = DEFAULT_BREAKPOINTS,
  enableResponsive = true,
  enableDragDrop = true,
  enableResize = true,
  autoSize = true,
  preventCollision = false,
  compactType = 'vertical',
  margin = [16, 16],
  containerPadding = [16, 16],
  rowHeight = 150,
  onLayoutChange,
  onBreakpointChange,
  onWidthChange
}) => {
  const [state, setState] = useState<ResponsiveState>({
    currentBreakpoint: 'lg',
    containerWidth: 1200,
    cols: 12,
    layouts: initialLayouts,
    mounted: false
  });

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showLayoutControls, setShowLayoutControls] = useState(false);
  const [previewMode, setPreviewMode] = useState<string | null>(null);

  // Get current breakpoint based on container width
  const getCurrentBreakpoint = useCallback((width: number): string => {
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([, a], [, b]) => b.minWidth - a.minWidth);

    for (const [name, config] of sortedBreakpoints) {
      if (width >= config.minWidth && (!config.maxWidth || width <= config.maxWidth)) {
        return name;
      }
    }

    return sortedBreakpoints[sortedBreakpoints.length - 1][0];
  }, [breakpoints]);

  // Update container width and breakpoint
  const updateDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;

    const containerWidth = window.innerWidth;
    const newBreakpoint = getCurrentBreakpoint(containerWidth);
    const newCols = breakpoints[newBreakpoint].cols;

    setState(prev => {
      if (prev.currentBreakpoint !== newBreakpoint) {
        onBreakpointChange?.(newBreakpoint, newCols);
      }

      if (prev.containerWidth !== containerWidth) {
        onWidthChange?.(containerWidth, margin, newCols, containerPadding);
      }

      return {
        ...prev,
        currentBreakpoint: newBreakpoint,
        containerWidth,
        cols: newCols,
        mounted: true
      };
    });
  }, [getCurrentBreakpoint, breakpoints, margin, containerPadding, onBreakpointChange, onWidthChange]);

  // Initialize and handle window resize
  useEffect(() => {
    updateDimensions();

    if (enableResponsive) {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [updateDimensions, enableResponsive]);

  // Get current layout for active breakpoint
  const currentLayout = useMemo(() => {
    return state.layouts[state.currentBreakpoint] || [];
  }, [state.layouts, state.currentBreakpoint]);

  // Calculate container height
  const containerHeight = useMemo(() => {
    if (currentLayout.length === 0) return 'auto';

    const maxY = Math.max(...currentLayout.map(item => item.y + item.h));
    return `${maxY * (rowHeight + margin[1]) - margin[1] + containerPadding[1] * 2}px`;
  }, [currentLayout, rowHeight, margin, containerPadding]);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    const newLayouts = {
      ...state.layouts,
      [state.currentBreakpoint]: newLayout
    };

    setState(prev => ({ ...prev, layouts: newLayouts }));
    onLayoutChange?.(newLayout, newLayouts);
  }, [state.layouts, state.currentBreakpoint, onLayoutChange]);

  // Generate layout for breakpoint if not exists
  const generateLayout = useCallback((breakpoint: string) => {
    if (state.layouts[breakpoint]) return;

    const cols = breakpoints[breakpoint].cols;
    const baseLayout = state.layouts[state.currentBreakpoint] || [];

    const newLayout = baseLayout.map((item, index) => ({
      ...item,
      x: Math.min(item.x, cols - item.w),
      w: Math.min(item.w, cols)
    }));

    setState(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        [breakpoint]: newLayout
      }
    }));
  }, [state.layouts, state.currentBreakpoint, breakpoints]);

  // Preview different breakpoints
  const previewBreakpoint = (breakpoint: string) => {
    if (previewMode === breakpoint) {
      setPreviewMode(null);
      return;
    }

    generateLayout(breakpoint);
    setPreviewMode(breakpoint);
  };

  // Reset layouts
  const resetLayouts = () => {
    setState(prev => ({ ...prev, layouts: {} }));
  };

  // Export layouts
  const exportLayouts = () => {
    const dataStr = JSON.stringify(state.layouts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-layouts.json';
    link.click();
  };

  // Get current breakpoint config
  const currentBreakpointConfig = breakpoints[previewMode || state.currentBreakpoint];
  const currentCols = currentBreakpointConfig.cols;
  const currentMargin: [number, number] = [currentBreakpointConfig.margin, currentBreakpointConfig.margin];
  const currentPadding: [number, number] = [currentBreakpointConfig.containerPadding, currentBreakpointConfig.containerPadding];
  const currentRowHeight = currentBreakpointConfig.rowHeight;

  // Render layout controls
  const renderLayoutControls = () => (
    <div className="space-y-4">
      <CollapsibleSection title="Breakpoints" icon={Monitor} defaultOpen badge={Object.keys(breakpoints).length}>
        <div className="space-y-2">
          {Object.entries(breakpoints).map(([name, config]) => {
            const isActive = (previewMode || state.currentBreakpoint) === name;
            const hasLayout = !!state.layouts[name];
            
            return (
              <div key={name} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    isActive ? 'bg-primary' : hasLayout ? 'bg-green-500' : 'bg-muted-foreground'
                  )} />
                  <div>
                    <p className="text-sm font-medium">{config.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.cols} cols • {config.minWidth}px+
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => previewBreakpoint(name)}
                  >
                    {isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Layout Settings" icon={Settings}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Responsive</span>
            <Switch checked={enableResponsive} disabled />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Drag & Drop</span>
            <Switch checked={enableDragDrop} disabled />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Resizable</span>
            <Switch checked={enableResize} disabled />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Auto Size</span>
            <Switch checked={autoSize} disabled />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Grid Info" icon={Grid3X3}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Breakpoint:</span>
            <Badge variant="outline">{previewMode || state.currentBreakpoint}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Columns:</span>
            <span>{currentCols}</span>
          </div>
          <div className="flex justify-between">
            <span>Row Height:</span>
            <span>{currentRowHeight}px</span>
          </div>
          <div className="flex justify-between">
            <span>Margin:</span>
            <span>{currentMargin[0]}px</span>
          </div>
          <div className="flex justify-between">
            <span>Container Width:</span>
            <span>{state.containerWidth}px</span>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Actions" icon={Zap}>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={exportLayouts}>
            <Save className="h-3 w-3 mr-2" />
            Export Layouts
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={resetLayouts}>
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset Layouts
          </Button>
        </div>
      </CollapsibleSection>
    </div>
  );

  if (!state.mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Layout className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Badge variant="outline">
            {currentBreakpointConfig.name}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {currentCols} cols
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLayoutControls(!showLayoutControls)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Layout Controls</h2>
            <Badge variant="outline">
              {currentBreakpointConfig.name}
            </Badge>
          </div>
          {renderLayoutControls()}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)}>
        {renderLayoutControls()}
      </MobileNavigation>

      {/* Mobile Layout Controls */}
      {showLayoutControls && (
        <div className="lg:hidden border-b bg-muted/50 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Preview Mode</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLayoutControls(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(breakpoints).map(([name, config]) => {
                const isActive = (previewMode || state.currentBreakpoint) === name;
                return (
                  <Button
                    key={name}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => previewBreakpoint(name)}
                  >
                    {config.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        'transition-all duration-300',
        'lg:ml-80',
        previewMode && 'ring-2 ring-primary ring-offset-2'
      )}>
        <div
          className="relative"
          style={{
            height: autoSize ? containerHeight : '100vh',
            padding: `${currentPadding[1]}px ${currentPadding[0]}px`,
            minHeight: '400px'
          }}
        >
          {/* Preview Mode Indicator */}
          {previewMode && (
            <div className="absolute top-2 right-2 z-50">
              <Badge variant="default" className="animate-pulse">
                Preview: {breakpoints[previewMode].name}
              </Badge>
            </div>
          )}

          {/* Grid Background (Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: `calc((100% - ${(currentCols - 1) * currentMargin[0]}px) / ${currentCols} + ${currentMargin[0]}px) ${currentRowHeight + currentMargin[1]}px`
              }}
            />
          )}

          {/* Layout Items */}
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return child;

            const layoutItem = currentLayout[index];
            if (!layoutItem) return child;

            return (
              <ResponsiveGridItem
                key={layoutItem.i}
                layout={layoutItem}
                breakpoint={previewMode || state.currentBreakpoint}
                cols={currentCols}
                rowHeight={currentRowHeight}
                margin={currentMargin}
                containerPadding={currentPadding}
              >
                {child}
              </ResponsiveGridItem>
            );
          })}

          {/* Empty State */}
          {currentLayout.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Layout Defined</h3>
                <p className="text-muted-foreground mb-4">
                  Add layout items for the {currentBreakpointConfig.name} breakpoint
                </p>
                <Badge variant="outline">
                  {currentCols} columns available
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
export { DEFAULT_BREAKPOINTS, type BreakpointConfig, type LayoutItem };