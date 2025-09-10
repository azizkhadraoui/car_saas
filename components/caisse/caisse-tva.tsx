"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Receipt, TrendingUp, Calculator, FileText, Loader2, PieChart as PieChartIcon } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { useCaisseData } from "@/hooks/use-caisse-data"
import { exportTransactionsToExcel } from "@/lib/caisse-data-service"

interface CaisseTVAProps {
  selectedMonth: string
  selectedYear: string
  tabConfig?: any
}

export function CaisseTVA({ selectedMonth, selectedYear, tabConfig }: CaisseTVAProps) {
  const currency = "TND"
  const locale = "fr-FR"

  const { transactions, insights, loading, error } = useCaisseData({
    caisseType: "tva",
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

  const tvaInsights = useMemo(() => {
    const tvaCollectee = transactions.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + (t.tvaAmount || 0), 0)

    const tvaDeductible = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + (t.tvaAmount || 0), 0)

    const tvaAVerser = tvaCollectee - tvaDeductible
    const nombreOperations = transactions.length

    // Better breakdown for sales-only data
    const repartitionParTypeDocument = transactions.reduce(
      (acc, t) => {
        const docType = t.subcategory === "invoice" ? "FACTURES" : "BONS DE LIVRAISON"
        acc[docType] = (acc[docType] || 0) + (t.tvaAmount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    // Breakdown by payment status
    const repartitionParStatut = transactions.reduce(
      (acc, t) => {
        const statut = t.isPaid ? "PAYÉES" : "IMPAYÉES"
        acc[statut] = (acc[statut] || 0) + (t.tvaAmount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const evolutionMensuelle = transactions.reduce(
      (acc, t) => {
        const date = t.date.substring(0, 7) // YYYY-MM
        if (!acc[date]) {
          acc[date] = { collectee: 0, deductible: 0 }
        }
        if (t.type === "INCOME") {
          acc[date].collectee += t.tvaAmount || 0
        } else {
          acc[date].deductible += t.tvaAmount || 0
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return {
      tvaCollectee,
      tvaDeductible,
      tvaAVerser,
      nombreOperations,
      repartitionParTypeDocument,
      repartitionParStatut,
      evolutionMensuelle,
    }
  }, [transactions])

  const handleExport = () => {
    const exportData = exportTransactionsToExcel(transactions, "tva")
    console.log("Export data:", exportData)
    alert("Export en cours... (fonctionnalité à implémenter)")
  }

  // Chart data for document types
  const repartitionDocumentData = useMemo(() => {
    return Object.entries(tvaInsights.repartitionParTypeDocument).map(([type, montant]) => ({
      name: type,
      value: montant,
    }))
  }, [tvaInsights.repartitionParTypeDocument])

  // Chart data for payment status
  const repartitionStatutData = useMemo(() => {
    return Object.entries(tvaInsights.repartitionParStatut).map(([statut, montant]) => ({
      name: statut,
      value: montant,
    }))
  }, [tvaInsights.repartitionParStatut])

  const evolutionData = useMemo(() => {
    return Object.entries(tvaInsights.evolutionMensuelle).map(([date, data]) => ({
      date,
      collectee: data.collectee,
      deductible: data.deductible,
      net: data.collectee - data.deductible,
    }))
  }, [tvaInsights.evolutionMensuelle])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données TVA...</span>
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
            <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(tvaInsights.tvaCollectee)}</div>
            <p className="text-xs text-muted-foreground">TVA sur ventes</p>
          </CardContent>
        </Card>

        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVA Déductible</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(tvaInsights.tvaDeductible)}</div>
            <p className="text-xs text-muted-foreground">TVA sur achats</p>
          </CardContent>
        </Card>

        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVA à Verser</CardTitle>
            <Calculator className={`h-4 w-4 ${tvaInsights.tvaAVerser >= 0 ? "text-red-600" : "text-green-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${tvaInsights.tvaAVerser >= 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(tvaInsights.tvaAVerser)}
            </div>
            <p className="text-xs text-muted-foreground">{tvaInsights.tvaAVerser >= 0 ? "À payer" : "Crédit TVA"}</p>
          </CardContent>
        </Card>

        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{tvaInsights.nombreOperations}</div>
            <p className="text-xs text-muted-foreground">Factures et BL</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className={`h-5 w-5 ${tabConfig?.color}`} />
              Évolution TVA Mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {evolutionData.length > 1 ? (
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `${value.toFixed(0)}`} />
                  <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                  <Line type="monotone" dataKey="collectee" stroke="#00C49F" name="TVA Collectée" strokeWidth={2} />
                  <Line type="monotone" dataKey="net" stroke="#0088FE" name="TVA Nette" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `${value.toFixed(0)}`} />
                  <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                  <Bar dataKey="collectee" fill="#00C49F" name="TVA Collectée" />
                  <Bar dataKey="net" fill="#0088FE" name="TVA Nette" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className={`h-5 w-5 ${tabConfig?.color}`} />
              Répartition par Type de Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repartitionDocumentData.length > 1 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionDocumentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {repartitionDocumentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {repartitionDocumentData[0]?.name || "Aucun document"}
                </p>
                <p className="text-2xl font-bold text-primary mt-2">
                  {formatCurrency(repartitionDocumentData[0]?.value || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">TVA sur tous les documents</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Chart */}
      {repartitionStatutData.length > 1 && (
        <Card className={`${tabConfig?.borderColor} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className={`h-5 w-5 ${tabConfig?.color}`} />
              Répartition par Statut de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={repartitionStatutData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {repartitionStatutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === "PAYÉES" ? "#00C49F" : "#FF8042"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Rest of your existing table and summary cards remain the same */}
      <Card className={`${tabConfig?.borderColor} border-2`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Receipt className={`h-6 w-6 ${tabConfig?.color}`} />
            Toutes les Factures et Bons de Livraison - TVA
          </CardTitle>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download size={16} />
            Exporter Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Vue d'ensemble:</strong> Cette section affiche toutes les factures et bons de livraison avec leurs
              montants TTC et statut de paiement. Les montants payés TTC sont mis en évidence pour le suivi de
              trésorerie.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className={`${tabConfig?.bgColor}`}>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[100px]">
                    Type Document
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[100px]">
                    Date
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    N° Facture/BL
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[150px]">
                    Client/Fournisseur
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    Montant HT
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    Montant TVA
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    Montant TTC
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    TTC Payé
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[100px]">
                    Statut
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[120px]">
                    Mode Paiement
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-medium min-w-[200px]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id} className={`hover:bg-muted/50 ${index % 2 === 0 ? "bg-muted/25" : ""}`}>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <Badge variant={transaction.type === "INCOME" ? "default" : "secondary"}>
                        {transaction.subcategory === "invoice" ? "FACTURE" : "BON LIVRAISON"}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      {new Date(transaction.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 font-mono">
                      {transaction.invoiceNumber}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 font-medium">
                      {transaction.clientName}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-right font-mono">
                      {formatCurrency(transaction.htAmount || 0)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-right font-mono font-bold text-amber-600">
                      {formatCurrency(transaction.tvaAmount || 0)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-right font-mono">
                      {formatCurrency(transaction.ttcAmount || 0)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-right font-mono font-bold">
                      {transaction.isPaid ? (
                        <span className="text-green-600">{formatCurrency(transaction.ttcAmount || 0)}</span>
                      ) : (
                        <span className="text-red-600">0,00 TND</span>
                      )}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <Badge variant={transaction.isPaid ? "default" : "destructive"}>
                        {transaction.isPaid ? "PAYÉ" : "IMPAYÉ"}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <Badge variant="outline">{transaction.paymentMethod}</Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm">
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune facture ou bon de livraison trouvé pour la période sélectionnée
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">TTC Encaissé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(transactions.filter((t) => t.isPaid).reduce((sum, t) => sum + (t.ttcAmount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter((t) => t.isPaid).length} factures payées
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">TTC En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(transactions.filter((t) => !t.isPaid).reduce((sum, t) => sum + (t.ttcAmount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter((t) => !t.isPaid).length} factures impayées
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">TTC Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(transactions.reduce((sum, t) => sum + (t.ttcAmount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">{transactions.length} documents au total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}