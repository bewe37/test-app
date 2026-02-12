"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { DownloadIcon, CalendarIcon, FilterIcon } from "@hugeicons/core-free-icons"

import donationsData from "./data.json"

export default function DonationsPage() {
  const [filteredData, setFilteredData] = React.useState(donationsData)
  const [filters, setFilters] = React.useState({
    startDate: "",
    endDate: "",
    store: "",
    volunteer: "",
    recipient: "",
  })

  // Get unique values for filters
  const uniqueStores = Array.from(new Set(donationsData.map(d => d.store))).sort()
  const uniqueVolunteers = Array.from(new Set(donationsData.map(d => d.volunteer))).sort()

  // Calculate totals
  const totalCount = filteredData.length
  const totalValue = filteredData.reduce((sum, donation) => sum + donation.amount, 0)

  // Filter data whenever filters change
  React.useEffect(() => {
    let filtered = donationsData

    if (filters.startDate) {
      filtered = filtered.filter(d => new Date(d.date) >= new Date(filters.startDate))
    }
    if (filters.endDate) {
      filtered = filtered.filter(d => new Date(d.date) <= new Date(filters.endDate))
    }
    if (filters.store) {
      filtered = filtered.filter(d => d.store === filters.store)
    }
    if (filters.volunteer) {
      filtered = filtered.filter(d => d.volunteer === filters.volunteer)
    }
    if (filters.recipient) {
      filtered = filtered.filter(d =>
        d.recipient.toLowerCase().includes(filters.recipient.toLowerCase())
      )
    }

    setFilteredData(filtered)
  }, [filters])

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Store", "Amount", "Volunteer", "Recipient", "Notes"]
    const csvData = filteredData.map(d => [
      d.date,
      d.store,
      `$${d.amount}`,
      d.volunteer,
      d.recipient,
      d.notes || ""
    ])

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `donations-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      store: "",
      volunteer: "",
      recipient: "",
    })
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardDescription>Total Donations Distributed</CardDescription>
                    <CardTitle className="text-4xl font-bold">{totalCount}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Gift cards given to recipients
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Total Dollar Value</CardDescription>
                    <CardTitle className="text-4xl font-bold">
                      ${totalValue.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Total value distributed to community
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters Card */}
              <Card className="mx-4 lg:mx-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Donation Log</CardTitle>
                      <CardDescription>Filter and export donation records</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        <HugeiconsIcon icon={FilterIcon} strokeWidth={2} />
                        Clear Filters
                      </Button>
                      <Button size="sm" onClick={exportToCSV}>
                        <HugeiconsIcon icon={DownloadIcon} strokeWidth={2} />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store">Store</Label>
                      <Select value={filters.store} onValueChange={(value) => setFilters({...filters, store: value})}>
                        <SelectTrigger id="store">
                          <SelectValue placeholder="All Stores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Stores</SelectItem>
                          {uniqueStores.map(store => (
                            <SelectItem key={store} value={store}>{store}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="volunteer">Volunteer</Label>
                      <Select value={filters.volunteer} onValueChange={(value) => setFilters({...filters, volunteer: value})}>
                        <SelectTrigger id="volunteer">
                          <SelectValue placeholder="All Volunteers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Volunteers</SelectItem>
                          {uniqueVolunteers.map(volunteer => (
                            <SelectItem key={volunteer} value={volunteer}>{volunteer}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient</Label>
                      <Input
                        id="recipient"
                        placeholder="Search recipient..."
                        value={filters.recipient}
                        onChange={(e) => setFilters({...filters, recipient: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Donations Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Volunteer</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.length > 0 ? (
                          filteredData.map((donation) => (
                            <TableRow key={donation.id}>
                              <TableCell className="font-medium">
                                {new Date(donation.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{donation.store}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">${donation.amount}</Badge>
                              </TableCell>
                              <TableCell>{donation.volunteer}</TableCell>
                              <TableCell>{donation.recipient}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {donation.notes}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No donations found matching your filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Results Count */}
                  <div className="mt-4 text-sm text-muted-foreground">
                    Showing {filteredData.length} of {donationsData.length} donations
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
