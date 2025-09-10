"use client"

import { useContext } from "react"
import { ApiStoreContext } from "@/lib/api-store-provider"

export function useApiStore() {
  const context = useContext(ApiStoreContext)
  if (context === undefined) {
    throw new Error("useApiStore must be used within an ApiStoreProvider")
  }
  return context
}
