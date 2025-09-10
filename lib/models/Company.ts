import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ICompany extends Document {
  name: string
  address: string
  phone: string
  email: string
  logoUrl?: string
  ownerId: mongoose.Types.ObjectId // Reference to the User who owns this company
  createdAt: Date
  updatedAt: Date
}

const CompanySchema: Schema<ICompany> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Company address is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Company phone is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Company email is required"],
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },
  },
  {
    timestamps: true,
  },
)

const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema)

export default Company
