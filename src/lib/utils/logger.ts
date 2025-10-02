// Simple console logger to avoid worker thread issues in development
export const logger = {
  trace: (obj: any, msg?: string) => console.log('[TRACE]', msg || obj, typeof obj === 'object' ? obj : ''),
  debug: (obj: any, msg?: string) => console.log('[DEBUG]', msg || obj, typeof obj === 'object' ? obj : ''),
  info: (obj: any, msg?: string) => console.log('[INFO]', msg || obj, typeof obj === 'object' ? obj : ''),
  warn: (obj: any, msg?: string) => console.warn('[WARN]', msg || obj, typeof obj === 'object' ? obj : ''),
  error: (obj: any, msg?: string) => console.error('[ERROR]', msg || obj, typeof obj === 'object' ? obj : ''),
  child: (obj: any) => logger, // Return same logger for child calls
}

// Request logger middleware
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now()
    const correlationId =
      req.headers['x-correlation-id'] ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    req.log = logger
    req.correlationId = correlationId

    res.setHeader('X-Correlation-ID', correlationId)

    res.on('finish', () => {
      const duration = Date.now() - start
      req.log.info(
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        },
        'Request completed'
      )
    })

    next()
  }
}
