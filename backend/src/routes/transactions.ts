import express from 'express'
import { db, generateId } from '../database.js'
import { categorizeExpense } from '../ai-categorization.js'
import { validateTransaction, validateTransactionUpdate, validateId } from '../middleware/validation.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { logger } from '../logger.js'

const router = express.Router()

// Get all transactions with pagination
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100) // Max 100
  const offset = (page - 1) * limit
  const type = req.query.type as string
  
  // Build query with optional filtering
  let query = 'SELECT * FROM transactions'
  let countQuery = 'SELECT COUNT(*) as total FROM transactions'
  const params: any[] = []
  
  if (type && (type === 'income' || type === 'expense')) {
    query += ' WHERE type = ?'
    countQuery += ' WHERE type = ?'
    params.push(type)
  }
  
  query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?'
  
  const transactions = db.prepare(query).all(...params, limit, offset)
  const { total } = db.prepare(countQuery).get(...params) as { total: number }
  
  logger.info('Fetched transactions', {
    page,
    limit,
    total,
    type: type || 'all',
  })
  
  res.json({
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}))

// Get transaction by ID
router.get('/:id', validateId, asyncHandler(async (req, res) => {
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id)
  
  if (!transaction) {
    throw new AppError(404, 'Transaction not found')
  }
  
  res.json(transaction)
}))

// Create transaction
router.post('/', validateTransaction, asyncHandler(async (req, res) => {
  const { type, category, amount, description, date, source } = req.body

  // AI-powered categorization for expenses
  let finalCategory = category
  if (type === 'expense' && (!category || category === 'other') && description) {
    finalCategory = categorizeExpense(description)
    logger.info('AI categorization applied', {
      description,
      suggestedCategory: finalCategory,
    })
  } else if (!finalCategory) {
    finalCategory = 'other'
  }

  const id = generateId()
  const stmt = db.prepare(`
    INSERT INTO transactions (id, type, category, amount, description, date, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, type, finalCategory, amount, description || '', date, source || null)

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
  
  logger.info('Transaction created', { id, type, amount })
  
  res.status(201).json(transaction)
}))

// Update transaction
router.patch('/:id', validateTransactionUpdate, asyncHandler(async (req, res) => {
  const { category, amount, description, date, source } = req.body
  const updates: string[] = []
  const values: (string | number)[] = []

  if (category !== undefined) {
    updates.push('category = ?')
    values.push(category)
  }
  if (amount !== undefined) {
    updates.push('amount = ?')
    values.push(amount)
  }
  if (description !== undefined) {
    updates.push('description = ?')
    values.push(description)
  }
  if (date !== undefined) {
    updates.push('date = ?')
    values.push(date)
  }
  if (source !== undefined) {
    updates.push('source = ?')
    values.push(source)
  }

  if (updates.length === 0) {
    throw new AppError(400, 'No fields to update')
  }

  values.push(req.params.id)
  const stmt = db.prepare(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`)
  const result = stmt.run(...values)
  
  if (result.changes === 0) {
    throw new AppError(404, 'Transaction not found')
  }

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id)
  
  logger.info('Transaction updated', { id: req.params.id })
  
  res.json(transaction)
}))

// Delete transaction
router.delete('/:id', validateId, asyncHandler(async (req, res) => {
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?')
  const result = stmt.run(req.params.id)

  if (result.changes === 0) {
    throw new AppError(404, 'Transaction not found')
  }

  logger.info('Transaction deleted', { id: req.params.id })

  res.json({ message: 'Transaction deleted successfully' })
}))

// Get transaction statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  
  let query = `
    SELECT 
      type,
      category,
      SUM(amount) as total,
      COUNT(*) as count,
      AVG(amount) as average
    FROM transactions
  `
  
  const params: string[] = []
  
  if (startDate && endDate) {
    query += ' WHERE date BETWEEN ? AND ?'
    params.push(startDate as string, endDate as string)
  }
  
  query += ' GROUP BY type, category ORDER BY total DESC'
  
  const stats = db.prepare(query).all(...params)
  
  res.json({ data: stats })
}))

export default router

