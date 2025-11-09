import express from 'express'
import { db, generateId } from '../database.js'
import { validateGoal, validateGoalUpdate, validateId } from '../middleware/validation.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { logger } from '../logger.js'

const router = express.Router()

// Helper function to transform goal from DB format to API format
const transformGoal = (goal: any) => ({
  id: goal.id,
  name: goal.name,
  targetAmount: goal.target_amount,
  currentAmount: goal.current_amount,
  deadline: goal.deadline,
  color: goal.color,
  notes: goal.notes || '',
  created_at: goal.created_at,
  updated_at: goal.updated_at,
})

// Get all goals
router.get('/', asyncHandler(async (req, res) => {
  const goals = db.prepare('SELECT * FROM goals ORDER BY deadline ASC').all()
  
  // Transform snake_case to camelCase for frontend
  const transformedGoals = (goals as any[]).map(transformGoal)
  
  logger.info('Fetched goals', { count: transformedGoals.length })
  
  res.json(transformedGoals)
}))

// Get goal by ID
router.get('/:id', validateId, asyncHandler(async (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id)
  
  if (!goal) {
    throw new AppError(404, 'Goal not found')
  }
  
  res.json(transformGoal(goal))
}))

// Create goal
router.post('/', validateGoal, asyncHandler(async (req, res) => {
  const { name, targetAmount, currentAmount, deadline, color, notes } = req.body

  const id = generateId()
  const stmt = db.prepare(`
    INSERT INTO goals (id, name, target_amount, current_amount, deadline, color, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, name, targetAmount, currentAmount || 0, deadline, color, notes || '')

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id)
  
  logger.info('Goal created', { id, name, targetAmount })
  
  res.status(201).json(transformGoal(goal))
}))

// Update goal
router.patch('/:id', validateGoalUpdate, asyncHandler(async (req, res) => {
  const { name, targetAmount, currentAmount, deadline, color, notes } = req.body
  const updates: string[] = []
  const values: (string | number)[] = []

  if (name !== undefined) {
    updates.push('name = ?')
    values.push(name)
  }
  if (targetAmount !== undefined) {
    updates.push('target_amount = ?')
    values.push(targetAmount)
  }
  if (currentAmount !== undefined) {
    updates.push('current_amount = ?')
    values.push(currentAmount)
  }
  if (deadline !== undefined) {
    updates.push('deadline = ?')
    values.push(deadline)
  }
  if (color !== undefined) {
    updates.push('color = ?')
    values.push(color)
  }
  if (notes !== undefined) {
    updates.push('notes = ?')
    values.push(notes)
  }

  if (updates.length === 0) {
    throw new AppError(400, 'No fields to update')
  }

  values.push(req.params.id)
  const stmt = db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`)
  const result = stmt.run(...values)
  
  if (result.changes === 0) {
    throw new AppError(404, 'Goal not found')
  }

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id)
  
  logger.info('Goal updated', { id: req.params.id })
  
  res.json(transformGoal(goal))
}))

// Delete goal
router.delete('/:id', validateId, asyncHandler(async (req, res) => {
  const stmt = db.prepare('DELETE FROM goals WHERE id = ?')
  const result = stmt.run(req.params.id)

  if (result.changes === 0) {
    throw new AppError(404, 'Goal not found')
  }

  logger.info('Goal deleted', { id: req.params.id })

  res.json({ message: 'Goal deleted successfully' })
}))

export default router


