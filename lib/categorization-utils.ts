export interface KeywordSettings {
  beneficeMO: {
    keywords: string[]
    newKeyword: string
  }
  charge: {
    keywords: string[]
    newKeyword: string
  }
  achatPiece: {
    keywords: string[]
    newKeyword: string
  }
  huile: {
    keywords: string[]
    newKeyword: string
  }
}

export type CaisseType = "beneficeMO" | "charge" | "achatPiece" | "huile" | "tva"

export interface CategorizedInvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  achatPiece?: number
  benefits?: number
  mod?: number
  ventePiece?: number
  category: CaisseType
  matchedKeyword?: string
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

/**
 * Categorizes an invoice item based on keywords
 */
export function categorizeInvoiceItem(
  description: string,
  keywordSettings: KeywordSettings,
): { category: CaisseType; matchedKeyword?: string } {
  const normalizedDescription = description.toLowerCase().trim()

  // Check each category for keyword matches
  for (const [categoryKey, categoryData] of Object.entries(keywordSettings)) {
    for (const keyword of categoryData.keywords) {
      if (normalizedDescription.includes(keyword.toLowerCase())) {
        return {
          category: categoryKey as CaisseType,
          matchedKeyword: keyword,
        }
      }
    }
  }

  // Default to TVA if no match found
  return { category: "tva" }
}

/**
 * Processes invoice data and categorizes all items
 */
export function processInvoiceData(
  invoiceItems: any[],
  keywordSettings: KeywordSettings,
): {
  categorizedItems: CategorizedInvoiceItem[]
  summary: Record<CaisseType, { count: number; totalAmount: number; totalAchat: number; totalVente: number }>
} {
  const categorizedItems: CategorizedInvoiceItem[] = []
  const summary: Record<CaisseType, { count: number; totalAmount: number; totalAchat: number; totalVente: number }> = {
    beneficeMO: { count: 0, totalAmount: 0, totalAchat: 0, totalVente: 0 },
    charge: { count: 0, totalAmount: 0, totalAchat: 0, totalVente: 0 },
    achatPiece: { count: 0, totalAmount: 0, totalAchat: 0, totalVente: 0 },
    huile: { count: 0, totalAmount: 0, totalAchat: 0, totalVente: 0 },
    tva: { count: 0, totalAmount: 0, totalAchat: 0, totalVente: 0 },
  }

  for (const item of invoiceItems) {
    const { category, matchedKeyword } = categorizeInvoiceItem(item.description, keywordSettings)

    const categorizedItem: CategorizedInvoiceItem = {
      id: item.id || `${Date.now()}-${Math.random()}`,
      description: item.description,
      quantity: extractMongoValue(item.quantity) || 1,
      unitPrice: extractMongoValue(item.unitPrice) || 0,
      total: extractMongoValue(item.total) || 0,
      achatPiece: extractMongoValue(item.achatPiece) || 0,
      benefits: extractMongoValue(item.benefits) || 0,
      mod: extractMongoValue(item.mod) || 0,
      ventePiece: extractMongoValue(item.ventePiece) || 0,
      category,
      matchedKeyword,
    }

    categorizedItems.push(categorizedItem)

    // Update summary
    summary[category].count += 1
    summary[category].totalAmount += categorizedItem.total
    summary[category].totalAchat += categorizedItem.achatPiece || 0
    summary[category].totalVente += categorizedItem.ventePiece || 0
  }

  return { categorizedItems, summary }
}

/**
 * Filters categorized items by caisse type
 */
export function filterItemsByCategory(
  categorizedItems: CategorizedInvoiceItem[],
  category: CaisseType,
): CategorizedInvoiceItem[] {
  return categorizedItems.filter((item) => item.category === category)
}

/**
 * Gets default keyword settings
 */
export function getDefaultKeywordSettings(): KeywordSettings {
  return {
    beneficeMO: {
      keywords: [
        "main d'oeuvre",
        "réparation",
        "diagnostic",
        "vidange",
        "révision",
        "entretien",
        "montage",
        "démontage",
        "main-d'œuvre",
        "main d'œuvre",
        "travail",
        "service"
      ],
      newKeyword: "",
    },
    charge: {
      keywords: [
        "loyer",
        "électricité",
        "eau",
        "téléphone",
        "assurance",
        "carburant",
        "fourniture bureau",
        "frais bancaire",
        "charge",
        "coût",
        "dépense",
        "frais"
      ],
      newKeyword: "",
    },
    achatPiece: {
      keywords: [
        "pièce",
        "filtre",
        "plaquette",
        "disque",
        "amortisseur",
        "courroie",
        "bougie",
        "batterie",
        "pièce détachée",
        "composant",
        "accessoire"
      ],
      newKeyword: "",
    },
    huile: {
      keywords: [
        "huile", 
        "lubrifiant", 
        "5w30", 
        "5w40", 
        "10w40", 
        "synthétique", 
        "semi-synthétique", 
        "minérale",
        "huile moteur",
        "huile de transmission",
        "graisse"
      ],
      newKeyword: "",
    },
  }
}

/**
 * Calculates totals for a specific caisse type from invoice items
 */
export function calculateCaisseTotals(
  invoiceItems: CategorizedInvoiceItem[],
  caisseType: CaisseType
): {
  totalIncome: number
  totalExpense: number
  totalBenefit: number
  itemCount: number
} {
  const filteredItems = filterItemsByCategory(invoiceItems, caisseType)
  
  let totalIncome = 0
  let totalExpense = 0
  let totalBenefit = 0
  
  filteredItems.forEach(item => {
    switch (caisseType) {
      case 'beneficeMO':
        totalIncome += (item.mod || 0) + (item.benefits || 0)
        break
      case 'achatPiece':
        totalExpense += item.achatPiece || 0
        totalIncome += item.ventePiece || 0
        totalBenefit += (item.ventePiece || 0) - (item.achatPiece || 0)
        break
      case 'huile':
        totalIncome += item.total
        break
      case 'charge':
        totalExpense += item.total
        break
      case 'tva':
        totalIncome += item.total
        break
    }
  })
  
  return {
    totalIncome,
    totalExpense,
    totalBenefit,
    itemCount: filteredItems.length
  }
}