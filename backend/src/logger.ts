import winston from 'winston'
import { config } from './config.js'

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = ''
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2)
    }
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: { service: 'finance-tracker-api' },
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Write error logs to file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
    }),
  ],
})

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs'
import { dirname } from 'path'

try {
  mkdirSync(dirname('logs/error.log'), { recursive: true })
} catch (error) {
  console.error('Failed to create logs directory:', error)
}

