import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function calculateUtilization(balance: number, limit: number): number {
  if (limit === 0) return 0
  return (balance / limit) * 100
}

export function getUtilizationColor(utilization: number): string {
  if (utilization >= 90) return 'text-red-600'
  if (utilization >= 70) return 'text-orange-600'
  if (utilization >= 50) return 'text-yellow-600'
  if (utilization >= 30) return 'text-blue-600'
  return 'text-green-600'
}

export function getUtilizationBadgeColor(utilization: number): string {
  if (utilization >= 90) return 'bg-red-100 text-red-800'
  if (utilization >= 70) return 'bg-orange-100 text-orange-800'
  if (utilization >= 50) return 'bg-yellow-100 text-yellow-800'
  if (utilization >= 30) return 'bg-blue-100 text-blue-800'
  return 'bg-green-100 text-green-800'
}