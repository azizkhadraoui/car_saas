// lib/models/SoldCar.ts
import mongoose, { Document, Schema } from "mongoose"

export interface ISoldCar extends Document {
  _id: string
  licensePlate: string
  brand: string
  model: string
  year: number
  color: string
  salePrice: number
  commission: number
  saleDate: Date
  clientId?: mongoose.Types.ObjectId | null
  description?: string
  companyId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SoldCarSchema: Schema = new Schema(
  {
    licensePlate: {
      type: String,
      required: [true, "License plate is required"],
      trim: true,
      uppercase: true,
      index: true
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      index: true
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
      index: true
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1900, "Year must be after 1900"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
      index: true
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true
    },
    salePrice: {
      type: Number,
      required: [true, "Sale price is required"],
      min: [0, "Sale price cannot be negative"]
    },
    commission: {
      type: Number,
      required: [true, "Commission is required"],
      min: [0, "Commission cannot be negative"]
    },
    saleDate: {
      type: Date,
      required: [true, "Sale date is required"],
      index: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxLength: [1000, "Description cannot exceed 1000 characters"]
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Company ID is required"],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Compound index for unique license plate per company
SoldCarSchema.index({ licensePlate: 1, companyId: 1 }, { unique: true })

// Index for common queries
SoldCarSchema.index({ companyId: 1, saleDate: -1 })
SoldCarSchema.index({ companyId: 1, brand: 1, model: 1 })
SoldCarSchema.index({ companyId: 1, clientId: 1 })

// Virtual for commission rate percentage
SoldCarSchema.virtual('commissionRate').get(function () {
  if (this.salePrice === 0) return 0
  return ((this.commission / this.salePrice) * 100).toFixed(2)
})

// Virtual for formatted commission
SoldCarSchema.virtual('commissionFormatted').get(function () {
  return `+${this.commission}`
})

const SoldCar = mongoose.models.SoldCar || mongoose.model<ISoldCar>("SoldCar", SoldCarSchema)

export default SoldCar