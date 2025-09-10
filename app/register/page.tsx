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

export default function RegisterPage() {
  const { register, loading, error } = useAuth()
  const { t } = useI18n()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")

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
    if (password !== confirmPassword) {
      toast({ title: t("passwordsMismatch"), variant: "destructive" })
      return
    }
    if (!companyName) {
      toast({ title: t("companyNameRequired"), variant: "destructive" })
      return
    }
    if (!companyAddress) {
      toast({ title: t("addressRequired"), variant: "destructive" })
      return
    }
    if (!companyPhone) {
      toast({ title: t("phoneRequired"), variant: "destructive" })
      return
    }
    if (!companyEmail) {
      toast({ title: t("emailRequired"), variant: "destructive" })
      return
    }

    try {
      await register(email, password, companyName, companyAddress, companyPhone, companyEmail)
      toast({
        title: t("registrationSuccess"),
        variant: "success",
      })
    } catch (err) {
      toast({
        title: t("registrationFailed"),
        description: error || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t("registerNewAccount")}</CardTitle>
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
            <div>
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="pt-4 border-t mt-4">
              <h3 className="text-lg font-semibold mb-2">{t("companyInformation")}</h3>
              <div>
                <Label htmlFor="companyName">{t("companyName")}</Label>
                <Input
                  id="companyName"
                  placeholder="Your Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="mt-2">
                <Label htmlFor="companyAddress">{t("companyAddress")}</Label>
                <Input
                  id="companyAddress"
                  placeholder="123 Main St, City, Country"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  required
                />
              </div>
              <div className="mt-2">
                <Label htmlFor="companyPhone">{t("companyPhone")}</Label>
                <Input
                  id="companyPhone"
                  placeholder="+1234567890"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  required
                />
              </div>
              <div className="mt-2">
                <Label htmlFor="companyEmail">{t("companyEmail")}</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  placeholder="company@example.com"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? t("loading") : t("register")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="underline">
              {t("login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
