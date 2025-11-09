import { create } from 'zustand'

// In production build (desktop app), connect directly to backend on port 5000
// In development, use port 3000 which Vite proxies to backend
const isDev = window.location.protocol === 'http:' && window.location.hostname === 'localhost' && window.location.port === '3000'
const API_URL = isDev ? 'http://localhost:3000' : 'http://localhost:5000'

interface Transaction {
  id?: number | string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  source?: string
}

interface Goal {
  id?: number | string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  category?: string
  color?: string
  notes?: string
}

interface LoadingState {
  transactions: boolean
  goals: boolean
}

interface ErrorState {
  transactions: string | null
  goals: string | null
  general: string | null
}

interface Store {
  transactions: Transaction[]
  goals: Goal[]
  loading: LoadingState
  error: ErrorState
  setTransactions: (transactions: Transaction[]) => void
  setGoals: (goals: Goal[]) => void
  setLoading: (key: keyof LoadingState, value: boolean) => void
  setError: (key: keyof ErrorState, value: string | null) => void
  clearError: () => void
  fetchTransactions: () => Promise<void>
  fetchGoals: () => Promise<void>
  addTransaction: (transaction: Transaction) => Promise<void>
  addGoal: (goal: Goal) => Promise<void>
  updateGoal: (id: number | string, currentAmount?: number, notes?: string) => Promise<void>
  deleteTransaction: (id: number | string) => Promise<void>
  deleteGoal: (id: number | string) => Promise<void>
}

export const useStore = create<Store>((set, get) => ({
  transactions: [],
  goals: [],
  loading: {
    transactions: false,
    goals: false,
  },
  error: {
    transactions: null,
    goals: null,
    general: null,
  },
  
  setTransactions: (transactions) => set({ transactions }),
  setGoals: (goals) => set({ goals }),
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value },
  })),
  setError: (key, value) => set((state) => ({
    error: { ...state.error, [key]: value },
  })),
  clearError: () => set({
    error: { transactions: null, goals: null, general: null },
  }),
  
  fetchTransactions: async () => {
    const { setLoading, setError } = get()
    setLoading('transactions', true)
    setError('transactions', null)
    
    try {
      const response = await fetch(`${API_URL}/api/transactions?limit=100`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`)
      }
      
      const result = await response.json()
      // Handle paginated response or direct array
      const transactions = result.data || result
      
      set({ transactions })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch transactions'
      setError('transactions', message)
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading('transactions', false)
    }
  },
  
  fetchGoals: async () => {
    const { setLoading, setError } = get()
    setLoading('goals', true)
    setError('goals', null)
    
    try {
      const response = await fetch(`${API_URL}/api/goals`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch goals: ${response.statusText}`)
      }
      
      const goals = await response.json()
      set({ goals })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch goals'
      setError('goals', message)
      console.error('Failed to fetch goals:', error)
    } finally {
      setLoading('goals', false)
    }
  },
  
  addTransaction: async (transaction) => {
    const { setError } = get()
    setError('transactions', null)
    
    try {
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      const newTransaction = await response.json()
      set((state) => ({ transactions: [newTransaction, ...state.transactions] }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add transaction'
      setError('transactions', message)
      throw error
    }
  },
  
  addGoal: async (goal) => {
    const { setError } = get()
    setError('goals', null)
    
    try {
      const response = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      const newGoal = await response.json()
      set((state) => ({ goals: [...state.goals, newGoal] }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add goal'
      setError('goals', message)
      throw error
    }
  },
  
  updateGoal: async (id, currentAmount, notes) => {
    const { setError } = get()
    setError('goals', null)
    
    try {
      const updateData: any = {}
      if (currentAmount !== undefined) updateData.currentAmount = currentAmount
      if (notes !== undefined) updateData.notes = notes
      
      const response = await fetch(`${API_URL}/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      const updatedGoal = await response.json()
      
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === id ? { ...goal, ...updatedGoal } : goal
        ),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update goal'
      setError('goals', message)
      throw error
    }
  },
  
  deleteTransaction: async (id) => {
    const { setError } = get()
    setError('transactions', null)
    
    try {
      const response = await fetch(`${API_URL}/api/transactions/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete transaction'
      setError('transactions', message)
      throw error
    }
  },
  
  deleteGoal: async (id) => {
    const { setError } = get()
    setError('goals', null)
    
    try {
      const response = await fetch(`${API_URL}/api/goals/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete goal'
      setError('goals', message)
      throw error
    }
  },
}))
