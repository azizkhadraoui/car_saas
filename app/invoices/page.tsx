"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApiStore } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate } from "@/lib/utils"
import { 
  MoreHorizontal, 
  FileDown, 
  PlusCircle, 
  Eye, 
  CreditCard, 
  Edit, 
  Trash2,
  Receipt,
  FileText,
  XCircle
} from "lucide-react"
import { generateInvoicePdf } from "@/lib/pdf-generator"
import { Spinner } from "@/components/ui/spinner"
import type { Invoice, Payment } from "@/types"
import { toast } from "sonner"
import { generateInvoicePreview, generateReceiptPreview } from "@/lib/preview-generator"

export default function InvoicesPage() {
  const showDeleteAction = false;
  const { invoices, clients, payments, loading, preferences, fetchInvoices, fetchPayments } = useApiStore()
  const { t } = useI18n()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "invoice" | "bon_de_livraison">("all")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentsModal, setShowPaymentsModal] = useState(false)
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewContent, setPreviewContent] = useState("")
  const [previewTitle, setPreviewTitle] = useState("")
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showTransformModal, setShowTransformModal] = useState(false)
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([])
  
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentType, setPaymentType] = useState<"HT" | "TTC">("TTC")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [transformingId, setTransformingId] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("")


  const getInvoicePaymentType = (invoice: Invoice) => {
      return invoice.paymentType
    
  }

  const getInvoiceStatus = (invoice: Invoice) => {
    if (invoice.status === "cancelled") {
      return "canceled"
    }
    
    const unpaidAmount = Math.max(invoice.totalAmount - invoice.amountPaid, 0)
    
    if (unpaidAmount === 0) {
      return "paid"
    } else if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
      return "overdue"
    } else {
      return "pending"
    }
  }

  const filteredInvoices = useMemo(() => {
    let filtered = invoices
    if (filterType !== "all") {
      filtered = filtered.filter((invoice) => invoice.type === filterType)
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(lowerSearch) ||
          clients.find((c) => c.id === invoice.clientId)?.name
            .toLowerCase()
            .includes(lowerSearch) ||
          getInvoiceStatus(invoice).toLowerCase().includes(lowerSearch) ||
          (invoice.originalDeliveryNoteNumber && 
           invoice.originalDeliveryNoteNumber.toLowerCase().includes(lowerSearch)) ||
          (invoice.license && 
           invoice.license.toLowerCase().includes(lowerSearch))
      )
    }
    return filtered
  }, [invoices, clients, searchTerm, filterType])

  const handleCancelInvoice = async () => {
    if (!selectedInvoice) return
    
    setCancelingId(selectedInvoice.id)
    
    try {
      const invoicePayments = payments.filter(p => p.invoiceId === selectedInvoice.id)
      
      for (const payment of invoicePayments) {
        const deleteRes = await fetch(`/api/payments/${payment.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        })

        if (!deleteRes.ok) {
          const { error } = await deleteRes.json()
          throw new Error(error || t("deletePaymentError"))
        }
      }

      const updateInvoiceRes = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedInvoice,
          status: "cancelled",
          amountPaid: 0,
          paymentType: null
        }),
      })

      if (updateInvoiceRes.ok) {
        toast.success(t("invoiceCanceledSuccessfully"))
        await Promise.all([
          fetchInvoices?.(),
          fetchPayments?.()
        ])
        setShowCancelModal(false)
      } else {
        const { error } = await updateInvoiceRes.json()
        throw new Error(error || t("cancelInvoiceError"))
      }
    } catch (error: any) {
      toast.error(error.message || t("cancelInvoiceError"))
    } finally {
      setCancelingId(null)
    }
  }

  const handleExportPdf = async (invoice: Invoice) => {
    if (!preferences) return
    const client = clients.find((c) => c.id === invoice.clientId)
    if (client) {
      await generateInvoicePdf(invoice, client, preferences, t)
    }
  }
  const getLicensePlate = (invoice: Invoice): string | null => {
  // Only proceed if invoice has a license ID
  // if (!invoice.license) {
  //   return null
  // }

  // Find the client associated with this invoice
  const client = clients.find(c => c.id === invoice.clientId)
  
  if (!client || !client.vehicles || client.vehicles.length === 0) {
    return null
  }

  // Find the specific vehicle using the license ID
  const vehicle = client.vehicles.find(v => v._id === invoice.license || v.id === invoice.license)
  return vehicle?.licensePlate || null
}

  const handleBulkExportPdf = async () => {
    if (!preferences) return
    for (const invoice of filteredInvoices) {
      const client = clients.find((c) => c.id === invoice.clientId)
      if (client) {
        await generateInvoicePdf(invoice, client, preferences, t)
      }
    }
  }

  const handlePreviewInvoice = async (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId)
    if (!client || !preferences) return
    
    const html = await generateInvoicePreview(invoice, client, preferences, t)
    setPreviewContent(html)
    setPreviewTitle(`${t("invoice")} ${invoice.invoiceNumber}`)
    setShowPreviewModal(true)
  }

  const handleViewPayments = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    const invoicePayments = payments.filter(p => p.invoiceId === invoice.id)
    setInvoicePayments(invoicePayments)
    setShowPaymentsModal(true)
  }

  const handlePreviewReceipt = async (payment: Payment) => {
    const invoice = invoices.find(i => i.id === payment.invoiceId)
    const client = clients.find((c) => c.id === invoice?.clientId)
    if (!invoice || !client || !preferences) return
    
    const html = await generateReceiptPreview(payment, invoice, client, preferences, t)
    setPreviewContent(html)
    setPreviewTitle(`${t("receipt")} - ${payment.reference || payment.id}`)
    setShowPreviewModal(true)
  }

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    const invoicePaymentType = getInvoicePaymentType(selectedInvoice!)
    setPaymentType(invoicePaymentType || "TTC")
    
    if (payment.amountHT && payment.paymentType) {
      setPaymentAmount(payment.paymentType === "HT" ? payment.amountHT.toString() : payment.amount.toString())
    } else {
      setPaymentAmount(payment.amount.toString())
    }
    
    setPaymentDate(new Date(payment.date).toISOString().split('T')[0])
    setPaymentMethod(payment.method)
    setPaymentReference(payment.reference || "")
    setShowEditPaymentModal(true)
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm(t("confirmDeletePayment"))) return

    setDeletingPaymentId(paymentId)

    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        toast.success(t("paymentDeletedSuccessfully"))
        
        if (selectedInvoice) {
          const remainingPayments = payments.filter(p => 
            p.invoiceId === selectedInvoice.id && p.id !== paymentId
          )
          
          if (remainingPayments.length === 0) {
            await fetch(`/api/invoices/${selectedInvoice.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...selectedInvoice,
                paymentType: null
              }),
            })
          }
        }
        
        await Promise.all([
          fetchInvoices?.(),
          fetchPayments?.()
        ])
        
        if (selectedInvoice) {
          const updatedPayments = payments.filter(p => p.invoiceId === selectedInvoice.id && p.id !== paymentId)
          setInvoicePayments(updatedPayments)
        }
      } else {
        const { error } = await res.json()
        toast.error(error || t("deletePaymentError"))
      }
    } catch (error: any) {
      toast.error(error.message || t("deletePaymentError"))
    } finally {
      setDeletingPaymentId(null)
    }
  }

  const handleAddPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setSelectedPayment(null)
    setPaymentAmount("")
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentMethod("Cash")
    setPaymentReference("")
    const existingPaymentType = getInvoicePaymentType(invoice)
    setPaymentType(existingPaymentType || "TTC")
    setShowPaymentModal(true)
  }

  const handleSubmitPayment = async () => {
    if (!paymentAmount || !paymentDate || !selectedInvoice || parseFloat(paymentAmount) <= 0) return

    const amountValue = parseFloat(paymentAmount)
    const taxPercentage = selectedInvoice.taxPercentage || 0
        
  

    setIsSubmittingPayment(true)

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          companyId: selectedInvoice.companyId,
          amount: amountValue,
          amountHT: amountValue,
          paymentType,
          taxPercentage,
          date: new Date(paymentDate),
          method: paymentMethod,
          reference: paymentReference || null,
        }),
      })

      if (res.ok) {
        const existingPaymentType = getInvoicePaymentType(selectedInvoice)
        if (!existingPaymentType) {
          await fetch(`/api/invoices/${selectedInvoice.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...selectedInvoice,
              paymentType
            }),
          })
        }

        toast.success(t("paymentAddedSuccessfully"))
        setShowPaymentModal(false)
        await Promise.all([
          fetchInvoices?.(),
          fetchPayments?.()
        ])
      } else {
        const { error } = await res.json()
        toast.error(error || t("paymentError"))
      }
    } catch (error: any) {
      toast.error(error.message || t("paymentError"))
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleUpdatePayment = async () => {
    if (!paymentAmount || !paymentDate || !selectedPayment || parseFloat(paymentAmount) <= 0) return

    const amountValue = parseFloat(paymentAmount)
    const taxPercentage = selectedInvoice?.taxPercentage || 0
    
    setIsSubmittingPayment(true)

    try {
      const res = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountValue,
          amountHT: amountValue,
          paymentType,
          taxPercentage,
          date: new Date(paymentDate),
          method: paymentMethod,
          reference: paymentReference || null,
        }),
      })

      if (res.ok) {
        toast.success(t("paymentUpdatedSuccessfully"))
        setShowEditPaymentModal(false)
        await Promise.all([
          fetchInvoices?.(),
          fetchPayments?.()
        ])
        
        if (selectedInvoice) {
          const updatedPayments = payments.filter(p => p.invoiceId === selectedInvoice.id)
          setInvoicePayments(updatedPayments)
        }
      } else {
        const { error } = await res.json()
        toast.error(error || t("updatePaymentError"))
      }
    } catch (error: any) {
      toast.error(error.message || t("updatePaymentError"))
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleDelete = async (invoiceId: string) => {
    if (!confirm(t("confirmDelete"))) return

    setDeletingId(invoiceId)

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        toast.success(t("invoiceDeletedSuccessfully"))
        await Promise.all([
          fetchInvoices?.(),
          fetchPayments?.()
        ])
      } else {
        const { error } = await res.json()
        toast.error(error || t("deleteInvoiceError"))
      }
    } catch (error: any) {
      toast.error(error.message || t("deleteInvoiceError"))
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenTransformModal = async (deliveryNote: Invoice) => {
    setSelectedInvoice(deliveryNote)
    
    // Get next suggested invoice number
    try {
      const nextNumberRes = await fetch("/api/invoices/next-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "invoice" }),
      })

      if (nextNumberRes.ok) {
        const { nextNumber } = await nextNumberRes.json()
        const currentYear = new Date().getFullYear()
        const suggestedNumber = `${currentYear}-${nextNumber}`
        setNewInvoiceNumber(suggestedNumber)
      } else {
        // Fallback if API fails
        const currentYear = new Date().getFullYear()
        setNewInvoiceNumber(`${currentYear}-`)
      }
    } catch (error) {
      // Fallback if API fails
      const currentYear = new Date().getFullYear()
      setNewInvoiceNumber(`${currentYear}-`)
    }
    
    setShowTransformModal(true)
  }

  const handleTransformToInvoice = async () => {
    if (!selectedInvoice || !newInvoiceNumber.trim()) return

    setTransformingId(selectedInvoice.id)

    try {
      console.log(JSON.stringify({
          ...selectedInvoice,
          type: "invoice",
          paymentType:  "TTC",
          invoiceNumber: newInvoiceNumber.trim(),
          originalDeliveryNoteNumber: selectedInvoice.invoiceNumber, // Store the original delivery note number
          date: new Date().toISOString(),
        }))
      const updateRes = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedInvoice,
          type: "invoice",
          paymentType:  "TTC",
          invoiceNumber: newInvoiceNumber.trim(),
          originalDeliveryNoteNumber: selectedInvoice.invoiceNumber, // Store the original delivery note number
          date: new Date().toISOString(),
        }),
      })

      if (updateRes.ok) {
        toast.success(t("deliveryNoteTransformedToInvoice", { invoiceNumber: newInvoiceNumber.trim() }))
        await fetchInvoices?.()
        setShowTransformModal(false)
        setSelectedInvoice(null)
        setNewInvoiceNumber("")
      } else {
        const { error } = await updateRes.json()
        toast.error(error || t("transformToInvoiceError"))
      }
    } catch (error: any) {
      toast.error(error.message || t("transformToInvoiceError"))
    } finally {
      setTransformingId(null)
    }
  }

  const getAmountLimits = () => {
    if (!selectedInvoice) return { max: 0, label: "" }
    
    const unpaidTTC = selectedInvoice.totalAmount - selectedInvoice.amountPaid
    const taxPercentage = selectedInvoice.taxPercentage || 0
    
    if (paymentType === "HT") {
      const unpaidHT = selectedInvoice.subtotal - selectedInvoice.amountPaid
      return {
        max: unpaidHT,
        label: `${t("maxPayableAmountHT")}: ${format(unpaidHT)}`
      }
    } else {
      return {
        max: unpaidTTC,
        label: `${t("maxPayableAmount")}: ${format(unpaidTTC)}`
      }
    }
  }

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("invoices")}</h1>
        <div className="flex space-x-2">
          <Button onClick={handleBulkExportPdf} disabled={filteredInvoices.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            {t("exportAllPdfs")}
          </Button>
          <Link href="/create-invoice">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("createNewInvoice")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex space-x-4">
        <Input
          placeholder={t("searchInvoices")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filterByType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            <SelectItem value="invoice">{t("invoice")}</SelectItem>
            <SelectItem value="bon_de_livraison">{t("deliveryNote")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invoiceNumber")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("originalDeliveryNote")}</TableHead>
              <TableHead>{t("licensePlate")}</TableHead>
              <TableHead>{t("client")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              {preferences?.showDueDate && <TableHead>{t("dueDate")}</TableHead>}
              <TableHead>{t("subTotalAmount")}</TableHead>
              <TableHead>{t("totalAmount")}</TableHead>
              <TableHead>{t("amountPaid")}</TableHead>
              <TableHead>{t("unpaidAmount")}</TableHead>
              <TableHead>{t("paymentType")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={preferences?.showDueDate ? 13 : 12} className="h-24 text-center">
                  {t("noInvoicesFound")}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => {
                const client = clients.find((c) => c.id === invoice.clientId)
                const unpaidAmount = Math.max(
                    invoice.paymentType === "TTC"
                    ? invoice.totalAmount - invoice.amountPaid
                    : invoice.subtotal - invoice.amountPaid,
                    0
                  )
                const currentStatus = getInvoiceStatus(invoice)
                const invoicePaymentsCount = payments.filter(p => p.invoiceId === invoice.id).length
                const invoicePaymentType = getInvoicePaymentType(invoice)
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{t(invoice.type)}</TableCell>
                    <TableCell>
                      {invoice.originalDeliveryNoteNumber ? (
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {invoice.originalDeliveryNoteNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getLicensePlate(invoice) ? (
                        <span className="text-sm font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded border">
                          {getLicensePlate(invoice)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>{client?.name || t("unknownClient")}</TableCell>
                    <TableCell>{formatDate(invoice.date, preferences?.dateFormat)}</TableCell>
                    {preferences?.showDueDate && (
                      <TableCell>{formatDate(invoice.dueDate, preferences?.dateFormat)}</TableCell>
                    )}
                    <TableCell>{format(invoice.subtotal)}</TableCell>
                    <TableCell>{format(invoice.totalAmount)}</TableCell>
                    <TableCell>{format(invoice.amountPaid)}</TableCell>
                    <TableCell>{format(unpaidAmount)}</TableCell>
                    <TableCell>
                      {invoicePaymentType ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          invoicePaymentType === "HT" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {invoicePaymentType}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          currentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : currentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : currentStatus === "overdue"
                            ? "bg-red-100 text-red-800"
                            : currentStatus === "canceled"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {t(currentStatus)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t("openMenu")}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
  <Link href={`/create-invoice?id=${invoice.id}`}>
    <DropdownMenuItem>
      <Edit className="mr-2 h-4 w-4" />
      {t("edit")}
    </DropdownMenuItem>
  </Link>
  <DropdownMenuItem onClick={() => handlePreviewInvoice(invoice)}>
    <Eye className="mr-2 h-4 w-4" />
    {t("preview")}
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => handleExportPdf(invoice)}>
    <FileDown className="mr-2 h-4 w-4" />
    {t("exportPdf")}
  </DropdownMenuItem>
  
  {/* Transform to Invoice action - only for delivery notes */}
  {invoice.type === "bon_de_livraison" && (
    <DropdownMenuItem 
      onClick={() => handleOpenTransformModal(invoice)}
      disabled={transformingId === invoice.id}
    >
      <FileText className="mr-2 h-4 w-4" />
      {transformingId === invoice.id ? t("transforming") : t("transformToInvoice")}
    </DropdownMenuItem>
  )}
  
  {/* Add Payment action - only for invoices with unpaid amount */}
  {
   (invoice.totalAmount - invoice.amountPaid) > 0 && (
    <DropdownMenuItem onClick={() => handleAddPayment(invoice)}>
      <PlusCircle className="mr-2 h-4 w-4" />
      {t("addPayment")}
    </DropdownMenuItem>
  )}
  
  {/* View Payments action - only for invoices */}
  {invoice.type === "invoice" && (
    <DropdownMenuItem onClick={() => handleViewPayments(invoice)}>
      <CreditCard className="mr-2 h-4 w-4" />
      {t("viewPayments")} ({payments.filter(p => p.invoiceId === invoice.id).length})
    </DropdownMenuItem>
  )}

  {invoice.type === "invoice" && getInvoiceStatus(invoice) !== "canceled" && (
    <DropdownMenuItem 
      onClick={() => {
        setSelectedInvoice(invoice)
        setShowCancelModal(true)
      }}
      className="text-orange-600"
    >
      <XCircle className="mr-2 h-4 w-4" />
      {t("cancelInvoice")}
    </DropdownMenuItem>
  )}
  
  {showDeleteAction && (
    <DropdownMenuItem
      onClick={() => handleDelete(invoice.id)}
      className="text-red-600"
      disabled={deletingId === invoice.id}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {deletingId === invoice.id ? t("deleting") : t("delete")}
    </DropdownMenuItem>
  )}
</DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Transform to Invoice Modal */}
      <Dialog open={showTransformModal} onOpenChange={setShowTransformModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transformToInvoice")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {t("transformDeliveryNoteToInvoice")}
              </p>
              {selectedInvoice && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                  <p><strong>{t("deliveryNoteNumber")}:</strong> {selectedInvoice.invoiceNumber}</p>
                  <p><strong>{t("client")}:</strong> {clients.find(c => c.id === selectedInvoice.clientId)?.name || t("unknownClient")}</p>
                  <p><strong>{t("totalAmount")}:</strong> {format(selectedInvoice.totalAmount)}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newInvoiceNumber">{t("newInvoiceNumber")}</Label>
              <Input
                id="newInvoiceNumber"
                value={newInvoiceNumber}
                onChange={(e) => setNewInvoiceNumber(e.target.value)}
                placeholder={t("enterInvoiceNumber")}
              />
              <p className="text-xs text-gray-500">
                {t("invoiceNumberHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTransformModal(false)}
              disabled={transformingId !== null}
            >
              {t("cancel")}
            </Button>
            <Button 
              onClick={handleTransformToInvoice}
              disabled={transformingId !== null || !newInvoiceNumber.trim()}
            >
              {transformingId ? t("transforming") : t("transform")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t("addPayment")}</DialogTitle>
    </DialogHeader>
    <div className="flex flex-col space-y-4">
      {/* Payment Type Display (read-only) */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
        <div className="flex flex-col">
          <Label className="text-sm font-medium">
            {t("paymentType")}
          </Label>
          <span className="text-xs text-gray-500">
            {paymentType === "HT" ? t("amountExcludingTax") : t("amountIncludingTax")}
          </span>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            paymentType === "HT" 
              ? "bg-blue-100 text-blue-800" 
              : "bg-green-100 text-green-800"
          }`}>
            {paymentType}
          </span>
        </div>
      </div>

      {selectedInvoice && (
        <>
          <div className="grid gap-2">
            <Label>{t("amount")} ({paymentType})</Label>
            <Input
              type="number"
              placeholder={paymentType === "HT" ? t("amountExcludingTax") : t("amountIncludingTax")}
              value={paymentAmount}
              min={0}
              max={getAmountLimits().max}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                const { max } = getAmountLimits()
                if (!isNaN(value) && value <= max) {
                  setPaymentAmount(e.target.value)
                } else if (value > max) {
                  setPaymentAmount(max.toFixed(3))
                } else {
                  setPaymentAmount("")
                }
              }}
            />
            <div className="text-sm text-gray-600 space-y-1">
              <p>{getAmountLimits().label}</p>
              {paymentAmount && (
                <div className="bg-gray-50 p-2 rounded text-xs">
                  {paymentType === "HT" ? (
                    <div>
                    </div>
                  ) : (
                    <div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("date")}</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("paymentMethod")}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("paymentMethod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(paymentMethod === "Credit Card" || paymentMethod === "Cheque") && (
            <div className="grid gap-2">
              <Label>{paymentMethod === "Cheque" ? t("chequeNumber") : t("cardNumber")}</Label>
              <Input
                type="text"
                placeholder={
                  paymentMethod === "Cheque"
                    ? t("enterChequeNumber")
                    : t("enterCardNumber")
                }
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          )}
        </>
      )}
    </div>
    <DialogFooter className="mt-4">
      <Button 
        onClick={handleSubmitPayment} 
        disabled={isSubmittingPayment || !paymentAmount || !paymentDate}
      >
        {isSubmittingPayment ? t("submitting") : t("submit")}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* View Payments Modal */}
      <Dialog open={showPaymentsModal} onOpenChange={setShowPaymentsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t("paymentsFor")} {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {invoicePayments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t("noPaymentsFound")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("method")}</TableHead>
                    <TableHead>{t("reference")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicePayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.date, preferences?.dateFormat)}</TableCell>
                      <TableCell>{format(payment.amount)}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{payment.reference || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewReceipt(payment)}
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(payment.id)}
                            disabled={deletingPaymentId === payment.id}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Modal */}
      <Dialog open={showEditPaymentModal} onOpenChange={setShowEditPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editPayment")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <div className="grid gap-2">
              <Label>{t("amount")}</Label>
              <Input
                type="number"
                placeholder={t("paymentAmount")}
                value={paymentAmount}
                min={0}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("date")}</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("paymentMethod")}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("paymentMethod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(paymentMethod === "Credit Card" || paymentMethod === "Cheque") && (
              <div className="grid gap-2">
                <Label>{paymentMethod === "Cheque" ? t("chequeNumber") : t("cardNumber")}</Label>
                <Input
                  type="text"
                  placeholder={
                    paymentMethod === "Cheque"
                      ? t("enterChequeNumber")
                      : t("enterCardNumber")
                  }
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button 
              onClick={handleUpdatePayment} 
              disabled={isSubmittingPayment || !paymentAmount || !paymentDate}
            >
              {isSubmittingPayment ? t("updating") : t("update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelInvoice")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {t("confirmCancelInvoice")}
            </p>
            {selectedInvoice && (
              <div className="mt-4 space-y-2">
                <p><strong>{t("invoiceNumber")}:</strong> {selectedInvoice.invoiceNumber}</p>
                <p><strong>{t("client")}:</strong> {clients.find(c => c.id === selectedInvoice.clientId)?.name || t("unknownClient")}</p>
                <p><strong>{t("totalAmount")}:</strong> {format(selectedInvoice.totalAmount)}</p>
                <p><strong>{t("amountPaid")}:</strong> {format(selectedInvoice.amountPaid)}</p>
                {selectedInvoice.amountPaid > 0 && (
                  <p className="text-red-600 font-medium">
                    {t("warningCancelInvoiceWithPayments")}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="destructive"
              onClick={handleCancelInvoice}
              disabled={cancelingId !== null}
            >
              {cancelingId ? t("canceling") : t("confirmCancel")}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelModal(false)}
              disabled={cancelingId !== null}
            >
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            <div dangerouslySetInnerHTML={{ __html: previewContent }} />
          </div>
          <DialogFooter>
            <Button onClick={() => {
              const printWindow = window.open('', '_blank')
              if (printWindow) {
                printWindow.document.write(previewContent)
                printWindow.document.close()
                printWindow.print()
              }
            }}>
              {t("print")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}