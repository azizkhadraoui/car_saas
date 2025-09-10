import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { ApiStoreProvider } from "@/lib/api-store"
import { I18nProvider } from "@/lib/i18n/context"
import { ProtectedRoute } from "@/components/protected-route"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/layout/navbar"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApiStoreProvider>
          <I18nProvider>
            <AuthProvider>
              <Navbar />
              <ProtectedRoute>{children}</ProtectedRoute>
            </AuthProvider>
          </I18nProvider>
        </ApiStoreProvider>
        <Toaster />
      </body>
    </html>
  )
}


export const metadata = {
      generator: 'v0.dev'
    };
