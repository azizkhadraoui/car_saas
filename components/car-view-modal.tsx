"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Edit, Car as CarIcon, Calendar, DollarSign, User, FileText, Palette, Percent } from 'lucide-react'
import { useI18n } from "@/lib/i18n/context"
import { formatCurrencyRight, formatDate } from "@/lib/utils"
import { useApiStore } from "@/lib/api-store"


interface Car {
  _id: string
  licensePlate: string
  brand: string
  model: string
  year: number
  color: string
  mileage: number
  salePrice: number
  commission: number
  saleDate: string
  clientId?: {
    _id: string
    name: string
    email?: string
    phone?: string
  } | string
  description?: string
  companyId: string
  createdAt: string
  updatedAt: string
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
}

interface CarViewModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  car: Car | null
  clients: Client[]
  onEdit: (car: Car) => void
}

export function CarViewModal({
  isOpen,
  onOpenChange,
  car,
  clients,
  onEdit,
}: CarViewModalProps) {
  const { t } = useI18n()
  const { preferences } = useApiStore()
  

  if (!car) return null

  // Helper function to get client information
  const getClientInfo = () => {
    if (!car.clientId) return null
    
    if (typeof car.clientId === 'object' && car.clientId.name) {
      return car.clientId
    }
    
    // Fallback: find client by ID in clients array
    return clients.find(c => c.id === car.clientId)
  }

  const client = getClientInfo()
  const commissionPercentage = car.salePrice > 0 ? ((car.commission / car.salePrice) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CarIcon className="h-5 w-5" />
            {car.brand} {car.model} ({car.year})
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {car.licensePlate}
            </Badge>
            <Badge 
              variant="secondary"
              className="bg-green-100 text-green-800 hover:bg-green-100"
            >
              Sold
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CarIcon className="h-4 w-4" />
              {t("vehicleInformation") || "Vehicle Information"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-md">
                  <CarIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("brand")}</p>
                  <p className="font-medium">{car.brand}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-md">
                  <CarIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("model")}</p>
                  <p className="font-medium">{car.model}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-md">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("year")}</p>
                  <p className="font-medium">{car.year}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-md">
                  <Palette className="h-4 w-4 text-orange-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("color")}</p>
                  <p className="font-medium">{car.color}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("financialInformation") || "Financial Information"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="p-2 bg-green-100 rounded-md">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("salePrice")}</p>
                  <p className="font-semibold text-green-700">{formatCurrencyRight(car.salePrice, preferences?.currency)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="p-2 bg-blue-100 rounded-md">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("commission")}</p>
                  <p className="font-semibold text-blue-700">{formatCurrencyRight(car.commission, preferences?.currency)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="p-2 bg-purple-100 rounded-md">
                  <Percent className="h-4 w-4 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("commissionRate") || "Commission Rate"}</p>
                  <p className="font-semibold text-purple-700">
                    {commissionPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sale Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("saleInformation") || "Sale Information"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-indigo-100 rounded-md">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("saleDate")}</p>
                  <p className="font-medium">{formatDate(car.saleDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-cyan-100 rounded-md">
                  <User className="h-4 w-4 text-cyan-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("client")}</p>
                  <div>
                    <p className="font-medium">{client ? client.name : "N/A"}</p>
                    {client && client.email && (
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    )}
                    {client && client.phone && (
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("description")}
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm leading-relaxed">{car.description}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Record Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created Date</p>
                  <p className="font-medium">{formatDate(car.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(car.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center pt-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("close")}
            </Button>
            <Button onClick={() => onEdit(car)}>
              <Edit className="mr-2 h-4 w-4" />
              {t("edit")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}