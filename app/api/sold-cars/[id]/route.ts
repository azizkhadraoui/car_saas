// app/api/sold-cars/[id]/route.ts
import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SoldCar from "@/lib/models/SoldCar"
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
    const { id } = await params // Await params before using
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const soldCar = await SoldCar.findOne({ 
      _id: id, 
      companyId 
    }).populate("clientId", "name email phone")

    if (!soldCar) {
      return NextResponse.json({ error: "Sold car not found" }, { status: 404 })
    }

    return NextResponse.json(soldCar, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching sold car:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch sold car" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const { id } = await params // Await params before using
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const carData = await req.json()
    
    // Validate required fields
    const requiredFields = ['licensePlate', 'brand', 'model', 'year', 'color', 'purchasePrice', 'salePrice', 'saleDate']
    const missingFields = requiredFields.filter(field => !carData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if license plate already exists for another car
    const existingCar = await SoldCar.findOne({ 
      licensePlate: carData.licensePlate, 
      companyId,
      _id: { $ne: id }
    })
    
    if (existingCar) {
      return NextResponse.json(
        { error: "A car with this license plate already exists" },
        { status: 409 }
      )
    }

    // Convert clientId if it's "none" or empty
    if (carData.clientId === "none" || carData.clientId === "") {
      carData.clientId = null
    }

    // Calculate profit
    carData.profit = carData.salePrice - carData.purchasePrice

    const updatedSoldCar = await SoldCar.findOneAndUpdate(
      { _id: id, companyId },
      carData,
      { new: true, runValidators: true }
    ).populate("clientId", "name email phone")

    if (!updatedSoldCar) {
      return NextResponse.json({ error: "Sold car not found" }, { status: 404 })
    }

    return NextResponse.json(updatedSoldCar, { status: 200 })
  } catch (error: any) {
    console.error("Error updating sold car:", error)
    return NextResponse.json({ error: error.message || "Failed to update sold car" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect()

  const authResult = await authMiddleware(req)
  if (authResult.status !== 200) {
    return authResult
  }

  try {
    const { id } = await params // Await params before using
    const token = req.cookies.get("token")?.value
    const decoded: any = jwt.verify(token!, JWT_SECRET)
    const companyId = decoded.companyId

    const deletedSoldCar = await SoldCar.findOneAndDelete({ 
      _id: id, 
      companyId 
    })

    if (!deletedSoldCar) {
      return NextResponse.json({ error: "Sold car not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Sold car deleted successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting sold car:", error)
    return NextResponse.json({ error: error.message || "Failed to delete sold car" }, { status: 500 })
  }
}