"use client"

import { useState, useMemo } from "react"
import { useApiStore } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle, FileDown, Trash2, Building2, User, Car, Eye, Settings, Stamp, Check, X, Edit3 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { generateClientProfilePdf } from "@/lib/pdf-generator"
import { ClientDialog } from "@/components/client-dialog"
import { VehicleVisualizerDialog } from "@/components/vehicle-visualizer-dialog"
import { VehicleManagerDialog } from "@/components/vehicle-manager-dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Client, ClientType } from "@/types"

export default function ClientsPage() {
  const { clients, loading, preferences, fetchClients, deleteClient, updateClient } = useApiStore()
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState("")
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientType | "all">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // New states for vehicle dialogs
  const [vehicleVisualizerOpen, setVehicleVisualizerOpen] = useState(false)
  const [vehicleManagerOpen, setVehicleManagerOpen] = useState(false)
  const [selectedClientForVehicles, setSelectedClientForVehicles] = useState<Client | null>(null)
  
  // States for inline stamp editing
  const [editingStampId, setEditingStampId] = useState<string | null>(null)
  const [tempStampValue, setTempStampValue] = useState("")

  const filteredClients = useMemo(() => {
    let filtered = clients

    // Filter by client type
    if (clientTypeFilter !== "all") {
      filtered = filtered.filter(client => client.clientType === clientTypeFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter((client) => {
        // Search in basic client info
        const basicMatch = 
          client.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          client.phone.toLowerCase().includes(lowerCaseSearchTerm) ||
          client.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
          client.stamp?.toLowerCase().includes(lowerCaseSearchTerm)

        // Search in vehicles
        const vehicleMatch = client.vehicles?.some(vehicle =>
          vehicle.make?.toLowerCase().includes(lowerCaseSearchTerm) ||
          vehicle.model?.toLowerCase().includes(lowerCaseSearchTerm) ||
          vehicle.licensePlate?.toLowerCase().includes(lowerCaseSearchTerm)
        )

        // Search in legacy fields for backward compatibility
        const legacyMatch = 
          client.vehicleMake?.toLowerCase().includes(lowerCaseSearchTerm) ||
          client.vehicleModel?.toLowerCase().includes(lowerCaseSearchTerm) ||
          client.licensePlate?.toLowerCase().includes(lowerCaseSearchTerm)

        return basicMatch || vehicleMatch || legacyMatch
      })
    }

    return filtered
  }, [clients, searchTerm, clientTypeFilter])

  const handleExportClientProfilePdf = async (client: Client) => {
    if (!preferences) return
    await generateClientProfilePdf(client, preferences, t)
  }

  const handleAddClient = () => {
    setEditingClient(null)
    setDialogOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setDialogOpen(true)
  }

  const handleDeleteClient = (client: Client) => {
    setDeletingClient(client)
    setDeleteDialogOpen(true)
  }

  // New handlers for vehicle actions
  const handleViewVehicles = (client: Client) => {
    setSelectedClientForVehicles(client)
    setVehicleVisualizerOpen(true)
  }

  const handleManageVehicles = (client: Client) => {
    setSelectedClientForVehicles(client)
    setVehicleManagerOpen(true)
  }

  // Stamp editing functions
  const handleStartEditStamp = (client: Client) => {
    setEditingStampId(client.id)
    setTempStampValue(client.stamp || "1")
  }

  const handleSaveStamp = async (clientId: string) => {
  try {
    console.log('Saving stamp:', clientId, tempStampValue) // Debug log
    
    // Update the client
    await updateClient(clientId, { stamp: tempStampValue })
    
    
    console.log('Stamp updated successfully') // Debug log
    
    // Reset editing state
    setEditingStampId(null)
    setTempStampValue("")
    
    // Wait for the clients to be refreshed
    await fetchClients()
    
    console.log('Clients refreshed') // Debug log
    
  } catch (error) {
    console.error("Failed to update stamp:", error)
    
    // Show user-visible error
    alert(`Failed to update stamp: ${error.message || error}`)
    
    // Don't reset the editing state if there was an error
    // so user can try again
  }
}

  const handleCancelEditStamp = () => {
    setEditingStampId(null)
    setTempStampValue("")
  }

  const confirmDeleteClient = async () => {
    if (!deletingClient) return
    
    try {
      await deleteClient(deletingClient.id)
      fetchClients() // Refresh the clients list
      setDeleteDialogOpen(false)
      setDeletingClient(null)
    } catch (error) {
      console.error("Failed to delete client:", error)
      // You might want to show a toast notification here for error handling
    }
  }

  const handleDialogSuccess = () => {
    // Refresh clients data after successful create/update
    fetchClients()
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingClient(null)
    }
  }

  const handleVehicleDialogClose = () => {
    setVehicleVisualizerOpen(false)
    setVehicleManagerOpen(false)
    setSelectedClientForVehicles(null)
    // Refresh clients data in case vehicles were modified
    fetchClients()
  }

  const formatVehicles = (client: Client) => {
    // Handle new vehicles array
    if (client.vehicles && client.vehicles.length > 0) {
      return client.vehicles.map(vehicle => {
        const parts = [vehicle.make, vehicle.model, vehicle.year ? `(${vehicle.year})` : ''].filter(Boolean)
        return parts.length > 0 ? parts.join(' ') : vehicle.licensePlate
      }).join(', ')
    }

    // Fallback to legacy fields
    if (client.vehicleMake || client.vehicleModel || client.vehicleYear) {
      return `${client.vehicleMake || ""} ${client.vehicleModel || ""} ${client.vehicleYear ? `(${client.vehicleYear})` : ""}`.trim()
    }

    return "-"
  }

  const formatLicensePlates = (client: Client) => {
    // Handle new vehicles array
    if (client.vehicles && client.vehicles.length > 0) {
      return client.vehicles.map(vehicle => vehicle.licensePlate).filter(Boolean).join(', ')
    }

    // Fallback to legacy field
    return client.licensePlate || "-"
  }

  const getClientTypeIcon = (clientType: ClientType) => {
    switch (clientType) {
      case "company":
        return <Building2 className="h-4 w-4" />
      case "individual":
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getClientTypeBadge = (clientType: ClientType) => {
    const variant = clientType === "company" ? "default" : "secondary"
    const label = clientType === "company" ? t("company") : t("individual")
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getClientTypeIcon(clientType)}
        {label}
      </Badge>
    )
  }

  const getVehicleCount = (client: Client) => {
    if (client.vehicles && client.vehicles.length > 0) {
      return client.vehicles.length
    }
    // Check if legacy vehicle data exists
    if (client.licensePlate || client.vehicleMake || client.vehicleModel) {
      return 1
    }
    return 0
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" />
        <p className="ml-2">{t("loadingData")}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("clients")}</h1>
        <Button onClick={handleAddClient}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("addNewClient")}
        </Button>
      </div>

      <div className="mb-4 flex gap-4">
        <Input
          placeholder={t("searchClients")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {clientTypeFilter === "all" ? t("allTypes") : 
               clientTypeFilter === "company" ? t("companies") : t("individuals")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setClientTypeFilter("all")}>
              {t("allTypes")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setClientTypeFilter("individual")}>
              <User className="mr-2 h-4 w-4" />
              {t("individuals")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setClientTypeFilter("company")}>
              <Building2 className="mr-2 h-4 w-4" />
              {t("companies")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("stamp")}</TableHead>
              <TableHead>{t("vehicles")}</TableHead>
              <TableHead>{t("licensePlates")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {searchTerm ? t("noClientsFound") : t("noClients")}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="group">
                  <TableCell>
                    {getClientTypeBadge(client.clientType)}
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.email || "-"}</TableCell>
                  <TableCell>
  <div className="flex items-center gap-2">
    <Stamp className="h-4 w-4 text-muted-foreground" />
    {editingStampId === client.id ? (
      <div className="flex items-center gap-2">
        <Input
          value={tempStampValue}
          onChange={(e) => {
            // Remove non-digit characters except decimal point
            const value = e.target.value.replace(/[^\d.,]/g, '');
            setTempStampValue(value);
          }}
          placeholder="Enter amount"
          className="h-7 w-24 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveStamp(client.id);
            } else if (e.key === 'Escape') {
              handleCancelEditStamp();
            }
          }}
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => handleSaveStamp(client.id)}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={handleCancelEditStamp}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {formatCurrency(
            Number(client.stamp || 1), 
            preferences?.currency, 
            { symbolPosition: "right" }
          )}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleStartEditStamp(client)}
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      </div>
    )}
  </div>
</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getVehicleCount(client) > 0 && <Car className="h-4 w-4 text-muted-foreground" />}
                      {formatVehicles(client)}
                      {getVehicleCount(client) > 1 && (
                        <Badge variant="outline" className="text-xs">
                          +{getVehicleCount(client) - 1}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatLicensePlates(client)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t("openMenu")}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClient(client)}>
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleViewVehicles(client)}
                          disabled={getVehicleCount(client) === 0}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t("viewVehicles")} ({getVehicleCount(client)})
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageVehicles(client)}>
                          <Settings className="mr-2 h-4 w-4" />
                          {t("manageVehicles")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportClientProfilePdf(client)}>
                          <FileDown className="mr-2 h-4 w-4" />
                          {t("exportProfilePdf")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClient(client)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Client Dialog */}
      <ClientDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        client={editingClient}
        onSuccess={handleDialogSuccess}
      />

      {/* Vehicle Visualizer Dialog */}
      <VehicleVisualizerDialog
        open={vehicleVisualizerOpen}
        onOpenChange={(open) => {
          setVehicleVisualizerOpen(open)
          if (!open) {
            setSelectedClientForVehicles(null)
          }
        }}
        client={selectedClientForVehicles}
      />

      {/* Vehicle Manager Dialog */}
      <VehicleManagerDialog
        open={vehicleManagerOpen}
        onOpenChange={(open) => {
          setVehicleManagerOpen(open)
          if (!open) {
            handleVehicleDialogClose()
          }
        }}
        client={selectedClientForVehicles}
        onSuccess={handleVehicleDialogClose}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteClient")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteClientConfirmation", { name: deletingClient?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteClient}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}