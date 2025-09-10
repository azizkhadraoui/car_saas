// app/api/sold-cars/route.ts
import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SoldCar from "@/lib/models/SoldCar"
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
    const brand = searchParams.get("brand")
    const model = searchParams.get("model")
    const year = searchParams.get("year")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const query: any = { companyId }
    
    // Add filters if provided
    if (clientId) query.clientId = clientId
    if (brand) query.brand = { $regex: brand, $options: 'i' }
    if (model) query.model = { $regex: model, $options: 'i' }
    if (year) query.year = parseInt(year)
    
    // Date range filter
    if (startDate || endDate) {
      query.saleDate = {}
      if (startDate) query.saleDate.$gte = new Date(startDate)
      if (endDate) query.saleDate.$lte = new Date(endDate)
    }

    const soldCars = await SoldCar.find(query)
      .sort({ saleDate: -1, createdAt: -1 })
      .populate("clientId", "name email phone") // Populate client details
      
    return NextResponse.json({ soldCars }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching sold cars:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch sold cars" }, { status: 500 })
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

    const carData = await req.json()
    
    // Validate required fields - updated for new structure
    const requiredFields = ['licensePlate', 'brand', 'model', 'year', 'color', 'salePrice', 'commission', 'saleDate']
    const missingFields = requiredFields.filter(field => !carData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (carData.salePrice < 0) {
      return NextResponse.json(
        { error: "Sale price cannot be negative" },
        { status: 400 }
      )
    }

    if (carData.commission < 0) {
      return NextResponse.json(
        { error: "Commission cannot be negative" },
        { status: 400 }
      )
    }

    if (carData.year < 1900 || carData.year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: "Year must be between 1900 and next year" },
        { status: 400 }
      )
    }

    // Check if license plate already exists for this company
    const existingCar = await SoldCar.findOne({ 
      licensePlate: carData.licensePlate, 
      companyId 
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

    // Create new sold car with simplified structure
    const newSoldCar = new SoldCar({ 
      ...carData, 
      companyId
    })
    
    await newSoldCar.save()
    
    // Populate client details before returning
    await newSoldCar.populate("clientId", "name email phone")
    
    return NextResponse.json(newSoldCar, { status: 201 })
  } catch (error: any) {
    console.error("Error creating sold car:", error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A car with this license plate already exists for your company" },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: error.message || "Failed to create sold car" }, { status: 500 })
  }
}