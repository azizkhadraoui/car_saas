"use client"

import { useMemo } from "react"
import { useApiStore } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

export default function DashboardPage() {
  const { clients, invoices, payments, loading, preferences } = useApiStore()
  const { t } = useI18n()

  const totalClients = clients.length
  const totalInvoices = invoices.length
  const totalOutstanding = useMemo(() => {
    return invoices.reduce(
      (sum, invoice) => sum + (invoice.totalAmount - invoice.amountPaid),
      0
    )
  }, [invoices])

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
  }, [invoices])

  const recentPayments = useMemo(() => {
    return [...payments]
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 5)
  }, [payments])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" />
        <p className="ml-2">{t("loadingData")}</p>
      </div>
    )
  }

  const format = (amount: number) =>
    formatCurrency(amount, preferences?.currency, { symbolPosition: "right" })

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">{t("dashboard")}</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalClients")}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalInvoices")}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <path d="M10 21V3m0 0L4 8m6-5l6 5" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalOutstanding")}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(totalOutstanding)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("recentInvoices")}</CardTitle>
            <Link href="/invoices">
              <Button variant="outline" size="sm">
                {t("viewAll")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("client")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("totalAmount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t("noRecentInvoices")}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInvoices.map((invoice) => {
                    const client = clients.find((c) => c.id === invoice.clientId)
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          {client?.name || t("unknownClient")}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.date, preferences?.dateFormat)}
                        </TableCell>
                        <TableCell>
                          {format(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              invoice.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : invoice.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : invoice.status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {t(invoice.status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("recentPayments")}</CardTitle>
            <Link href="/invoices">
              <Button variant="outline" size="sm">
                {t("viewAll")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("paymentMethod")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t("noRecentPayments")}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPayments.map((payment) => {
                    const invoice = invoices.find(
                      (inv) => inv.id === payment.invoiceId
                    )
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {invoice?.invoiceNumber || t("unknownInvoice")}
                        </TableCell>
                        <TableCell>{format(payment.amount)}</TableCell>
                        <TableCell>
                          {formatDate(payment.date, preferences?.dateFormat)}
                        </TableCell>
                        <TableCell>{payment.method}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
