"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaisseAchatPiece } from "@/components/caisse/caisse-achat-piece"
import { CaisseDhuile } from "@/components/caisse/caisse-dhuile"
import { CaisseTVA } from "@/components/caisse/caisse-tva"
import { CaisseCharge } from "@/components/caisse/caisse-charge"
import { CaisseBeneficeMO } from "@/components/caisse/caisse-benefice-mo"
import { CaisseParam } from "@/components/caisse/caisse-param"
import { useAllCaissesSummary } from "@/hooks/use-caisse-data"
import { Wallet, Droplets, Receipt, CreditCard, TrendingUp, Settings, AlertCircle } from "lucide-react"

export default function CaissePage() {
  const [selectedMonth, setSelectedMonth] = useState("08")
  const [selectedYear, setSelectedYear] = useState("2025")
  const [activeTab, setActiveTab] = useState("CAISSE_ACHAT_PIECE")

  const { summary, loading: summaryLoading } = useAllCaissesSummary(selectedMonth, selectedYear)
  console.log({ summary, loading: summaryLoading } )

  const tabs = [
    {
      id: "CAISSE_ACHAT_PIECE",
      label: "Achat Pièce",
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      borderColor: "border-emerald-200 dark:border-emerald-800",
    },
    {
      id: "CAISSE_DHUILE",
      label: "Caisse d'Huile",
      icon: Droplets,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      id: "CAISSE_TVA",
      label: "TVA",
      icon: Receipt,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    {
      id: "CAISSE_CHARGE",
      label: "Charges",
      icon: CreditCard,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      borderColor: "border-red-200 dark:border-red-800",
    },
    {
      id: "CAISSE_BENIFICE_MO",
      label: "Bénéfice MO",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      id: "PARAM",
      label: "Paramètres",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950",
      borderColor: "border-gray-200 dark:border-gray-800",
    },
  ]

  const currentTab = tabs.find((tab) => tab.id === activeTab)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Synthèse Caisses</h1>
            <p className="text-muted-foreground mt-2">
              Gestion et suivi des différentes caisses -{" "}
              {new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth) - 1).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Period Selection */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Période de consultation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month" className="text-sm font-medium">
                  Mois
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month" className="h-11">
                    <SelectValue placeholder="Sélectionner un mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((m) => (
                      <SelectItem key={m} value={m}>
                        {new Date(2025, Number.parseInt(m) - 1).toLocaleDateString("fr-FR", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm font-medium">
                  Année
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year" className="h-11">
                    <SelectValue placeholder="Sélectionner une année" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {!summaryLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(summary).map(([caisseType, data]) => {
              const tab = tabs.find((t) => t.id.toLowerCase().includes(caisseType.toLowerCase().replace("mo", "_mo")))
              const Icon = tab?.icon || AlertCircle
              return (
                <Card key={caisseType} className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${tab?.color || "text-gray-600"}`} />
                      {tab?.label || caisseType}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-lg font-bold">{formatCurrency(data.amount)}</div>
                    <p className="text-xs text-muted-foreground">{data.transactions} transactions</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted/50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:${tab.bgColor} data-[state=active]:${tab.borderColor} data-[state=active]:border-2`}
              >
                <Icon className={`h-5 w-5 ${tab.color}`} />
                <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="CAISSE_ACHAT_PIECE" className="space-y-6">
          <CaisseAchatPiece selectedMonth={selectedMonth} selectedYear={selectedYear} tabConfig={currentTab} />
        </TabsContent>

        <TabsContent value="CAISSE_DHUILE" className="space-y-6">
          <CaisseDhuile selectedMonth={selectedMonth} selectedYear={selectedYear} tabConfig={currentTab} />
        </TabsContent>

        <TabsContent value="CAISSE_TVA" className="space-y-6">
          <CaisseTVA selectedMonth={selectedMonth} selectedYear={selectedYear} tabConfig={currentTab} />
        </TabsContent>

        <TabsContent value="CAISSE_CHARGE" className="space-y-6">
          <CaisseCharge selectedMonth={selectedMonth} selectedYear={selectedYear} tabConfig={currentTab} />
        </TabsContent>

        <TabsContent value="CAISSE_BENIFICE_MO" className="space-y-6">
          <CaisseBeneficeMO selectedMonth={selectedMonth} selectedYear={selectedYear} tabConfig={currentTab} />
        </TabsContent>

        <TabsContent value="PARAM" className="space-y-6">
          <CaisseParam selectedMonth={selectedMonth} selectedYear={selectedYear} tabConfig={currentTab} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
