'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  TrendingUp,
  Filter,
  Search,
  Plus,
  Edit3,
  Home,
  Bell,
  User,
  MoreHorizontal,
  RefreshCw,
  Download,
  Share,
  Bookmark,
  Heart,
  MessageSquare,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GridContainer, { GridWidget } from './GridContainer';
import { LayoutItem, BreakpointConfig } from './ResponsiveLayout';

export interface MobileDashboardProps {
  className?: string;
  widgets: GridWidget[];
  layouts?: Record<string, LayoutItem[]>;
  title?: string;
  subtitle?: string;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableNotifications?: boolean;
  enableUserMenu?: boolean;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
}

interface MobileState {
  searchQuery: string;
  activeFilters: Record<string, any>;
  showSearch: boolean;
  showFilters: boolean;
  showNotifications: boolean;
  selectedTab: string;
  isMenuOpen: boolean;
  isFullscreen: boolean;
  refreshing: boolean;
}

// Mobile-optimized breakpoints
const MOBILE_BREAKPOINTS: Record<string, BreakpointConfig> = {
  xs: {
    name: 'Mobile Portrait',
    minWidth: 0,
    maxWidth: 479,
    cols: 1,
    margin: 8,
    containerPadding: 12,
    rowHeight: 120
  },
  sm: {
    name: 'Mobile Landscape',
    minWidth: 480,
    maxWidth: 767,
    cols: 2,
    margin: 12,
    containerPadding: 16,
    rowHeight: 140
  },
  md: {
    name: 'Tablet Portrait',
    minWidth: 768,
    maxWidth: 1023,
    cols: 3,
    margin: 16,
    containerPadding: 20,
    rowHeight: 160
  },
  lg: {
    name: 'Tablet Landscape',
    minWidth: 1024,
    maxWidth: 1279,
    cols: 4,
    margin: 20,
    containerPadding: 24,
    rowHeight: 180
  },
  xl: {
    name: 'Desktop',
    minWidth: 1280,
    cols: 6,
    margin: 24,
    containerPadding: 32,
    rowHeight: 200
  }
};

// Mobile Navigation Items
const MOBILE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'charts', label: 'Charts', icon: LineChart },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings }
];

// Quick Actions
const QUICK_ACTIONS = [
  { id: 'refresh', label: 'Refresh', icon: RefreshCw, color: 'bg-blue-500' },
  { id: 'export', label: 'Export', icon: Download, color: 'bg-green-500' },
  { id: 'share', label: 'Share', icon: Share, color: 'bg-purple-500' },
  { id: 'bookmark', label: 'Bookmark', icon: Bookmark, color: 'bg-yellow-500' }
];

// Mobile Header Component
interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  onSearchClick: () => void;
  onNotificationClick: () => void;
  onUserClick: () => void;
  showSearch: boolean;
  showNotifications: boolean;
  notificationCount?: number;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  onMenuClick,
  onSearchClick,
  onNotificationClick,
  onUserClick,
  showSearch,
  showNotifications,
  notificationCount = 0
}) => {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearchClick}
            className={cn(
              'p-2',
              showSearch && 'bg-muted'
            )}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onNotificationClick}
            className={cn(
              'p-2 relative',
              showNotifications && 'bg-muted'
            )}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onUserClick}
            className="p-2"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Mobile Search Bar
interface MobileSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  placeholder?: string;
}

const MobileSearch: React.FC<MobileSearchProps> = ({
  query,
  onQueryChange,
  onClose,
  placeholder = 'Search dashboard...'
}) => {
  return (
    <div className="border-b bg-muted/30 p-4">
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Mobile Bottom Navigation
interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  items: typeof MOBILE_NAV_ITEMS;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  items
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t">
      <div className="flex items-center justify-around py-2">
        {items.map(item => {
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center space-y-1 p-2 h-auto min-w-0 flex-1',
                isActive && 'text-primary bg-primary/10'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5',
                isActive && 'text-primary'
              )} />
              <span className={cn(
                'text-xs truncate',
                isActive && 'text-primary font-medium'
              )}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

// Quick Actions Panel
interface QuickActionsPanelProps {
  actions: typeof QUICK_ACTIONS;
  onActionClick: (actionId: string) => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  actions,
  onActionClick
}) => {
  return (
    <div className="p-4 border-b">
      <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-3">
        {actions.map(action => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => onActionClick(action.id)}
            className="flex flex-col items-center space-y-2 h-auto p-3"
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              action.color
            )}>
              <action.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

// Mobile Sidebar Menu
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onActionClick: (actionId: string) => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onActionClick
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Dashboard Menu</SheetTitle>
          <SheetDescription>
            Navigate and manage your dashboard
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <QuickActionsPanel
            actions={QUICK_ACTIONS}
            onActionClick={onActionClick}
          />
          
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Navigation</h3>
            <div className="space-y-1">
              {MOBILE_NAV_ITEMS.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <Separator />
          
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Dark Mode</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Notifications</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto Refresh</span>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

// Main Mobile Dashboard Component
const MobileDashboard: React.FC<MobileDashboardProps> = ({
  className,
  widgets,
  layouts,
  title = 'Dashboard',
  subtitle,
  enableSearch = true,
  enableFilters = true,
  enableNotifications = true,
  enableUserMenu = true,
  onSearch,
  onFilterChange,
  onNotificationClick,
  onUserMenuClick
}) => {
  const [state, setState] = useState<MobileState>({
    searchQuery: '',
    activeFilters: {},
    showSearch: false,
    showFilters: false,
    showNotifications: false,
    selectedTab: 'dashboard',
    isMenuOpen: false,
    isFullscreen: false,
    refreshing: false
  });

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    onSearch?.(query);
  }, [onSearch]);

  // Handle quick actions
  const handleQuickAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'refresh':
        setState(prev => ({ ...prev, refreshing: true }));
        setTimeout(() => {
          setState(prev => ({ ...prev, refreshing: false }));
        }, 1000);
        break;
      case 'export':
        // Handle export
        break;
      case 'share':
        // Handle share
        break;
      case 'bookmark':
        // Handle bookmark
        break;
    }
  }, []);

  // Filter widgets based on search and filters
  const filteredWidgets = useMemo(() => {
    let filtered = widgets;
    
    if (state.searchQuery) {
      filtered = filtered.filter(widget =>
        widget.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        widget.description?.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [widgets, state.searchQuery]);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setState(prev => ({ ...prev, selectedTab: tab }));
  }, []);

  // Toggle search
  const toggleSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSearch: !prev.showSearch,
      searchQuery: prev.showSearch ? '' : prev.searchQuery
    }));
  }, []);

  // Toggle notifications
  const toggleNotifications = useCallback(() => {
    setState(prev => ({ ...prev, showNotifications: !prev.showNotifications }));
    onNotificationClick?.();
  }, [onNotificationClick]);

  // Handle user menu
  const handleUserMenu = useCallback(() => {
    onUserMenuClick?.();
  }, [onUserMenuClick]);

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile Header */}
      <MobileHeader
        title={title}
        subtitle={subtitle}
        onMenuClick={() => setState(prev => ({ ...prev, isMenuOpen: true }))}
        onSearchClick={toggleSearch}
        onNotificationClick={toggleNotifications}
        onUserClick={handleUserMenu}
        showSearch={state.showSearch}
        showNotifications={state.showNotifications}
        notificationCount={3}
      />

      {/* Search Bar */}
      {state.showSearch && (
        <MobileSearch
          query={state.searchQuery}
          onQueryChange={handleSearch}
          onClose={() => setState(prev => ({ ...prev, showSearch: false, searchQuery: '' }))}
        />
      )}

      {/* Refreshing Indicator */}
      {state.refreshing && (
        <div className="bg-primary/10 border-b p-2">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Refreshing dashboard...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pb-20"> {/* Bottom padding for navigation */}
        <GridContainer
          widgets={filteredWidgets}
          layouts={layouts}
          breakpoints={MOBILE_BREAKPOINTS}
          enableEditing={false}
          enableDragDrop={false}
          enableResize={false}
          enableAddRemove={false}
          className="min-h-[calc(100vh-200px)]"
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={state.isMenuOpen}
        onClose={() => setState(prev => ({ ...prev, isMenuOpen: false }))}
        activeTab={state.selectedTab}
        onTabChange={handleTabChange}
        onActionClick={handleQuickAction}
      />

      {/* Bottom Navigation */}
      <MobileBottomNav
        activeTab={state.selectedTab}
        onTabChange={handleTabChange}
        items={MOBILE_NAV_ITEMS}
      />

      {/* Fullscreen Overlay */}
      {state.isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Fullscreen View</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, isFullscreen: false }))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            {/* Fullscreen content */}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;
export { MOBILE_BREAKPOINTS, MOBILE_NAV_ITEMS, QUICK_ACTIONS };