"use client"

import { useState, useEffect } from "react"
import { useApiStore } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { PlusCircle, Trash2, Car, Building2, User } from "lucide-react"
import type { Client, ClientType, Vehicle } from "@/types"

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null // For editing existing client
  onSuccess?: () => void
}

export function ClientDialog({ open, onOpenChange, client, onSuccess }: ClientDialogProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    clientType: "individual" as ClientType,
    name: "",
    address: "",
    phone: "",
    email: "",
    vehicles: [] as Vehicle[],
  })

  // Reset form when dialog opens/closes or client changes
  useEffect(() => {
    if (open) {
      if (client) {
        // Editing existing client
        let vehicles: Vehicle[] = []
        
        // Handle new vehicles array or migrate from legacy fields
        if (client.vehicles && client.vehicles.length > 0) {
          vehicles = client.vehicles
        } else if (client.licensePlate || client.vehicleMake || client.vehicleModel || client.vehicleYear) {
          // Migrate legacy single vehicle data
          vehicles = [{
            make: client.vehicleMake || "",
            model: client.vehicleModel || "",
            year: client.vehicleYear || undefined,
            licensePlate: client.licensePlate || "",
          }]
        }

        setFormData({
          clientType: client.clientType || "individual",
          name: client.name || "",
          address: client.address || "",
          phone: client.phone || "",
          email: client.email || "",
          vehicles: vehicles,
        })
      } else {
        // Adding new client
        setFormData({
          clientType: "individual",
          name: "",
          address: "",
          phone: "",
          email: "",
          vehicles: [],
        })
      }
    }
  }, [open, client])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        { make: "", model: "", year: undefined, licensePlate: "" }
      ]
    }))
  }

  const removeVehicle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }))
  }

  const updateVehicle = (index: number, field: keyof Vehicle, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle, i) => 
        i === index ? { ...vehicle, [field]: value } : vehicle
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: t("error"),
        description: t("clientNameRequired"),
        variant: "destructive",
      })
      return
    }

    if (!formData.address.trim()) {
      toast({
        title: t("error"),
        description: t("clientAddressRequired"),
        variant: "destructive",
      })
      return
    }

    if (!formData.phone.trim()) {
      toast({
        title: t("error"),
        description: t("clientPhoneRequired"),
        variant: "destructive",
      })
      return
    }

    // Email validation if provided
    if (formData.email && !/.+@.+\..+/.test(formData.email)) {
      toast({
        title: t("error"),
        description: t("invalidEmailFormat"),
        variant: "destructive",
      })
      return
    }

    // Validate vehicles - ensure license plates are provided for vehicles with any data
    for (let i = 0; i < formData.vehicles.length; i++) {
      const vehicle = formData.vehicles[i]
      if ((vehicle.make || vehicle.model || vehicle.year) && !vehicle.licensePlate.trim()) {
        toast({
          title: t("error"),
          description: t("licensePlateRequiredForVehicle", { index: i + 1 }),
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)

    try {
      // Clean up vehicles - remove empty ones and trim strings
      const cleanedVehicles = formData.vehicles
        .filter(vehicle => vehicle.licensePlate.trim() !== "" || vehicle.make || vehicle.model || vehicle.year)
        .map(vehicle => ({
          make: vehicle.make?.trim() || undefined,
          model: vehicle.model?.trim() || undefined,
          year: vehicle.year || undefined,
          licensePlate: vehicle.licensePlate.trim().toUpperCase(),
        }))

      const payload = {
        clientType: formData.clientType,
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        vehicles: cleanedVehicles,
      }

      const url = client ? `/api/clients/${client.id}` : "/api/clients"
      const method = client ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: t("success"),
          description: client ? t("clientUpdated") : t("clientCreated"),
        })
        
        onOpenChange(false)
        onSuccess?.()
      } else {
        const errorData = await response.json()
        toast({
          title: t("error"),
          description: errorData.error || (client ? t("updateClientFailed") : t("createClientFailed")),
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

  const clientTypeOptions = [
    { value: "individual", label: t("individual"), icon: User },
    { value: "company", label: t("company"), icon: Building2 },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? t("editClient") : t("addNewClient")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Type Selection */}
          <div>
            <Label htmlFor="clientType">{t("clientType")} *</Label>
            <Select 
              value={formData.clientType} 
              onValueChange={(value: ClientType) => handleInputChange("clientType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectClientType")} />
              </SelectTrigger>
              <SelectContent>
                {clientTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">
                {formData.clientType === "company" ? t("companyName") : t("clientName")} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={formData.clientType === "company" ? t("enterCompanyName") : t("enterClientName")}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">{t("phone")} *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder={t("enterPhoneNumber")}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder={t("enterEmailAddress")}
            />
          </div>

          <div>
            <Label htmlFor="address">{t("address")} *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder={t("enterClientAddress")}
              required
              rows={3}
            />
          </div>

          {/* Vehicles Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                <CardTitle className="text-lg">
                  {t("vehicles")}
                  {formData.clientType === "company" && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {t("multipleVehiclesAllowed")}
                    </Badge>
                  )}
                </CardTitle>
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
            </CardHeader>
            <CardContent>
              {formData.vehicles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("noVehiclesAdded")}</p>
                  <p className="text-sm">{t("clickAddVehicleToStart")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.vehicles.map((vehicle, index) => (
                    <Card key={index} className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-4">
                          <Badge variant="secondary">
                            {t("vehicle")} {index + 1}
                          </Badge>
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

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>{t("make")}</Label>
                            <Input
                              value={vehicle.make || ""}
                              onChange={(e) => updateVehicle(index, "make", e.target.value)}
                              placeholder="Toyota, BMW..."
                            />
                          </div>

                          <div>
                            <Label>{t("model")}</Label>
                            <Input
                              value={vehicle.model || ""}
                              onChange={(e) => updateVehicle(index, "model", e.target.value)}
                              placeholder="Corolla, X5..."
                            />
                          </div>

                          <div>
                            <Label>{t("year")}</Label>
                            <Input
                              type="number"
                              min="1900"
                              max={new Date().getFullYear() + 1}
                              value={vehicle.year || ""}
                              onChange={(e) => updateVehicle(index, "year", e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>

                          <div>
                            <Label>{t("licensePlate")} *</Label>
                            <Input
                              value={vehicle.licensePlate}
                              onChange={(e) => updateVehicle(index, "licensePlate", e.target.value.toUpperCase())}
                              placeholder="ABC-1234"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  {client ? t("updating") : t("creating")}
                </>
              ) : (
                client ? t("updateClient") : t("createClient")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}