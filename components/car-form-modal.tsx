"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
}

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

interface CarFormModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Car | null
  onSubmit: (data: Omit<Car, "_id" | "createdAt" | "updatedAt" | "companyId">) => void
  isSubmitting?: boolean
  clients: Client[]
}

export function CarFormModal({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting = false,
  clients,
}: CarFormModalProps) {
  const [formData, setFormData] = useState({
    licensePlate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    mileage: 0,
    salePrice: 0,
    commission: 0,
    saleDate: "",
    clientId: "",
    description: "",
  })

  // Helper function to extract client ID from the nested structure
  const getClientId = (car: Car) => {
    if (!car.clientId) return ""
    if (typeof car.clientId === 'object' && car.clientId._id) {
      return car.clientId._id
    }
    return typeof car.clientId === 'string' ? car.clientId : ""
  }

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          licensePlate: initialData.licensePlate || "",
          brand: initialData.brand || "",
          model: initialData.model || "",
          year: initialData.year || new Date().getFullYear(),
          color: initialData.color || "",
          mileage: initialData.mileage || 0,
          salePrice: initialData.salePrice || 0,
          commission: initialData.commission || 0,
          saleDate: initialData.saleDate?.split('T')[0] || "", // Extract date part only
          clientId: getClientId(initialData),
          description: initialData.description || "",
        })
      } else {
        setFormData({
          licensePlate: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          color: "",
          mileage: 0,
          salePrice: 0,
          commission: 0,
          saleDate: "",
          clientId: "",
          description: "",
        })
      }
    }
  }, [isOpen, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert "none" back to empty string for clientId and handle the nested structure properly
    const submitData = {
      ...formData,
      clientId: formData.clientId === "none" || formData.clientId === "" ? undefined : formData.clientId
    }
    
    onSubmit(submitData as any)
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Sold Car" : "Add Sold Car"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Update the sold car information below." 
              : "Enter the details of the car that was sold."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate *</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                placeholder="Enter license plate"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="Enter car color"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Enter car brand"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Enter car model"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date *</Label>
              <Input
                id="saleDate"
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price *</Label>
              <Input
                id="salePrice"
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter sale price"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Commission *</Label>
              <Input
                id="commission"
                type="number"
                value={formData.commission}
                onChange={(e) => setFormData(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter commission amount"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select
              value={formData.clientId || "none"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client selected</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter additional notes or description"
              rows={3}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center">
                  <Spinner size="sm" className="mr-2" />
                  {initialData ? "Updating..." : "Adding..."}
                </div>
              ) : (
                initialData ? "Update Car" : "Add Car"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}