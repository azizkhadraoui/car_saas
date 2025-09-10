import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Client from "@/lib/models/Client"
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

    const clients = await Client.find({ companyId }).sort({ createdAt: -1 })
    return NextResponse.json(clients, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch clients" }, { status: 500 })
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

    const clientData = await req.json()
    const newClient = new Client({ ...clientData, companyId })
    await newClient.save()
    return NextResponse.json(newClient, { status: 201 })
  } catch (error: any) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: error.message || "Failed to create client" }, { status: 500 })
  }
}
