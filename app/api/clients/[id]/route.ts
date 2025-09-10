import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Client from "@/lib/models/Client"
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

    // Await params before using
    const { id } = await params
    
    const client = await Client.findOne({ _id: id, companyId })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json(client, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch client" }, { status: 500 })
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

    const clientData = await req.json()
    console.log(clientData)
    
    // Await params before using
    const { id } = await params
    
    const updatedClient = await Client.findOneAndUpdate({ _id: id, companyId }, clientData, {
      new: true,
      runValidators: true,
    })
    if (!updatedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json(updatedClient, { status: 200 })
  } catch (error: any) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: error.message || "Failed to update client" }, { status: 500 })
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

    // Await params before using
    const { id } = await params
    
    const deletedClient = await Client.findOneAndDelete({ _id: id, companyId })
    if (!deletedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Client deleted successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: error.message || "Failed to delete client" }, { status: 500 })
  }
}