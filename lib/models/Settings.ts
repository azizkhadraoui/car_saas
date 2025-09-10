import mongoose, { Schema, type Document, type Model } from "mongoose"
import type { Company, InvoicePreferences } from "@/types" // Import types for reference

export interface ISettings extends Document {
  companyId: mongoose.Types.ObjectId | Company // Reference to Company model
  invoicePreferences: InvoicePreferences
  createdAt: Date
  updatedAt: Date
}

const InvoicePreferencesSchema: Schema<InvoicePreferences> = new Schema(
  {
    dateFormat: { type: String, default: "YYYY-MM-DD" },
    defaultTaxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    showDueDate: { type: Boolean, default: true },
    showTax: { type: Boolean, default: true },
    showDiscount: { type: Boolean, default: true },
    showNotes: { type: Boolean, default: true },
    language: { type: String, enum: ["en", "fr"], default: "en" },
    currency: { type: String, default: "TND" },

  },
  { _id: false }, // Do not create _id for subdocuments
)

const SettingsSchema: Schema<ISettings> = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      unique: true, // Each company has only one settings document
      index: true,
    },
    invoicePreferences: {
      type: InvoicePreferencesSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema)

export default Settings
