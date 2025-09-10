// "use client"

// import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// // Creating a proper API store provider instead of importing from user context
// interface Client {
//   id: string
//   name: string
//   email?: string
//   phone?: string
//   address?: string
//   createdAt: string
// }

// interface InvoiceItem {
//   id?: string
//   description: string
//   quantity: number
//   unitPrice: number
//   totalHT?: number
//   totalTTC?: number
//   tvaRate?: number
// }

// interface Invoice {
//   id: string
//   invoiceNumber: string
//   type: "invoice" | "bon_de_livraison"
//   clientId: string | Client
//   items?: InvoiceItem[]
//   totalHT?: number
//   totalTTC?: number
//   status: "draft" | "sent" | "paid" | "overdue"
//   createdAt: string
//   dueDate?: string
//   notes?: string
// }

// interface Payment {
//   id: string
//   invoiceId: string | Invoice
//   amount: number
//   paymentMethod: string
//   paymentDate: string
//   notes?: string
// }

// interface Company {
//   id: string
//   name: string
//   address?: string
//   phone?: string
//   email?: string
// }

// interface InvoicePreferences {
//   dateFormat: string
//   defaultTaxPercentage: number
//   language: string
//   showDueDate: boolean
//   showTax: boolean
//   showDiscount: boolean
//   showNotes: boolean
//   currency: string
// }

// interface ApiStoreContextType {
//   clients: Client[]
//   invoices: Invoice[]
//   payments: Payment[]
//   company: Company | null
//   preferences: InvoicePreferences | null
//   loading: boolean
//   error: string | null

//   // Client methods
//   fetchClients: () => Promise<void>
//   addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<void>
//   updateClient: (id: string, client: Partial<Client>) => Promise<void>
//   deleteClient: (id: string) => Promise<void>

//   // Invoice methods
//   fetchInvoices: (filters?: any) => Promise<void>
//   addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Promise<void>
//   updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>
//   deleteInvoice: (id: string) => Promise<void>
//   getNextInvoiceNumber: (type: "invoice" | "bon_de_livraison") => Promise<number>

//   // Payment methods
//   fetchPayments: (invoiceId?: string) => Promise<void>
//   addPayment: (payment: Omit<Payment, "id">) => Promise<void>

//   // Company methods
//   fetchCompany: () => Promise<void>
//   updateCompany: (company: Partial<Company>) => Promise<void>

//   // Settings methods
//   fetchSettings: () => Promise<void>
//   updatePreferences: (preferences: Partial<InvoicePreferences>) => Promise<void>
// }

// const ApiStoreContext = createContext<ApiStoreContextType | undefined>(undefined)

// export function ApiStoreProvider({ children }: { children: ReactNode }) {
//   const [clients, setClients] = useState<Client[]>([])
//   const [invoices, setInvoices] = useState<Invoice[]>([])
//   const [payments, setPayments] = useState<Payment[]>([])
//   const [company, setCompany] = useState<Company | null>(null)
//   const [preferences, setPreferences] = useState<InvoicePreferences | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   // Helper function for API calls
//   const apiCall = async (url: string, options: RequestInit = {}) => {
//     const response = await fetch(url, {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//     })

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({ error: "API call failed" }))
//       throw new Error(errorData.error || "API call failed")
//     }

//     return response.json()
//   }

//   // Client methods
//   const fetchClients = async () => {
//     try {
//       setLoading(true)
//       setError(null)
//       // Mock data for now - replace with real API call
//       const mockClients: Client[] = [
//         {
//           id: "1",
//           name: "SARL GARAGE MODERNE",
//           email: "contact@garagemoderne.tn",
//           phone: "+216 71 123 456",
//           address: "123 Avenue Habib Bourguiba, Tunis",
//           createdAt: "2025-01-01T00:00:00Z",
//         },
//         {
//           id: "2",
//           name: "AUTO SERVICE PLUS",
//           email: "info@autoservice.tn",
//           phone: "+216 71 987 654",
//           address: "456 Rue de la République, Sfax",
//           createdAt: "2025-01-02T00:00:00Z",
//         },
//       ]
//       setClients(mockClients)
//     } catch (err: any) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const addClient = async (clientData: Omit<Client, "id" | "createdAt">) => {
//     try {
//       setError(null)
//       // Mock implementation
//       const newClient: Client = {
//         ...clientData,
//         id: Date.now().toString(),
//         createdAt: new Date().toISOString(),
//       }
//       setClients((prev) => [newClient, ...prev])
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   const updateClient = async (id: string, clientData: Partial<Client>) => {
//     try {
//       setError(null)
//       setClients((prev) => prev.map((client) => (client.id === id ? { ...client, ...clientData } : client)))
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   const deleteClient = async (id: string) => {
//     try {
//       setError(null)
//       setClients((prev) => prev.filter((client) => client.id !== id))
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   // Invoice methods
//   const fetchInvoices = async (filters: any = {}) => {
//     try {
//       setLoading(true)
//       setError(null)
//       // Mock data for now - replace with real API call
//       const mockInvoices: Invoice[] = [
//         {
//           id: "1",
//           invoiceNumber: "BL2025120",
//           type: "bon_de_livraison",
//           clientId: "1",
//           items: [
//             {
//               id: "1",
//               description: "Plaquettes de frein BMW",
//               quantity: 1,
//               unitPrice: 222.975,
//               totalHT: 222.975,
//               totalTTC: 265.35,
//               tvaRate: 19,
//             },
//           ],
//           totalHT: 222.975,
//           totalTTC: 265.35,
//           status: "paid",
//           createdAt: "2025-04-02T00:00:00Z",
//         },
//         {
//           id: "2",
//           invoiceNumber: "BL2025121",
//           type: "bon_de_livraison",
//           clientId: "2",
//           items: [
//             {
//               id: "2",
//               description: "Filtre à huile Peugeot",
//               quantity: 1,
//               unitPrice: 27.243,
//               totalHT: 27.243,
//               totalTTC: 32.42,
//               tvaRate: 19,
//             },
//           ],
//           totalHT: 27.243,
//           totalTTC: 32.42,
//           status: "paid",
//           createdAt: "2025-04-03T00:00:00Z",
//         },
//       ]
//       setInvoices(mockInvoices)
//     } catch (err: any) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt">) => {
//     try {
//       setError(null)
//       const newInvoice: Invoice = {
//         ...invoiceData,
//         id: Date.now().toString(),
//         createdAt: new Date().toISOString(),
//       }
//       setInvoices((prev) => [newInvoice, ...prev])
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
//     try {
//       setError(null)
//       setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? { ...invoice, ...invoiceData } : invoice)))
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   const deleteInvoice = async (id: string) => {
//     try {
//       setError(null)
//       setInvoices((prev) => prev.filter((invoice) => invoice.id !== id))
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   const getNextInvoiceNumber = async (type: "invoice" | "bon_de_livraison"): Promise<number> => {
//     try {
//       setError(null)
//       // Mock implementation
//       return invoices.length + 1
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   // Payment methods
//   const fetchPayments = async (invoiceId?: string) => {
//     try {
//       setError(null)
//       // Mock data
//       const mockPayments: Payment[] = [
//         {
//           id: "1",
//           invoiceId: "1",
//           amount: 265.35,
//           paymentMethod: "ESPECE",
//           paymentDate: "2025-04-02T00:00:00Z",
//         },
//         {
//           id: "2",
//           invoiceId: "2",
//           amount: 32.42,
//           paymentMethod: "ESPECE",
//           paymentDate: "2025-04-03T00:00:00Z",
//         },
//       ]
//       setPayments(mockPayments)
//     } catch (err: any) {
//       setError(err.message)
//     }
//   }

//   const addPayment = async (paymentData: Omit<Payment, "id">) => {
//     try {
//       setError(null)
//       const newPayment: Payment = {
//         ...paymentData,
//         id: Date.now().toString(),
//       }
//       setPayments((prev) => [newPayment, ...prev])
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   // Company methods
//   const fetchCompany = async () => {
//     try {
//       setError(null)
//       const mockCompany: Company = {
//         id: "1",
//         name: "GARAGE MODERNE SARL",
//         address: "123 Avenue Habib Bourguiba, Tunis",
//         phone: "+216 71 123 456",
//         email: "contact@garagemoderne.tn",
//       }
//       setCompany(mockCompany)
//     } catch (err: any) {
//       setError(err.message)
//     }
//   }

//   const updateCompany = async (companyData: Partial<Company>) => {
//     try {
//       setError(null)
//       setCompany((prev) => (prev ? { ...prev, ...companyData } : null))
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   // Settings methods
//   const fetchSettings = async () => {
//     try {
//       setError(null)
//       const mockPreferences: InvoicePreferences = {
//         dateFormat: "dd/MM/yyyy",
//         defaultTaxPercentage: 19,
//         language: "fr-FR",
//         showDueDate: true,
//         showTax: true,
//         showDiscount: false,
//         showNotes: true,
//         currency: "TND",
//       }
//       setPreferences(mockPreferences)
//     } catch (err: any) {
//       setError(err.message)
//     }
//   }

//   const updatePreferences = async (preferencesData: Partial<InvoicePreferences>) => {
//     try {
//       setError(null)
//       setPreferences((prev) => (prev ? { ...prev, ...preferencesData } : null))
//     } catch (err: any) {
//       setError(err.message)
//       throw err
//     }
//   }

//   // Initialize data on mount
//   useEffect(() => {
//     const initializeData = async () => {
//       try {
//         await Promise.all([fetchClients(), fetchInvoices(), fetchPayments(), fetchCompany(), fetchSettings()])
//       } catch (error) {
//         console.error("Failed to initialize data:", error)
//       }
//     }

//     initializeData()
//   }, [])

//   const contextValue: ApiStoreContextType = {
//     clients,
//     invoices,
//     payments,
//     company,
//     preferences,
//     loading,
//     error,
//     fetchClients,
//     addClient,
//     updateClient,
//     deleteClient,
//     fetchInvoices,
//     addInvoice,
//     updateInvoice,
//     deleteInvoice,
//     getNextInvoiceNumber,
//     fetchPayments,
//     addPayment,
//     fetchCompany,
//     updateCompany,
//     fetchSettings,
//     updatePreferences,
//   }

//   return <ApiStoreContext.Provider value={contextValue}>{children}</ApiStoreContext.Provider>
// }

// export function useApiStore() {
//   const context = useContext(ApiStoreContext)
//   if (context === undefined) {
//     throw new Error("useApiStore must be used within an ApiStoreProvider")
//   }
//   return context
// }

// export { ApiStoreContext }
