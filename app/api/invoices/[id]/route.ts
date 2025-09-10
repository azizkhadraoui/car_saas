import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/lib/models/Invoice"
import Payment from "@/lib/models/Payment" // Add Payment model import
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
    const invoice = await Invoice.findOne({ _id: id, companyId }).populate("clientId")
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }
    return NextResponse.json(invoice, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch invoice" }, { status: 500 })
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
    const invoiceData = await req.json()
    
    // Ensure all invoice items have the proper structure including tarifTolier
    if (invoiceData.items && Array.isArray(invoiceData.items)) {
      invoiceData.items = invoiceData.items.map((item: any) => ({
        description: item.description || "",
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        achatPiece: item.achatPiece || 0,
        ventePiece: item.ventePiece || item.unitPrice || 0,
        benefits: item.benefits || 0,
        mod: item.mod || 0,
        tarifTolier: item.tarifTolier || 0, // Ensure tarifTolier is included
      }))
    }
    
    const updatedInvoice = await Invoice.findOneAndUpdate({ _id: id, companyId }, invoiceData, {
      new: true,
      runValidators: true,
    }).populate("clientId")
    
    if (!updatedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }
    return NextResponse.json(updatedInvoice, { status: 200 })
  } catch (error: any) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: error.message || "Failed to update invoice" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const { id } = await context.params

    // First, check if the invoice exists
    const invoiceToDelete = await Invoice.findOne({ _id: id, companyId })
    if (!invoiceToDelete) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Delete all payments associated with this invoice
    const deletedPayments = await Payment.deleteMany({ 
      invoiceId: id, 
      companyId 
    })

    // Then delete the invoice
    const deletedInvoice = await Invoice.findOneAndDelete({ _id: id, companyId })

    return NextResponse.json({ 
      message: "Invoice and associated payments deleted successfully",
      deletedPaymentsCount: deletedPayments.deletedCount
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error deleting invoice and payments:", error)
    return NextResponse.json({ error: error.message || "Failed to delete invoice and payments" }, { status: 500 })
  }
}