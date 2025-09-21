import { z } from 'zod'

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  DIRECT_URL: z.string().optional(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Redis
  REDIS_URL: z.string().min(1, 'Redis URL is required'),
  
  // Email
  SENDGRID_API_KEY: z.string().min(1, 'SendGrid API key is required'),
  FROM_EMAIL: z.string().email('Invalid from email address'),
  
  // File Storage
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  
  // External APIs
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Monitoring
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  SENTRY_DSN: z.string().optional(),
})

function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

export const env = validateEnv()

export type Env = z.infer<typeof envSchema>
