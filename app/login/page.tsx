"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const { login, loading, error } = useAuth()
  const { t } = useI18n()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({ title: t("emailRequired"), variant: "destructive" })
      return
    }
    if (!password) {
      toast({ title: t("passwordRequired"), variant: "destructive" })
      return
    }

    try {
      await login(email, password)
    } catch (err) {
      toast({
        title: t("loginFailed"),
        description: error || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t("loginToAccount")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? t("loading") : t("login")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t("dontHaveAccount")}{" "}
            <Link href="/register" className="underline">
              {t("register")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
