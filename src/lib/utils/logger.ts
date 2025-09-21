import pino from 'pino'
import { env } from '../config/env'

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: env.NODE_ENV === 'development',
    translateTime: 'yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname',
  },
})

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: {
      env: env.NODE_ENV,
    },
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
  },
  env.NODE_ENV === 'development' ? transport : undefined
)

// Request logger middleware
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now()
    const correlationId =
      req.headers['x-correlation-id'] ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    req.log = logger.child({ correlationId })
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
