import type { Invoice, Payment } from "@/types"
import { categorizeInvoiceItem, type KeywordSettings, type CaisseType } from "./categorization-utils"

export interface CaisseTransaction {
  id: string
  date: string
  type: "INCOME" | "EXPENSE" | "INITIAL"
  description: string
  amount: number
  invoiceNumber?: string
  clientName?: string
  category?: string
  subcategory?: string
  paymentMethod?: string
  isPaid?: boolean
  tvaAmount?: number
  htAmount?: number
  ttcAmount?: number
  matchedKeyword?: string
  originalInvoiceId?: string
}

export interface CaisseInsights {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
  averageTransaction: number
  monthlyGrowth: number
  topCategories: Record<string, number>
  paymentMethods: Record<string, number>
}

// Helper function to safely extract MongoDB values
function extractMongoValue(value: any): any {
  if (value && typeof value === 'object') {
    if (value.$oid) return value.$oid
    if (value.$date) return new Date(parseInt(value.$date.$numberLong))
    if (value.$numberInt) return parseInt(value.$numberInt)
    if (value.$numberLong) return parseInt(value.$numberLong)
    if (value.$numberDouble) return parseFloat(value.$numberDouble)
  }
  return value
}

// Helper function to get client name from clientId
function getClientName(clientId: any): string {
  if (typeof clientId === 'string') return 'Client'
  if (clientId && typeof clientId === 'object') {
    if (clientId.$oid) return 'Client'
    if (clientId.name) return clientId.name
  }
  return 'Client'
}

/**
 * Processes invoice data for Benefice MO (Labor Profit) caisse
 */
export function processBeneficeMOData(
  invoices: Invoice[],
  payments: Payment[],
  keywordSettings: KeywordSettings,
  selectedMonth: string,
  selectedYear: string,
): { transactions: CaisseTransaction[]; insights: CaisseInsights } {
  const transactions: CaisseTransaction[] = []

  // Filter invoices by date
  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
    const dateObj = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate)
    const invoiceMonth = (dateObj.getMonth() + 1).toString().padStart(2, "0")
    const invoiceYear = dateObj.getFullYear().toString()
    return invoiceMonth === selectedMonth && invoiceYear === selectedYear
  })

  // Process each invoice
  for (const invoice of filteredInvoices) {
    if (!invoice.items) continue

    for (const item of invoice.items) {
      const { category, matchedKeyword } = categorizeInvoiceItem(item.description, keywordSettings)

      // Only include items categorized as beneficeMO
      if (category === "beneficeMO") {
        const relatedPayment = payments.find((p) => extractMongoValue(p.invoiceId) === extractMongoValue(invoice._id))
        const itemDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
        
        // Calculate amounts from your data structure
        const modAmount = extractMongoValue(item.mod) || 0
        const benefits = extractMongoValue(item.benefits) || 0
        const totalAmount = modAmount + benefits

        transactions.push({
          id: `${extractMongoValue(invoice._id)}-${item.id || Math.random()}`,
          date: itemDate instanceof Date ? itemDate.toISOString() : new Date(itemDate).toISOString(),
          type: "INCOME",
          description: item.description,
          amount: totalAmount,
          invoiceNumber: invoice.invoiceNumber,
          clientName: getClientName(invoice.clientId),
          category: "MAIN_OEUVRE",
          subcategory: matchedKeyword || "Autre",
          paymentMethod: relatedPayment?.paymentMethod || "Non spécifié",
          isPaid: invoice.status === "paid",
          tvaAmount: extractMongoValue(invoice.taxAmount) || 0,
          htAmount: extractMongoValue(invoice.subtotal) || 0,
          ttcAmount: extractMongoValue(invoice.totalAmount) || 0,
          matchedKeyword,
          originalInvoiceId: extractMongoValue(invoice._id),
        })
      }
    }
  }

  const insights = calculateInsights(transactions)
  return { transactions, insights }
}

/**
 * Processes invoice data for Charge (Expenses) caisse
 */
export function processChargeData(
  invoices: Invoice[],
  payments: Payment[],
  keywordSettings: KeywordSettings,
  selectedMonth: string,
  selectedYear: string,
): { transactions: CaisseTransaction[]; insights: CaisseInsights } {
  const transactions: CaisseTransaction[] = []

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
    const dateObj = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate)
    const invoiceMonth = (dateObj.getMonth() + 1).toString().padStart(2, "0")
    const invoiceYear = dateObj.getFullYear().toString()
    return invoiceMonth === selectedMonth && invoiceYear === selectedYear
  })

  for (const invoice of filteredInvoices) {
    if (!invoice.items) continue

    for (const item of invoice.items) {
      const { category, matchedKeyword } = categorizeInvoiceItem(item.description, keywordSettings)

      if (category === "charge") {
        const relatedPayment = payments.find((p) => extractMongoValue(p.invoiceId) === extractMongoValue(invoice._id))
        const itemDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
        
        // For charges, use the total amount as expense
        const totalAmount = extractMongoValue(item.total) || 0

        transactions.push({
          id: `${extractMongoValue(invoice._id)}-${item.id || Math.random()}`,
          date: itemDate instanceof Date ? itemDate.toISOString() : new Date(itemDate).toISOString(),
          type: "EXPENSE",
          description: item.description,
          amount: -totalAmount,
          invoiceNumber: invoice.invoiceNumber,
          clientName: getClientName(invoice.clientId),
          category: "CHARGE",
          subcategory: matchedKeyword || "Autre",
          paymentMethod: relatedPayment?.paymentMethod || "Non spécifié",
          isPaid: invoice.status === "paid",
          tvaAmount: extractMongoValue(invoice.taxAmount) || 0,
          htAmount: extractMongoValue(invoice.subtotal) || 0,
          ttcAmount: extractMongoValue(invoice.totalAmount) || 0,
          matchedKeyword,
          originalInvoiceId: extractMongoValue(invoice._id),
        })
      }
    }
  }

  const insights = calculateInsights(transactions)
  return { transactions, insights }
}

/**
 * Processes invoice data for Achat Piece (Parts Purchase) caisse
 */
export function processAchatPieceData(
  invoices: Invoice[],
  payments: Payment[],
  keywordSettings: KeywordSettings,
  selectedMonth: string,
  selectedYear: string,
): { transactions: CaisseTransaction[]; insights: CaisseInsights } {
  const transactions: CaisseTransaction[] = []

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
    const dateObj = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate)
    const invoiceMonth = (dateObj.getMonth() + 1).toString().padStart(2, "0")
    const invoiceYear = dateObj.getFullYear().toString()
    return invoiceMonth === selectedMonth && invoiceYear === selectedYear
  })

  for (const invoice of filteredInvoices) {
    if (!invoice.items) continue

    for (const item of invoice.items) {
      const { category, matchedKeyword } = categorizeInvoiceItem(item.description, keywordSettings)

      if (category === "achatPiece") {
        const relatedPayment = payments.find((p) => extractMongoValue(p.invoiceId) === extractMongoValue(invoice._id))
        const itemDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
        
        // Use achatPiece field for purchase amount, ventePiece for sale amount
        const achatAmount = extractMongoValue(item.achatPiece) || 0
        const venteAmount = extractMongoValue(item.ventePiece) || 0
        
        // Determine if this is income or expense based on invoice type
        const isIncome = invoice.type === "invoice"
        const amount = isIncome ? venteAmount : -achatAmount

        transactions.push({
          id: `${extractMongoValue(invoice._id)}-${item.id || Math.random()}`,
          date: itemDate instanceof Date ? itemDate.toISOString() : new Date(itemDate).toISOString(),
          type: isIncome ? "INCOME" : "EXPENSE",
          description: item.description,
          amount: amount,
          invoiceNumber: invoice.invoiceNumber,
          clientName: getClientName(invoice.clientId),
          category: "PIECE",
          subcategory: matchedKeyword || "Autre",
          paymentMethod: relatedPayment?.paymentMethod || "Non spécifié",
          isPaid: invoice.status === "paid",
          tvaAmount: extractMongoValue(invoice.taxAmount) || 0,
          htAmount: extractMongoValue(invoice.subtotal) || 0,
          ttcAmount: extractMongoValue(invoice.totalAmount) || 0,
          matchedKeyword,
          originalInvoiceId: extractMongoValue(invoice._id),
        })
      }
    }
  }

  const insights = calculateInsights(transactions)
  return { transactions, insights }
}

/**
 * Processes invoice data for Huile (Oil) caisse
 */
export function processHuileData(
  invoices: Invoice[],
  payments: Payment[],
  keywordSettings: KeywordSettings,
  selectedMonth: string,
  selectedYear: string,
): { transactions: CaisseTransaction[]; insights: CaisseInsights } {
  const transactions: CaisseTransaction[] = []

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
    const dateObj = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate)
    const invoiceMonth = (dateObj.getMonth() + 1).toString().padStart(2, "0")
    const invoiceYear = dateObj.getFullYear().toString()
    return invoiceMonth === selectedMonth && invoiceYear === selectedYear
  })

  for (const invoice of filteredInvoices) {
    if (!invoice.items) continue

    for (const item of invoice.items) {
      const { category, matchedKeyword } = categorizeInvoiceItem(item.description, keywordSettings)

      if (category === "huile") {
        const relatedPayment = payments.find((p) => extractMongoValue(p.invoiceId) === extractMongoValue(invoice._id))
        const itemDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
        
        // Use item total for oil transactions
        const totalAmount = extractMongoValue(item.total) || 0
        const isIncome = invoice.type === "invoice"

        transactions.push({
          id: `${extractMongoValue(invoice._id)}-${item.id || Math.random()}`,
          date: itemDate instanceof Date ? itemDate.toISOString() : new Date(itemDate).toISOString(),
          type: isIncome ? "INCOME" : "EXPENSE",
          description: item.description,
          amount: isIncome ? totalAmount : -totalAmount,
          invoiceNumber: invoice.invoiceNumber,
          clientName: getClientName(invoice.clientId),
          category: "HUILE",
          subcategory: matchedKeyword || "Autre",
          paymentMethod: relatedPayment?.paymentMethod || "Non spécifié",
          isPaid: invoice.status === "paid",
          tvaAmount: extractMongoValue(invoice.taxAmount) || 0,
          htAmount: extractMongoValue(invoice.subtotal) || 0,
          ttcAmount: extractMongoValue(invoice.totalAmount) || 0,
          matchedKeyword,
          originalInvoiceId: extractMongoValue(invoice._id),
        })
      }
    }
  }

  const insights = calculateInsights(transactions)
  return { transactions, insights }
}

/**
 * Processes all invoice data for TVA caisse (includes all invoices)
 */
export function processTVAData(
  invoices: Invoice[],
  payments: Payment[],
  selectedMonth: string,
  selectedYear: string,
): { transactions: CaisseTransaction[]; insights: CaisseInsights } {
  const transactions: CaisseTransaction[] = []

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
    const dateObj = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate)
    const invoiceMonth = (dateObj.getMonth() + 1).toString().padStart(2, "0")
    const invoiceYear = dateObj.getFullYear().toString()
    return invoiceMonth === selectedMonth && invoiceYear === selectedYear
  })

  for (const invoice of filteredInvoices) {
    const relatedPayment = payments.find((p) => extractMongoValue(p.invoiceId) === extractMongoValue(invoice._id))
    const itemDate = extractMongoValue(invoice.date) || extractMongoValue(invoice.createdAt)
    
    const totalHT = extractMongoValue(invoice.subtotal) || 0
    const totalTTC = extractMongoValue(invoice.totalAmount) || 0
    const tvaAmount = extractMongoValue(invoice.taxAmount) || 0
    const isIncome = invoice.type === "invoice"

    transactions.push({
      id: extractMongoValue(invoice._id),
      date: itemDate instanceof Date ? itemDate.toISOString() : new Date(itemDate).toISOString(),
      type: isIncome ? "INCOME" : "EXPENSE",
      description: `${isIncome ? "Facture" : "Bon de livraison"} ${invoice.invoiceNumber}`,
      amount: isIncome ? totalTTC : -totalTTC,
      invoiceNumber: invoice.invoiceNumber,
      clientName: getClientName(invoice.clientId),
      category: isIncome ? "VENTE" : "ACHAT",
      subcategory: invoice.type,
      paymentMethod: relatedPayment?.paymentMethod || "Non spécifié",
      isPaid: invoice.status === "paid",
      tvaAmount: Math.abs(tvaAmount),
      htAmount: totalHT,
      ttcAmount: totalTTC,
      originalInvoiceId: extractMongoValue(invoice._id),
    })
  }

  const insights = calculateInsights(transactions)
  return { transactions, insights }
}

/**
 * Calculates insights from transaction data
 */
function calculateInsights(transactions: CaisseTransaction[]): CaisseInsights {
  const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const balance = totalIncome - totalExpense
  const transactionCount = transactions.length
  const averageTransaction = transactionCount > 0 ? (totalIncome + totalExpense) / transactionCount : 0

  // Calculate top categories
  const topCategories = transactions.reduce(
    (acc, t) => {
      const category = t.subcategory || t.category || "Autre"
      acc[category] = (acc[category] || 0) + Math.abs(t.amount)
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate payment methods distribution
  const paymentMethods = transactions.reduce(
    (acc, t) => {
      const method = t.paymentMethod || "Non spécifié"
      acc[method] = (acc[method] || 0) + Math.abs(t.amount)
      return acc
    },
    {} as Record<string, number>,
  )

  // For now, set monthly growth to 0 (would need historical data)
  const monthlyGrowth = 0

  return {
    totalIncome,
    totalExpense,
    balance,
    transactionCount,
    averageTransaction,
    monthlyGrowth,
    topCategories,
    paymentMethods,
  }
}

/**
 * Gets all transactions for a specific caisse type
 */
export function getCaisseTransactions(
  caisseType: CaisseType,
  invoices: Invoice[],
  payments: Payment[],
  keywordSettings: KeywordSettings,
  selectedMonth: string,
  selectedYear: string,
): { transactions: CaisseTransaction[]; insights: CaisseInsights } {
  switch (caisseType) {
    case "beneficeMO":
      return processBeneficeMOData(invoices, payments, keywordSettings, selectedMonth, selectedYear)
    case "charge":
      return processChargeData(invoices, payments, keywordSettings, selectedMonth, selectedYear)
    case "achatPiece":
      return processAchatPieceData(invoices, payments, keywordSettings, selectedMonth, selectedYear)
    case "huile":
      return processHuileData(invoices, payments, keywordSettings, selectedMonth, selectedYear)
    case "tva":
      return processTVAData(invoices, payments, selectedMonth, selectedYear)
    default:
      return { transactions: [], insights: calculateInsights([]) }
  }
}

/**
 * Export transactions to Excel format (returns data structure for Excel export)
 */
export function exportTransactionsToExcel(transactions: CaisseTransaction[], caisseType: string) {
  const headers = [
    "Date",
    "Type",
    "Description",
    "Montant",
    "N° Facture",
    "Client/Fournisseur",
    "Catégorie",
    "Sous-catégorie",
    "Mode de paiement",
    "Payé",
    "Montant HT",
    "TVA",
    "Montant TTC",
    "Mot-clé correspondant",
  ]

  const data = transactions.map((transaction) => [
    new Date(transaction.date).toLocaleDateString("fr-FR"),
    transaction.type === "INCOME" ? "Recette" : "Dépense",
    transaction.description,
    transaction.amount,
    transaction.invoiceNumber || "",
    transaction.clientName || "",
    transaction.category || "",
    transaction.subcategory || "",
    transaction.paymentMethod || "",
    transaction.isPaid ? "Oui" : "Non",
    transaction.htAmount || 0,
    transaction.tvaAmount || 0,
    transaction.ttcAmount || 0,
    transaction.matchedKeyword || "",
  ])

  return {
    filename: `${caisseType}_${new Date().toISOString().split("T")[0]}.xlsx`,
    headers,
    data,
  }
}