import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Company from "@/lib/models/Company"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function GET(req: NextRequest) {
  await dbConnect()

  const token = req.cookies.get("token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password") // Exclude password

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const company = await Company.findById(user.companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found for this user" }, { status: 404 })
    }

    return NextResponse.json(
      {
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
  } catch (error: any) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }
}
