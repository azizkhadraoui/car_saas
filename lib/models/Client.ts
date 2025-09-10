import mongoose, { Schema, type Document, type Model } from "mongoose"
import type { Company } from "@/types"

// Define client type enum
export enum ClientType {
  INDIVIDUAL = "individual",
  COMPANY = "company"
}

// Vehicle interface for multiple vehicles per client
export interface IVehicle {
  make?: string
  model?: string
  year?: number
  licensePlate: string
  _id?: mongoose.Types.ObjectId
}

export interface IClient extends Document {
  companyId: mongoose.Types.ObjectId | Company // Reference to Company model (the business owner)
  clientType: ClientType // Whether this client is an individual or a company
  name: string
  stamp: string
  address: string
  phone: string
  email?: string
  vehicles: IVehicle[] // Array of vehicles for this client
  createdAt: Date
  updatedAt: Date
}

// Vehicle schema for embedded documents
const VehicleSchema = new Schema<IVehicle>({
  make: {
    type: String,
    trim: true,
  },
  model: {
    type: String,
    trim: true,
  },
  year: {
    type: Number,
    min: [1900, "Year must be after 1900"],
    max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
  },
  licensePlate: {
    type: String,
    required: [true, "License plate is required"],
    trim: true,
    uppercase: true,
  }
}, { _id: true })

const ClientSchema: Schema<IClient> = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true, // Index for faster queries by company
    },
    clientType: {
      type: String,
      enum: Object.values(ClientType),
      required: [true, "Client type is required"],
      default: ClientType.INDIVIDUAL,
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    stamp: {
      type: String,
      required: [true, "Stamp name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Client address is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Client phone is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
    },
    vehicles: [VehicleSchema], // Array of vehicles
  },
  {
    timestamps: true,
  },
)

// Compound index for unique license plates within the same company
ClientSchema.index({ companyId: 1, "vehicles.licensePlate": 1 }, { 
  unique: true, 
  partialFilterExpression: { "vehicles.licensePlate": { $exists: true } }
})

const Client: Model<IClient> = mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema)

export default Client