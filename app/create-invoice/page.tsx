"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useApiStore } from "@/lib/api-store"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { calculateInvoiceTotals, formatCurrencyRight } from "@/lib/utils"
import type { InvoiceItem, Invoice, Client, Payment } from "@/types"
import { PlusCircle, Trash2, FileDown, CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { generateInvoicePdf } from "@/lib/pdf-generator"

// Extended interface for invoice items with optional fields
interface ExtendedInvoiceItem extends InvoiceItem {
  achatPiece?: number     // Purchase price
  ventePiece?: number     // Selling price (this becomes unitPrice)
  benefits?: number       // Calculated: ventePiece - achatPiece
  mod?: number
  tarifTolier?: number    // New field for tarif tolier
}

// Custom DatePicker component using shadcn/ui Calendar and Popover
interface DatePickerProps {
  id?: string
  selected?: Date
  onChange: (date: Date | undefined) => void
  required?: boolean
  placeholder?: string
}

function DatePicker({ id, selected, onChange, required, placeholder = "Pick a date" }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("id")

  const {
    clients,
    invoices,
    addInvoice,
    addPayment,
    updateInvoice,
    deleteInvoice,
    loading,
    preferences,
    company,
    getNextInvoiceNumber,
  } = useApiStore()
  const { t } = useI18n()
  const { toast } = useToast()

  // Locale & currency setup for formatting
  const locale = preferences?.language === "fr" ? "fr-FR" : "en-US"
  const currencyCode = preferences?.currency || "USD"

  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [paymentType, setPaymentType] = useState<"HT" | "TTC">("TTC")
  const [paymentInputAmount, setPaymentInputAmount] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [invoiceType, setInvoiceType] = useState<"invoice" | "bon_de_livraison">("invoice")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [paymentReference, setPaymentReference] = useState("")
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false)
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date())
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  const [stampAmount, setStampAmount] = useState(1)
  const [items, setItems] = useState<ExtendedInvoiceItem[]>([{ 
    description: "", 
    quantity: 1, 
    unitPrice: 0, 
    total: 0, 
    achatPiece: 0, 
    ventePiece: 0, 
    benefits: 0, 
    mod: 0, 
    tarifTolier: 0 
  }])
  const [taxPercentage, setTaxPercentage] = useState(0)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [notes, setNotes] = useState("")
  const [amountPaid, setAmountPaid] = useState(0)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  
  // Track original amount paid to detect changes
  const [originalAmountPaid, setOriginalAmountPaid] = useState(0)

  // Conditional rendering based on preferences
  const showDueDate = preferences?.showDueDate !== false
  const showNotes = preferences?.showNotes !== false

  // Get selected vehicle details
  const selectedVehicle = useMemo(() => {
    if (!selectedClient || selectedClient.clientType !== "company" || !selectedVehicleId) {
      return null
    }
    return selectedClient.vehicles?.find(vehicle => vehicle._id === selectedVehicleId) || null
  }, [selectedClient, selectedVehicleId])

  // Function to generate next invoice number
  const generateNextInvoiceNumber = async (type: "invoice" | "bon_de_livraison") => {
    try {
      setIsGeneratingNumber(true)
      const nextNumber = await getNextInvoiceNumber(type)
      const currentYear = new Date().getFullYear()
      return `${currentYear}-${nextNumber}`
    } catch (error) {
      console.error("Error generating invoice number:", error)
      toast({
        title: "Error",
        description: "Failed to generate invoice number.",
        variant: "destructive",
      })
      // Fallback to timestamp-based number
      const currentYear = new Date().getFullYear()
      return `${currentYear}-${Date.now()}`
    } finally {
      setIsGeneratingNumber(false)
    }
  }
  

  // Add this helper function for amount limits:
  const getPaymentAmountLimits = () => {
    const currentTaxPercentage = taxPercentage || 0
    
    if (paymentType === "HT") {
      const unpaidHT = (subtotal)
      return {
        max: unpaidHT,
        label: `${t("maxPayableAmountHT")}: ${formatCurrencyRight(unpaidHT, currencyCode, locale)}`
      }
    } else {
      const unpaidTTC = totalAmount 
      return {
        max: unpaidTTC,
        label: `${t("maxPayableAmount")}: ${formatCurrencyRight(unpaidTTC, currencyCode, locale)}`
      }
    }
  }

  // Handle client selection change
  const handleClientChange = (clientId: string) => {
  const client = clients.find((c) => c.id === clientId) || null
  setSelectedClient(client)
  
  // Reset vehicle selection when client changes
  setSelectedVehicleId("")
  
  // Set stamp amount based on client's stamp field, default to 1 if not exists
  if (client) {
    const clientStamp = client.stamp || 1
    setStampAmount(clientStamp)
  } else {
    setStampAmount(1)
  }
  
  // If the new client is not a company, clear any vehicle selection
  if (!client || client.clientType !== "company") {
    setSelectedVehicleId("")
  }
}

  // Generate invoice number when type changes (for new invoices only)
  useEffect(() => {
    const generateNumber = async () => {
      if (!invoiceId && !currentInvoice && isFormInitialized) {
        const newNumber = await generateNextInvoiceNumber(invoiceType)
        setInvoiceNumber(newNumber)
      }
    }
    
    if (isFormInitialized) {
      generateNumber()
    }
  }, [invoiceType, isFormInitialized, invoiceId, currentInvoice])
  
  useEffect(() => {
    // Force TTC for invoices, allow HT/TTC toggle for delivery notes
    if (invoiceType === "invoice") {
      setPaymentType("TTC")
    }
  }, [invoiceType])
  
  useEffect(() => {
    if (preferences && !isFormInitialized && !invoiceId) {
      setTaxPercentage(preferences.defaultTaxPercentage || 0)
    }
  }, [preferences, isFormInitialized, invoiceId])

  useEffect(() => {
  if (invoiceId && invoices.length > 0) {
    const foundInvoice = invoices.find((inv) => inv.id === invoiceId)
    if (foundInvoice) {
      setCurrentInvoice(foundInvoice)
      setInvoiceType(foundInvoice.type)
      setInvoiceNumber(foundInvoice.invoiceNumber)
      setInvoiceDate(new Date(foundInvoice.date))
      setDueDate(new Date(foundInvoice.dueDate))
      setItems(foundInvoice.items.length > 0 ? foundInvoice.items.map(item => ({
        ...item,
        achatPiece: (item as ExtendedInvoiceItem).achatPiece || 0,
        ventePiece: (item as ExtendedInvoiceItem).ventePiece || item.unitPrice || 0,
        benefits: (item as ExtendedInvoiceItem).benefits || 0,
        mod: (item as ExtendedInvoiceItem).mod || 0,
        tarifTolier: (item as ExtendedInvoiceItem).tarifTolier || 0
      })) : [{ 
        description: "", 
        quantity: 1, 
        unitPrice: 0, 
        total: 0, 
        achatPiece: 0, 
        ventePiece: 0, 
        benefits: 0, 
        mod: 0, 
        tarifTolier: 0 
      }])
      setTaxPercentage(foundInvoice.taxPercentage || 0)
      setDiscountPercentage(foundInvoice.discountPercentage || 0)
      setNotes(foundInvoice.notes || "")
      setAmountPaid(foundInvoice.amountPaid || 0)
      setOriginalAmountPaid(foundInvoice.amountPaid || 0)

      const clientFound = clients.find((c) => c.id === foundInvoice.clientId)
      if (clientFound) {
        setSelectedClient(clientFound)
        
        // Set stamp amount based on client's stamp field
        const clientStamp = clientFound.stamp || 1
        setStampAmount(clientStamp)
        
        // Set vehicle selection if it exists in the invoice
        if (foundInvoice.vehicleId && clientFound.clientType === "company") {
          setSelectedVehicleId(foundInvoice.vehicleId)
        }
      }
      setIsFormInitialized(true)
    }
  } else if (!invoiceId) {
    setCurrentInvoice(null)
    setSelectedClient(null)
    setSelectedVehicleId("")
    setInvoiceType("invoice")
    setInvoiceNumber("")
    setInvoiceDate(new Date())
    setDueDate(new Date())
    setItems([{ 
      description: "", 
      quantity: 1, 
      unitPrice: 0, 
      total: 0, 
      achatPiece: 0, 
      ventePiece: 0, 
      benefits: 0, 
      mod: 0, 
      tarifTolier: 0 
    }])
    setTaxPercentage(preferences?.defaultTaxPercentage || 0)
    setDiscountPercentage(0)
    setNotes("")
    setAmountPaid(0)
    setOriginalAmountPaid(0)
    setStampAmount(1) // Reset to default
    setIsFormInitialized(true)
  }
}, [invoiceId, invoices, clients, preferences])

  const { subtotal, taxAmount, discountAmount, totalAmount } = useMemo(() => {
  // Calculate subtotal as sum of all item totals
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
  
  // Calculate tax amount
  const calculatedTaxAmount = (calculatedSubtotal * taxPercentage) / 100
  
  // Calculate discount amount
  const calculatedDiscountAmount = (calculatedSubtotal * discountPercentage) / 100
  
  // Calculate final total: subtotal + tax - discount + stamp (dynamic based on client)
  const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount - calculatedDiscountAmount + stampAmount
  
  return {
    subtotal: calculatedSubtotal,
    taxAmount: calculatedTaxAmount,
    discountAmount: calculatedDiscountAmount,
    totalAmount: calculatedTotalAmount
  }
}, [items, taxPercentage, discountPercentage, stampAmount])

  const handleItemChange = (index: number, field: keyof ExtendedInvoiceItem, value: any) => {
    const newItems = [...items]
    if (field === "quantity" || field === "unitPrice" || field === "achatPiece" || field === "ventePiece" || field === "mod" || field === "tarifTolier") {
      const numValue = Number.parseFloat(value) || 0
      newItems[index][field] = Math.max(0, numValue)
      
      // If ventePiece is changed, update unitPrice
      if (field === "ventePiece") {
        newItems[index].unitPrice = numValue
      }
      
      // Calculate benefits: ventePiece - achatPiece
      const achatPiece = newItems[index].achatPiece || 0
      const ventePiece = newItems[index].ventePiece || 0
      newItems[index].benefits = Math.max(0, ventePiece - achatPiece)
      
      // Calculate total including mod and tarifTolier
      const baseTotal = newItems[index].quantity * newItems[index].unitPrice
      const mod = newItems[index].mod || 0
      const tarifTolier = newItems[index].tarifTolier || 0
      newItems[index].total = baseTotal + mod + tarifTolier
    } else {
      newItems[index][field] = value
    }
    setItems(newItems)
  }

  const handleAddItem = () => {
    setItems([...items, { 
      description: "", 
      quantity: 1, 
      unitPrice: 0, 
      total: 0, 
      achatPiece: 0, 
      ventePiece: 0, 
      benefits: 0, 
      mod: 0, 
      tarifTolier: 0 
    }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      setItems(newItems)
    }
  }

  // Handle manual invoice number regeneration
  const handleRegenerateInvoiceNumber = async () => {
    if (!currentInvoice) {
      const newNumber = await generateNextInvoiceNumber(invoiceType)
      setInvoiceNumber(newNumber)
    }
  }

  // Fixed function to handle adding a payment - moved outside handleSubmit
  const handleAddPayment = async (invoiceId: string, paymentAmount: number) => {
    try {
      const paymentData: Omit<Payment, "id"> = {
        invoiceId: invoiceId,
        amount: paymentAmount,
        method: paymentMethod,
        reference: paymentReference,
        date: new Date().toISOString().split("T")[0],
        notes: `Payment via ${paymentMethod}${paymentReference ? ` - Ref: ${paymentReference}` : ""}`,
      }

      await addPayment(paymentData)
      
      toast({
        title: t("paymentAddedSuccess") || "Payment Added",
        description: `${formatCurrencyRight(paymentAmount, currencyCode, locale)} payment has been recorded.`,
        variant: "success",
      })

      return true
    } catch (error) {
      console.error("Payment add error:", error)
      toast({
        title: "Error",
        description: "Failed to add payment.",
        variant: "destructive",
      })
      return false
    }
  }

  const validateForm = () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client.",
        variant: "destructive",
      })
      return false
    }
    
    // Validate vehicle selection for company clients
    if (selectedClient.clientType === "company" && selectedClient.vehicles && selectedClient.vehicles.length > 0 && !selectedVehicleId) {
      toast({
        title: "Error",
        description: "Please select a vehicle for this company client.",
        variant: "destructive",
      })
      return false
    }
    
    if (!invoiceNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invoice number.",
        variant: "destructive",
      })
      return false
    }
    if (!invoiceDate) {
      toast({
        title: "Error",
        description: "Please select an invoice date.",
        variant: "destructive",
      })
      return false
    }
    if (showDueDate && !dueDate) {
      toast({
        title: "Error",
        description: "Please select a due date.",
        variant: "destructive",
      })
      return false
    }
    if (items.some((item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0)) {
      toast({
        title: "Error",
        description: "Please ensure all invoice items have a description, quantity > 0, and unit price >= 0.",
        variant: "destructive",
      })
      return false
    }
    if (amountPaid < 0 || amountPaid > totalAmount) {
      toast({
        title: "Error",
        description: "Amount paid must be between 0 and the total amount.",
        variant: "destructive",
      })
      return false
    }
    if (taxPercentage < 0 || taxPercentage > 100) {
      toast({
        title: "Error",
        description: "Tax percentage must be between 0 and 100.",
        variant: "destructive",
      })
      return false
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      toast({
        title: "Error",
        description: "Discount percentage must be between 0 and 100.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Calculate the payment amount to add
    const paymentAmountToAdd = paymentInputAmount ? parseFloat(paymentInputAmount) : 0
    let finalPaymentAmount = 0
    finalPaymentAmount = paymentAmountToAdd

    // Ensure all extended fields are included in the items when saving
    const itemsWithExtendedFields = items.map(item => ({
      ...item,
      achatPiece: item.achatPiece || 0,
      ventePiece: item.ventePiece || 0,
      benefits: item.benefits || 0,
      mod: item.mod || 0,
      tarifTolier: item.tarifTolier || 0,
    }))

    // Set the correct amountPaid value for the invoice
    const invoiceAmountPaid = currentInvoice ? originalAmountPaid : (finalPaymentAmount > 0 ? finalPaymentAmount : 0)

    const invoiceData: Omit<Invoice, "id" | "createdAt" | "companyId" | "status"> = {
      clientId: selectedClient!.id,
      license: selectedVehicleId || "", // Add vehicle ID if selected
      invoiceNumber: invoiceNumber,
      number: invoiceNumber,
      date: invoiceDate!.toISOString().split("T")[0],
      dueDate: showDueDate ? dueDate!.toISOString().split("T")[0] : invoiceDate!.toISOString().split("T")[0],
      items: itemsWithExtendedFields,
      subtotal,
      paymentType: paymentType,
      taxPercentage,
      taxAmount,
      discountPercentage,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      notes: showNotes ? notes.trim() : "",
      type: invoiceType,
      originalDeliveryNoteNumber: ""
    }

    try {
      let savedInvoice: Invoice

      if (currentInvoice) {
        // Update existing invoice
        savedInvoice = await updateInvoice(currentInvoice.id, invoiceData)
        
        // Handle additional payment for existing invoices
        if (finalPaymentAmount > 0) {
          const paymentSuccess = await handleAddPayment(currentInvoice.id, finalPaymentAmount)
          if (!paymentSuccess) {
            toast({
              title: "Warning",
              description: "Invoice updated successfully, but payment could not be added.",
              variant: "destructive",
            })
          }
        }
        
        toast({
          title: t("invoiceUpdatedSuccess"),
          variant: "success",
        })
      } else {
        // Create new invoice
        savedInvoice = await addInvoice(invoiceData)
        
        // Handle initial payment for new invoices
        if (finalPaymentAmount > 0) {
          const paymentSuccess = await handleAddPayment(savedInvoice.id, finalPaymentAmount)
          if (!paymentSuccess) {
            toast({
              title: "Warning",
              description: "Invoice created successfully, but payment could not be added.",
              variant: "destructive",
            })
          }
        }
        
        toast({
          title: t("invoiceCreatedSuccess"),
          variant: "success",
        })
      }
      
      // Reset payment input fields after successful submission
      setPaymentInputAmount("")
      setPaymentReference("")
      
      router.push("/invoices")
    } catch (error) {
      console.error("Invoice save error:", error)
      toast({
        title: "Error",
        description: `Failed to ${currentInvoice ? "update" : "create"} invoice.`,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (currentInvoice) {
      try {
        await deleteInvoice(currentInvoice.id)
        toast({
          title: t("invoiceDeletedSuccess"),
          variant: "success",
        })
        router.push("/invoices")
      } catch (error) {
        console.error("Invoice delete error:", error)
        toast({
          title: "Error",
          description: "Failed to delete invoice.",
          variant: "destructive",
        })
      }
    }
  }

  const handleExportPdf = async () => {
    if (!preferences || !selectedClient || !currentInvoice) {
      toast({
        title: "Error",
        description: "Missing required data for PDF export.",
        variant: "destructive",
      })
      return
    }
    
    try {
      await generateInvoicePdf(currentInvoice, selectedClient, preferences, t, company || undefined)
    } catch (error) {
      console.error("PDF export error:", error)
      toast({
        title: "Error",
        description: "Failed to export PDF.",
        variant: "destructive",
      })
    }
  }

  const handleTaxPercentageChange = (value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setTaxPercentage(Math.min(Math.max(0, numValue), 100))
  }

  const handleDiscountPercentageChange = (value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setDiscountPercentage(Math.min(Math.max(0, numValue), 100))
  }

  // Fixed payment amount change handler
  const handleAmountPaidChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    const { max } = getPaymentAmountLimits()
    
    if (numValue <= max) {
      setPaymentInputAmount(value)
    } else {
      const maxValue = max.toFixed(3)
      setPaymentInputAmount(maxValue)
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">{currentInvoice ? t("editInvoice") : t("createInvoice")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-md border p-6">
          <h2 className="mb-4 text-2xl font-semibold">{t("invoiceDetails")}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="invoiceType">{t("invoiceType")}</Label>
              <Select
                value={invoiceType}
                onValueChange={(value) => setInvoiceType(value as "invoice" | "bon_de_livraison")}
                id="invoiceType"
                disabled={!!currentInvoice}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectInvoiceType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">{t("invoice")}</SelectItem>
                  <SelectItem value="bon_de_livraison">{t("bonDeLivraison")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoiceNumber">{t("invoiceNumber")}</Label>
              <div className="flex gap-2">
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                  disabled={isGeneratingNumber}
                  placeholder={`${new Date().getFullYear()}-1`}
                />
                {!currentInvoice && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateInvoiceNumber}
                    disabled={isGeneratingNumber}
                    title="Generate new number"
                  >
                    {isGeneratingNumber ? <Spinner size="sm" /> : "↻"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Format: YYYY-ID (auto-generated)
              </p>
            </div>

            <div>
              <Label htmlFor="client">{t("client")}</Label>
              <Select
                value={selectedClient?.id || ""}
                onValueChange={handleClientChange}
                id="client"
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectClient")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.clientType === "company" ? "(Company)" : "(Individual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle/License Plate Selection for Company Clients */}
            {selectedClient && selectedClient.clientType === "company" && selectedClient.vehicles && selectedClient.vehicles.length > 0 && (
              <div>
                <Label htmlFor="vehicle">{t("licensePlate")}</Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={setSelectedVehicleId}
                  id="vehicle"
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectVehicle")} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedClient.vehicles.map((vehicle) => (
                      <SelectItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.licensePlate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVehicle && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="invoiceDate">{t("invoiceDate")}</Label>
              <DatePicker
                id="invoiceDate"
                selected={invoiceDate}
                onChange={(date) => setInvoiceDate(date)}
                placeholder="Select invoice date"
              />
            </div>

            {showDueDate && (
              <div>
                <Label htmlFor="dueDate">{t("dueDate")}</Label>
                <DatePicker
                  id="dueDate"
                  selected={dueDate}
                  onChange={(date) => setDueDate(date)}
                  placeholder="Select due date"
                />
              </div>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="rounded-md border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("items")}</h2>
          </div>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-10">
                <div className="md:col-span-2">
                  <Label htmlFor={`description-${index}`}>{t("description")}</Label>
                  <Input
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`quantity-${index}`}>{t("quantity")}</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`achatPiece-${index}`}>ACHAT PIECES</Label>
                  <Input
                    id={`achatPiece-${index}`}
                    type="number"
                    min={0}
                    step="0.001"
                    value={item.achatPiece || 0}
                    onChange={(e) => handleItemChange(index, "achatPiece", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`ventePiece-${index}`}>VENTE PIECE</Label>
                  <Input
                    id={`ventePiece-${index}`}
                    type="number"
                    min={0}
                    step="0.001"
                    value={item.ventePiece || 0}
                    onChange={(e) => handleItemChange(index, "ventePiece", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`benefits-${index}`}>BENEFICES</Label>
                  <Input
                    id={`benefits-${index}`}
                    value={formatCurrencyRight(item.benefits || 0, currencyCode, locale)}
                    readOnly
                    className="font-medium bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor={`mod-${index}`}>MOD</Label>
                  <Input
                    id={`mod-${index}`}
                    type="number"
                    min={0}
                    step="0.001"
                    value={item.mod || 0}
                    onChange={(e) => handleItemChange(index, "mod", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`tarifTolier-${index}`}>TARIF TOLIER</Label>
                  <Input
                    id={`tarifTolier-${index}`}
                    type="number"
                    min={0}
                    step="0.001"
                    value={item.tarifTolier || 0}
                    onChange={(e) => handleItemChange(index, "tarifTolier", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`total-${index}`}>{t("total")}</Label>
                  <Input
                    id={`total-${index}`}
                    value={formatCurrencyRight(item.total, currencyCode, locale)}
                    readOnly
                    className="font-medium"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" onClick={handleAddItem} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("addItem")}
          </Button>

          {/* Totals */}
          <div className="mt-6 flex flex-col items-end space-y-2">
            <div className="flex w-full max-w-xs justify-between">
              <Label>{t("subtotal")}:</Label>
              <span>{formatCurrencyRight(subtotal, currencyCode, locale)}</span>
            </div>

            {preferences?.showTax && (
              <div className="flex w-full max-w-xs items-center justify-between gap-2">
                <Label htmlFor="taxPercentage">{t("tax")} (%):</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  value={taxPercentage}
                  onChange={(e) => handleTaxPercentageChange(e.target.value)}
                  className="w-24 text-right"
                  min="0"
                  max="100"
                  step="0.001"
                />
                <span className="min-w-[80px] text-right">{formatCurrencyRight(taxAmount, currencyCode, locale)}</span>
              </div>
            )}

            {preferences?.showDiscount && (
              <div className="flex w-full max-w-xs items-center justify-between gap-2">
                <Label htmlFor="discountPercentage">{t("discount")} (%):</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => handleDiscountPercentageChange(e.target.value)}
                  className="w-24 text-right"
                  min="0"
                  max="100"
                  step="0.001"
                />
                <span className="min-w-[80px] text-right">{formatCurrencyRight(discountAmount, currencyCode, locale)}</span>
              </div>
            )}

            <div className="flex w-full max-w-xs justify-between">
              <Label>{t("stamp")}:</Label>
              <span>{formatCurrencyRight(stampAmount, currencyCode, locale)}</span>
            </div>

            <div className="flex w-full max-w-xs justify-between text-lg font-bold">
              <Label>{t("grandTotal")}:</Label>
              <span>{formatCurrencyRight(totalAmount, currencyCode, locale)}</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="rounded-md border p-6">
          <h2 className="mb-4 text-2xl font-semibold">{t("paymentDetails")}</h2>
          
          {/* Current Payment Status */}
          {currentInvoice && originalAmountPaid > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium text-blue-900">
                    {t("currentPaidAmount")}
                  </Label>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrencyRight(originalAmountPaid, currencyCode, locale)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-900">
                    {t("remainingBalance")}
                  </Label>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrencyRight(totalAmount - originalAmountPaid, currencyCode, locale)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Type Toggle - Only for Delivery Notes */}
          {invoiceType === "bon_de_livraison" && (
            <div className="mb-4 flex items-center justify-between p-3 border rounded-lg">
              <div className="flex flex-col">
                <Label className="text-sm font-medium">
                  {t("paymentType")}
                </Label>
                <span className="text-xs text-gray-500">
                  {paymentType === "HT" ? t("amountExcludingTax") : t("amountIncludingTax")}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Label className={`text-sm ${paymentType === "HT" ? "font-medium" : "text-gray-500"}`}>
                  HT
                </Label>
                <Switch
                  checked={paymentType === "TTC"}
                  onCheckedChange={(checked) => {
                    setPaymentType(checked ? "TTC" : "HT")
                    setPaymentInputAmount("")
                    setAmountPaid(originalAmountPaid)
                  }}
                />
                <Label className={`text-sm ${paymentType === "TTC" ? "font-medium" : "text-gray-500"}`}>
                  TTC
                </Label>
              </div>
            </div>
          )}

          {/* For invoices, show that payment type is always TTC */}
          {invoiceType === "invoice" && (
            <div className="mb-4 p-3 bg-gray-50 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {t("paymentType")}
                </Label>
                <span className="text-sm font-medium text-gray-900">TTC (Tax Included)</span>
              </div>
              <span className="text-xs text-gray-500">
                {t("invoicesAlwaysUseTTC") || "Invoices always use TTC pricing"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="amountPaid">
                {currentInvoice ? t("additionalPayment") : t("amountPaid")} 
                {invoiceType === "bon_de_livraison" ? ` (${paymentType})` : " (TTC)"}
              </Label>
              <Input
                id="amountPaid"
                type="number"
                value={paymentInputAmount}
                onChange={(e) => handleAmountPaidChange(e.target.value)}
                step="0.001"
                min="0"
                max={getPaymentAmountLimits().max}
                placeholder={
                  invoiceType === "invoice" 
                    ? t("amountIncludingTax") 
                    : (paymentType === "HT" ? t("amountExcludingTax") : t("amountIncludingTax"))
                }
              />
              
              {/* Amount limits and calculation preview */}
              <div className="text-sm text-gray-600 space-y-1 mt-1">
                <p>{getPaymentAmountLimits().label}</p>
                {paymentInputAmount && (
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <p className="font-medium">
                      Payment: {formatCurrencyRight(parseFloat(paymentInputAmount) || 0, currencyCode, locale)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="amountOutstanding">{t("totalOutstanding")}</Label>
              <Input
                id="amountOutstanding"
                value={formatCurrencyRight(Math.max(0, getPaymentAmountLimits().max - (parseFloat(paymentInputAmount) || 0)), currencyCode, locale)}
                readOnly
                className="font-medium"
              />
            </div>
          </div>

          {/* Payment Method Section */}
          {(parseFloat(paymentInputAmount) > 0 || (!currentInvoice && amountPaid > 0)) && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="paymentMethod">{t("paymentMethod")}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder={t("selectPaymentMethod")} />
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
                <div>
                  <Label htmlFor="paymentReference">
                    {paymentMethod === "Cheque" ? t("chequeNumber") : t("cardNumber")}
                  </Label>
                  <Input
                    id="paymentReference"
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
          )}
        </div>

        {/* Notes Section - Conditionally Rendered */}
        {showNotes && (
          <div className="rounded-md border p-6">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button type="submit" disabled={loading}>
            {currentInvoice ? t("updateInvoice") : t("createInvoice")}
          </Button>

          {currentInvoice && (
            <div className="flex gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">{t("deleteInvoice")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("confirmDeleteDesc")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>{t("delete")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={handleExportPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                {t("exportPdf")}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}