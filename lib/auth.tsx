"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User, Company } from "@/types"

interface AuthContextType {
  user: User | null
  company: Company | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    companyName: string,
    companyAddress: string,
    companyPhone: string,
    companyEmail: string,
  ) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = async () => {
    console.log('checkAuth called')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      })
      console.log('checkAuth response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setCompany(data.company)
      } else {
        setUser(null)
        setCompany(null)
      }
    } catch (err: any) {
      console.error("Failed to check auth:", err)
      setUser(null)
      setCompany(null)
      setError("Failed to check authentication status.")
    } finally {
      setLoading(false)
      console.log('checkAuth finished')
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setCompany(data.company)
        router.push("/dashboard")
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Login failed")
        throw new Error(errorData.error || "Login failed")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred during login.")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    email: string,
    password: string,
    companyName: string,
    companyAddress: string,
    companyPhone: string,
    companyEmail: string,
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, companyName, companyAddress, companyPhone, companyEmail }),
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setCompany(data.company)
        router.push("/dashboard")
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Registration failed")
        throw new Error(errorData.error || "Registration failed")
      }
    } catch (err: any) {
      console.error("Register error:", err)
      setError(err.message || "An unexpected error occurred during registration.")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setUser(null)
        setCompany(null)
        router.push("/login")
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Logout failed")
      }
    } catch (err: any) {
      console.error("Logout error:", err)
      setError(err.message || "An unexpected error occurred during logout.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('AuthProvider useEffect triggered, pathname:', pathname)
    
    // Don't check auth on login/register pages to prevent infinite loops
    const publicPages = ['/login', '/register']
    const isPublicPage = publicPages.some(page => pathname?.startsWith(page))
    
    console.log('Is public page:', isPublicPage)
    
    if (!isPublicPage) {
      console.log('Calling checkAuth...')
      checkAuth()
    } else {
      // Set loading to false immediately on public pages
      console.log('Skipping auth check on public page')
      setLoading(false)
    }
  }, [pathname])

  const contextValue: AuthContextType = {
    user,
    company,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}