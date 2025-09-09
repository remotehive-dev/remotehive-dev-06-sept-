'use client';

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  errorRate: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
}

export interface ScraperSourceMetrics {
  source: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  avgJobsPerRun: number;
  avgRunDuration: number;
  lastRunTime: string;
  qualityScore: number; // 0-100 based on data completeness and accuracy
  reliability: number; // 0-100 based on success rate and consistency
}

export interface ErrorAnalysis {
  errorType: string;
  count: number;
  percentage: number;
  lastOccurrence: string;
  affectedScrapers: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution?: string;
}

export interface TrendData {
  timestamp: string;
  value: number;
  change?: number;
  changePercentage?: number;
}

export interface ScrapingVelocity {
  jobsPerHour: number;
  jobsPerDay: number;
  pagesPerHour: number;
  dataVolumePerHour: number; // in MB
  peakHours: string[];
  slowestHours: string[];
}

export interface QualityMetrics {
  dataCompleteness: number; // percentage of fields populated
  dataAccuracy: number; // based on validation rules
  duplicateRate: number; // percentage of duplicate entries
  freshness: number; // how recent the data is
  consistency: number; // data format consistency
}

export interface PredictiveAnalytics {
  expectedJobsNextHour: number;
  expectedJobsNextDay: number;
  resourceUtilizationForecast: number;
  potentialBottlenecks: string[];
  recommendedActions: string[];
}

class AnalyticsService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = 'http://127.0.0.1:5003/api') {
    this.baseUrl = baseUrl;
  }

  private async fetchWithCache<T>(endpoint: string, ttl: number = this.CACHE_TTL): Promise<T> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now(), ttl });
      return data;
    } catch (error) {
      console.error(`Analytics fetch error for ${endpoint}:`, error);
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  async getPerformanceMetrics(timeRange: AnalyticsTimeRange): Promise<PerformanceMetrics> {
    const params = new URLSearchParams({
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      granularity: timeRange.granularity
    });

    return this.fetchWithCache(`/analytics/performance?${params}`);
  }

  async getSourceMetrics(timeRange?: AnalyticsTimeRange): Promise<ScraperSourceMetrics[]> {
    const params = timeRange ? new URLSearchParams({
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString()
    }) : '';

    return this.fetchWithCache(`/analytics/sources${params ? '?' + params : ''}`);
  }

  async getErrorAnalysis(timeRange: AnalyticsTimeRange): Promise<ErrorAnalysis[]> {
    const params = new URLSearchParams({
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString()
    });

    return this.fetchWithCache(`/analytics/errors?${params}`);
  }

  async getTrendData(
    metric: 'jobs' | 'success_rate' | 'response_time' | 'error_rate' | 'throughput',
    timeRange: AnalyticsTimeRange
  ): Promise<TrendData[]> {
    const params = new URLSearchParams({
      metric,
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      granularity: timeRange.granularity
    });

    return this.fetchWithCache(`/analytics/trends?${params}`);
  }

  async getScrapingVelocity(timeRange: AnalyticsTimeRange): Promise<ScrapingVelocity> {
    const params = new URLSearchParams({
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString()
    });

    return this.fetchWithCache(`/analytics/velocity?${params}`);
  }

  async getQualityMetrics(scraperId?: string): Promise<QualityMetrics> {
    const params = scraperId ? new URLSearchParams({ scraper_id: scraperId }) : '';
    return this.fetchWithCache(`/analytics/quality${params ? '?' + params : ''}`);
  }

  async getPredictiveAnalytics(): Promise<PredictiveAnalytics> {
    return this.fetchWithCache('/analytics/predictions', 10 * 60 * 1000); // 10 minutes cache
  }

  async getHistoricalComparison(
    metric: string,
    currentPeriod: AnalyticsTimeRange,
    comparisonPeriod: AnalyticsTimeRange
  ): Promise<{ current: TrendData[]; comparison: TrendData[]; change: number }> {
    const params = new URLSearchParams({
      metric,
      current_start: currentPeriod.start.toISOString(),
      current_end: currentPeriod.end.toISOString(),
      comparison_start: comparisonPeriod.start.toISOString(),
      comparison_end: comparisonPeriod.end.toISOString(),
      granularity: currentPeriod.granularity
    });

    return this.fetchWithCache(`/analytics/compare?${params}`);
  }

  async getCustomMetrics(query: {
    metrics: string[];
    filters?: Record<string, any>;
    groupBy?: string[];
    timeRange: AnalyticsTimeRange;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/analytics/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Utility methods for common time ranges
  static getTimeRange(period: 'last_hour' | 'last_24h' | 'last_7d' | 'last_30d' | 'last_90d'): AnalyticsTimeRange {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'last_hour':
        start.setHours(start.getHours() - 1);
        return { start, end, granularity: 'minute' };
      case 'last_24h':
        start.setDate(start.getDate() - 1);
        return { start, end, granularity: 'hour' };
      case 'last_7d':
        start.setDate(start.getDate() - 7);
        return { start, end, granularity: 'hour' };
      case 'last_30d':
        start.setDate(start.getDate() - 30);
        return { start, end, granularity: 'day' };
      case 'last_90d':
        start.setDate(start.getDate() - 90);
        return { start, end, granularity: 'day' };
      default:
        throw new Error(`Unknown period: ${period}`);
    }
  }

  // Calculate derived metrics
  static calculateTrend(data: TrendData[]): { direction: 'up' | 'down' | 'stable'; percentage: number } {
    if (data.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    const recent = data.slice(-5); // Last 5 data points
    const older = data.slice(-10, -5); // Previous 5 data points

    if (recent.length === 0 || older.length === 0) {
      return { direction: 'stable', percentage: 0 };
    }

    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (Math.abs(change) < 5) {
      return { direction: 'stable', percentage: change };
    }

    return {
      direction: change > 0 ? 'up' : 'down',
      percentage: Math.abs(change)
    };
  }

  static aggregateMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    if (metrics.length === 0) {
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        successRate: 0,
        totalRequests: 0,
        failedRequests: 0
      };
    }

    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalFailed = metrics.reduce((sum, m) => sum + m.failedRequests, 0);
    const totalThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0);

    return {
      avgResponseTime: metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length,
      minResponseTime: Math.min(...metrics.map(m => m.minResponseTime)),
      maxResponseTime: Math.max(...metrics.map(m => m.maxResponseTime)),
      p95ResponseTime: metrics.reduce((sum, m) => sum + m.p95ResponseTime, 0) / metrics.length,
      p99ResponseTime: metrics.reduce((sum, m) => sum + m.p99ResponseTime, 0) / metrics.length,
      throughput: totalThroughput,
      errorRate: totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0,
      successRate: totalRequests > 0 ? ((totalRequests - totalFailed) / totalRequests) * 100 : 0,
      totalRequests,
      failedRequests: totalFailed
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export default AnalyticsService;
export const analyticsService = new AnalyticsService();