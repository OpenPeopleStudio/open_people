/**
 * Structured Logging System
 *
 * Provides centralized logging with context, correlation IDs, and structured data.
 * Uses Pino for high-performance JSON logging in production.
 */

import pino from 'pino';
import { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  op?: boolean;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// Logger Configuration
// ═══════════════════════════════════════════════════════════════════════════

const isDevelopment = process.env.NODE_ENV === 'development';

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
      header: res.header,
    }),
  },
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// ═══════════════════════════════════════════════════════════════════════════
// Context Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AsyncLocalStorage for request context
 */
import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<LogContext>();

/**
 * Get current request context
 */
export function getRequestContext(): LogContext | undefined {
  return requestContext.getStore();
}

/**
 * Create a child logger with context
 */
export function createLogger(context: LogContext = {}) {
  const currentContext = getRequestContext();
  const mergedContext = { ...currentContext, ...context };

  return logger.child(mergedContext);
}

/**
 * Generate correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Logging Methods
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log HTTP requests with timing
 */
export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context: LogContext = {}
) {
  const childLogger = createLogger({
    method,
    url,
    statusCode,
    duration,
    ...context,
  });

  if (statusCode >= 500) {
    childLogger.error('Request failed');
  } else if (statusCode >= 400) {
    childLogger.warn('Request error');
  } else if (duration > 1000) {
    childLogger.warn('Slow request');
  } else {
    childLogger.info('Request completed');
  }
}

/**
 * Log authentication events
 */
export function logAuth(
  action: 'login' | 'logout' | 'token_refresh' | 'failed_login' | 'session_created' | 'session_expired',
  success: boolean,
  context: LogContext = {}
) {
  const childLogger = createLogger({
    event: 'auth',
    action,
    success,
    ...context,
  });

  if (success) {
    childLogger.info(`Authentication: ${action}`);
  } else {
    childLogger.warn(`Authentication failed: ${action}`);
  }
}

/**
 * Log authorization events
 */
export function logAuthZ(
  action: 'permission_check' | 'role_check' | 'tenant_check' | 'ownership_check',
  success: boolean,
  context: LogContext = {}
) {
  const childLogger = createLogger({
    event: 'authorization',
    action,
    success,
    ...context,
  });

  if (success) {
    childLogger.debug(`Authorization: ${action}`);
  } else {
    childLogger.warn(`Authorization denied: ${action}`);
  }
}

/**
 * Log security events
 */
export function logSecurity(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: LogContext = {}
) {
  const childLogger = createLogger({
    event: 'security',
    security_event: event,
    severity,
    ...context,
  });

  switch (severity) {
    case 'critical':
      childLogger.fatal(`Security event: ${event}`);
      break;
    case 'high':
      childLogger.error(`Security event: ${event}`);
      break;
    case 'medium':
      childLogger.warn(`Security event: ${event}`);
      break;
    default:
      childLogger.info(`Security event: ${event}`);
  }
}

/**
 * Log vault operations
 */
export function logVault(
  operation: string,
  success: boolean,
  context: LogContext = {}
) {
  const childLogger = createLogger({
    event: 'vault',
    operation,
    success,
    ...context,
  });

  if (success) {
    childLogger.info(`Vault operation: ${operation}`);
  } else {
    childLogger.error(`Vault operation failed: ${operation}`);
  }
}

/**
 * Log API calls
 */
export function logApi(
  service: string,
  operation: string,
  success: boolean,
  context: LogContext = {}
) {
  const childLogger = createLogger({
    event: 'api',
    service,
    operation,
    success,
    ...context,
  });

  if (success) {
    childLogger.debug(`API call: ${service}.${operation}`);
  } else {
    childLogger.warn(`API call failed: ${service}.${operation}`);
  }
}

/**
 * Log performance metrics
 */
export function logPerformance(
  metric: string,
  value: number,
  unit: string = 'ms',
  context: LogContext = {}
) {
  const childLogger = createLogger({
    event: 'performance',
    metric,
    value,
    unit,
    ...context,
  });

  if (value > 1000) {
    childLogger.warn(`Performance: ${metric} = ${value}${unit}`);
  } else {
    childLogger.debug(`Performance: ${metric} = ${value}${unit}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Middleware Integration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create request context middleware
 */
export function withRequestContext(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const correlationId = generateCorrelationId();
    const userAgent = request.headers.get('user-agent');

    // Extract context from request
    const context: LogContext = {
      op: true,
      correlationId,
      requestId: correlationId,
      method: request.method,
      url: request.url,
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      ...(userAgent ? { userAgent } : {}),
    };

    // Run handler with context
    const result = await requestContext.run(context, () => handler(request, ...args));

    return result;
  };
}

/**
 * Add user/tenant context to existing request
 */
export function setRequestContext(updates: Partial<LogContext>) {
  const current = getRequestContext();
  if (current) {
    Object.assign(current, updates);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Export logger instance for direct use
// ═══════════════════════════════════════════════════════════════════════════

export { logger };
export default logger;
