/**
 * Performance Monitoring System
 *
 * Tracks response times, database queries, API calls, and other performance metrics.
 * Integrates with logging and can send metrics to external monitoring systems.
 */

import { logPerformance, createLogger } from './logger';

// ═══════════════════════════════════════════════════════════════════════════
// Performance Metrics Types
// ═══════════════════════════════════════════════════════════════════════════

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface DatabaseMetrics {
  queryCount: number;
  totalQueryTime: number;
  slowQueries: number;
  connectionPoolSize: number;
  activeConnections: number;
}

export interface APIMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Performance Monitoring Class
// ═══════════════════════════════════════════════════════════════════════════

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTimes: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(operation: string, tags?: Record<string, string>): string {
    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.startTimes.set(timerId, Date.now());

    const logger = createLogger({ operation, ...tags });
    logger.debug(`Started timing: ${operation}`);

    return timerId;
  }

  /**
   * End timing an operation and record the metric
   */
  endTimer(timerId: string, tags?: Record<string, string>): number {
    const startTime = this.startTimes.get(timerId);
    if (!startTime) {
      console.warn(`Timer not found: ${timerId}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(timerId);

    const operation = timerId.split('_')[0];
    this.recordMetric(operation, duration, 'ms', tags);

    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' | 'percentage',
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      ...(tags ? { tags } : {}),
    };

    this.metrics.push(metric);
    logPerformance(name, value, unit, tags);

    // In production, you might want to send this to a metrics collection service
    // like DataDog, New Relic, or CloudWatch
    if (process.env.NODE_ENV === 'production') {
      this.sendToMetricsService(metric);
    }
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);

    this.recordMetric(name, current + value, 'count', tags);
  }

  /**
   * Record API performance
   */
  recordAPI(apiMetrics: APIMetrics): void {
    const tags = {
      endpoint: apiMetrics.endpoint,
      method: apiMetrics.method,
      status_code: apiMetrics.statusCode.toString(),
    };

    this.recordMetric('api_response_time', apiMetrics.responseTime, 'ms', tags);
    this.recordMetric('api_request_size', apiMetrics.requestSize, 'bytes', tags);
    this.recordMetric('api_response_size', apiMetrics.responseSize, 'bytes', tags);

    // Track status code distribution
    this.incrementCounter(`api_status_${Math.floor(apiMetrics.statusCode / 100)}xx`, 1, tags);
  }

  /**
   * Record database performance
   */
  recordDatabase(metrics: Partial<DatabaseMetrics>): void {
    if (metrics.queryCount !== undefined) {
      this.recordMetric('db_queries_total', metrics.queryCount, 'count');
    }
    if (metrics.totalQueryTime !== undefined) {
      this.recordMetric('db_query_time_total', metrics.totalQueryTime, 'ms');
    }
    if (metrics.slowQueries !== undefined) {
      this.recordMetric('db_slow_queries', metrics.slowQueries, 'count');
    }
    if (metrics.connectionPoolSize !== undefined) {
      this.recordMetric('db_connection_pool_size', metrics.connectionPoolSize, 'count');
    }
    if (metrics.activeConnections !== undefined) {
      this.recordMetric('db_active_connections', metrics.activeConnections, 'count');
    }
  }

  /**
   * Record cache performance
   */
  recordCache(metrics: Partial<CacheMetrics>): void {
    if (metrics.hits !== undefined) {
      this.recordMetric('cache_hits', metrics.hits, 'count');
    }
    if (metrics.misses !== undefined) {
      this.recordMetric('cache_misses', metrics.misses, 'count');
    }
    if (metrics.hitRate !== undefined) {
      this.recordMetric('cache_hit_rate', metrics.hitRate, 'percentage');
    }
    if (metrics.evictions !== undefined) {
      this.recordMetric('cache_evictions', metrics.evictions, 'count');
    }
  }

  /**
   * Get current metrics (for debugging/monitoring)
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics (useful for testing or periodic cleanup)
   */
  clearMetrics(): void {
    this.metrics = [];
    this.counters.clear();
  }

  /**
   * Send metric to external monitoring service
   * Override this method to integrate with your monitoring system
   */
  private sendToMetricsService(metric: PerformanceMetric): void {
    // Example implementations:

    // DataDog
    // const dogStatsD = require('hot-shots');
    // const client = new dogStatsD({ host: 'localhost', port: 8125 });
    // client.histogram(metric.name, metric.value, { tags: Object.entries(metric.tags || {}) });

    // New Relic
    // const newrelic = require('newrelic');
    // newrelic.recordMetric(metric.name, metric.value);

    // CloudWatch (via AWS SDK)
    // const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
    // const client = new CloudWatchClient({});
    // const command = new PutMetricDataCommand({ ... });

    console.debug(`[Metrics] ${metric.name}: ${metric.value}${metric.unit}`, metric.tags);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Global Performance Monitor Instance
// ═══════════════════════════════════════════════════════════════════════════

export const performanceMonitor = new PerformanceMonitor();

// ═══════════════════════════════════════════════════════════════════════════
// Performance Monitoring Hooks/Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Measure execution time of an async function
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const timerId = performanceMonitor.startTimer(operation, tags);
  try {
    const result = await fn();
    performanceMonitor.endTimer(timerId, { success: 'true', ...tags });
    return result;
  } catch (error) {
    performanceMonitor.endTimer(timerId, { success: 'false', error: (error as Error).message, ...tags });
    throw error;
  }
}

/**
 * Measure execution time of a sync function
 */
export function measureSync<T>(
  operation: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  const timerId = performanceMonitor.startTimer(operation, tags);
  try {
    const result = fn();
    performanceMonitor.endTimer(timerId, { success: 'true', ...tags });
    return result;
  } catch (error) {
    performanceMonitor.endTimer(timerId, { success: 'false', error: (error as Error).message, ...tags });
    throw error;
  }
}

/**
 * Create a performance monitoring wrapper for database operations
 */
export function withDatabaseMonitoring<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    void operation;
    const startTime = Date.now();
    const queryCount = 0;

    // This is a simplified example - in reality you'd need to instrument
    // the database client to count actual queries
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      performanceMonitor.recordDatabase({
        queryCount,
        totalQueryTime: duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      performanceMonitor.recordDatabase({
        queryCount,
        totalQueryTime: duration,
      });

      throw error;
    }
  };
}

/**
 * Create a performance monitoring wrapper for API calls
 */
export function withAPIMonitoring<T extends unknown[], R>(
  endpoint: string,
  method: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      // This is a simplified example - you'd need to extract actual request/response sizes
      performanceMonitor.recordAPI({
        endpoint,
        method,
        responseTime: duration,
        statusCode: 200, // Assume success, adjust based on actual response
        requestSize: 0,
        responseSize: 0,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      performanceMonitor.recordAPI({
        endpoint,
        method,
        responseTime: duration,
        statusCode: 500, // Assume server error
        requestSize: 0,
        responseSize: 0,
      });

      throw error;
    }
  };
}
