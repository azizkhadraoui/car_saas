import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Company from "@/lib/models/Company"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function POST(req: Request) {
  await dbConnect()

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await User.findOne({ email }).select("+password") // Select password explicitly
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Fetch company details
    const company = await Company.findById(user.companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found for this user" }, { status: 404 })
    }

    const token = jwt.sign({ id: user._id, companyId: user.companyId, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    })

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
        company: {
          id: company._id,
          name: company.name,
          address: company.address,
          phone: company.phone,
          email: company.email,
          logoUrl: company.logoUrl,
        },
      },
      { status: 200 },
    )

    // Set HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 4, // 1 hour
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}
