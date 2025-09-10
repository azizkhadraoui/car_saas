// lib/preview-generator.ts
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Invoice, Payment, Client, Preferences } from "@/types"

interface TemplateData {
  [key: string]: any
}

// Safe number formatting function
function safeFormat(value: any, decimals: number = 2): string {
  try {
    if (value === null || value === undefined || value === '') {
      return '0.' + '0'.repeat(decimals)
    }
    const num = parseFloat(String(value))
    if (isNaN(num) || !isFinite(num)) {
      return '0.' + '0'.repeat(decimals)
    }
    return num.toFixed(decimals)
  } catch (error) {
    return '0.' + '0'.repeat(decimals)
  }
}

// Safe number conversion
function safeNumber(value: any): number {
  try {
    if (value === null || value === undefined || value === '') return 0
    const num = parseFloat(String(value))
    return isNaN(num) || !isFinite(num) ? 0 : num
  } catch (error) {
    return 0
  }
}

// Simple template engine - replaces {{variable}} with actual values
function renderTemplate(template: string, data: TemplateData): string {
  return template.replace(/\{\{(#?)(\/?)([\w.]+)\}\}/g, (match, isSection, isClosing, key) => {
    if (isSection && !isClosing) {
      // Handle sections like {{#items}}
      const value = getNestedValue(data, key)
      return Array.isArray(value) && value.length > 0 ? '' : '<!--SECTION_START-->'
    } else if (isSection && isClosing) {
      // Handle closing sections like {{/items}}
      return '<!--SECTION_END-->'
    } else {
      // Handle regular variables like {{companyName}}
      const value = getNestedValue(data, key)
      return value !== undefined ? String(value) : ''
    }
  })
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

// Process template sections (loops)
function processSections(template: string, data: TemplateData): string {
  const sectionRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g
  
  return template.replace(sectionRegex, (match, sectionKey, sectionTemplate) => {
    const sectionData = data[sectionKey]
    
    if (!sectionData || !Array.isArray(sectionData) || sectionData.length === 0) {
      return ''
    }
    
    return sectionData.map(item => {
      return renderTemplate(sectionTemplate, { ...data, ...item })
    }).join('')
  })
}

// Function to convert number to French words
function convertToFrenchWords(amount: number): string {
  try {
    const safeAmount = safeNumber(amount)
    return `${Math.floor(safeAmount).toLocaleString('fr-FR')} dinars et ${Math.round((safeAmount % 1) * 1000).toString().padStart(3, '0')} millimes`
  } catch (error) {
    return 'zéro dinars et zéro millimes'
  }
}

export async function generateInvoicePreview(
  invoice: Invoice,
  client: Client,
  preferences: Preferences,
  t: (key: string) => string
): Promise<string> {
  try {
    // Ensure we have valid data
    const safeInvoice = invoice || {} as Invoice
    const safeClient = client || {} as Client
    const safePreferences = preferences || {} as Preferences
    const items = Array.isArray(safeInvoice.items) ? safeInvoice.items : []

    // Calculate totals with safe number conversion
    let subtotal = 0
    for (const item of items) {
      const quantity = safeNumber(item?.quantity)
      const rate = safeNumber(item?.rate)
      subtotal += (quantity * rate)
    }
    
    // Group items by tax rate for TVA summary
    const taxGroups: Record<number, { base: number; amount: number }> = {}
    
    for (const item of items) {
      const taxRate = safeNumber(item?.tax)
      const quantity = safeNumber(item?.quantity)
      const rate = safeNumber(item?.rate)
      const itemTotal = quantity * rate
      const itemDiscount = safeNumber(item?.discount)
      const discountAmount = item?.discountType === 'percentage' 
        ? itemTotal * (itemDiscount / 100)
        : itemDiscount
      const taxableAmount = itemTotal - discountAmount
      const taxAmount = taxableAmount * (taxRate / 100)
      
      if (!taxGroups[taxRate]) {
        taxGroups[taxRate] = { base: 0, amount: 0 }
      }
      taxGroups[taxRate].base += taxableAmount
      taxGroups[taxRate].amount += taxAmount
    }

    let totalTaxAmount = 0
    for (const group of Object.values(taxGroups)) {
      totalTaxAmount += safeNumber(group.amount)
    }
    
    const stampDuty = safeNumber(safePreferences.stampDuty) || 1.000
    const totalTTC = subtotal + totalTaxAmount + stampDuty
    
    // Process items safely
    const processedItems = []
    for (const item of items) {
      const quantity = safeNumber(item?.quantity)
      const rate = safeNumber(item?.rate)
      const tax = safeNumber(item?.tax)
      const discount = safeNumber(item?.discount)
      
      const itemTotal = quantity * rate
      const discountAmount = item?.discountType === 'percentage' 
        ? itemTotal * (discount / 100)
        : discount
      const finalTotal = itemTotal - discountAmount
      
      processedItems.push({
        reference: String(item?.reference || item?.id || ''),
        designation: String(item?.name || '') + (item?.description ? ` - ${item.description}` : ''),
        tva: safeFormat(tax, 2),
        quantity: quantity,
        unitPrice: safeFormat(rate, 3),
        discount: discountAmount > 0 ? safeFormat(discountAmount, 3) : '0.000',
        total: safeFormat(finalTotal, 3)
      })
    }
    
    // Process TVA summary safely
    const processedTvaSummary = []
    for (const [rate, data] of Object.entries(taxGroups)) {
      processedTvaSummary.push({
        rate: safeFormat(rate, 2),
        base: safeFormat(data.base, 3),
        amount: safeFormat(data.amount, 3)
      })
    }
    
    const templateData: TemplateData = {
      // Company information
      companyName: String(safePreferences.companyName || ''),
      companyAddress: String(safePreferences.companyAddress || ''),
      companyCity: String(safePreferences.companyCity || ''),
      companyZip: String(safePreferences.companyZip || ''),
      companyCountry: String(safePreferences.companyCountry || ''),
      companyPhone: String(safePreferences.companyPhone || ''),
      companyEmail: String(safePreferences.companyEmail || ''),
      companyWebsite: String(safePreferences.companyWebsite || ''),
      companyMF: String(safePreferences.companyMF || safePreferences.companyTaxNumber || ''),
      companyRIB: String(safePreferences.companyRIB || ''),
      
      // Invoice information
      invoiceNumber: String(safeInvoice.invoiceNumber || ''),
      invoiceDate: safeInvoice.date ? formatDate(safeInvoice.date, safePreferences.dateFormat || 'MM/DD/YYYY') : '',
      dueDate: safeInvoice.dueDate ? formatDate(safeInvoice.dueDate, safePreferences.dateFormat || 'MM/DD/YYYY') : null,
      
      // Client information
      clientName: String(safeClient.name || ''),
      clientAddress: String(safeClient.address || ''),
      clientCity: String(safeClient.city || ''),
      clientZip: String(safeClient.zip || ''),
      clientCountry: String(safeClient.country || ''),
      clientPhone: String(safeClient.phone || ''),
      clientEmail: String(safeClient.email || ''),
      clientMF: String(safeClient.taxNumber || ''),
      
      // Processed data
      items: processedItems,
      tvaSummary: processedTvaSummary,
      
      // Totals
      subtotal: safeFormat(subtotal, 3),
      totalHT: safeFormat(subtotal, 3),
      taxAmount: safeFormat(totalTaxAmount, 3),
      stampDuty: safeFormat(stampDuty, 3),
      totalTTC: safeFormat(totalTTC, 3),
      
      // Amount in words (French)
      amountInWords: convertToFrenchWords(totalTTC),
      
      // Notes and terms
      notes: String(safeInvoice.notes || ''),
      terms: String(safeInvoice.terms || '')
    }

    // Load template
    const template = await loadInvoiceTemplate()
    
    // Process sections first (for loops like items)
    let processedTemplate = processSections(template, templateData)
    
    // Then render variables
    return renderTemplate(processedTemplate, templateData)
    
  } catch (error) {
    console.error('Error generating invoice preview:', error)
    return '<div>Error generating preview: ' + String(error) + '</div>'
  }
}

export async function generateReceiptPreview(
  payment: Payment,
  invoice: Invoice,
  client: Client,
  preferences: Preferences,
  t: (key: string) => string
): Promise<string> {
  try {
    const format = (amount: number) => 
      formatCurrency(amount, preferences?.currency || 'USD', { symbolPosition: "right" })

    const safePayment = payment || {} as Payment
    const safeInvoice = invoice || {} as Invoice
    const safeClient = client || {} as Client
    const safePreferences = preferences || {} as Preferences

    const unpaidAmount = Math.max(safeNumber(safeInvoice.totalAmount) - safeNumber(safeInvoice.amountPaid), 0)
    
    const templateData: TemplateData = {
      // Company information
      companyName: String(safePreferences.companyName || ''),
      companyAddress: String(safePreferences.companyAddress || ''),
      companyCity: String(safePreferences.companyCity || ''),
      companyZip: String(safePreferences.companyZip || ''),
      companyCountry: String(safePreferences.companyCountry || ''),
      companyPhone: String(safePreferences.companyPhone || ''),
      companyEmail: String(safePreferences.companyEmail || ''),
      
      // Receipt information
      receiptNumber: String(safePayment.reference || safePayment.id?.slice(-8).toUpperCase() || ''),
      paymentDate: safePayment.date ? formatDate(safePayment.date, safePreferences.dateFormat || 'MM/DD/YYYY') : '',
      paymentAmount: format(safeNumber(safePayment.amount)),
      paymentMethod: String(safePayment.method || ''),
      paymentReference: String(safePayment.reference || ''),
      
      // Client information
      clientName: String(safeClient.name || ''),
      clientAddress: String(safeClient.address || ''),
      clientCity: String(safeClient.city || ''),
      clientZip: String(safeClient.zip || ''),
      clientCountry: String(safeClient.country || ''),
      clientPhone: String(safeClient.phone || ''),
      clientEmail: String(safeClient.email || ''),
      
      // Invoice information
      invoiceNumber: String(safeInvoice.invoiceNumber || ''),
      invoiceDate: safeInvoice.date ? formatDate(safeInvoice.date, safePreferences.dateFormat || 'MM/DD/YYYY') : '',
      invoiceType: t(safeInvoice.type || 'invoice'),
      dueDate: safeInvoice.dueDate ? formatDate(safeInvoice.dueDate, safePreferences.dateFormat || 'MM/DD/YYYY') : null,
      
      // Balance information
      invoiceTotal: format(safeNumber(safeInvoice.totalAmount)),
      totalPaid: format(safeNumber(safeInvoice.amountPaid)),
      remainingBalance: format(unpaidAmount),
      
      // Status
      paymentStatus: unpaidAmount === 0 ? "PAID IN FULL" : "PARTIAL PAYMENT",
      
      // Current date/time
      currentDate: formatDate(new Date(), safePreferences.dateFormat || 'MM/DD/YYYY'),
      currentTime: new Date().toLocaleTimeString()
    }

    // Load template
    const template = await loadReceiptTemplate()
    
    // Process sections first
    let processedTemplate = processSections(template, templateData)
    
    // Then render variables
    return renderTemplate(processedTemplate, templateData)
  } catch (error) {
    console.error('Error generating receipt preview:', error)
    return '<div>Error generating receipt preview: ' + String(error) + '</div>'
  }
}

// Template loader functions - implement these based on your setup
async function loadInvoiceTemplate(): Promise<string> {
  try {
    const response = await fetch('/templates/invoice-template.html')
    return await response.text()
  } catch (error) {
    // Fallback to embedded template
    return getDefaultInvoiceTemplate()
  }
}

async function loadReceiptTemplate(): Promise<string> {
  try {
    const response = await fetch('/templates/receipt-template.html')
    return await response.text()
  } catch (error) {
    // Fallback to embedded template
    return getDefaultReceiptTemplate()
  }
}

// Default template matching the PDF format
function getDefaultInvoiceTemplate(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture {{invoiceNumber}}</title>
  <style>
    body {
      font-family: "Arial", sans-serif;
      font-size: 12px;
      color: #000;
      margin: 20px;
      background: #fff;
      line-height: 1.2;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    .invoice-title {
      text-align: center;
      flex: 1;
      margin: 0 20px;
    }
    .invoice-title h1 {
      font-size: 28px;
      margin: 0 0 10px 0;
      font-weight: bold;
      letter-spacing: 2px;
    }
    .invoice-number {
      font-size: 18px;
      margin: 5px 0;
      font-weight: bold;
    }
    .invoice-date {
      font-size: 12px;
      margin: 5px 0;
    }
    .party {
      width: 280px;
    }
    .party h3 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      text-decoration: underline;
      text-transform: uppercase;
    }
    .party p {
      margin: 3px 0;
      font-size: 11px;
      line-height: 1.4;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
    }
    .items-table th {
      background: #f5f5f5;
      padding: 10px 6px;
      text-align: center;
      font-size: 9px;
      font-weight: bold;
      border: 1px solid #333;
      text-transform: uppercase;
      letter-spacing: 1px;
      line-height: 1.2;
    }
    .items-table td {
      padding: 10px 6px;
      border: 1px solid #333;
      font-size: 11px;
      text-align: center;
    }
    .items-table td:nth-child(2) {
      text-align: left;
      padding-left: 8px;
    }
    .tva-table {
      width: 350px;
      border-collapse: collapse;
      margin: 25px 0;
    }
    .tva-table th, .tva-table td {
      padding: 8px 10px;
      border: 1px solid #333;
      font-size: 11px;
      text-align: center;
      font-weight: bold;
    }
    .tva-table th {
      background: #f5f5f5;
      text-transform: uppercase;
    }
    .totals {
      width: 350px;
      margin-left: auto;
      margin-top: 25px;
    }
    .totals table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals td {
      padding: 6px 12px;
      font-size: 12px;
      border: none;
      border-bottom: 1px solid #ddd;
    }
    .totals tr:last-child td {
      font-weight: bold;
      font-size: 13px;
      border-top: 2px solid #333;
      border-bottom: 2px solid #333;
      padding: 8px 12px;
    }
    .totals td:first-child {
      text-align: left;
    }
    .totals td:last-child {
      text-align: right;
    }
    .amount-words {
      margin-top: 25px;
      font-size: 11px;
      font-style: italic;
      text-align: justify;
      line-height: 1.4;
    }
    .footer {
      margin-top: 40px;
      font-size: 11px;
      text-align: center;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    .footer p {
      margin: 3px 0;
      display: inline-block;
      margin-right: 20px;
    }
    .footer-row {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="party">
      <h3>Fournisseur</h3>
      <p><strong>Société :</strong> {{companyName}}</p>
      <p><strong>Adresse :</strong> {{companyAddress}}</p>
      <p><strong>Numero De TVA:</strong> {{companyMF}}</p>
      <p><strong>Numero De Téléphone :</strong> {{companyPhone}}</p>
      <p><strong>Email :</strong> {{companyEmail}}</p>
    </div>
    
    <div class="invoice-title">
      <h1>FACTURE</h1>
      <div class="invoice-number">#{{invoiceNumber}}</div>
      <div class="invoice-date">Créé: {{invoiceDate}}</div>
    </div>
    
    <div class="party">
      <h3>Client</h3>
      <p><strong>Société :</strong> {{clientName}}</p>
      <p><strong>Adresse :</strong> {{clientAddress}}</p>
      <p><strong>Numero De TVA:</strong> {{clientMF}}</p>
      <p><strong>Numero De Téléphone :</strong> {{clientPhone}}</p>
    </div>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 12%;">R E F E R E N C E</th>
        <th style="width: 30%;">D E S I G N A T I O N</th>
        <th style="width: 8%;">T V A</th>
        <th style="width: 12%;">Q U A N T I T E</th>
        <th style="width: 15%;">P R I X  U N I T A I R E</th>
        <th style="width: 10%;">R E M I S E</th>
        <th style="width: 13%;">P R I X  T O T A L</th>
      </tr>
    </thead>
    <tbody>
      {{#items}}
      <tr>
        <td>{{reference}}</td>
        <td>{{designation}}</td>
        <td>{{tva}}%</td>
        <td>{{quantity}}</td>
        <td>{{unitPrice}}</td>
        <td>{{discount}}</td>
        <td>{{total}}</td>
      </tr>
      {{/items}}
    </tbody>
  </table>

  <!-- TVA Summary -->
  <table class="tva-table">
    <thead>
      <tr>
        <th style="width: 33%;">TVA</th>
        <th style="width: 33%;">Base</th>
        <th style="width: 34%;">Montant TVA</th>
      </tr>
    </thead>
    <tbody>
      {{#tvaSummary}}
      <tr>
        <td>{{rate}}%</td>
        <td>{{base}}</td>
        <td>{{amount}}</td>
      </tr>
      {{/tvaSummary}}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <table>
      <tr>
        <td>Sous-total HT</td>
        <td>{{subtotal}}</td>
      </tr>
      <tr>
        <td>Total HT</td>
        <td>{{totalHT}}</td>
      </tr>
      <tr>
        <td>TVA</td>
        <td>{{taxAmount}}</td>
      </tr>
      <tr>
        <td>Timbre fiscal</td>
        <td>{{stampDuty}}</td>
      </tr>
      <tr>
        <td>Total TTC</td>
        <td>{{totalTTC}}</td>
      </tr>
    </table>
  </div>

  <!-- Amount in words -->
  <div class="amount-words">
    Arrêtée la présente facture à la somme de {{amountInWords}}.
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-row">
      <p>📍{{companyAddress}}</p>
      <p>📞{{companyPhone}}</p>
    </div>
    <div class="footer-row">
      <p><strong>MF:</strong> {{companyMF}}</p>
      <p><strong>RIB_BANQUE :</strong> {{companyRIB}}</p>
    </div>
  </div>
</body>
</html>`
}

function getDefaultReceiptTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reçu {{receiptNumber}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .details { margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>REÇU DE PAIEMENT</h1>
    <p>{{receiptNumber}}</p>
  </div>
  <div class="details">
    <p>Date: {{paymentDate}}</p>
    <p>Montant: {{paymentAmount}}</p>
    <p>Méthode: {{paymentMethod}}</p>
  </div>
</body>
</html>`
}