import mongoose, { Schema, type Document, type Model } from "mongoose"
import type { Company, Client, InvoiceItem } from "@/types" // Import types for reference

// Ensure Client model is registered
if (!mongoose.models.Client) {
  // Import Client model to ensure it's registered
  require("./Client")
}

export interface IInvoice extends Document {
  companyId: mongoose.Types.ObjectId | Company // Reference to Company model
  clientId: mongoose.Types.ObjectId | Client // Reference to Client model
  invoiceNumber: string
  license: string
  originalDeliveryNoteNumber: String
  date: Date
  dueDate: Date
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
  createdAt: Date
  updatedAt: Date
}

const InvoiceItemSchema: Schema<InvoiceItem> = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    achatPiece: { type: Number, min: 0 },
    benefits: { type: Number, min: 0 },
    mod: { type: Number, min: 0 },
    ventePiece: { type: Number, min: 0 },
    tarifTolier: { type: Number, min: 0 }, // Added tarifTolier field
  },
  { _id: false }, // Do not create _id for subdocuments
)

const InvoiceSchema: Schema<IInvoice> = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true, // Index for faster queries by company
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client ID is required"],
      index: true, // Index for faster queries by client
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: false, // Not unique globally, but unique per company
      trim: true,
    },
    license: {
      type: String,
      unique: false, // Not unique globally, but unique per company
      trim: true,
    },
    originalDeliveryNoteNumber: {
      type: String,
      unique: false, // Not unique globally, but unique per company
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Invoice date is required"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    items: {
      type: [InvoiceItemSchema],
      required: [true, "Invoice must have at least one item"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    paymentType: {
      type: String,
      enum: ["HT", "TTC"],
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["invoice", "bon_de_livraison"],
      required: true,
      default: "invoice",
    },
  },
  {
    timestamps: true,
  },
)

// Pre-save hook to update status based on amountPaid and dueDate
InvoiceSchema.pre("save", function (next) {
  if (this.isModified("amountPaid") || this.isModified("totalAmount")) {
    if (this.amountPaid >= this.totalAmount) {
      this.status = "paid"
    } else if (this.amountPaid < this.totalAmount && new Date() > this.dueDate) {
      this.status = "overdue"
    } else {
      this.status = "pending"
    }
  } else if (this.isModified("dueDate") && new Date() > this.dueDate && this.amountPaid < this.totalAmount) {
    this.status = "overdue"
  }
  next()
})

const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema)

export default Invoice