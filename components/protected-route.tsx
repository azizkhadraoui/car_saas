"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useApiStore } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"
import { Spinner } from "@/components/ui/spinner"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth() // Remove checkAuth from here
  const { loading: apiLoading } = useApiStore()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useI18n()

  const publicPaths = ["/login", "/register"]
  const isPublicPath = publicPaths.includes(pathname)

  // REMOVED THE PROBLEMATIC useEffect THAT WAS CALLING checkAuth

  useEffect(() => {
    if (!authLoading && !apiLoading) {
      if (!user && !isPublicPath) {
        router.push("/login")
      } else if (user && isPublicPath) {
        router.push("/dashboard")
      }
    }
  }, [user, authLoading, apiLoading, isPublicPath, router])

  if (authLoading || apiLoading || (!user && !isPublicPath) || (user && isPublicPath)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
        <p className="ml-2">{t("loading")}</p>
      </div>
    )
  }

  return <>{children}</>
}