import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Company from "@/lib/models/Company"
import { authMiddleware } from "@/lib/middleware/auth"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function GET(req: NextRequest) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const company = await Company.findById(companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    return NextResponse.json(company, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching company:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch company" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const companyData = await req.json()
    const updatedCompany = await Company.findByIdAndUpdate(companyId, companyData, {
      new: true,
      runValidators: true,
    })
    if (!updatedCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    return NextResponse.json(updatedCompany, { status: 200 })
  } catch (error: any) {
    console.error("Error updating company:", error)
    return NextResponse.json({ error: error.message || "Failed to update company" }, { status: 500 })
  }
}
