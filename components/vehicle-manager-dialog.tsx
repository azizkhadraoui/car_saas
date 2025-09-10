"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { 
  Car, 
  PlusCircle, 
  Trash2, 
  Save, 
  Building2, 
  User, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import type { Client, Vehicle } from "@/types"

interface VehicleManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSuccess?: () => void
}

export function VehicleManagerDialog({ 
  open, 
  onOpenChange, 
  client, 
  onSuccess 
}: VehicleManagerDialogProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize vehicles when dialog opens
  useEffect(() => {
    if (open && client) {
      let initialVehicles: Vehicle[] = []
      
      // Handle new vehicles array or migrate from legacy fields
      if (client.vehicles && client.vehicles.length > 0) {
        initialVehicles = [...client.vehicles]
      } else if (client.licensePlate || client.vehicleMake || client.vehicleModel || client.vehicleYear) {
        // Migrate legacy single vehicle data
        initialVehicles = [{
          make: client.vehicleMake || "",
          model: client.vehicleModel || "",
          year: client.vehicleYear || undefined,
          licensePlate: client.licensePlate || "",
        }]
      }

      setVehicles(initialVehicles)
      setHasChanges(false)
    }
  }, [open, client])

  const addVehicle = () => {
    setVehicles(prev => [
      ...prev,
      { make: "", model: "", year: undefined, licensePlate: "" }
    ])
    setHasChanges(true)
  }

  const removeVehicle = (index: number) => {
    setVehicles(prev => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const updateVehicle = (index: number, field: keyof Vehicle, value: string | number | undefined) => {
    setVehicles(prev => prev.map((vehicle, i) => 
      i === index ? { ...vehicle, [field]: value } : vehicle
    ))
    setHasChanges(true)
  }

  const validateVehicles = () => {
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i]
      // Check if vehicle has any data but missing license plate
      if ((vehicle.make || vehicle.model || vehicle.year) && !vehicle.licensePlate?.trim()) {
        toast({
          title: t("error"),
          description: t("licensePlateRequiredForVehicle", { index: i + 1 }),
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!client) return

    if (!validateVehicles()) return

    setLoading(true)

    try {
      // Clean up vehicles - remove empty ones and trim strings
      const cleanedVehicles = vehicles
        .filter(vehicle => 
          vehicle.licensePlate?.trim() || vehicle.make || vehicle.model || vehicle.year
        )
        .map(vehicle => ({
          make: vehicle.make?.trim() || undefined,
          model: vehicle.model?.trim() || undefined,
          year: vehicle.year || undefined,
          licensePlate: vehicle.licensePlate?.trim().toUpperCase() || "",
        }))

      const payload = {
        vehicles: cleanedVehicles,
      }

      const response = await fetch(`/api/clients/${client.id}/vehicles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: t("success"),
          description: t("vehiclesUpdated"),
        })
        
        setHasChanges(false)
        onOpenChange(false)
        onSuccess?.()
      } else {
        const errorData = await response.json()
        toast({
          title: t("error"),
          description: errorData.error || t("updateVehiclesFailed"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(t("unsavedChangesWarning"))
      if (!confirmed) return
    }
    onOpenChange(false)
  }

  const getVehicleDisplayName = (vehicle: Vehicle, index: number) => {
    const parts = []
    if (vehicle.make) parts.push(vehicle.make)
    if (vehicle.model) parts.push(vehicle.model)
    if (vehicle.year) parts.push(`(${vehicle.year})`)
    
    return parts.length > 0 ? parts.join(' ') : `${t("vehicle")} ${index + 1}`
  }

  const isVehicleEmpty = (vehicle: Vehicle) => {
    return !vehicle.make && !vehicle.model && !vehicle.year && !vehicle.licensePlate
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {t("manageVehicles")} - {client.name}
            <Badge variant={client.clientType === "company" ? "default" : "secondary"}>
              {client.clientType === "company" ? (
                <>
                  <Building2 className="h-3 w-3 mr-1" />
                  {t("company")}
                </>
              ) : (
                <>
                  <User className="h-3 w-3 mr-1" />
                  {t("individual")}
                </>
              )}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {vehicles.length === 0 
                  ? t("noVehiclesYet") 
                  : t("vehicleCount", { count: vehicles.length })
                }
              </p>
              {hasChanges && (
                <div className="flex items-center gap-2 mt-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600">{t("unsavedChanges")}</span>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVehicle}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              {t("addVehicle")}
            </Button>
          </div>

          {/* Vehicles List */}
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-4 pr-4">
              {vehicles.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Car className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center mb-4">
                      {t("noVehiclesAdded")}
                    </p>
                    <Button onClick={addVehicle} variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t("addFirstVehicle")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                vehicles.map((vehicle, index) => (
                  <Card key={index} className={`${isVehicleEmpty(vehicle) ? 'border-dashed' : 'border-solid'}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          {getVehicleDisplayName(vehicle, index)}
                          {isVehicleEmpty(vehicle) && (
                            <Badge variant="outline" className="text-xs">
                              {t("empty")}
                            </Badge>
                          )}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVehicle(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs">{t("make")}</Label>
                          <Input
                            value={vehicle.make || ""}
                            onChange={(e) => updateVehicle(index, "make", e.target.value)}
                            placeholder="Toyota, BMW..."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">{t("model")}</Label>
                          <Input
                            value={vehicle.model || ""}
                            onChange={(e) => updateVehicle(index, "model", e.target.value)}
                            placeholder="Corolla, X5..."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">{t("year")}</Label>
                          <Input
                            type="number"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            value={vehicle.year || ""}
                            onChange={(e) => updateVehicle(index, "year", e.target.value ? parseInt(e.target.value) : undefined)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs flex items-center gap-1">
                            {t("licensePlate")} 
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={vehicle.licensePlate || ""}
                            onChange={(e) => updateVehicle(index, "licensePlate", e.target.value.toUpperCase())}
                            placeholder="ABC-1234"
                            className="mt-1 font-mono"
                          />
                        </div>
                      </div>

                      {/* Vehicle Status */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t("vehicleIndex", { index: index + 1 })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {vehicle.licensePlate && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              {t("hasLicensePlate")}
                            </div>
                          )}
                          {(vehicle.make || vehicle.model || vehicle.year) && !vehicle.licensePlate && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <AlertTriangle className="h-3 w-3" />
                              {t("missingLicensePlate")}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {vehicles.length > 0 && (
              <span>{t("totalVehicles", { count: vehicles.length })}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {hasChanges ? t("cancelChanges") : t("close")}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !hasChanges}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("saveChanges")}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}