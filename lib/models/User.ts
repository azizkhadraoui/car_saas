import mongoose, { Schema, type Document, type Model } from "mongoose"
import bcrypt from "bcryptjs"
import type { Company } from "@/types" // Import Company type if needed for reference

export interface IUser extends Document {
  email: string
  password?: string // Password can be optional if using external auth, but for local it's required
  role: "admin" | "user"
  companyId: mongoose.Types.ObjectId | Company // Reference to Company model
  createdAt: Date
  updatedAt: Date
  comparePassword: (candidatePassword: string) => Promise<boolean>
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Do not return password by default
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: function(this: IUser) {
        // Only require companyId if this is not a new document being created
        // This allows creation during registration flow where user is created first
        return !this.isNew
      },
      validate: {
        validator: function(this: IUser, value: any) {
          // Always validate that companyId exists if the document is not new
          // This ensures existing users always have a companyId
          if (!this.isNew && !value) {
            return false
          }
          return true
        },
        message: "Company ID is required for existing users"
      }
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password!, salt)
  next()
})

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password!)
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User