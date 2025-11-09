import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Target, AlertTriangle, Database, StickyNote, X, Edit2, Check } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { ErrorAlert } from '../components/ErrorAlert'
import { Loading } from '../components/Loading'
import { useStore } from '../store/useStore'
import { formatDate, formatCompactCurrency } from '../lib/utils'

const goalColors = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // orange
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

export default function Settings() {
  const { 
    goals, 
    transactions, 
    addGoal, 
    updateGoal, 
    deleteGoal, 
    deleteTransaction, 
    fetchGoals, 
    fetchTransactions,
    loading,
    error,
    clearError,
  } = useStore()
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    color: goalColors[0],
    notes: '',
  })
  const [expandedNotes, setExpandedNotes] = useState<{ [key: string]: boolean }>({})
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchGoals()
    fetchTransactions()
  }, [])

  const handleSaveNotes = async (goalId: string | number | undefined, notes: string) => {
    if (!goalId) return
    
    try {
      await updateGoal(goalId, undefined, notes)
      setEditingNotes({ ...editingNotes, [goalId]: '' })
      await fetchGoals()
    } catch (error) {
      console.error('Failed to update notes:', error)
    }
  }

  const handleResetData = async () => {
    if (resetConfirmText !== 'DELETE ALL DATA') {
      return
    }
    
    try {
      // Delete all transactions
      for (const transaction of transactions) {
        await deleteTransaction(transaction.id)
      }
      
      // Delete all goals
      for (const goal of goals) {
        await deleteGoal(goal.id)
      }
      
      // Refresh data
      await fetchTransactions()
      await fetchGoals()
      
      setShowResetConfirm(false)
      setResetConfirmText('')
      alert('All data has been cleared successfully')
    } catch (error) {
      console.error('Error clearing data:', error)
      alert('Error clearing data. Please try again.')
    }
  }

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    clearError()
    
    try {
      // Ensure currentAmount defaults to 0 if empty
      const currentAmount = goalForm.currentAmount ? parseFloat(goalForm.currentAmount) : 0
      const targetAmount = parseFloat(goalForm.targetAmount)
      
      // Client-side validation
      if (!goalForm.name.trim()) {
        throw new Error('Goal name is required')
      }
      if (isNaN(targetAmount) || targetAmount <= 0) {
        throw new Error('Target amount must be greater than 0')
      }
      if (isNaN(currentAmount) || currentAmount < 0) {
        throw new Error('Current amount must be 0 or greater')
      }
      if (currentAmount > targetAmount) {
        throw new Error('Current amount cannot exceed target amount')
      }
      if (!goalForm.deadline) {
        throw new Error('Deadline is required')
      }
      
      // Check deadline is in the future
      const deadlineDate = new Date(goalForm.deadline)
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Reset time for date comparison
      if (deadlineDate < now) {
        throw new Error('Deadline must be in the future')
      }
      
      await addGoal({
        name: goalForm.name.trim(),
        targetAmount,
        currentAmount,
        deadline: goalForm.deadline,
        color: goalForm.color,
        notes: goalForm.notes.trim(),
      })
      
      // Reset form and close on success
      setGoalForm({
        name: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        color: goalColors[0],
        notes: '',
      })
      setShowGoalForm(false)
      
      // Refresh goals list
      await fetchGoals()
    } catch (error) {
      console.error('Failed to create goal:', error)
      // Error is already set in store, just keep form open
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">
          Manage your financial goals and preferences
        </p>
      </motion.div>

      {/* Financial Goals Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Financial Goals</h2>
          <Button onClick={() => {
            setShowGoalForm(!showGoalForm)
            if (!showGoalForm) {
              clearError()
            }
          }}>
            <Plus size={20} className="mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Error Display */}
        {error.goals && (
          <ErrorAlert 
            message={error.goals} 
            onClose={clearError}
            onRetry={() => {
              clearError()
              fetchGoals()
            }}
          />
        )}

        {/* Add Goal Form */}
        {showGoalForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold mb-4">Create New Goal</h3>
              
              {isSubmitting && (
                <div className="mb-4">
                  <Loading size="sm" text="Creating goal..." />
                </div>
              )}
              
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <Input
                  label="Goal Name"
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  value={goalForm.name}
                  onChange={e => setGoalForm({ ...goalForm, name: e.target.value })}
                  required
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Target Amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999999999"
                    placeholder="0.00"
                    value={goalForm.targetAmount}
                    onChange={e => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                    required
                  />
                  <Input
                    label="Current Amount (Optional)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={goalForm.currentAmount}
                    onChange={e => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                  />
                  <Input
                    label="Deadline"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={goalForm.deadline}
                    onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })}
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex gap-2">
                      {goalColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setGoalForm({ ...goalForm, color })}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            goalForm.color === color ? 'border-foreground scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <StickyNote size={16} />
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add notes on how to achieve this goal or save for it..."
                    value={goalForm.notes}
                    onChange={e => setGoalForm({ ...goalForm, notes: e.target.value })}
                    maxLength={1000}
                    className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {goalForm.notes.length}/1000 characters
                  </p>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                      setShowGoalForm(false)
                      clearError()
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Goal'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Goals List */}
        {loading.goals ? (
          <Card>
            <Loading text="Loading goals..." />
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {goals.length === 0 ? (
              <Card className="md:col-span-2">
                <p className="text-muted-foreground text-center py-8">
                  No goals set yet. Create your first financial goal!
                </p>
              </Card>
            ) : (
            goals.map(goal => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              const daysRemaining = Math.ceil(
                (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: `${goal.color}20` }}
                        >
                          <Target size={24} style={{ color: goal.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{goal.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Due: {formatDate(goal.deadline)} ({daysRemaining} days)
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{formatCompactCurrency(goal.currentAmount)}</span>
                        <span className="text-muted-foreground">
                          of {formatCompactCurrency(goal.targetAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Update current amount"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement
                            const newAmount = parseFloat(input.value)
                            if (!isNaN(newAmount)) {
                              await updateGoal(goal.id, newAmount)
                              input.value = ''
                            }
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Press Enter to update amount
                      </p>
                    </div>

                    {/* Notes Section */}
                    <div className="mt-4 pt-4 border-t border-border">
                      {editingNotes[goal.id!] !== undefined ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <StickyNote size={16} />
                              Edit Notes
                            </label>
                            <button
                              onClick={() => {
                                const newState = { ...editingNotes }
                                delete newState[goal.id!]
                                setEditingNotes(newState)
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                          <textarea
                            value={editingNotes[goal.id!]}
                            onChange={(e) => setEditingNotes({ ...editingNotes, [goal.id!]: e.target.value })}
                            placeholder="Add notes on how to achieve this goal..."
                            maxLength={1000}
                            className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={3}
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {editingNotes[goal.id!].length}/1000 characters
                            </p>
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(goal.id, editingNotes[goal.id!])}
                            >
                              <Check size={16} className="mr-1" />
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          {goal.notes ? (
                            <div>
                              <button
                                onClick={() => setExpandedNotes({ ...expandedNotes, [goal.id!]: !expandedNotes[goal.id!] })}
                                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                              >
                                <StickyNote size={16} />
                                <span>Notes</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingNotes({ ...editingNotes, [goal.id!]: goal.notes || '' })
                                  }}
                                  className="ml-auto mr-2 p-1 hover:bg-secondary rounded"
                                  title="Edit notes"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <motion.div
                                  animate={{ rotate: expandedNotes[goal.id!] ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <X size={16} className={expandedNotes[goal.id!] ? '' : 'rotate-45'} />
                                </motion.div>
                              </button>
                              
                              <AnimatePresence>
                                {expandedNotes[goal.id!] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 p-3 bg-secondary/30 rounded-lg text-sm whitespace-pre-wrap">
                                      {goal.notes}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            // No notes yet - show add button
                            <button
                              onClick={() => setEditingNotes({ ...editingNotes, [goal.id!]: '' })}
                              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                            >
                              <Plus size={16} />
                              <span>Add Notes</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })
            )}
          </div>
        )}
      </div>

      {/* Data Management */}
      <Card className="border-destructive/20">
        <div className="flex items-center gap-3 mb-4">
          <Database size={24} className="text-destructive" />
          <h2 className="text-2xl font-semibold">Data Management</h2>
        </div>
        
        <div className="space-y-4">
          {/* Database Statistics */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Database Statistics</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Financial Goals</p>
                <p className="text-2xl font-bold">{goals.length}</p>
              </div>
            </div>
          </div>

          {/* Reset Warning */}
          {!showResetConfirm ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-destructive mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive mb-1">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Clear all transactions and goals from your database. This action cannot be undone.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowResetConfirm(true)}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-destructive/10 border-2 border-destructive rounded-lg p-4"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="text-destructive mt-0.5" size={24} />
                <div>
                  <h3 className="font-bold text-destructive text-lg">⚠️ Confirm Data Deletion</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You are about to delete <strong>{transactions.length} transactions</strong> and <strong>{goals.length} goals</strong>.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  Type <span className="bg-destructive text-white px-2 py-0.5 rounded font-mono">DELETE ALL DATA</span> to confirm:
                </p>
                <Input
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Type here to confirm..."
                  className="border-destructive/50 focus:border-destructive"
                />
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowResetConfirm(false)
                      setResetConfirmText('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleResetData}
                    disabled={resetConfirmText !== 'DELETE ALL DATA'}
                    className="bg-destructive hover:bg-destructive/90 text-white"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Permanently Delete All Data
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* App Info */}
      <Card>
        <h2 className="text-2xl font-semibold mb-4">About</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold">Finance Tracker v1.0.0</p>
          <p>A luxurious personal financial management application</p>
          <p className="pt-2 text-xs">
            Track your income, expenses, and achieve your financial goals with beautiful analytics and premium design.
          </p>
        </div>
      </Card>
    </div>
  )
}

