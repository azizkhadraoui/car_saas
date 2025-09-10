"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrencyRight, formatDate } from "@/lib/utils"
import { MoreHorizontal, PlusCircle, Eye, Edit, Trash2, DollarSign, TrendingUp, Calendar, Percent } from 'lucide-react'
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { useApiStore } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"
import { CarFormModal } from "@/components/car-form-modal"
import { CarViewModal } from "@/components/car-view-modal"

export interface Car {
  _id: string
  licensePlate: string
  brand: string
  model: string
  year: number
  color: string
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

export default function SoldCarsPage() {
  const { clients, loading, preferences } = useApiStore()
  const { t } = useI18n()
  const [soldCars, setSoldCars] = useState<Car[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [fetchingData, setFetchingData] = useState(true)
  
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch sold cars on component mount
  useEffect(() => {
    fetchSoldCars()
  }, [])

  const fetchSoldCars = async () => {
    setFetchingData(true)
    try {
      const response = await fetch('/api/sold-cars')
      if (!response.ok) {
        throw new Error('Failed to fetch sold cars')
      }
      const data = await response.json()
      setSoldCars(data.soldCars || [])
    } catch (error) {
      console.error('Error fetching sold cars:', error)
      toast.error('Failed to load sold cars')
      setSoldCars([])
    } finally {
      setFetchingData(false)
    }
  }

  const getClientName = (car: Car) => {
    if (!car.clientId) return 'N/A'
    
    if (typeof car.clientId === 'object' && car.clientId.name) {
      return car.clientId.name
    }
    
    // Fallback: find client by ID in clients array
    const client = clients.find(c => c.id === car.clientId)
    return client?.name || 'N/A'
  }

  const filteredCars = useMemo(() => {
    if (!searchTerm) return soldCars
    
    const lowerSearch = searchTerm.toLowerCase()
    return soldCars.filter(
      (car) =>
        car.licensePlate.toLowerCase().includes(lowerSearch) ||
        car.brand.toLowerCase().includes(lowerSearch) ||
        car.model.toLowerCase().includes(lowerSearch) ||
        car.color.toLowerCase().includes(lowerSearch) ||
        getClientName(car).toLowerCase().includes(lowerSearch)
    )
  }, [soldCars, clients, searchTerm])

  const handleAddSoldCar = () => {
    setSelectedCar(null)
    setShowFormModal(true)
  }

  const handleEditCar = (car: Car) => {
    setSelectedCar(car)
    setShowFormModal(true)
  }

  const handleViewCar = (car: Car) => {
    setSelectedCar(car)
    setShowViewModal(true)
  }

  const handleSubmitCar = async (formData: Omit<Car, "_id" | "createdAt" | "updatedAt" | "companyId">) => {
    if (!formData.licensePlate || !formData.brand || !formData.model || !formData.salePrice || !formData.commission || !formData.saleDate) {
      toast.error(t("fillRequiredFields"))
      return
    }

    setIsSubmitting(true)
    try {
      if (selectedCar) {
        // Update existing sold car
        const response = await fetch(`/api/sold-cars/${selectedCar._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update sold car')
        }

        const updatedCar = await response.json()
        setSoldCars(prev => prev.map(car => car._id === selectedCar._id ? updatedCar : car))
        toast.success(t("carUpdatedSuccessfully"))
      } else {
        // Add new sold car
        const response = await fetch('/api/sold-cars', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add sold car')
        }

        const newCar = await response.json()
        setSoldCars(prev => [newCar, ...prev])
        toast.success(t("carAddedSuccessfully"))
      }
    } catch (error: any) {
      toast.error(error.message || (selectedCar ? t("updateCarError") : t("addCarError")))
    } finally {
      setIsSubmitting(false)
      setShowFormModal(false)
    }
  }

  const handleDeleteCar = async (carId: string) => {
    if (!confirm(t("confirmDeleteCar"))) return
    
    setDeletingId(carId)
    try {
      const response = await fetch(`/api/sold-cars/${carId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete sold car')
      }

      setSoldCars(prev => prev.filter(car => car._id !== carId))
      toast.success(t("carDeletedSuccessfully"))
    } catch (error: any) {
      toast.error(error.message || t("deleteCarError"))
    } finally {
      setDeletingId(null)
    }
  }

  const format = (amount: number) =>
    formatCurrencyRight(amount, preferences?.currency)

  const totalSales = useMemo(() => {
    return soldCars.reduce((sum, car) => sum + car.salePrice, 0)
  }, [soldCars])

  const totalCommission = useMemo(() => {
    return soldCars.reduce((sum, car) => sum + car.commission, 0)
  }, [soldCars])

  const averageCommission = useMemo(() => {
    return soldCars.length > 0 ? totalCommission / soldCars.length : 0
  }, [soldCars, totalCommission])

  const averageSalePrice = useMemo(() => {
    return soldCars.length > 0 ? totalSales / soldCars.length : 0
  }, [soldCars, totalSales])

  if (loading || fetchingData) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" />
        <p className="ml-2">{t("loadingData")}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("soldCars")}</h1>
          <p className="text-muted-foreground">{t("manageSoldCarsDescription")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Input
            placeholder={t("searchSoldCars")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm flex-grow"
          />
          <Button onClick={handleAddSoldCar}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("addSoldCar")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalSoldCars")}</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldCars.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalSales")}</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {format(totalSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {format(averageSalePrice)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalCommission")}</CardTitle>
            <Percent className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {format(totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {format(averageCommission)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("commissionRate")}</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalSales > 0 ? `${((totalCommission / totalSales) * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sold Cars Table */}
      <Card className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("licensePlate")}</TableHead>
              <TableHead>{t("brand")}</TableHead>
              <TableHead>{t("model")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("year")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("color")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("client")}</TableHead>
              <TableHead>{t("salePrice")}</TableHead>
              <TableHead>{t("commission")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("saleDate")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCars.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  {searchTerm ? t("noSoldCarsFound") : t("noSoldCarsYet")}
                </TableCell>
              </TableRow>
            ) : (
              filteredCars.map((car) => (
                <TableRow key={car._id}>
                  <TableCell className="font-medium">{car.licensePlate}</TableCell>
                  <TableCell>{car.brand}</TableCell>
                  <TableCell>{car.model}</TableCell>
                  <TableCell className="hidden md:table-cell">{car.year}</TableCell>
                  <TableCell className="hidden lg:table-cell">{car.color}</TableCell>
                  <TableCell className="hidden sm:table-cell">{getClientName(car)}</TableCell>
                  <TableCell className="font-medium text-green-600">
                    {format(car.salePrice)}
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {format(car.commission)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(car.saleDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t("openMenu")}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewCar(car)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCar(car)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteCar(car._id)}
                          className="text-red-600"
                          disabled={deletingId === car._id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingId === car._id ? t("deleting") : t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <CarFormModal
        isOpen={showFormModal}
        onOpenChange={setShowFormModal}
        initialData={selectedCar}
        onSubmit={handleSubmitCar}
        isSubmitting={isSubmitting}
        clients={clients}
      />

      <CarViewModal
        isOpen={showViewModal}
        onOpenChange={setShowViewModal}
        car={selectedCar}
        clients={clients}
        onEdit={(carToEdit) => {
          setShowViewModal(false)
          handleEditCar(carToEdit)
        }}
      />
    </div>
  )
}