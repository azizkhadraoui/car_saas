const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("../lib/models/User").default // Use .default for ES module export
const Company = require("../lib/models/Company").default
const Client = require("../lib/models/Client").default
const Invoice = require("../lib/models/Invoice").default
const Payment = require("../lib/models/Payment").default
const Settings = require("../lib/models/Settings").default

require("dotenv").config({ path: ".env.local" }) // Load .env.local for MONGODB_URI

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env.local")
  process.exit(1)
}

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("MongoDB connected for seeding.")

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Client.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Settings.deleteMany({}),
    ])
    console.log("Existing data cleared.")

    // Create Company
    const company1 = new Company({
      name: "Auto Repair Pro",
      address: "123 Workshop Lane, Garageville, 12345",
      phone: "+1 (555) 123-4567",
      email: "info@autorepairpro.com",
      logoUrl: "/placeholder.svg?height=100&width=100",
    })
    await company1.save()
    console.log("Company created:", company1.name)

    // Create Admin User
    const adminUser = new User({
      email: "admin@garage.com",
      password: "password", // Will be hashed by pre-save hook
      role: "admin",
      companyId: company1._id,
    })
    await adminUser.save()
    console.log("Admin user created:", adminUser.email)

    // Update company ownerId
    company1.ownerId = adminUser._id
    await company1.save()
    console.log("Company owner updated.")

    // Create default settings for the company
    const defaultSettings = new Settings({
      companyId: company1._id,
      invoicePreferences: {
        dateFormat: "YYYY-MM-DD",
        defaultTaxPercentage: 10,
        showDueDate: true,
        showTax: true,
        showDiscount: true,
        showNotes: true,
        language: "en",
      },
    })
    await defaultSettings.save()
    console.log("Default settings created for company.")

    // Create Clients
    const client1 = new Client({
      companyId: company1._id,
      name: "Alice Smith",
      address: "456 Oak Avenue, Townsville, 67890",
      phone: "+1 (555) 987-6543",
      email: "alice.smith@example.com",
      vehicleMake: "Honda",
      vehicleModel: "Civic",
      vehicleYear: 2018,
      licensePlate: "ABC-123",
    })
    const client2 = new Client({
      companyId: company1._id,
      name: "Bob Johnson",
      address: "789 Pine Street, Cityburg, 10112",
      phone: "+1 (555) 234-5678",
      email: "bob.j@example.com",
      vehicleMake: "Ford",
      vehicleModel: "F-150",
      vehicleYear: 2020,
      licensePlate: "DEF-456",
    })
    const client3 = new Client({
      companyId: company1._id,
      name: "Charlie Brown",
      address: "101 Maple Drive, Villageton, 34567",
      phone: "+1 (555) 876-5432",
      email: "charlie.b@example.com",
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
      vehicleYear: 2015,
      licensePlate: "GHI-789",
    })
    await Promise.all([client1.save(), client2.save(), client3.save()])
    console.log("Clients created.")

    // Create Invoices
    const invoice1 = new Invoice({
      companyId: company1._id,
      clientId: client1._id,
      invoiceNumber: "INV-2023-001",
      date: new Date("2023-03-01"),
      dueDate: new Date("2023-03-31"),
      items: [
        { description: "Oil Change", quantity: 1, unitPrice: 50, total: 50 },
        { description: "Tire Rotation", quantity: 1, unitPrice: 30, total: 30 },
      ],
      subtotal: 80,
      taxPercentage: 10,
      taxAmount: 8,
      discountPercentage: 0,
      discountAmount: 0,
      totalAmount: 88,
      amountPaid: 88,
      status: "paid",
      notes: "Thank you for your business!",
      type: "invoice",
    })
    const invoice2 = new Invoice({
      companyId: company1._id,
      clientId: client2._id,
      invoiceNumber: "INV-2023-002",
      date: new Date("2023-03-05"),
      dueDate: new Date("2023-04-04"),
      items: [
        { description: "Brake Pad Replacement (Front)", quantity: 1, unitPrice: 150, total: 150 },
        { description: "Brake Fluid Flush", quantity: 1, unitPrice: 75, total: 75 },
      ],
      subtotal: 225,
      taxPercentage: 10,
      taxAmount: 22.5,
      discountPercentage: 5,
      discountAmount: 11.25,
      totalAmount: 236.25 - 11.25,
      amountPaid: 100,
      status: "pending",
      notes: "Customer requested premium brake pads.",
      type: "invoice",
    })
    const invoice3 = new Invoice({
      companyId: company1._id,
      clientId: client1._id,
      invoiceNumber: "BL-2023-001",
      date: new Date("2023-03-10"),
      dueDate: new Date("2023-03-10"),
      items: [
        { description: "Diagnostic Check", quantity: 1, unitPrice: 60, total: 60 },
        { description: "Battery Test", quantity: 1, unitPrice: 20, total: 20 },
      ],
      subtotal: 80,
      taxPercentage: 0,
      taxAmount: 0,
      discountPercentage: 0,
      discountAmount: 0,
      totalAmount: 80,
      amountPaid: 0,
      status: "pending",
      notes: "Initial inspection for engine light.",
      type: "bon_de_livraison",
    })
    const invoice4 = new Invoice({
      companyId: company1._id,
      clientId: client3._id,
      invoiceNumber: "INV-2023-003",
      date: new Date("2023-03-15"),
      dueDate: new Date("2023-04-14"),
      items: [
        { description: "Transmission Fluid Change", quantity: 1, unitPrice: 200, total: 200 },
        { description: "Spark Plug Replacement", quantity: 4, unitPrice: 25, total: 100 },
      ],
      subtotal: 300,
      taxPercentage: 10,
      taxAmount: 30,
      discountPercentage: 0,
      discountAmount: 0,
      totalAmount: 330,
      amountPaid: 0,
      status: "overdue", // Will be set to overdue by pre-save hook if due date is past
      notes: "Major service performed.",
      type: "invoice",
    })
    await Promise.all([invoice1.save(), invoice2.save(), invoice3.save(), invoice4.save()])
    console.log("Invoices created.")

    // Create Payments
    const payment1 = new Payment({
      companyId: company1._id,
      invoiceId: invoice1._id,
      amount: 88,
      date: new Date("2023-03-01"),
      method: "Credit Card",
    })
    const payment2 = new Payment({
      companyId: company1._id,
      invoiceId: invoice2._id,
      amount: 100,
      date: new Date("2023-03-06"),
      method: "Cash",
    })
    await Promise.all([payment1.save(), payment2.save()])
    console.log("Payments created.")

    console.log("Database seeding complete!")
  } catch (error) {
    console.error("Database seeding failed:", error)
  } finally {
    await mongoose.disconnect()
    console.log("MongoDB disconnected.")
  }
}

seedDatabase()
