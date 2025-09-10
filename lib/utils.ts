import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Map currency codes to symbols for right-side formatting
const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  TND: "TND",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
  // Add more if needed
}

/**
 * Format currency with symbol on the right side of the number.
 * Falls back to currency code if symbol not found.
 */
export function formatCurrencyRight(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  // Format number without currency symbol, 2 decimals
  const numberFormatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount)

  const symbol = currencySymbols[currency] || currency

  return `${numberFormatted} ${symbol}`
}

// Format currency with locale support and symbol on the left (default)
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount)
}

// Format date with various options
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-US"
): string {
  const dateObj = new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date"
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj)
}

// Additional utility: Format date as relative time (e.g., "2 days ago")
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date()
  const dateObj = new Date(date)
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

// Additional utility: Format number with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

// Calculate invoice totals with tax and discount
export function calculateInvoiceTotals(
  items: Array<{
    quantity: number
    unitPrice: number
    discount?: number
  }>,
  taxPercentage: number = 0,
  globalDiscount: number = 0
) {
  // Calculate subtotal (sum of all items)
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    const itemDiscount = item.discount || 0
    const itemTotalAfterDiscount = itemTotal - (itemTotal * itemDiscount / 100)
    return sum + itemTotalAfterDiscount
  }, 0)

  // Apply global discount
  const subtotalAfterGlobalDiscount = subtotal - (subtotal * globalDiscount / 100)

  // Calculate tax on the discounted subtotal
  const taxAmount = subtotalAfterGlobalDiscount * (taxPercentage / 100)

  // Calculate final total (including fixed stamp of 1 if needed)
  const total = subtotalAfterGlobalDiscount + taxAmount
  console.log(total)

  return {
    subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round((total + 1) * 100) / 100, // +1 for stamp tax if applicable
    discountAmount: Math.round((subtotal * globalDiscount / 100) * 100) / 100,
    subtotalAfterDiscount: Math.round(subtotalAfterGlobalDiscount * 100) / 100,
  }
}

// Alternative simpler version for basic calculations
export function calculateSimpleInvoiceTotal(
  items: Array<{ quantity: number; unitPrice: number }>,
  taxPercentage: number = 0
) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  const taxAmount = subtotal * (taxPercentage / 100)
  const total = subtotal + taxAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(total * 100) / 100,
  }
}
