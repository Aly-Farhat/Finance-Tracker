import { Request, Response, NextFunction } from 'express'
import { logger } from '../logger.js'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  // Handle operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    })
  }

  // Handle database errors
  if (err.message.includes('SQLITE')) {
    return res.status(500).json({
      status: 'error',
      message: 'Database error occurred',
    })
  }

  // Handle validation errors
  if (err.message.includes('Validation')) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    })
  }

  // Default error response
  return res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
  })
}

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  })
}

