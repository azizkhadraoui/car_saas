import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/lib/models/Invoice"
import { authMiddleware } from "@/lib/middleware/auth"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function POST(req: NextRequest) {
  await dbConnect()

  // Check authentication
  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    // Get company ID from JWT token
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    // Get invoice type from request body
    const { type } = await req.json()

    // Validate invoice type
    if (!type || !['invoice', 'bon_de_livraison'].includes(type)) {
      return NextResponse.json({ error: 'Invalid invoice type. Must be "invoice" or "bon_de_livraison"' }, { status: 400 })
    }

    // Get current year
    const currentYear = new Date().getFullYear()

    // Find the highest invoice number for this type, company, and year
    const latestInvoice = await Invoice.findOne({
      type: type,
      companyId: companyId,
      invoiceNumber: new RegExp(`^${currentYear}-`)
    }).sort({ invoiceNumber: -1 })

    let nextNumber = 1

    if (latestInvoice) {
      // Extract the number part after the year (e.g., "2024-5" -> "5")
      const invoiceNumberParts = latestInvoice.invoiceNumber.split('-')
      
      if (invoiceNumberParts.length >= 2) {
        const currentHighest = parseInt(invoiceNumberParts[1], 10)
        
        if (!isNaN(currentHighest)) {
          nextNumber = currentHighest + 1
        }
      }
    }

    return NextResponse.json({ nextNumber }, { status: 200 })

  } catch (error: any) {
    console.error("Error getting next invoice number:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to get next invoice number" 
    }, { status: 500 })
  }
}