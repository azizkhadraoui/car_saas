import mongoose, { Schema, type Document, type Model } from "mongoose"
import type { Invoice, Company } from "@/types" // Import types for reference

export interface IPayment extends Document {
  invoiceId: mongoose.Types.ObjectId | Invoice // Reference to Invoice model
  companyId: mongoose.Types.ObjectId | Company // Reference to Company model
  amount: number
  date: Date
  method: string // e.g., "Cash", "Credit Card", "Bank Transfer"
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Invoice ID is required"],
      index: true, // Index for faster queries by invoice
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true, // Index for faster queries by company
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 0,
    },
    date: {
      type: Date,
      required: [true, "Payment date is required"],
    },
    method: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

// Post-save hook to update the associated invoice's amountPaid and status
PaymentSchema.post("save", async (doc, next) => {
  const InvoiceModel = mongoose.models.Invoice || mongoose.model("Invoice")
  await InvoiceModel.findByIdAndUpdate(doc.invoiceId, { $inc: { amountPaid: doc.amount } }, { new: true })
  next()
})

// Post-delete hook to update the associated invoice's amountPaid and status
PaymentSchema.post("findOneAndDelete", async (doc, next) => {
  if (doc) {
    const InvoiceModel = mongoose.models.Invoice || mongoose.model("Invoice")
    await InvoiceModel.findByIdAndUpdate(doc.invoiceId, { $inc: { amountPaid: -doc.amount } }, { new: true })
  }
  next()
})

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema)

export default Payment
