"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Droplets, BarChart3, Zap, Loader2 } from "lucide-react"
import { useCaisseData } from "@/hooks/use-caisse-data"
import { exportTransactionsToExcel } from "@/lib/caisse-data-service"

interface CaisseDhuileProps {
  selectedMonth: string
  selectedYear: string
  tabConfig?: any
}

export function CaisseDhuile({ selectedMonth, selectedYear, tabConfig }: CaisseDhuileProps) {
  const currency = "TND"
  const locale = "fr-FR"

  const { transactions, insights, loading, error } = useCaisseData({
    caisseType: "huile",
    selectedMonth,
    selectedYear,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(amount)
  }

  const handleExport = () => {
    const exportData = exportTransactionsToExcel(transactions, "huile")
    console.log("Export data:", exportData)
    alert("Export en cours... (fonctionnalité à implémenter)")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement des données: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <Droplets className={`h-4 w-4 ${tabConfig?.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${tabConfig?.color}`}>{formatCurrency(insights.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Ventes d'huile</p>
          </CardContent>
        </Card>

        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(insights.balance)}</div>
            <p className="text-xs text-muted-foreground">Marge réalisée</p>
          </CardContent>
        </Card>

        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût d'Achat</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(insights.totalExpense)}</div>
            <p className="text-xs text-muted-foreground">Achats d'huile</p>
          </CardContent>
        </Card>

        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{insights.transactionCount}</div>
            <p className="text-xs text-muted-foreground">Opérations totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(insights.topCategories).map(([category, amount]) => (
          <Card key={category} className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(amount)}</div>
              <p className="text-xs text-muted-foreground">
                {insights.totalIncome > 0 ? ((amount / insights.totalIncome) * 100).toFixed(1) : 0}% du CA
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Methods Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(insights.paymentMethods).map(([method, amount]) => (
          <Card key={method} className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{method}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(amount)}</div>
              <p className="text-xs text-muted-foreground">Mode de paiement</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction Table */}
      <Card className={`${tabConfig?.borderColor} border-2`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Droplets className={`h-6 w-6 ${tabConfig?.color}`} />
            Détail des Opérations - Huile
          </CardTitle>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download size={16} />
            Exporter Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className={`${tabConfig?.bgColor}`}>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[80px]">
                    Type
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[100px]">
                    Date
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    N° Facture
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[200px]">
                    Description
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    Montant
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[150px]">
                    Client/Fournisseur
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    Catégorie
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[100px]">
                    Payé
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    Mode Paiement
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[150px]">
                    Mot-clé
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id} className={`hover:bg-muted/50 ${index % 2 === 0 ? "bg-muted/25" : ""}`}>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <Badge variant={transaction.type === "INCOME" ? "default" : "destructive"}>
                        {transaction.type === "INCOME" ? "VENTE" : "ACHAT"}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      {new Date(transaction.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 font-mono">
                      {transaction.invoiceNumber}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 font-medium">
                      {transaction.description}
                    </td>
                    <td
                      className={`border border-gray-200 dark:border-gray-700 px-4 py-3 text-right font-mono font-bold ${
                        transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">{transaction.clientName}</td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <Badge variant="outline">{transaction.subcategory}</Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <Badge variant={transaction.isPaid ? "default" : "destructive"}>
                        {transaction.isPaid ? "Oui" : "Non"}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <Badge variant="outline">{transaction.paymentMethod}</Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm">
                      {transaction.matchedKeyword || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune opération trouvée pour la période sélectionnée
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
