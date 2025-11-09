import { useMemo, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Calendar, ChevronDown } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { useStore } from '../store/useStore'
import { formatCurrency, getMonthName, formatAxisNumber } from '../lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

type ReportType = 'yearly' | 'monthly'

export default function Reports() {
  const { transactions, fetchTransactions } = useStore()
  const reportRef = useRef<HTMLDivElement>(null)
  
  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    transactions.forEach(t => {
      const year = new Date(t.date).getFullYear()
      years.add(year)
    })
    const yearArray = Array.from(years).sort((a, b) => b - a)
    // Always include current year even if no transactions
    const currentYear = new Date().getFullYear()
    if (!yearArray.includes(currentYear)) {
      yearArray.unshift(currentYear)
    }
    return yearArray
  }, [transactions])

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [reportType, setReportType] = useState<ReportType>('yearly')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const yearlyReport = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === i && date.getFullYear() === selectedYear
      })

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        month: getMonthName(i),
        income,
        expenses,
        net: income - expenses,
      }
    })

    const totalIncome = months.reduce((sum, m) => sum + m.income, 0)
    const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0)
    const netIncome = totalIncome - totalExpenses
    
    // Calculate average - if viewing current year, use elapsed months only
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const isCurrentYear = selectedYear === currentYear
    const monthsToAverage = isCurrentYear ? currentMonth : 12
    const avgMonthlySaving = monthsToAverage > 0 ? netIncome / monthsToAverage : 0

    return { months, totalIncome, totalExpenses, netIncome, avgMonthlySaving }
  }, [transactions, selectedYear])

  const monthlyReport = useMemo(() => {
    if (selectedMonth === null) return null

    // Get transactions for the selected month and year
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const net = income - expenses

    // Group by day for daily breakdown
    const dailyData = []
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTransactions = monthTransactions.filter(t => {
        const date = new Date(t.date)
        return date.getDate() === day
      })

      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const dayExpenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      dailyData.push({
        day: day.toString(),
        income: dayIncome,
        expenses: dayExpenses,
        net: dayIncome - dayExpenses,
      })
    }

    return { income, expenses, net, dailyData }
  }, [transactions, selectedYear, selectedMonth])

  const categoryBreakdown = useMemo(() => {
    const incomeByCategory = new Map<string, number>()
    const expensesByCategory = new Map<string, number>()

    // Filter transactions by selected period
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      const yearMatch = date.getFullYear() === selectedYear
      const monthMatch = selectedMonth === null || date.getMonth() === selectedMonth
      return yearMatch && monthMatch
    })

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        const current = incomeByCategory.get(t.category) || 0
        incomeByCategory.set(t.category, current + t.amount)
      } else {
        const current = expensesByCategory.get(t.category) || 0
        expensesByCategory.set(t.category, current + t.amount)
      }
    })

    return {
      income: Array.from(incomeByCategory.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      expenses: Array.from(expensesByCategory.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
    }
  }, [transactions, selectedYear, selectedMonth])

  const exportToPDF = async () => {
    if (!reportRef.current) return

    try {
      // Capture the visual report as canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10

      // Calculate how many pages needed
      const pageHeight = pdfHeight - 20 // Leave margin
      const totalPages = Math.ceil((imgHeight * ratio) / pageHeight)

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const sourceY = (i * pageHeight) / ratio
        const sourceHeight = Math.min(pageHeight / ratio, imgHeight - sourceY)

        // Create a temporary canvas for this page section
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgWidth
        pageCanvas.height = sourceHeight
        const ctx = pageCanvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, imgWidth, sourceHeight,
            0, 0, imgWidth, sourceHeight
          )
          
          const pageImgData = pageCanvas.toDataURL('image/png')
          pdf.addImage(
            pageImgData,
            'PNG',
            imgX,
            imgY,
            imgWidth * ratio,
            sourceHeight * ratio
          )
        }
      }

      // Generate filename based on selected period
      const monthName = selectedMonth !== null ? `-${getMonthName(selectedMonth)}` : ''
      const filename = `financial-report-${selectedYear}${monthName}.pdf`
      
      pdf.save(filename)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  // Handle report type change
  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type)
    if (type === 'yearly') {
      setSelectedMonth(null)
    } else if (selectedMonth === null) {
      // Default to current month when switching to monthly
      setSelectedMonth(new Date().getMonth())
    }
  }

  // Get current report data based on type
  const totalIncome = reportType === 'yearly' ? yearlyReport.totalIncome : monthlyReport.income
  const totalExpenses = reportType === 'yearly' ? yearlyReport.totalExpenses : monthlyReport.expenses
  const netIncome = reportType === 'yearly' ? yearlyReport.netIncome : monthlyReport.net

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent">
              Reports
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">
              Comprehensive financial summaries and analytics
            </p>
          </div>
          <Button onClick={exportToPDF} className="gradient-blue hover:opacity-90 text-white shadow-lg">
            <Download size={20} className="mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Controls */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Report Type Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Report Type:</span>
              <div className="flex bg-secondary rounded-lg p-1">
                <button
                  onClick={() => handleReportTypeChange('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    reportType === 'yearly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => handleReportTypeChange('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    reportType === 'monthly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Month Selector (only for monthly reports) */}
            <AnimatePresence>
              {reportType === 'monthly' && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-medium text-muted-foreground">Month:</span>
                  <select
                    value={selectedMonth ?? ''}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{getMonthName(i)}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Period Label */}
            <div className="flex-1 flex items-center justify-end gap-2 text-sm font-medium text-primary">
              <Calendar size={16} />
              {reportType === 'yearly' 
                ? `${selectedYear} Full Year`
                : `${getMonthName(selectedMonth!)} ${selectedYear}`}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Report Content - This will be captured for PDF */}
      <div ref={reportRef} className="space-y-6">
      {/* Summary */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-primary" size={24} />
          <h3 className="text-lg font-semibold">
            {reportType === 'yearly' 
              ? `${selectedYear} Full Year Summary`
              : `${getMonthName(selectedMonth!)} ${selectedYear} Summary`}
          </h3>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-success mt-1">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive mt-1">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Income</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(netIncome)}
            </p>
          </div>
          {reportType === 'yearly' && (
            <div>
              <p className="text-sm text-muted-foreground">Avg Monthly Saving</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatCurrency(yearlyReport.avgMonthlySaving)}
              </p>
            </div>
          )}
          {reportType === 'monthly' && (
            <div>
              <p className="text-sm text-muted-foreground">Saving Rate</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Chart: Monthly or Daily Comparison */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">
          {reportType === 'yearly' ? 'Monthly' : 'Daily'} Income vs Expenses
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportType === 'yearly' ? yearlyReport.months : monthlyReport?.dailyData || []}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey={reportType === 'yearly' ? 'month' : 'day'} />
            <YAxis tickFormatter={formatAxisNumber} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Income by Category</h3>
          <div className="space-y-3">
            {categoryBreakdown.income.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No income data</p>
            ) : (
              categoryBreakdown.income.map((item, index) => {
                const percentage = totalIncome > 0 
                  ? (item.amount / totalIncome) * 100 
                  : 0
                return (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{item.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(item.amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="h-full bg-success rounded-full"
                      />
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {categoryBreakdown.expenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No expense data</p>
            ) : (
              categoryBreakdown.expenses.map((item, index) => {
                const percentage = totalExpenses > 0 
                  ? (item.amount / totalExpenses) * 100 
                  : 0
                return (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{item.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(item.amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="h-full bg-destructive rounded-full"
                      />
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}

