"use client"

import { redirect } from "next/navigation"
import { useAuth } from "@/lib/auth"

export default function HomePage() {
  const { user } = useAuth()

  if (!user) {
    redirect("/login")
  }

  redirect("/dashboard")
}
