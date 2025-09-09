'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ANIMATION } from '@/lib/constants/admin';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'bordered';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

const variants = {
  default: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  elevated: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 15px 35px 0 rgba(31, 38, 135, 0.4)',
  },
  subtle: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
  },
  bordered: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '2px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
};

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

export function GlassCard({
  children,
  className,
  variant = 'default',
  blur = 'md',
  opacity = 1,
  hover = true,
  glow = false,
  gradient = false,
  ...props
}: GlassCardProps) {
  const variantStyles = variants[variant];

  return (
    <motion.div
      className={cn(
        'relative rounded-xl overflow-hidden',
        blurClasses[blur],
        {
          'hover:scale-[1.02] transition-transform duration-300': hover,
          'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300': glow,
          'bg-gradient-to-br from-white/10 via-white/5 to-transparent': gradient,
        },
        className
      )}
      style={{
        background: gradient ? undefined : variantStyles.background,
        border: variantStyles.border,
        boxShadow: variantStyles.boxShadow,
        opacity,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ANIMATION.SPRING}
      {...props}
    >
      {glow && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Specialized glass card variants
export function StatsCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon,
  className,
  ...props
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
} & Omit<GlassCardProps, 'children'>) {
  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <GlassCard
      className={cn('p-6 group', className)}
      variant="elevated"
      glow
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-300 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-2">{value}</p>
          {change && (
            <p className={cn('text-sm font-medium', changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 rounded-lg bg-white/10 text-white/80 group-hover:bg-white/20 transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function FeatureCard({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
} & Omit<GlassCardProps, 'children'>) {
  return (
    <GlassCard
      className={cn('p-6 group cursor-pointer', className)}
      variant="default"
      hover
      glow
      {...props}
    >
      <div className="flex flex-col h-full">
        {icon && (
          <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white/90 mb-4 w-fit group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
        </div>
        {action && (
          <div className="mt-4 pt-4 border-t border-white/10">
            {action}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function NotificationCard({
  title,
  message,
  type = 'info',
  timestamp,
  onDismiss,
  className,
  ...props
}: {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
  onDismiss?: () => void;
  className?: string;
} & Omit<GlassCardProps, 'children'>) {
  const typeColors = {
    info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    error: 'from-red-500/20 to-pink-500/20 border-red-500/30',
  };

  return (
    <GlassCard
      className={cn(
        'p-4 bg-gradient-to-r border-l-4',
        typeColors[type],
        className
      )}
      variant="subtle"
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
          <p className="text-xs text-gray-300 leading-relaxed">{message}</p>
          {timestamp && (
            <p className="text-xs text-gray-400 mt-2">{timestamp}</p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-3 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </GlassCard>
  );
}