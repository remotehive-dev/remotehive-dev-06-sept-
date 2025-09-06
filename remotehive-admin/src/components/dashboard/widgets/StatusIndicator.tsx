'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Pause, 
  XCircle,
  Loader2
} from 'lucide-react';

export type StatusType = 'idle' | 'running' | 'completed' | 'failed' | 'paused' | 'warning' | 'loading';

export interface StatusIndicatorProps {
  status: StatusType;
  title: string;
  description?: string;
  timestamp?: string;
  progress?: number;
  details?: {
    label: string;
    value: string | number;
  }[];
  actions?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'card' | 'inline' | 'compact';
  animated?: boolean;
}

const statusConfig: Record<StatusType, {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  label: string;
}> = {
  idle: {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    badgeVariant: 'secondary',
    label: 'Idle'
  },
  running: {
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    badgeVariant: 'default',
    label: 'Running'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    badgeVariant: 'outline',
    label: 'Completed'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    badgeVariant: 'destructive',
    label: 'Failed'
  },
  paused: {
    icon: Pause,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    badgeVariant: 'outline',
    label: 'Paused'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    badgeVariant: 'outline',
    label: 'Warning'
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    badgeVariant: 'default',
    label: 'Loading'
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  title,
  description,
  timestamp,
  progress,
  details,
  actions,
  className,
  size = 'md',
  variant = 'card',
  animated = true
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className={cn('p-1 rounded-full', config.bgColor)}>
          <Icon className={cn(
            iconSizes[size],
            config.color,
            animated && status === 'running' && 'animate-pulse',
            animated && status === 'loading' && 'animate-spin'
          )} />
        </div>
        <Badge variant={config.badgeVariant} className={sizeClasses[size]}>
          {config.label}
        </Badge>
        {title && <span className={cn('font-medium', sizeClasses[size])}>{title}</span>}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-between p-3 rounded-lg border', className)}>
        <div className="flex items-center space-x-3">
          <div className={cn('p-2 rounded-full', config.bgColor)}>
            <Icon className={cn(
              iconSizes[size],
              config.color,
              animated && status === 'running' && 'animate-pulse',
              animated && status === 'loading' && 'animate-spin'
            )} />
          </div>
          <div>
            <h4 className={cn('font-medium', sizeClasses[size])}>{title}</h4>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
          {actions}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('transition-all duration-200', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-full', config.bgColor)}>
              <Icon className={cn(
                iconSizes[size],
                config.color,
                animated && status === 'running' && 'animate-pulse',
                animated && status === 'loading' && 'animate-spin'
              )} />
            </div>
            <div>
              <CardTitle className={sizeClasses[size]}>{title}</CardTitle>
              {timestamp && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(timestamp)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={config.badgeVariant}>{config.label}</Badge>
            {actions}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
        )}
        
        {progress !== undefined && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  status === 'completed' ? 'bg-green-500' :
                  status === 'failed' ? 'bg-red-500' :
                  status === 'running' ? 'bg-blue-500' :
                  'bg-gray-400'
                )}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {details && details.length > 0 && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {details.map((detail, index) => (
              <div key={index}>
                <p className="text-muted-foreground">{detail.label}</p>
                <p className="font-medium">{detail.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusIndicator;