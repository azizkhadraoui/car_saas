"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Car, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"

export function Navbar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { t } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: t("dashboard"), href: "/dashboard" },
    { name: t("showroom"), href: "/showroom" },
    { name: t("createInvoice"), href: "/create-invoice" },
    { name: t("clients"), href: "/clients" },
    { name: t("invoices"), href: "/invoices" },
    { name: t("synthesis"), href: "/synthesis" },
  ]

  const specialNavigation = [{ name: t("caisse"), href: "/caisse" }]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Garage Manager</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200 py-2",
                    isActive ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  {item.name}
                </Link>
              )
            })}

            {/* Special navigation items (like caisse) */}
            {specialNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <Link
              href="/settings"
              className={cn(
                "text-sm font-medium transition-colors duration-200 hidden sm:block",
                pathname === "/settings" ? "text-blue-600" : "text-gray-600 hover:text-gray-900",
              )}
            >
              {t("settings")}
            </Link>

            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="hidden sm:flex text-gray-600 hover:text-gray-900 font-medium"
            >
              {t("logout")}
            </Button>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 pt-4 pb-6 space-y-3">
              {[...navigation, ...specialNavigation].map((item) => {
                const isActive = pathname === item.href
                const isSpecial = specialNavigation.includes(item)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-md text-sm font-medium transition-all duration-200",
                      isActive && isSpecial
                        ? "bg-gray-900 text-white"
                        : isActive
                          ? "bg-blue-50 text-blue-600"
                          : isSpecial
                            ? "bg-gray-100 text-gray-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    )}
                  >
                    {item.name}
                  </Link>
                )
              })}

              {/* Mobile-only actions */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-md text-sm font-medium transition-all duration-200",
                    pathname === "/settings"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  )}
                >
                  {t("settings")}
                </Link>

                <div className="px-4 py-2">
                  <LanguageSwitcher />
                </div>

                <Button
                  variant="ghost"
                  onClick={logout}
                  className="w-full justify-start px-4 py-3 h-auto text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  {t("logout")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
