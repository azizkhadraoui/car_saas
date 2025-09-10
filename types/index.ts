// Updated Types with enhanced Client structure
export interface User {
  id: string
  email: string
  role: "admin" | "user"
  companyId?: string
}

export interface Company {
  id: string
  name: string
  address: string
  phone: string
  email: string
  logoUrl?: string
  ownerId: string
}

export enum ClientType {
  INDIVIDUAL = "individual",
  COMPANY = "company"
}

export interface Vehicle {
  _id?: string
  make?: string
  model?: string
  year?: number
  licensePlate: string
}

export interface Client {
  id: string
  _id?: string
  companyId: string
  clientType: ClientType
  name: string
  stamp: string
  address: string
  phone: string
  email?: string
  vehicles: Vehicle[]
  createdAt: string
  updatedAt: string
  
  // Backward compatibility fields (will be deprecated)
  vehicleMake?: string
  vehicleModel?: string
  vehicleYear?: number
  licensePlate?: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  achatPiece?: number
  benefits?: number
  mod?: number
  ventePiece?: number
  tarifTolier?: number  // Added tarifTolier field
}

export interface Invoice {
  id: string
  companyId: string
  clientId: string
  license: string
  invoiceNumber: string
  originalDeliveryNoteNumber: String
  date: string
  dueDate: string
  number: string
  items: InvoiceItem[]
  subtotal: number
  taxPercentage: number
  taxAmount: number
  discountPercentage: number
  discountAmount: number
  totalAmount: number
  amountPaid: number
  paymentType?: "HT" | "TTC" | null // Payment type for the entire invoice
  status: "pending" | "paid" | "overdue" | "cancelled"
  notes?: string
  type: "invoice" | "bon_de_livraison"
  createdAt: string
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number // TTC amount (main amount for calculations)
  amountHT?: number // HT amount
  paymentType?: "HT" | "TTC" // Type of payment entered by user
  taxPercentage?: number // Tax percentage at time of payment
  date: string
  method: string
  reference?: string
  companyId: string
  createdAt?: string
  updatedAt?: string
  notes?: string
}

export interface InvoicePreferences {
  dateFormat: string
  defaultTaxPercentage: number
  showDueDate: boolean
  showTax: boolean
  showDiscount: boolean
  showNotes: boolean
  language: "en" | "fr"
  currency: string
}

export interface Settings {
  id: string
  companyId: string
  invoicePreferences: InvoicePreferences
}