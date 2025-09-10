import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { Client, Company, Invoice, InvoicePreferences } from "@/types"
import { formatCurrency, formatDate } from "@/lib/utils"

// Extend jspdf with autoTable
const addAutoTable = autoTable as any

export async function generateInvoicePdf(
  invoice: Invoice,
  client: Client,
  preferences: InvoicePreferences,
  t: (key: string) => string,
  company?: Company,
) {
  const doc = new jsPDF()

  // Set font for international characters if needed (e.g., for French accents)
  // You might need to embed a font that supports these characters if not using standard ones
  doc.setFont("helvetica")

  // Company Info (if provided)
  if (company) {
    doc.setFontSize(16)
    doc.text(company.name, 14, 20)
    doc.setFontSize(10)
    doc.text(company.address, 14, 26)
    doc.text(`${t("phone")}: ${company.phone}`, 14, 32)
    doc.text(`${t("email")}: ${company.email}`, 14, 38)
  }

  // Invoice Type and Number
  doc.setFontSize(20)
  doc.text(t(invoice.type).toUpperCase(), 200, 20, { align: "right" })
  doc.setFontSize(12)
  doc.text(`${t("invoiceNumber")}: ${invoice.invoiceNumber}`, 200, 26, { align: "right" })

  // Client Info
  doc.setFontSize(12)
  doc.text(`${t("client")}:`, 14, 50)
  doc.setFontSize(10)
  doc.text(client.name, 14, 56)
  doc.text(client.address, 14, 62)
  doc.text(`${t("phone")}: ${client.phone}`, 14, 68)
  if (client.email) doc.text(`${t("email")}: ${client.email}`, 14, 74)

  // Dates
  doc.setFontSize(10)
  doc.text(`${t("date")}: ${formatDate(invoice.date, preferences.dateFormat)}`, 200, 50, { align: "right" })
  if (preferences.showDueDate) {
    doc.text(`${t("dueDate")}: ${formatDate(invoice.dueDate, preferences.dateFormat)}`, 200, 56, { align: "right" })
  }

  // Items Table
  const tableColumn = [t("description"), t("quantity"), t("unitPrice"), t("total")]
  const tableRows = invoice.items.map((item) => [
    item.description,
    item.quantity,
    formatCurrency(item.unitPrice),
    formatCurrency(item.total),
  ])

  addAutoTable(doc, {
    startY: 80,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
  })

  let finalY = (doc as any).lastAutoTable.finalY + 10

  // Totals
  doc.setFontSize(10)
  doc.text(`${t("subtotal")}: ${formatCurrency(invoice.subtotal)}`, 200, finalY, { align: "right" })
  finalY += 6
  if (preferences.showTax) {
    doc.text(`${t("tax")} (${invoice.taxPercentage}%): ${formatCurrency(invoice.taxAmount)}`, 200, finalY, {
      align: "right",
    })
    finalY += 6
  }
  if (preferences.showDiscount) {
    doc.text(
      `${t("discount")} (${invoice.discountPercentage}%): ${formatCurrency(invoice.discountAmount)}`,
      200,
      finalY,
      {
        align: "right",
      },
    )
    finalY += 6
  }
  doc.setFontSize(12)
  doc.text(`${t("grandTotal")}: ${formatCurrency(invoice.totalAmount)}`, 200, finalY, { align: "right" })
  finalY += 10

  // Amount Paid and Outstanding
  doc.setFontSize(10)
  doc.text(`${t("amountPaid")}: ${formatCurrency(invoice.amountPaid)}`, 200, finalY, { align: "right" })
  finalY += 6
  doc.text(`${t("totalOutstanding")}: ${formatCurrency(invoice.totalAmount - invoice.amountPaid)}`, 200, finalY, {
    align: "right",
  })
  finalY += 10

  // Notes
  if (preferences.showNotes && invoice.notes) {
    doc.setFontSize(10)
    doc.text(`${t("notes")}:`, 14, finalY)
    doc.text(invoice.notes, 14, finalY + 6, { maxWidth: 180 })
  }

  doc.save(`${invoice.type}-${invoice.invoiceNumber}.pdf`)
}

export async function generateClientProfilePdf(
  client: Client,
  preferences: InvoicePreferences,
  t: (key: string) => string,
  company?: Company,
) {
  const doc = new jsPDF()

  doc.setFont("helvetica")

  // Company Info (if provided)
  if (company) {
    doc.setFontSize(16)
    doc.text(company.name, 14, 20)
    doc.setFontSize(10)
    doc.text(company.address, 14, 26)
    doc.text(`${t("phone")}: ${company.phone}`, 14, 32)
    doc.text(`${t("email")}: ${company.email}`, 14, 38)
  }

  doc.setFontSize(20)
  doc.text(t("clientProfile").toUpperCase(), 200, 20, { align: "right" })

  doc.setFontSize(12)
  doc.text(`${t("clientDetails")}:`, 14, 50)
  doc.setFontSize(10)
  doc.text(`${t("name")}: ${client.name}`, 14, 56)
  doc.text(`${t("address")}: ${client.address}`, 14, 62)
  doc.text(`${t("phone")}: ${client.phone}`, 14, 68)
  if (client.email) doc.text(`${t("email")}: ${client.email}`, 14, 74)

  let currentY = 80
  if (client.vehicleMake || client.vehicleModel || client.vehicleYear || client.licensePlate) {
    doc.setFontSize(12)
    doc.text(`${t("vehicleDetails")}:`, 14, currentY)
    currentY += 6
    doc.setFontSize(10)
    if (client.vehicleMake) doc.text(`${t("vehicleMake")}: ${client.vehicleMake}`, 14, currentY)
    currentY += 6
    if (client.vehicleModel) doc.text(`${t("vehicleModel")}: ${client.vehicleModel}`, 14, currentY)
    currentY += 6
    if (client.vehicleYear) doc.text(`${t("vehicleYear")}: ${client.vehicleYear}`, 14, currentY)
    currentY += 6
    if (client.licensePlate) doc.text(`${t("licensePlate")}: ${client.licensePlate}`, 14, currentY)
    currentY += 10
  }

  doc.save(`client-profile-${client.name}.pdf`)
}
