/**
 * Structured Logger with Correlation IDs
 * Provides consistent logging across the application
 */

import pino from 'pino';

// Create base logger
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
            pid: bindings.pid,
            hostname: bindings.hostname,
            node_env: process.env.NODE_ENV,
        }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact sensitive fields
    redact: {
        paths: [
            'password',
            'passwordHash',
            'token',
            'apiKey',
            'secret',
            'authorization',
            'cookie',
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
        ],
        remove: true,
    },
    serializers: {
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            headers: {
                host: req.headers.host,
                'user-agent': req.headers['user-agent'],
            },
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
        err: pino.stdSerializers.err,
    },
});

/**
 * Create child logger with correlation ID
 */
export function createLogger(correlationId: string) {
    return logger.child({ correlationId });
}

/**
 * Log levels
 */
export const LogLevel = {
    TRACE: 'trace',
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal',
} as const;

/**
 * Log API request
 */
export function logRequest(
    correlationId: string,
    method: string,
    url: string,
    userId?: string
) {
    const log = createLogger(correlationId);
    log.info({
        type: 'request',
        method,
        url,
        userId,
    });
}

/**
 * Log API response
 */
export function logResponse(
    correlationId: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number
) {
    const log = createLogger(correlationId);
    log.info({
        type: 'response',
        method,
        url,
        statusCode,
        duration,
    });
}

/**
 * Log error
 */
export function logError(
    correlationId: string,
    error: Error,
    context?: Record<string, any>
) {
    const log = createLogger(correlationId);
    log.error({
        type: 'error',
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
        },
        ...context,
    });
}

/**
 * Log database query
 */
export function logDatabaseQuery(
    correlationId: string,
    operation: string,
    model: string,
    duration: number
) {
    const log = createLogger(correlationId);
    log.debug({
        type: 'database',
        operation,
        model,
        duration,
    });
}

/**
 * Log business event
 */
export function logBusinessEvent(
    correlationId: string,
    event: string,
    data?: Record<string, any>
) {
    const log = createLogger(correlationId);
    log.info({
        type: 'business_event',
        event,
        ...data,
    });
}

/**
 * Generate correlation ID
 */
export function generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Middleware to add correlation ID to requests
 */
export function withCorrelationId<T extends (...args: any[]) => any>(
    handler: T
): T {
    return (async (...args: any[]) => {
        const req = args[0];
        const correlationId =
            req?.headers?.get?.('x-correlation-id') || generateCorrelationId();

        // Add correlation ID to request
        if (req?.headers) {
            req.correlationId = correlationId;
        }

        logRequest(
            correlationId,
            req?.method || 'UNKNOWN',
            req?.url || 'UNKNOWN',
            req?.userId
        );

        const startTime = Date.now();

        try {
            const result = await handler(...args);
            const duration = Date.now() - startTime;

            logResponse(
                correlationId,
                req?.method || 'UNKNOWN',
                req?.url || 'UNKNOWN',
                result?.status || 200,
                duration
            );

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            logError(correlationId, error as Error, {
                method: req?.method,
                url: req?.url,
                duration,
            });
            throw error;
        }
    }) as T;
}
