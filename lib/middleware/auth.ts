import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function authMiddleware(req: NextRequest) {
  await dbConnect()

  const token = req.cookies.get("token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Attach user and companyId to the request for downstream handlers
    // This is a common pattern, but in Next.js Route Handlers, you might pass this via headers or directly in the handler logic
    // For simplicity, we'll just verify and return success/failure here.
    // Actual user data passing to route handlers is typically done by re-fetching or passing via headers/context.
    // For this setup, the presence of a valid token and user is enough to proceed.
    return NextResponse.next()
  } catch (error: any) {
    console.error("Authentication middleware error:", error)
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }
}
