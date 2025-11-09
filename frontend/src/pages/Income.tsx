import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Select } from '../components/Select'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate } from '../lib/utils'

const incomeCategories = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'business', label: 'Business' },
  { value: 'investment', label: 'Investment Income' },
  { value: 'rental', label: 'Rental Income' },
  { value: 'other', label: 'Other' },
]

export default function Income() {
  const { transactions, addTransaction, deleteTransaction, fetchTransactions } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    category: 'salary',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    source: '',
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  const incomeTransactions = useMemo(
    () => transactions.filter(t => t.type === 'income').sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [transactions]
  )

  const totalIncome = useMemo(
    () => incomeTransactions.reduce((sum, t) => sum + t.amount, 0),
    [incomeTransactions]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addTransaction({
      type: 'income',
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description || '',
      date: formData.date,
      source: formData.source || '',
    })
    setFormData({
      category: 'salary',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      source: '',
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Income
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Track all your revenue sources
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gradient-green hover:opacity-90 text-white shadow-lg">
          <Plus size={20} className="mr-2" />
          Add Income
        </Button>
      </motion.div>

      {/* Total Income Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 pointer-events-none"></div>
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Income</p>
            <motion.h2 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-5xl font-bold mt-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
            >
              {formatCurrency(totalIncome)}
            </motion.h2>
          </div>
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="p-5 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 glow-green"
          >
            <TrendingUp className="text-green-500" size={36} />
          </motion.div>
        </div>
      </Card>

      {/* Add Income Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <h3 className="text-lg font-semibold mb-4">Add New Income</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Category"
                  options={incomeCategories}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                <Input
                  label="Source"
                  placeholder="e.g., Company name, Client name"
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                />
                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Description (Optional)"
                placeholder="Brief description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Income</Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Income List */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Recent Income</h3>
        <div className="space-y-3">
          {incomeTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No income recorded yet. Add your first income entry!
            </p>
          ) : (
            incomeTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <TrendingUp className="text-success" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">{transaction.description}</h4>
                      <p className="text-sm text-muted-foreground">
                        {transaction.source && `${transaction.source} • `}
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-success">
                    +{formatCurrency(transaction.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTransaction(transaction.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

