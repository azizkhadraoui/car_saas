"use client"

import { useState, useMemo } from "react"
import { useApiStore } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { formatCurrencyRight } from "@/lib/utils"
import * as XLSX from 'xlsx'

export default function SynthesisPage() {
  const { invoices, payments, clients, companies, loading, preferences } = useApiStore()
  const { t } = useI18n()
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [month, setMonth] = useState("01")

  const currency = preferences?.currency || "USD"
  const locale = preferences?.language === "fr" ? "fr-FR" : "en-US"

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    invoices.forEach((invoice) => {
      years.add(new Date(invoice.date).getFullYear().toString())
    })
    payments.forEach((payment) => {
      years.add(new Date(payment.date).getFullYear().toString())
    })
    return Array.from(years).sort((a, b) => Number.parseInt(b) - Number.parseInt(a))
  }, [invoices, payments])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.date)
      const invoiceYear = invoiceDate.getFullYear().toString()
      const invoiceMonth = (invoiceDate.getMonth() + 1).toString().padStart(2, "0")
      return invoiceYear === year && (month === "" || invoiceMonth === month)
    })
  }, [invoices, year, month])

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const paymentDate = new Date(payment.date)
      const paymentYear = paymentDate.getFullYear().toString()
      const paymentMonth = (paymentDate.getMonth() + 1).toString().padStart(2, "0")
      return paymentYear === year && (month === "" || paymentMonth === month)
    })
  }, [payments, year, month])

  const totalInvoiced = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  }, [filteredInvoices])

  const totalPaid = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }, [filteredPayments])

  const totalOutstanding = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount - invoice.amountPaid), 0)
  }, [filteredInvoices])

  const totalTaxCollected = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => sum + invoice.taxAmount, 0)
  }, [filteredInvoices])

  // Update the transactionData useMemo to use dynamic stamp from client
const transactionData = useMemo(() => {
  return filteredInvoices.map((invoice) => {
    // Find client and company data
    const client = clients?.find(c => c.id === invoice.clientId || c._id === invoice.clientId)
    const company = companies?.find(c => c.id === invoice.companyId || c._id === invoice.companyId)
    
    // Calculate totals from items
    const totalAchatPiece = invoice.items?.reduce((sum, item) => sum + (item.achatPiece || 0) * (item.quantity || 1), 0) || 0
    const totalVentePiece = invoice.items?.reduce((sum, item) => sum + (item.ventePiece || 0) * (item.quantity || 1), 0) || 0
    const totalBenefits = invoice.items?.reduce((sum, item) => sum + (item.benefits || 0) * (item.quantity || 1), 0) || 0
    const totalMOD = invoice.items?.reduce((sum, item) => sum + (item.mod || 0) * (item.quantity || 1), 0) || 0
    const totalTOL = invoice.items?.reduce((sum, item) => sum + (item.tarifTolier || 0) * (item.quantity || 1), 0) || 0
    
    // Calculate amounts
    const amountHT = invoice.subtotal || 0
    const amountHTAfterDiscount = amountHT - (invoice.discountAmount || 0)
    
    // Get dynamic stamp from client, default to 1 if not exists
    const stamp = client?.stamp || 1.0
    
    const gainPercent = totalVentePiece > 0 ? ((totalBenefits / totalVentePiece) * 100) : 0
    
    return {
      typePayment: "Espèces", // Default - you might want to add this field to your schema
      isPaid: invoice.status === "paid",
      status: invoice.type,
      blNumber: `${invoice.type}-${invoice.invoiceNumber}`,
      blDate: invoice.date,
      company: client?.name || client?.companyName || "N/A",
      immat: client?.licensePlate || client?.registrationNumber || `IMMAT-${invoice.invoiceNumber}`,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.date,
      paymentDate: invoice.status === "paid" ? invoice.updatedAt : null,
      amountHT: amountHT,
      discount: invoice.discountAmount || 0,
      amountHTAfterDiscount: amountHTAfterDiscount,
      vatAmount: invoice.taxAmount || 0,
      stamp: stamp, // Now using dynamic stamp from client
      totalTTC: invoice.totalAmount || 0,
      purchasePriceHT: totalAchatPiece,
      sellPriceHT: totalVentePiece,
      profitPieceHT: totalBenefits,
      gainPercent: Math.round(gainPercent * 100) / 100,
      laborPrice: totalMOD,
      modTolerie: totalTOL,
      profitVAT:
        invoice.type === "bon_de_livraison" && invoice.paymentType === "TTC"
        ? (invoice.taxAmount || 0) 
        : 0,
      blVATAmount: invoice.taxAmount || 0,
      blTotal: invoice.totalAmount || 0,
      totalProfitMOD: totalBenefits + totalMOD + invoice.taxAmount
    }
  })
}, [filteredInvoices, clients, companies]) // Added clients to dependencies since we're now using client.stamp

  // Excel export function
  const exportToExcel = () => {
    if (transactionData.length === 0) {
      alert("Aucune donnée à exporter")
      return
    }

    // Prepare data for Excel
    const excelData = transactionData.map((transaction) => ({
      "Type Paiement": transaction.typePayment,
      "Payé ?": transaction.isPaid ? "Oui" : "Non",
      "Statut": transaction.status,
      "N° BL/Facture": transaction.blNumber,
      "Date BL/Facture": new Date(transaction.blDate).toLocaleDateString(locale),
      "Nom": transaction.company,
      "IMMAT": transaction.immat,
      "N°Facture": transaction.invoiceNumber,
      "Date Facture": new Date(transaction.invoiceDate).toLocaleDateString(locale),
      "Date Paiement": transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleDateString(locale) : "-",
      "MNT HT": transaction.amountHT,
      "Remise": transaction.discount,
      "MNT HT Après Remise": transaction.amountHTAfterDiscount,
      "MNT TVA": transaction.vatAmount,
      "Timbre": transaction.stamp,
      "Total TTC": transaction.totalTTC,
      "Prix Achat Pièce HT": transaction.purchasePriceHT,
      "Prix Vente Pièce HT": transaction.sellPriceHT,
      "Bénéfice Pièce HT": transaction.profitPieceHT,
      "% Gain": `${transaction.gainPercent}%`,
      "Prix Main d'œuvre": transaction.laborPrice,
      "Prix MOD Tôlerie": transaction.modTolerie,
      "Bénéfice TVA BL": transaction.profitVAT,
      "MNT TVA & Timbre BL": transaction.blVATAmount + transaction.stamp,
      "Total Bénéf MOD & Pièces": transaction.totalProfitMOD
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths for better readability
    const columnWidths = [
      { wch: 12 }, // Type Paiement
      { wch: 8 },  // Payé ?
      { wch: 10 }, // Statut
      { wch: 15 }, // N° BL/Facture
      { wch: 12 }, // Date BL/Facture
      { wch: 20 }, // Nom
      { wch: 15 }, // IMMAT
      { wch: 12 }, // N°Facture
      { wch: 12 }, // Date Facture
      { wch: 12 }, // Date Paiement
      { wch: 12 }, // MNT HT
      { wch: 10 }, // Remise
      { wch: 18 }, // MNT HT Après Remise
      { wch: 10 }, // MNT TVA
      { wch: 8 },  // Timbre
      { wch: 12 }, // Total TTC
      { wch: 18 }, // Prix Achat Pièce HT
      { wch: 18 }, // Prix Vente Pièce HT
      { wch: 18 }, // Bénéfice Pièce HT
      { wch: 8 },  // % Gain
      { wch: 16 }, // Prix Main d'œuvre
      { wch: 15 }, // Prix MOD Tôlerie
      { wch: 15 }, // Bénéfice TVA BL
      { wch: 18 }, // MNT TVA & Timbre BL
      { wch: 20 }  // Total Bénéf MOD & Pièces
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions")

    // Generate filename with current date and period
    const monthName = month === "00" ? "Toute_Annee" : `Mois_${month}`
    const filename = `Synthese_Transactions_${year}_${monthName}_${new Date().toISOString().split('T')[0]}.xlsx`

    // Write and download file
    XLSX.writeFile(workbook, filename)
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" />
        <p className="ml-2">{t("loadingData")}</p>
      </div>
    )
  }

  const stats = [
    { label: t("totalInvoiced"), value: totalInvoiced },
    { label: t("totalPaid"), value: totalPaid },
    { label: t("totalOutstanding"), value: totalOutstanding },
    { label: t("totalTaxCollected"), value: totalTaxCollected },
  ]

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">{t("synthesis")}</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="year">{t("year")}</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="year">
              <SelectValue placeholder={t("selectYear")} />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="month">{t("month")}</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger id="month">
              <SelectValue placeholder={t("selectAllMonths")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="00">{t("allMonths")}</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((m) => (
                <SelectItem key={m} value={m}>{t(`month_${m}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrencyRight(stat.value, currency, locale)}</div>
              <p className="text-xs text-muted-foreground">{t("basedOnSelectedPeriod")}</p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
            <p className="text-xs text-muted-foreground">{t("basedOnSelectedPeriod")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalPayments")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
            <p className="text-xs text-muted-foreground">{t("basedOnSelectedPeriod")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Détails des Transactions</CardTitle>
          <Button 
            onClick={exportToExcel}
            disabled={transactionData.length === 0}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exporter Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Type Paiement</TableHead>
                  <TableHead className="min-w-[80px]">Payé ?</TableHead>
                  <TableHead className="min-w-[80px]">Statut</TableHead>
                  <TableHead className="min-w-[100px]">N° BL/Facture</TableHead>
                  <TableHead className="min-w-[100px]">Date BL/Facture</TableHead>
                  <TableHead className="min-w-[180px]">Nom</TableHead>
                  <TableHead className="min-w-[100px]">IMMAT</TableHead>
                  <TableHead className="min-w-[100px]">N°Facture</TableHead>
                  <TableHead className="min-w-[100px]">Date Facture</TableHead>
                  <TableHead className="min-w-[100px]">Date Paiement</TableHead>
                  <TableHead className="min-w-[100px]">MNT HT</TableHead>
                  <TableHead className="min-w-[80px]">Remise</TableHead>
                  <TableHead className="min-w-[120px]">MNT HT Après Remise</TableHead>
                  <TableHead className="min-w-[80px]">MNT TVA</TableHead>
                  <TableHead className="min-w-[80px]">Timbre</TableHead>
                  <TableHead className="min-w-[100px]">Total TTC</TableHead>
                  <TableHead className="min-w-[120px]">Prix Achat Pièce HT</TableHead>
                  <TableHead className="min-w-[120px]">Prix Vente Pièce HT</TableHead>
                  <TableHead className="min-w-[120px]">Bénéfice Pièce HT</TableHead>
                  <TableHead className="min-w-[80px]">% Gain</TableHead>
                  <TableHead className="min-w-[120px]">Prix Main d'œuvre</TableHead>
                  <TableHead className="min-w-[100px]">Prix MOD Tôlerie</TableHead>
                  <TableHead className="min-w-[100px]">Bénéfice TVA BL</TableHead>
                  <TableHead className="min-w-[120px]">MNT TVA & Timbre BL</TableHead>
                  <TableHead className="min-w-[140px]">Total Bénéf MOD & Pièces</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionData.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.typePayment}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.isPaid ? "default" : "destructive"}>
                        {transaction.isPaid ? "Oui" : "Non"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{transaction.blNumber}</TableCell>
                    <TableCell>{new Date(transaction.blDate).toLocaleDateString(locale)}</TableCell>
                    <TableCell className="font-medium">{transaction.company}</TableCell>
                    <TableCell className="font-mono">{transaction.immat}</TableCell>
                    <TableCell className="font-mono">{transaction.invoiceNumber}</TableCell>
                    <TableCell>{new Date(transaction.invoiceDate).toLocaleDateString(locale)}</TableCell>
                    <TableCell>
                      {transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleDateString(locale) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.amountHT, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.discount, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.amountHTAfterDiscount, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.vatAmount, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.stamp, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrencyRight(transaction.totalTTC, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.purchasePriceHT, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.sellPriceHT, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrencyRight(transaction.profitPieceHT, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {transaction.gainPercent}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.laborPrice, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.modTolerie, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrencyRight(transaction.profitVAT, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyRight(transaction.blVATAmount + transaction.stamp, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600 font-bold">
                      {formatCurrencyRight(transaction.totalProfitMOD, currency, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {transactionData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune transaction trouvée pour la période sélectionnée
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}