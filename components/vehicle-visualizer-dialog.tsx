"use client"

import { useMemo } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Car, Calendar, Hash, Building, User2, Phone, Mail, MapPin } from "lucide-react"
import type { Client, Vehicle } from "@/types"

interface VehicleVisualizerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

export function VehicleVisualizerDialog({ open, onOpenChange, client }: VehicleVisualizerDialogProps) {
  const { t } = useI18n()

  const vehicles = useMemo(() => {
    if (!client) return []
    
    // Handle new vehicles array
    if (client.vehicles && client.vehicles.length > 0) {
      return client.vehicles
    }

    // Fallback to legacy fields
    if (client.licensePlate || client.vehicleMake || client.vehicleModel || client.vehicleYear) {
      return [{
        make: client.vehicleMake || "",
        model: client.vehicleModel || "",
        year: client.vehicleYear,
        licensePlate: client.licensePlate || "",
      }] as Vehicle[]
    }

    return []
  }, [client])

  const getVehicleDisplayName = (vehicle: Vehicle) => {
    const parts = []
    if (vehicle.make) parts.push(vehicle.make)
    if (vehicle.model) parts.push(vehicle.model)
    if (vehicle.year) parts.push(`(${vehicle.year})`)
    
    return parts.length > 0 ? parts.join(' ') : vehicle.licensePlate || t("unknownVehicle")
  }

  const getVehicleBrandColor = (make: string) => {
    // Simple color mapping based on brand
    const colors: Record<string, string> = {
      toyota: 'bg-red-100 text-red-800 border-red-200',
      honda: 'bg-blue-100 text-blue-800 border-blue-200',
      bmw: 'bg-gray-100 text-gray-800 border-gray-200',
      mercedes: 'bg-purple-100 text-purple-800 border-purple-200',
      audi: 'bg-green-100 text-green-800 border-green-200',
      ford: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      volkswagen: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      nissan: 'bg-pink-100 text-pink-800 border-pink-200',
    }
    
    const lowerMake = make?.toLowerCase() || ''
    return colors[lowerMake] || 'bg-slate-100 text-slate-800 border-slate-200'
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {t("vehicleOverview")} - {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Information Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {client.clientType === "company" ? (
                    <Building className="h-4 w-4" />
                  ) : (
                    <User2 className="h-4 w-4" />
                  )}
                  {t("clientInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("name")}</p>
                  <p className="text-sm">{client.name}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm truncate">{client.phone}</p>
                </div>
                
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm break-all">{client.email}</p>
                  </div>
                )}
                
                {client.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm break-words">{client.address}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Badge variant={client.clientType === "company" ? "default" : "secondary"}>
                    {client.clientType === "company" ? t("company") : t("individual")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicles Grid */}
          <div className="lg:col-span-2">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {t("vehicles")} ({vehicles.length})
                  </h3>
                  {vehicles.length > 1 && (
                    <Badge variant="outline">
                      {t("multipleVehicles")}
                    </Badge>
                  )}
                </div>

                {vehicles.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Car className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground text-center">
                        {t("noVehiclesRegistered")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {vehicles.map((vehicle, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              {getVehicleDisplayName(vehicle)}
                            </CardTitle>
                            {vehicle.make && (
                              <Badge className={getVehicleBrandColor(vehicle.make)}>
                                {vehicle.make}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              {vehicle.make && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t("make")}
                                  </p>
                                  <p className="text-sm font-medium">{vehicle.make}</p>
                                </div>
                              )}
                              
                              {vehicle.model && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t("model")}
                                  </p>
                                  <p className="text-sm font-medium">{vehicle.model}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {vehicle.year && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {t("year")}
                                  </p>
                                  <p className="text-sm font-medium">{vehicle.year}</p>
                                </div>
                              )}
                              
                              {vehicle.licensePlate && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    {t("licensePlate")}
                                  </p>
                                  <Badge variant="outline" className="font-mono">
                                    {vehicle.licensePlate}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vehicle Summary */}
                          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{t("vehicleIndex", { index: index + 1 })}</span>
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {t("registeredVehicle")}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}