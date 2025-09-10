"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Client, Invoice, Payment, Company, InvoicePreferences } from "@/types"

interface ApiStoreContextType {
  clients: Client[]
  invoices: Invoice[]
  payments: Payment[]
  company: Company | null
  preferences: InvoicePreferences | null
  loading: boolean
  error: string | null

  // Client methods
  fetchClients: () => Promise<void>
  addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<void>
  updateClient: (id: string, client: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>

  // Invoice methods
  fetchInvoices: (filters?: any) => Promise<void>
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Promise<void>
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  getNextInvoiceNumber: (type: "invoice" | "bon_de_livraison") => Promise<number> // Added this method

  // Payment methods
  fetchPayments: (invoiceId?: string) => Promise<void>
  addPayment: (payment: Omit<Payment, "id">) => Promise<void>

  // Company methods
  fetchCompany: () => Promise<void>
  updateCompany: (company: Partial<Company>) => Promise<void>

  // Settings methods
  fetchSettings: () => Promise<void>
  updatePreferences: (preferences: Partial<InvoicePreferences>) => Promise<void>
}

const ApiStoreContext = createContext<ApiStoreContextType | undefined>(undefined)

export function ApiStoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [preferences, setPreferences] = useState<InvoicePreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function for API calls
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "API call failed")
    }

    return response.json()
  }

  // Client methods
  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall("/api/clients")
      setClients(
        data.map((client: any) => ({
          ...client,
          id: client._id,
          createdAt: client.createdAt,
        })),
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addClient = async (clientData: Omit<Client, "id" | "createdAt">) => {
    try {
      setError(null)
      const data = await apiCall("/api/clients", {
        method: "POST",
        body: JSON.stringify(clientData),
      })
      const newClient = {
        ...data,
        id: data._id,
        createdAt: data.createdAt,
      }
      setClients((prev) => [newClient, ...prev])
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      setError(null)
      const data = await apiCall(`/api/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(clientData),
      })
      const updatedClient = {
        ...data,
        id: data._id,
        createdAt: data.createdAt,
      }
      setClients((prev) => prev.map((client) => (client.id === id ? updatedClient : client)))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteClient = async (id: string) => {
    try {
      setError(null)
      await apiCall(`/api/clients/${id}`, { method: "DELETE" })
      setClients((prev) => prev.filter((client) => client.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  // Invoice methods
  const fetchInvoices = async (filters: any = {}) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key])
      })

      const data = await apiCall(`/api/invoices?${params.toString()}`)
      setInvoices(
        data.invoices.map((invoice: any) => ({
          ...invoice,
          id: invoice._id,
          clientId: invoice.clientId._id || invoice.clientId, // Handle populated client or just ID
          createdAt: invoice.createdAt,
        })),
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt">) => {
    try {
      setError(null)
      const data = await apiCall("/api/invoices", {
        method: "POST",
        body: JSON.stringify(invoiceData),
      })
      const newInvoice = {
        ...data,
        id: data._id,
        clientId: data.clientId._id || data.clientId,
        createdAt: data.createdAt,
      }
      setInvoices((prev) => [newInvoice, ...prev])
      return newInvoice
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    try {
      setError(null)
      const data = await apiCall(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(invoiceData),
      })
      const updatedInvoice = {
        ...data,
        id: data._id,
        clientId: data.clientId._id || data.clientId,
        createdAt: data.createdAt,
      }
      setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? updatedInvoice : invoice)))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      setError(null)
      await apiCall(`/api/invoices/${id}`, { method: "DELETE" })
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  // NEW: Get next invoice number method
  const getNextInvoiceNumber = async (type: "invoice" | "bon_de_livraison"): Promise<number> => {
    try {
      setError(null)
      const data = await apiCall("/api/invoices/next-number", {
        method: "POST",
        body: JSON.stringify({ type }),
      })
      return data.nextNumber
    } catch (err: any) {
      setError(err.message)
      console.error("Error getting next invoice number:", err)
      throw err
    }
  }

  // Payment methods
  const fetchPayments = async (invoiceId?: string) => {
    try {
      setError(null)
      const params = invoiceId ? `?invoiceId=${invoiceId}` : ""
      const data = await apiCall(`/api/payments${params}`)
      setPayments(
        data.map((payment: any) => ({
          ...payment,
          id: payment._id,
          invoiceId: payment.invoiceId._id || payment.invoiceId,
        })),
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addPayment = async (paymentData: Omit<Payment, "id">) => {
    try {
      setError(null)
      const data = await apiCall("/api/payments", {
        method: "POST",
        body: JSON.stringify(paymentData),
      })
      const newPayment = {
        ...data,
        id: data._id,
        invoiceId: data.invoiceId._id || data.invoiceId,
      }
      setPayments((prev) => [newPayment, ...prev])

      // Refresh invoices to get updated payment status
      await fetchInvoices()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  // Company methods
  const fetchCompany = async () => {
    try {
      setError(null)
      const data = await apiCall("/api/company")
      setCompany({
        ...data,
        id: data._id,
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateCompany = async (companyData: Partial<Company>) => {
    try {
      setError(null)
      const data = await apiCall("/api/company", {
        method: "PUT",
        body: JSON.stringify(companyData),
      })
      setCompany({
        ...data,
        id: data._id,
      })
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  // Settings methods
  const fetchSettings = async () => {
    try {
      setError(null)
      const data = await apiCall("/api/settings")
      setPreferences({
        dateFormat: data.dateFormat,
        defaultTaxPercentage: data.defaultTaxPercentage,
        language: data.language,
        showDueDate: data.showDueDate,
        showTax: data.showTax,
        showDiscount: data.showDiscount,
        showNotes: data.showNotes,
        currency: data.currency,
      })
    } catch (err: any) {
      setError(err.message)
    }
  }
  
  const updatePreferences = async (preferencesData: Partial<InvoicePreferences>) => {
    try {
      setError(null)
      const data = await apiCall("/api/settings", {
        method: "PUT",
        body: JSON.stringify(preferencesData),
      })

      // ✅ Safely merge with previous preferences
      setPreferences((prev) => ({
        ...prev,
        ...data,
      }))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([fetchClients(), fetchInvoices(), fetchPayments(), fetchCompany(), fetchSettings()])
      } catch (error) {
        console.error("Failed to initialize data:", error)
      }
    }

    initializeData()
  }, [])

  const contextValue: ApiStoreContextType = {
    clients,
    invoices,
    payments,
    company,
    preferences,
    loading,
    error,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
    fetchInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getNextInvoiceNumber, // Added to context value
    fetchPayments,
    addPayment,
    fetchCompany,
    updateCompany,
    fetchSettings,
    updatePreferences,
  }

  return <ApiStoreContext.Provider value={contextValue}>{children}</ApiStoreContext.Provider>
}

export function useApiStore() {
  const context = useContext(ApiStoreContext)
  if (context === undefined) {
    throw new Error("useApiStore must be used within an ApiStoreProvider")
  }
  return context
}