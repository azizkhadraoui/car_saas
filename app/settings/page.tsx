"use client"

import { useState, useEffect } from "react"
import { useApiStore } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

// Currency list with code, symbol and label
const currencies = [
  { code: "USD", symbol: "$", label: "USD - US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "EUR - Euro (€)" },
  { code: "GBP", symbol: "£", label: "GBP - British Pound (£)" },
  { code: "JPY", symbol: "¥", label: "JPY - Japanese Yen (¥)" },
  { code: "TND", symbol: "د.ت", label: "TND - Tunisian Dinar (د.ت)" },
  { code: "CAD", symbol: "CA$", label: "CAD - Canadian Dollar (CA$)" },
  { code: "AUD", symbol: "A$", label: "AUD - Australian Dollar (A$)" },
  { code: "CHF", symbol: "CHF", label: "CHF - Swiss Franc (CHF)" },
  { code: "CNY", symbol: "¥", label: "CNY - Chinese Yuan (¥)" },
  { code: "INR", symbol: "₹", label: "INR - Indian Rupee (₹)" },
]

export default function SettingsPage() {
  const { company, preferences, updateCompany, updatePreferences, loading } = useApiStore()
  const { t, setLocale: setAppLocale } = useI18n()
  const { toast } = useToast()

  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyLogoUrl, setCompanyLogoUrl] = useState("")

  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD")
  const [defaultTaxPercentage, setDefaultTaxPercentage] = useState(19)
  const [showDueDate, setShowDueDate] = useState(false)
  const [showTax, setShowTax] = useState(true)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showNotes, setShowNotes] = useState(true)
  const [language, setLanguage] = useState<"en" | "fr">("fr")
  const [currency, setCurrency] = useState("TND")

  useEffect(() => {
    if (company) {
      setCompanyName(company.name || "")
      setCompanyAddress(company.address || "")
      setCompanyPhone(company.phone || "")
      setCompanyEmail(company.email || "")
      setCompanyLogoUrl(company.logoUrl || "")
    }
  }, [company])

  useEffect(() => {
    if (preferences) {
      if (preferences.dateFormat && preferences.dateFormat !== dateFormat) setDateFormat(preferences.dateFormat)
      if (
        preferences.defaultTaxPercentage !== undefined &&
        preferences.defaultTaxPercentage !== defaultTaxPercentage
      )
        setDefaultTaxPercentage(preferences.defaultTaxPercentage)
      if (preferences.showDueDate !== undefined && preferences.showDueDate !== showDueDate)
        setShowDueDate(preferences.showDueDate)
      if (preferences.showTax !== undefined && preferences.showTax !== showTax) setShowTax(preferences.showTax)
      if (preferences.showDiscount !== undefined && preferences.showDiscount !== showDiscount)
        setShowDiscount(preferences.showDiscount)
      if (preferences.showNotes !== undefined && preferences.showNotes !== showNotes)
        setShowNotes(preferences.showNotes)
      if (preferences.language && preferences.language !== language) setLanguage(preferences.language)
      if (preferences.currency && preferences.currency !== currency) setCurrency(preferences.currency)
    }
  }, [preferences]) // Only run when preferences change

  const handleSaveCompany = async () => {
    try {
      await updateCompany({
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
        logoUrl: companyLogoUrl,
      })
      toast({
        title: t("companyUpdatedSuccess"),
        variant: "success",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update company information.",
        variant: "destructive",
      })
    }
  }

  const handleSavePreferences = async () => {
    try {
      await updatePreferences({
        dateFormat,
        defaultTaxPercentage,
        showDueDate,
        showTax,
        showDiscount,
        showNotes,
        language,
        currency,
      })
      setAppLocale(language)
      toast({
        title: t("settingsUpdatedSuccess"),
        variant: "success",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      })
    }
  }

  if (loading || !preferences) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" />
        <p className="ml-2">{t("loadingData")}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">{t("settings")}</h1>

      {/* Company Info */}
      <div className="mb-8 rounded-md border p-6">
        <h2 className="mb-4 text-2xl font-semibold">{t("companyInformation")}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="companyName">{t("companyName")}</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="companyAddress">{t("companyAddress")}</Label>
            <Input id="companyAddress" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="companyPhone">{t("companyPhone")}</Label>
            <Input id="companyPhone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="companyEmail">{t("companyEmail")}</Label>
            <Input
              id="companyEmail"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="companyLogoUrl">{t("companyLogo")}</Label>
            <Input
              id="companyLogoUrl"
              value={companyLogoUrl}
              onChange={(e) => setCompanyLogoUrl(e.target.value)}
              placeholder="e.g., /logo.png or https://example.com/logo.png"
            />
          </div>
        </div>
        <Button onClick={handleSaveCompany} className="mt-6">
          {t("save")}
        </Button>
      </div>

      {/* Preferences */}
      <div className="rounded-md border p-6">
        <h2 className="mb-4 text-2xl font-semibold">{t("invoicePreferences")}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="dateFormat">{t("dateFormat")}</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger id="dateFormat">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2023-01-31)</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g., 01/31/2023)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g., 31/01/2023)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="defaultTaxPercentage">{t("defaultTaxPercentage")}</Label>
            <Input
              id="defaultTaxPercentage"
              type="number"
              value={defaultTaxPercentage}
              onChange={(e) => setDefaultTaxPercentage(Number.parseFloat(e.target.value))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="showDueDate" checked={showDueDate} onCheckedChange={setShowDueDate} />
            <Label htmlFor="showDueDate">{t("showDueDate")}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="showTax" checked={showTax} onCheckedChange={setShowTax} />
            <Label htmlFor="showTax">{t("showTax")}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="showDiscount" checked={showDiscount} onCheckedChange={setShowDiscount} />
            <Label htmlFor="showDiscount">{t("showDiscount")}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="showNotes" checked={showNotes} onCheckedChange={setShowNotes} />
            <Label htmlFor="showNotes">{t("showNotes")}</Label>
          </div>

          <div>
            <Label htmlFor="language">{t("language")}</Label>
            <Select value={language} onValueChange={(value: "en" | "fr") => setLanguage(value)}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="currency">{t("currency")}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((cur) => (
                  <SelectItem key={cur.code} value={cur.code}>
                    {cur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSavePreferences} className="mt-6">
          {t("save")}
        </Button>
      </div>
    </div>
  )
}
