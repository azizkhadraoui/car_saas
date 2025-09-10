// app/api/payments/[id]/route.ts
import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Payment from "@/lib/models/Payment"
import Invoice from "@/lib/models/Invoice"
import { authMiddleware } from "@/lib/middleware/auth"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const { id } = await params
    const payment = await Payment.findOne({ _id: id, companyId })
    
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }
    
    return NextResponse.json(payment, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch payment" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const { id } = await params
    const paymentData = await req.json()
    
    // Find the payment to get the old amount and invoice ID
    const oldPayment = await Payment.findOne({ _id: id, companyId })
    if (!oldPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update the payment
    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: id, companyId }, 
      paymentData, 
      { new: true, runValidators: true }
    )

    if (!updatedPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Recalculate invoice amount paid
    const allPayments = await Payment.find({ invoiceId: oldPayment.invoiceId, companyId })
    const totalPaid = allPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Update the invoice with new amount paid
    await Invoice.findOneAndUpdate(
      { _id: oldPayment.invoiceId, companyId },
      { amountPaid: totalPaid },
      { new: true }
    )

    return NextResponse.json(updatedPayment, { status: 200 })
  } catch (error: any) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const { id } = await params
    
    // Find the payment first to get invoice ID
    const payment = await Payment.findOne({ _id: id, companyId })
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Delete the payment
    const deletedPayment = await Payment.findOneAndDelete({ _id: id, companyId })
    
    // Recalculate invoice amount paid
    const remainingPayments = await Payment.find({ invoiceId: payment.invoiceId, companyId })
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0)

    // Update the invoice with new amount paid
    await Invoice.findOneAndUpdate(
      { _id: payment.invoiceId, companyId },
      { amountPaid: totalPaid },
      { new: true }
    )

    return NextResponse.json({ 
      message: "Payment deleted successfully",
      deletedPayment 
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: error.message || "Failed to delete payment" }, { status: 500 })
  }
}