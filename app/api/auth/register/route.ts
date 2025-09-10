import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Company from "@/lib/models/Company"
import Settings from "@/lib/models/Settings"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function POST(req: Request) {
  await dbConnect()

  try {
    const { email, password, companyName, companyAddress, companyPhone, companyEmail } = await req.json()

    if (!email || !password || !companyName || !companyAddress || !companyPhone || !companyEmail) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Start a session for transaction
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // 1. Create User first (without companyId initially)
      const newUser = new User({
        email,
        password,
        role: "admin", // First user is admin
        // companyId will be set after company creation
      })
      await newUser.save({ session })

      // 2. Create Company with the user's ID as ownerId
      const newCompany = new Company({
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
        ownerId: newUser._id, // Set ownerId from the created user
      })
      await newCompany.save({ session })

      // 3. Update user with companyId
      newUser.companyId = newCompany._id
      await newUser.save({ session })

      // 4. Create default settings for the new company
      const defaultSettings = new Settings({
        companyId: newCompany._id,
        invoicePreferences: {
          dateFormat: "YYYY-MM-DD",
          defaultTaxPercentage: 10,
          showDueDate: true,
          showTax: true,
          showDiscount: true,
          showNotes: true,
          language: "en",
        },
      })
      await defaultSettings.save({ session })

      await session.commitTransaction()
      session.endSession()

      // Generate token for immediate login
      const token = jwt.sign({ id: newUser._id, companyId: newUser.companyId, role: newUser.role }, JWT_SECRET, {
        expiresIn: "1h",
      })

      const response = NextResponse.json(
        {
          message: "Registration successful",
          user: {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            companyId: newUser.companyId,
          },
          company: {
            id: newCompany._id,
            name: newCompany.name,
            address: newCompany.address,
            phone: newCompany.phone,
            email: newCompany.email,
            logoUrl: newCompany.logoUrl,
          },
        },
        { status: 201 },
      )

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1, // 1 hour
        path: "/",
      })

      return response
    } catch (transactionError) {
      await session.abortTransaction()
      session.endSession()
      console.error("Registration transaction failed:", transactionError)
      return NextResponse.json({ error: "Registration failed due to a server error." }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}