import { body, param, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { logger } from '../logger.js'

// Middleware to handle validation errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', { errors: errors.array(), path: req.path })
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    })
  }
  next()
}

// Transaction validation rules
export const validateTransaction = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Amount must be a positive number between 0.01 and 999999999'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must be less than 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value)
      const now = new Date()
      const maxFutureDate = new Date()
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1)
      
      if (date > maxFutureDate) {
        throw new Error('Date cannot be more than 1 year in the future')
      }
      return true
    }),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Source must be less than 100 characters'),
  handleValidationErrors,
]

// Transaction update validation rules
export const validateTransactionUpdate = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Transaction ID is required'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Amount must be a positive number between 0.01 and 999999999'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Source must be less than 100 characters'),
  handleValidationErrors,
]

// Goal validation rules
export const validateGoal = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('targetAmount')
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Target amount must be a positive number between 0.01 and 999999999'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0, max: 999999999 })
    .withMessage('Current amount must be a non-negative number less than 999999999')
    .custom((value, { req }) => {
      if (value !== undefined && value > req.body.targetAmount) {
        throw new Error('Current amount cannot exceed target amount')
      }
      return true
    }),
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date')
    .custom((value) => {
      const deadline = new Date(value)
      const now = new Date()
      if (deadline < now) {
        throw new Error('Deadline cannot be in the past')
      }
      return true
    }),
  body('color')
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #10b981)'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  handleValidationErrors,
]

// Goal update validation rules
export const validateGoalUpdate = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Goal ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('targetAmount')
    .optional()
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Target amount must be a positive number'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0, max: 999999999 })
    .withMessage('Current amount must be a non-negative number'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  handleValidationErrors,
]

// ID parameter validation
export const validateId = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('ID is required'),
  handleValidationErrors,
]

