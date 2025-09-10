# Car Repair SaaS Platform

This is a multi-page SaaS platform for managing a car repair shop's operations, built with Next.js, React, Tailwind CSS, shadcn/ui, and MongoDB.

## Features

-   **Authentication**: Secure user login and registration with JWT and HTTP-only cookies.
-   **Multi-Tenancy**: Each company has its own isolated data.
-   **Dashboard**: Overview of key metrics like total clients, invoices, and outstanding amounts.
-   **Client Management**: Add, view, edit, and delete client details, including vehicle information.
-   **Invoice & Delivery Note Management**:
    -   Create, view, edit, and delete invoices and "Bons de Livraison" (delivery notes).
    -   Automatic calculation of subtotals, taxes, discounts, and grand totals.
    -   Track payments and outstanding balances.
    -   Invoice status (pending, paid, overdue, cancelled) updates automatically.
-   **Synthesis/Reporting**: Financial overview based on selected periods (year/month).
-   **Settings**: Configure company information and invoice preferences (date format, default tax, visibility of due date, tax, discount, notes).
-   **PDF Export**: Export individual invoices and client profiles as PDFs in a specific format. Bulk export of invoices.
-   **Internationalization (i18n)**: Support for English and French languages, with a language switcher.
-   **Responsive Layout**: Optimized for various screen sizes.

## Technologies Used

-   **Framework**: Next.js (App Router)
-   **UI**: React, Tailwind CSS, shadcn/ui
-   **Database**: MongoDB (with Mongoose for ODM)
-   **Authentication**: JSON Web Tokens (JWT), `bcryptjs` for password hashing
-   **PDF Generation**: `jspdf`, `jspdf-autotable`
-   **Date Handling**: `date-fns`
-   **State Management**: React Context API (for Auth and API data)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd car-repair-saas
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables:

\`\`\`env
MONGODB_URI=mongodb://localhost:27017/car-repair-saas
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
\`\`\`

-   `MONGODB_URI`: Your MongoDB connection string. If you have MongoDB installed locally, `mongodb://localhost:27017/car-repair-saas` is a common default. Replace `car-repair-saas` with your desired database name.
-   `JWT_SECRET`: A strong, random string used to sign and verify JWTs. **Change this in production!**

### 4. Seed the Database (Optional but Recommended)

This project includes a seeding script to populate your MongoDB with sample data (a company, an admin user, clients, invoices, and payments).

\`\`\`bash
npm run seed
# or
yarn seed
\`\`\`

After seeding, you can log in with the following credentials:
-   **Email**: `admin@garage.com`
-   **Password**: `password`

### 5. Run the Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 6. Build for Production

\`\`\`bash
npm run build
# or
yarn build
\`\`\`

This will create an optimized production build of your application.

### 7. Start Production Server

\`\`\`bash
npm run start
# or
yarn start
\`\`\`

## Project Structure

\`\`\`
.
├── app/
│   ├── api/                  # Next.js API Routes
│   │   ├── auth/             # Authentication endpoints (login, register, logout, me)
│   │   ├── clients/          # Client CRUD operations
│   │   ├── company/          # Company information CRUD
│   │   ├── invoices/         # Invoice CRUD operations
│   │   ├── payments/         # Payment CRUD operations
│   │   └── settings/         # User/Company settings CRUD
│   ├── clients/              # Client management page
│   ├── create-client/        # Create/Edit client page
│   ├── create-invoice/       # Create/Edit invoice/delivery note page
│   ├── dashboard/            # Main dashboard page
│   ├── invoices/             # Invoice management page
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── settings/             # Settings page
│   ├── synthesis/            # Financial synthesis/reporting page
│   ├── globals.css           # Global Tailwind CSS styles
│   └── layout.tsx            # Root layout for the application
├── components/
│   ├── layout/               # Layout-specific components (e.g., Navbar)
│   ├── ui/                   # shadcn/ui components (generated via `npx shadcn add`)
│   ├── language-switcher.tsx # Component to switch application language
│   └── protected-route.tsx   # Client-side route protection component
├── lib/
│   ├── api-store.ts          # React Context API store for fetching/managing data via API routes
│   ├── auth.ts               # React Context API for authentication state and actions
│   ├── i18n/                 # Internationalization (i18n) setup
│   │   ├── config.ts         # i18n configuration (locales, default)
│   │   ├── context.tsx       # i18n context and hook
│   │   └── translations.ts   # Translation strings for different languages
│   ├── middleware/           # Next.js middleware (e.g., authentication middleware)
│   │   └── auth.ts
│   ├── models/               # Mongoose schemas and models for MongoDB
│   │   ├── Client.ts
│   │   ├── Company.ts
│   │   ├── Invoice.ts
│   │   ├── Payment.ts
│   │   ├── Settings.ts
│   │   └── User.ts
│   ├── mongodb.ts            # MongoDB connection utility
│   ├── pdf-generator.ts      # Utility for generating PDF documents
│   ├── sample-data.ts        # Sample data for seeding the database
│   └── utils.ts              # General utility functions (e.g., date formatting, currency formatting)
├── scripts/
│   └── seed-database.js      # Script to populate MongoDB with initial data
├── public/                   # Static assets
├── .env.example              # Example environment variables
├── next.config.mjs           # Next.js configuration
├── package.json              # Project dependencies and scripts
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project README
\`\`\`

## Contributing

Feel free to fork this repository and contribute!

## License

This project is open source and available under the [MIT License](LICENSE).
