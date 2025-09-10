import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Settings from "@/lib/models/Settings"
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

    let settings = await Settings.findOne({ companyId })
    if (!settings) {
      // If settings don't exist, create default ones
      settings = new Settings({
        companyId,
        invoicePreferences: {
          dateFormat: "YYYY-MM-DD",
          defaultTaxPercentage: 19,
          showDueDate: false,
          showTax: true,
          showDiscount: false,
          showNotes: true,
          language: "fr",
          currency: "TND", // ✅ Added currency field
        },
      })
      await settings.save()
    }
    return NextResponse.json(settings.invoicePreferences, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 })
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

    const preferencesData = await req.json()
    const updatedSettings = await Settings.findOneAndUpdate(
      { companyId },
      { $set: { invoicePreferences: preferencesData } },
      { new: true, runValidators: true, upsert: true },
    )

    if (!updatedSettings) {
      return NextResponse.json({ error: "Settings not found or failed to update" }, { status: 404 })
    }
    return NextResponse.json(updatedSettings.invoicePreferences, { status: 200 })
  } catch (error: any) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 })
  }
}
