'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { GlassCard } from './glass-card';
import { CHART_COLORS, ANIMATION } from '@/lib/constants/admin';
import type { TimeSeriesData, ChartDataPoint } from '@/lib/types/admin';

interface BaseChartProps {
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  loading?: boolean;
  error?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

interface LineChartProps extends BaseChartProps {
  data: TimeSeriesData[];
  lines: {
    dataKey: string;
    name: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }[];
}

interface AreaChartProps extends BaseChartProps {
  data: TimeSeriesData[];
  areas: {
    dataKey: string;
    name: string;
    color?: string;
    fillOpacity?: number;
  }[];
}

interface BarChartProps extends BaseChartProps {
  data: ChartDataPoint[];
  bars: {
    dataKey: string;
    name: string;
    color?: string;
  }[];
  orientation?: 'horizontal' | 'vertical';
}

interface PieChartProps extends BaseChartProps {
  data: ChartDataPoint[];
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, labelFormatter, valueFormatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <GlassCard variant="elevated" className="p-3 min-w-[150px]">
      {label && (
        <p className="text-sm font-medium text-white mb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="text-white font-medium">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </GlassCard>
  );
};

// Loading Skeleton
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="animate-pulse" style={{ height }}>
    <div className="h-full bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-lg" />
  </div>
);

// Error State
const ChartError = ({ error }: { error: string }) => (
  <div className="flex items-center justify-center h-64 text-center">
    <div>
      <div className="text-red-400 mb-2">⚠️</div>
      <p className="text-gray-400 text-sm">{error}</p>
    </div>
  </div>
);

// Animated Line Chart
export function AnimatedLineChart({
  data,
  lines,
  title,
  subtitle,
  className,
  height = 300,
  loading = false,
  error,
  showLegend = true,
  showGrid = true,
  animate = true,
}: LineChartProps) {
  const [animatedData, setAnimatedData] = useState<TimeSeriesData[]>([]);

  useEffect(() => {
    if (!animate) {
      setAnimatedData(data);
      return;
    }

    // Animate data entry
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);

    return () => clearTimeout(timer);
  }, [data, animate]);

  return (
    <GlassCard variant="elevated" className={cn('p-6', className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold text-white mb-1"
            >
              {title}
            </motion.h3>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-gray-400"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}

      {loading ? (
        <ChartSkeleton height={height} />
      ) : error ? (
        <ChartError error={error} />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={ANIMATION.SPRING}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={animatedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              )}
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color || CHART_COLORS.PRIMARY}
                  strokeWidth={line.strokeWidth || 2}
                  strokeDasharray={line.strokeDasharray}
                  dot={{ fill: line.color || CHART_COLORS.PRIMARY, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: line.color || CHART_COLORS.PRIMARY, strokeWidth: 2 }}
                  animationDuration={animate ? 1000 : 0}
                  animationDelay={animate ? index * 200 : 0}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </GlassCard>
  );
}

// Animated Area Chart
export function AnimatedAreaChart({
  data,
  areas,
  title,
  subtitle,
  className,
  height = 300,
  loading = false,
  error,
  showLegend = true,
  showGrid = true,
  animate = true,
}: AreaChartProps) {
  return (
    <GlassCard variant="elevated" className={cn('p-6', className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold text-white mb-1"
            >
              {title}
            </motion.h3>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-gray-400"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}

      {loading ? (
        <ChartSkeleton height={height} />
      ) : error ? (
        <ChartError error={error} />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={ANIMATION.SPRING}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                {areas.map((area, index) => (
                  <linearGradient key={area.dataKey} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={area.color || CHART_COLORS.PRIMARY} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={area.color || CHART_COLORS.PRIMARY} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              )}
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {areas.map((area, index) => (
                <Area
                  key={area.dataKey}
                  type="monotone"
                  dataKey={area.dataKey}
                  name={area.name}
                  stroke={area.color || CHART_COLORS.PRIMARY}
                  fill={`url(#gradient-${index})`}
                  fillOpacity={area.fillOpacity || 0.6}
                  animationDuration={animate ? 1000 : 0}
                  animationDelay={animate ? index * 200 : 0}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </GlassCard>
  );
}

// Animated Bar Chart
export function AnimatedBarChart({
  data,
  bars,
  title,
  subtitle,
  className,
  height = 300,
  loading = false,
  error,
  showLegend = true,
  showGrid = true,
  animate = true,
  orientation = 'vertical',
}: BarChartProps) {
  return (
    <GlassCard variant="elevated" className={cn('p-6', className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold text-white mb-1"
            >
              {title}
            </motion.h3>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-gray-400"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}

      {loading ? (
        <ChartSkeleton height={height} />
      ) : error ? (
        <ChartError error={error} />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={ANIMATION.SPRING}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              )}
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {bars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.color || CHART_COLORS.PRIMARY}
                  radius={[4, 4, 0, 0]}
                  animationDuration={animate ? 1000 : 0}
                  animationDelay={animate ? index * 100 : 0}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </GlassCard>
  );
}

// Animated Pie Chart
export function AnimatedPieChart({
  data,
  title,
  subtitle,
  className,
  height = 300,
  loading = false,
  error,
  showLegend = true,
  animate = true,
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true,
  showValues = true,
}: PieChartProps) {
  const colors = [
    CHART_COLORS.PRIMARY,
    CHART_COLORS.SECONDARY,
    CHART_COLORS.SUCCESS,
    CHART_COLORS.WARNING,
    CHART_COLORS.ERROR,
    CHART_COLORS.INFO,
  ];

  const renderLabel = (entry: any) => {
    if (!showLabels) return '';
    return showValues ? `${entry.label}: ${entry.value}` : entry.label;
  };

  return (
    <GlassCard variant="elevated" className={cn('p-6', className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold text-white mb-1"
            >
              {title}
            </motion.h3>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-gray-400"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}

      {loading ? (
        <ChartSkeleton height={height} />
      ) : error ? (
        <ChartError error={error} />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={ANIMATION.SPRING}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                fill="#8884d8"
                dataKey="value"
                animationDuration={animate ? 1000 : 0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </GlassCard>
  );
}

// Export all chart components
// Generic AnimatedChart component that accepts a type prop
interface AnimatedChartProps {
  type: 'line' | 'area' | 'bar' | 'pie';
  data: any[];
  height?: number;
  config?: any;
  title?: string;
  subtitle?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

export function AnimatedChart({ type, data, config = {}, ...props }: AnimatedChartProps) {
  switch (type) {
    case 'line':
      return (
        <AnimatedLineChart
          data={data}
          lines={config.lines || []}
          {...props}
        />
      );
    case 'area':
      return (
        <AnimatedAreaChart
          data={data}
          areas={config.areas || []}
          {...props}
        />
      );
    case 'bar':
      return (
        <AnimatedBarChart
          data={data}
          bars={config.bars || []}
          {...props}
        />
      );
    case 'pie':
      return (
        <AnimatedPieChart
          data={data}
          {...props}
        />
      );
    default:
      return <div>Unsupported chart type</div>;
  }
}

export {
  AnimatedLineChart as LineChart,
  AnimatedAreaChart as AreaChart,
  AnimatedBarChart as BarChart,
  AnimatedPieChart as PieChart,
};