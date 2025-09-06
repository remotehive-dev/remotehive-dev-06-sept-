'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Timer
} from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress?: number;
  details?: string;
  timestamp?: string;
}

export interface ProgressTrackerProps {
  title: string;
  description?: string;
  steps?: ProgressStep[];
  overallProgress?: number;
  currentStep?: string;
  estimatedTimeRemaining?: string;
  startTime?: string;
  endTime?: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onResume?: () => void;
  className?: string;
  showControls?: boolean;
  showSteps?: boolean;
  animated?: boolean;
  compact?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  title,
  description,
  steps = [],
  overallProgress = 0,
  currentStep,
  estimatedTimeRemaining,
  startTime,
  endTime,
  status,
  onStart,
  onPause,
  onStop,
  onResume,
  className,
  showControls = true,
  showSteps = true,
  animated = true,
  compact = false
}) => {
  const getStatusColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'active': return <Activity className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    try {
      return new Date(timeString).toLocaleTimeString();
    } catch {
      return timeString;
    }
  };

  const calculateElapsedTime = () => {
    if (!startTime) return null;
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (compact) {
    return (
      <div className={cn('p-4 rounded-lg border', className)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium">{title}</h4>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{overallProgress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={overallProgress} 
            className={cn(
              'transition-all duration-300',
              animated && status === 'running' && 'animate-pulse'
            )}
          />
        </div>

        {showControls && (
          <div className="flex justify-end space-x-2 mt-3">
            {status === 'idle' && onStart && (
              <Button size="sm" onClick={onStart}>
                <Play className="w-3 h-3 mr-1" />
                Start
              </Button>
            )}
            {status === 'running' && onPause && (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
            )}
            {status === 'paused' && onResume && (
              <Button size="sm" onClick={onResume}>
                <Play className="w-3 h-3 mr-1" />
                Resume
              </Button>
            )}
            {(status === 'running' || status === 'paused') && onStop && (
              <Button size="sm" variant="destructive" onClick={onStop}>
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('transition-all duration-200', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
                {status}
              </Badge>
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          {showControls && (
            <div className="flex space-x-2">
              {status === 'idle' && onStart && (
                <Button size="sm" onClick={onStart}>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              )}
              {status === 'running' && onPause && (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              {status === 'paused' && onResume && (
                <Button size="sm" onClick={onResume}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              {(status === 'running' || status === 'paused') && onStop && (
                <Button size="sm" variant="destructive" onClick={onStop}>
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{overallProgress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={overallProgress} 
            className={cn(
              'h-3 transition-all duration-300',
              animated && status === 'running' && 'animate-pulse'
            )}
          />
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {startTime && (
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium">{formatTime(startTime)}</p>
            </div>
          )}
          {endTime && (
            <div>
              <p className="text-muted-foreground">Completed</p>
              <p className="font-medium">{formatTime(endTime)}</p>
            </div>
          )}
          {!endTime && startTime && (
            <div>
              <p className="text-muted-foreground">Elapsed</p>
              <p className="font-medium">{calculateElapsedTime()}</p>
            </div>
          )}
          {estimatedTimeRemaining && status === 'running' && (
            <div>
              <p className="text-muted-foreground">ETA</p>
              <p className="font-medium flex items-center">
                <Timer className="w-3 h-3 mr-1" />
                {estimatedTimeRemaining}
              </p>
            </div>
          )}
        </div>

        {/* Current Step */}
        {currentStep && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Current Step</p>
            <p className="text-sm text-muted-foreground">{currentStep}</p>
          </div>
        )}

        {/* Step Details */}
        {showSteps && steps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Steps</h4>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs',
                    getStatusColor(step.status)
                  )}>
                    {step.status === 'completed' || step.status === 'failed' ? (
                      getStatusIcon(step.status)
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{step.label}</p>
                    {step.details && (
                      <p className="text-xs text-muted-foreground truncate">{step.details}</p>
                    )}
                    {step.progress !== undefined && step.status === 'active' && (
                      <div className="mt-1">
                        <Progress value={step.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                  {step.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {formatTime(step.timestamp)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;