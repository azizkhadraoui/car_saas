import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Payment from "@/lib/models/Payment"
import Invoice from "@/lib/models/Invoice"
import { authMiddleware } from "@/lib/middleware/auth"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function GET(req: NextRequest) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) return authResult

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get("invoiceId")

    const query: any = { companyId }
    if (invoiceId) query.invoiceId = invoiceId

    const payments = await Payment.find(query).sort({ date: -1 })
    return NextResponse.json(payments, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) return authResult

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const paymentData = await req.json()
    const newPayment = new Payment({ ...paymentData, companyId })
    await newPayment.save()

    // Fetch all payments for the same invoice
    const invoiceId = newPayment.invoiceId
    const payments = await Payment.find({ invoiceId })
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    // Fetch the invoice
    const invoice = await Invoice.findById(invoiceId)
    if (invoice) {
      const totalDue = invoice.total || 0
      const today = new Date()
      let status: "pending" | "paid" | "overdue" | "cancelled" = "pending"

      if (totalPaid >= totalDue) {
        status = "paid"
      } else if (today > new Date(invoice.dueDate)) {
        status = "overdue"
      } else {
        status = "pending"
      }

      invoice.status = status
      await invoice.save()
    }

    return NextResponse.json(newPayment, { status: 201 })
  } catch (error: any) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: error.message || "Failed to create payment" }, { status: 500 })
  }
}
