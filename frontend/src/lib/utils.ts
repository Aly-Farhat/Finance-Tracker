import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  // Round to nearest integer (0.5 and above rounds up, below rounds down)
  const rounded = Math.round(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthIndex]
}

export function formatCompactCurrency(amount: number): string {
  // Round to nearest integer
  const rounded = Math.round(amount)
  if (rounded >= 1000) {
    const thousands = rounded / 1000
    // Round to 1 decimal for k notation, but only show decimal if needed
    return `$${thousands % 1 === 0 ? Math.round(thousands) : thousands.toFixed(1)}k`
  }
  return `$${rounded}`
}

export function formatAxisNumber(value: number): string {
  // Round to nearest integer
  const rounded = Math.round(value)
  if (rounded >= 1000) {
    return `${Math.round(rounded / 1000)}k`
  }
  return `${rounded}`
}

