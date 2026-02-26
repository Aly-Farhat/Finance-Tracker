import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config.js'
import { logger } from './logger.js'
import { initDatabase, backupDatabase } from './database.js'
import transactionsRouter from './routes/transactions.js'
import goalsRouter from './routes/goals.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow frontend to load
}))

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, Electron, etc.)
    if (!origin) return callback(null, true)
    
    // Allow file:// protocol for Electron
    if (origin && origin.startsWith('file://')) return callback(null, true)
    
    if (config.allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      logger.warn('CORS blocked request', { origin })
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip,
      path: req.path,
    })
    res.status(429).json({
      error: 'Too many requests, please try again later.',
    })
  },
})

app.use('/api', limiter)

// Body parser middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  })
  next()
})

// Initialize database
try {
  initDatabase()
} catch (error) {
  logger.error('Failed to initialize database', { error })
  process.exit(1)
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Finance Tracker API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Backup endpoint (for admin use)
app.post('/api/backup', (req, res) => {
  const token = req.get('x-backup-token')

  if (config.backupToken && token !== config.backupToken) {
    logger.warn('Unauthorized backup attempt', {
      ip: req.ip,
      path: req.path,
    })

    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized',
    })
  }

  if (!config.backupToken && config.nodeEnv === 'production') {
    logger.error('Backup endpoint misconfigured: BACKUP_TOKEN is required in production')

    return res.status(503).json({
      status: 'error',
      message: 'Backup endpoint is not configured',
    })
  }

  try {
    const backupPath = backupDatabase()
    res.json({
      status: 'success',
      message: 'Database backup created',
      path: backupPath,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create backup',
    })
  }
})

// API Routes
app.use('/api/transactions', transactionsRouter)
app.use('/api/goals', goalsRouter)

// 404 handler
app.use(notFoundHandler)

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
const server = app.listen(config.port, () => {
  logger.info('Server started', {
    port: config.port,
    environment: config.nodeEnv,
    allowedOrigins: config.allowedOrigins,
  })
  console.log(`🚀 Server running on http://localhost:${config.port}`)
  console.log(`📊 Finance Tracker API ready!`)
  console.log(`📝 Logs available in logs/ directory`)
})

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server gracefully...')
  
  server.close(() => {
    logger.info('Server closed successfully')
    process.exit(0)
  })
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

export default app

