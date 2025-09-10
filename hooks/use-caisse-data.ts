"use client"

import { useMemo } from "react" // ✅ Make sure this import is here
import { useApiStore } from "@/lib/api-store" // ✅ Update path to match your structure
import { getCaisseTransactions, type CaisseTransaction, type CaisseInsights } from "@/lib/caisse-data-service"
import { getDefaultKeywordSettings, type CaisseType, type KeywordSettings } from "@/lib/categorization-utils"

interface UseCaisseDataProps {
  caisseType: CaisseType
  selectedMonth: string
  selectedYear: string
  keywordSettings?: KeywordSettings
}

interface UseCaisseDataReturn {
  transactions: CaisseTransaction[]
  insights: CaisseInsights
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Custom hook to get processed caisse data
 */
export function useCaisseData({
  caisseType,
  selectedMonth,
  selectedYear,
  keywordSettings,
}: UseCaisseDataProps): UseCaisseDataReturn {
  const { invoices, payments, loading, error, fetchInvoices, fetchPayments } = useApiStore()

  // Use default keyword settings if none provided
  const effectiveKeywordSettings = keywordSettings || getDefaultKeywordSettings()

  // Process data based on caisse type
  const { transactions, insights } = useMemo(() => {
    if (loading || !invoices.length) {
      return {
        transactions: [],
        insights: {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0,
          averageTransaction: 0,
          monthlyGrowth: 0,
          topCategories: {},
          paymentMethods: {},
        },
      }
    }

    return getCaisseTransactions(caisseType, invoices, payments, effectiveKeywordSettings, selectedMonth, selectedYear)
  }, [invoices, payments, caisseType, selectedMonth, selectedYear, effectiveKeywordSettings, loading])

  const refresh = async () => {
    try {
      await Promise.all([fetchInvoices(), fetchPayments()])
    } catch (err) {
      console.error("Error refreshing caisse data:", err)
    }
  }

  return {
    transactions,
    insights,
    loading,
    error,
    refresh,
  }
}

/**
 * Hook to get summary data for all caisses
 */
export function useAllCaissesSummary(selectedMonth: string, selectedYear: string, keywordSettings?: KeywordSettings) {
  const { invoices, payments, loading, error } = useApiStore()
  const effectiveKeywordSettings = keywordSettings || getDefaultKeywordSettings()

  const summary = useMemo(() => {
    if (loading || !invoices.length) {
      return {
        beneficeMO: { transactions: 0, amount: 0 },
        charge: { transactions: 0, amount: 0 },
        achatPiece: { transactions: 0, amount: 0 },
        huile: { transactions: 0, amount: 0 },
        tva: { transactions: 0, amount: 0 },
      }
    }

    const caisseTypes: CaisseType[] = ["beneficeMO", "charge", "achatPiece", "huile", "tva"]
    const result: Record<string, { transactions: number; amount: number }> = {}

    for (const caisseType of caisseTypes) {
      const { transactions, insights } = getCaisseTransactions(
        caisseType,
        invoices,
        payments,
        effectiveKeywordSettings,
        selectedMonth,
        selectedYear,
      )

      result[caisseType] = {
        transactions: transactions.length,
        amount: insights.balance,
      }
    }

    return result
  }, [invoices, payments, selectedMonth, selectedYear, effectiveKeywordSettings, loading])

  return {
    summary,
    loading,
    error,
  }
}