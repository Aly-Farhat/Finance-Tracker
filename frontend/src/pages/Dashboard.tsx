import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  ArrowRight,
  Calendar,
  ShoppingCart,
} from 'lucide-react'
import { Card, StatCard } from '../components/Card'
import { useStore } from '../store/useStore'
import { formatCurrency, formatPercentage, formatCompactCurrency, formatAxisNumber, formatDate } from '../lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Dashboard() {
  const { transactions, goals, fetchTransactions, fetchGoals } = useStore()

  useEffect(() => {
    fetchTransactions()
    fetchGoals()
  }, [])

  const stats = useMemo(() => {
    console.log('Recalculating stats with', transactions.length, 'transactions')
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Get previous month and year
    let prevMonth = currentMonth - 1
    let prevYear = currentYear
    if (prevMonth < 0) {
      prevMonth = 11
      prevYear = currentYear - 1
    }

    // Current month transactions
    const thisMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    // Previous month transactions
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear
    })

    // Current month stats
    const totalRevenue = thisMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const netIncome = totalRevenue - totalExpenses
    const savingRate = totalRevenue > 0 ? netIncome / totalRevenue : 0

    // Previous month stats
    const prevRevenue = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const prevExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const prevNetIncome = prevRevenue - prevExpenses
    const prevSavingRate = prevRevenue > 0 ? prevNetIncome / prevRevenue : 0

    // Calculate percentage changes
    const revenueChange = prevRevenue > 0 
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0
    
    const expensesChange = prevExpenses > 0 
      ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 
      : totalExpenses > 0 ? 100 : 0
    
    const netIncomeChange = prevNetIncome !== 0 
      ? ((netIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100 
      : netIncome !== 0 ? 100 : 0
    
    // Show percentage point change (not relative change) for clarity
    // e.g., 20% -> 25% shows as +5.0 pts (not +25%)
    const savingRateChange = (savingRate - prevSavingRate) * 100

    console.log('Stats:', { 
      current: { totalRevenue, totalExpenses, netIncome, savingRate },
      previous: { prevRevenue, prevExpenses, prevNetIncome, prevSavingRate },
      changes: { revenueChange, expensesChange, netIncomeChange, savingRateChange }
    })

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      savingRate,
      revenueChange,
      expensesChange,
      netIncomeChange,
      savingRateChange,
    }
  }, [transactions])

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    return months.map((month, index) => {
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === index && date.getFullYear() === currentYear
      })

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        month,
        income,
        expenses,
        net: income - expenses,
      }
    })
  }, [transactions])

  // Expense categories (current year only - consistent with monthly chart)
  const expenseByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>()
    const currentYear = new Date().getFullYear()
    
    transactions
      .filter(t => {
        const date = new Date(t.date)
        return t.type === 'expense' && date.getFullYear() === currentYear
      })
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0
        categoryMap.set(t.category, current + t.amount)
      })

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [transactions])

  // Recent transactions (top 7 most recent)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)
  }, [transactions])

  // Top spending categories (current month)
  const topSpendingThisMonth = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const categoryMap = new Map<string, number>()
    
    transactions
      .filter(t => {
        const date = new Date(t.date)
        return t.type === 'expense' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear
      })
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0
        categoryMap.set(t.category, current + t.amount)
      })

    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0)

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ 
        name, 
        value,
        percentage: total > 0 ? (value / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [transactions])

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">
          Welcome back! Here's your financial overview.
        </p>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          trend={stats.revenueChange >= 0 ? "up" : "down"}
          variant="green"
          icon={<DollarSign size={20} />}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          change={stats.expensesChange}
          trend={stats.expensesChange >= 0 ? "up" : "down"}
          variant="red"
          icon={<TrendingDown size={20} />}
        />
        <StatCard
          title="Net Income"
          value={formatCurrency(stats.netIncome)}
          change={stats.netIncomeChange}
          trend={stats.netIncome >= 0 ? "up" : "down"}
          variant={stats.netIncome >= 0 ? "green" : "red"}
          icon={stats.netIncome >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        />
        <StatCard
          title="Saving Rate"
          value={formatPercentage(stats.savingRate)}
          change={stats.savingRateChange}
          trend={stats.savingRate >= 0 ? "up" : "down"}
          variant={stats.savingRate >= 0 ? "blue" : "red"}
          icon={<PiggyBank size={20} />}
          changeUnit=" pts"
        />
      </div>

      {/* Quick Insights Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Recent Transactions
            </h3>
            <Link 
              to="/transactions" 
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No transactions yet. Add your first transaction!
              </p>
            ) : (
              recentTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'income' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp size={18} />
                      ) : (
                        <ShoppingCart size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {transaction.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar size={12} />
                        <span>{formatDate(transaction.date)}</span>
                        <span className="capitalize px-2 py-0.5 bg-secondary rounded text-xs">
                          {transaction.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold text-sm whitespace-nowrap ml-3 ${
                    transaction.type === 'income' ? 'text-success' : 'text-destructive'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>

        {/* Top Spending Categories This Month */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Top Spending This Month
          </h3>
          <div className="space-y-4">
            {topSpendingThisMonth.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No expenses this month yet.
              </p>
            ) : (
              topSpendingThisMonth.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="font-medium capitalize text-sm">
                        {category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {formatCurrency(category.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.08, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`
                      }}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income vs Expenses & Net Income Trend */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-red-500/5 pointer-events-none"></div>
          <h3 className="text-2xl font-bold mb-6 text-gradient-green">Income, Expenses & Net Income</h3>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-red-500/10 blur-2xl pointer-events-none"></div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#888" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                />
                <YAxis 
                  stroke="#888"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                  tickFormatter={formatAxisNumber}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    padding: '12px',
                  }}
                  formatter={(value: number) => `$${Math.round(value).toLocaleString()}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 3 }}
                  activeDot={{ fill: '#10b981', r: 5 }}
                  filter="url(#glow)"
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 3 }}
                  activeDot={{ fill: '#ef4444', r: 5 }}
                  filter="url(#glow)"
                  name="Expenses"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ fill: '#3b82f6', r: 5 }}
                  filter="url(#glow)"
                  name="Net Income"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Categories */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 pointer-events-none"></div>
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Expense Breakdown</h3>
          <p className="text-sm text-muted-foreground mb-4">Current month breakdown</p>
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {COLORS.map((color, index) => (
                    <linearGradient key={`gradient-${index}`} id={`colorGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1}/>
                      <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                    </linearGradient>
                  ))}
                  <filter id="pieGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={false}
                  outerRadius={95}
                  innerRadius={55}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                  filter="url(#pieGlow)"
                >
                  {expenseByCategory.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#colorGradient${index % COLORS.length})`}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    padding: '12px',
                    fontWeight: 600,
                  }}
                  formatter={(value: number) => `$${Math.round(value).toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {expenseByCategory.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)` 
                    }}
                  />
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Financial Goals</h3>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 glow-blue"
          >
            <Target className="text-blue-500" size={28} />
          </motion.div>
        </div>
        <div className="space-y-6">
          {goals.length === 0 ? (
            <p className="text-muted-foreground text-center py-12 text-lg">
              No goals set yet. Create one to track your progress!
            </p>
          ) : (
            goals.map((goal, index) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              return (
                <motion.div 
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-card to-card/50 backdrop-blur-sm border border-border/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg">{goal.name}</span>
                    <span className="text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10">
                      {formatCompactCurrency(goal.currentAmount)} / {formatCompactCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="h-4 bg-secondary/50 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ 
                        background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </motion.div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {progress.toFixed(1)}% Complete
                    </span>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}

