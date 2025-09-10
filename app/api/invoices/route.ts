import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/lib/models/Invoice"
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

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("clientId")
    const type = searchParams.get("type") as "invoice" | "bon_de_livraison" | null
    const status = searchParams.get("status") as "pending" | "paid" | "overdue" | "cancelled" | null

    const query: any = { companyId }
    if (clientId) query.clientId = clientId
    if (type) query.type = type
    if (status) query.status = status

    const invoices = await Invoice.find(query).sort({ createdAt: -1 }).populate("clientId") // Populate client details
    return NextResponse.json({ invoices }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const invoiceData = await req.json()
    console.log(invoiceData);
    const newInvoice = new Invoice({ ...invoiceData, companyId })
    await newInvoice.save()
    return NextResponse.json(newInvoice, { status: 201 })
  } catch (error: any) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 })
  }
}
