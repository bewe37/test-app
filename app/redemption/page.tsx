"use client"

import { useState, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import rawData from "./data.json"

type GiftCard = {
  id: number
  store: string
  last4: string
  initialBalance: number
  remainingBalance: number
  status: string
  addedDate: string
  addedBy: string
}

type Transaction = {
  id: number
  cardId: number
  date: string
  type: "spend" | "donation"
  amount: number
  volunteer: string
  recipient: string | null
  notes: string
}

type DataStore = {
  cards: GiftCard[]
  transactions: Transaction[]
}

const uniqueStores = [...new Set((rawData as DataStore).cards.map((c) => c.store))].sort()
const volunteers = ["Sarah Johnson", "Mike Davis", "Lisa Chen", "James Lee", "Amy Brown"]

export default function RedemptionPage() {
  const [data, setData] = useState<DataStore>(rawData as DataStore)

  // Search state
  const [searchStore, setSearchStore] = useState("")
  const [searchLast4, setSearchLast4] = useState("")
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [searchError, setSearchError] = useState("")

  // Spend form state
  const [showSpendForm, setShowSpendForm] = useState(false)
  const [spendAmount, setSpendAmount] = useState("")
  const [spendVolunteer, setSpendVolunteer] = useState("")
  const [spendNotes, setSpendNotes] = useState("")
  const [spendError, setSpendError] = useState("")

  // Donation form state
  const [showDonationForm, setShowDonationForm] = useState(false)
  const [donationFull, setDonationFull] = useState(false)
  const [donationAmount, setDonationAmount] = useState("")
  const [donationRecipient, setDonationRecipient] = useState("")
  const [donationVolunteer, setDonationVolunteer] = useState("")
  const [donationNotes, setDonationNotes] = useState("")
  const [donationError, setDonationError] = useState("")

  const cardTransactions = useMemo(() => {
    if (!selectedCard) return []
    return data.transactions
      .filter((t) => t.cardId === selectedCard.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedCard, data.transactions])

  function handleSearch() {
    setSearchError("")
    setSelectedCard(null)
    setShowSpendForm(false)
    setShowDonationForm(false)

    if (!searchStore) {
      setSearchError("Please select a store.")
      return
    }
    if (!searchLast4 || searchLast4.length !== 4) {
      setSearchError("Please enter the last 4 digits of the card.")
      return
    }

    const found = data.cards.find(
      (c) => c.store === searchStore && c.last4 === searchLast4
    )

    if (!found) {
      setSearchError("No card found with that store and last 4 digits.")
      return
    }

    setSelectedCard(found)
  }

  function handleRecordSpend() {
    setSpendError("")
    if (!spendAmount || isNaN(Number(spendAmount)) || Number(spendAmount) <= 0) {
      setSpendError("Enter a valid amount.")
      return
    }
    if (!spendVolunteer) {
      setSpendError("Please select a volunteer.")
      return
    }
    const amount = Number(Number(spendAmount).toFixed(2))
    if (amount > selectedCard!.remainingBalance) {
      setSpendError(`Amount exceeds remaining balance of $${selectedCard!.remainingBalance.toFixed(2)}.`)
      return
    }

    const newTransaction: Transaction = {
      id: data.transactions.length + 1,
      cardId: selectedCard!.id,
      date: new Date().toISOString(),
      type: "spend",
      amount,
      volunteer: spendVolunteer,
      recipient: null,
      notes: spendNotes,
    }

    const newBalance = selectedCard!.remainingBalance - amount
    const updatedCards = data.cards.map((c) =>
      c.id === selectedCard!.id
        ? { ...c, remainingBalance: newBalance, status: newBalance === 0 ? "Used" : c.status }
        : c
    )
    const updatedCard = updatedCards.find((c) => c.id === selectedCard!.id)!

    setData({ cards: updatedCards, transactions: [...data.transactions, newTransaction] })
    setSelectedCard(updatedCard)
    setShowSpendForm(false)
    setSpendAmount("")
    setSpendVolunteer("")
    setSpendNotes("")
  }

  function handleRecordDonation() {
    setDonationError("")
    if (!donationVolunteer) {
      setDonationError("Please select a volunteer.")
      return
    }
    if (!donationRecipient.trim()) {
      setDonationError("Please enter a recipient name.")
      return
    }

    let amount: number
    if (donationFull) {
      amount = selectedCard!.remainingBalance
    } else {
      if (!donationAmount || isNaN(Number(donationAmount)) || Number(donationAmount) <= 0) {
        setDonationError("Enter a valid amount.")
        return
      }
      amount = Number(Number(donationAmount).toFixed(2))
      if (amount > selectedCard!.remainingBalance) {
        setDonationError(`Amount exceeds remaining balance of $${selectedCard!.remainingBalance.toFixed(2)}.`)
        return
      }
    }

    const newTransaction: Transaction = {
      id: data.transactions.length + 1,
      cardId: selectedCard!.id,
      date: new Date().toISOString(),
      type: "donation",
      amount,
      volunteer: donationVolunteer,
      recipient: donationRecipient,
      notes: donationNotes,
    }

    const newBalance = selectedCard!.remainingBalance - amount
    const updatedCards = data.cards.map((c) =>
      c.id === selectedCard!.id
        ? { ...c, remainingBalance: newBalance, status: newBalance === 0 ? "Donated" : c.status }
        : c
    )
    const updatedCard = updatedCards.find((c) => c.id === selectedCard!.id)!

    setData({ cards: updatedCards, transactions: [...data.transactions, newTransaction] })
    setSelectedCard(updatedCard)
    setShowDonationForm(false)
    setDonationAmount("")
    setDonationRecipient("")
    setDonationVolunteer("")
    setDonationNotes("")
    setDonationFull(false)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    })
  }

  function getStatusColor(status: string) {
    if (status === "Active") return "bg-green-100 text-green-800"
    if (status === "Used") return "bg-gray-100 text-gray-700"
    if (status === "Donated") return "bg-blue-100 text-blue-800"
    return "bg-yellow-100 text-yellow-800"
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">

          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold">Redemption</h1>
            <p className="text-muted-foreground text-sm mt-1">Search for a gift card and record spends or donations.</p>
          </div>

          {/* Search Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search Gift Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Store</Label>
                  <Select value={searchStore} onValueChange={setSearchStore}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueStores.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-40 space-y-1">
                  <Label>Last 4 Digits</Label>
                  <Input
                    placeholder="e.g. 1234"
                    maxLength={4}
                    value={searchLast4}
                    onChange={(e) => setSearchLast4(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <Button onClick={handleSearch} className="w-full sm:w-auto">Search</Button>
              </div>
              {searchError && <p className="text-sm text-red-500 mt-2">{searchError}</p>}
            </CardContent>
          </Card>

          {/* Card Detail */}
          {selectedCard && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Card Details</CardTitle>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(selectedCard.status)}`}>
                    {selectedCard.status}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    <div>
                      <p className="text-xs text-muted-foreground">Store</p>
                      <p className="font-semibold">{selectedCard.store}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Card (Last 4)</p>
                      <p className="font-semibold">•••• {selectedCard.last4}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Initial Balance</p>
                      <p className="font-semibold">${selectedCard.initialBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining Balance</p>
                      <p className={`text-lg font-bold ${selectedCard.remainingBalance === 0 ? "text-red-500" : "text-green-600"}`}>
                        ${selectedCard.remainingBalance.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Added On</p>
                      <p className="font-medium text-sm">{selectedCard.addedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Added By</p>
                      <p className="font-medium text-sm">{selectedCard.addedBy}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedCard.remainingBalance > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        onClick={() => { setShowSpendForm(!showSpendForm); setShowDonationForm(false) }}
                        variant={showSpendForm ? "default" : "outline"}
                      >
                        Record Spend
                      </Button>
                      <Button
                        onClick={() => { setShowDonationForm(!showDonationForm); setShowSpendForm(false) }}
                        variant={showDonationForm ? "default" : "outline"}
                      >
                        Record Donation Out
                      </Button>
                    </div>
                  )}

                  {/* Spend Form */}
                  {showSpendForm && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                      <p className="font-medium text-sm">Record a Spend</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Amount ($)</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={spendAmount}
                            onChange={(e) => setSpendAmount(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Volunteer</Label>
                          <Select value={spendVolunteer} onValueChange={setSpendVolunteer}>
                            <SelectTrigger><SelectValue placeholder="Select volunteer" /></SelectTrigger>
                            <SelectContent>
                              {volunteers.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <Label>Notes (optional)</Label>
                          <Input
                            placeholder="e.g. Groceries for Family A"
                            value={spendNotes}
                            onChange={(e) => setSpendNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      {spendError && <p className="text-sm text-red-500">{spendError}</p>}
                      <div className="flex gap-2 pt-1">
                        <Button onClick={handleRecordSpend} size="sm">Confirm Spend</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setShowSpendForm(false); setSpendError("") }}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Donation Form */}
                  {showDonationForm && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                      <p className="font-medium text-sm">Record a Donation Out</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Recipient</Label>
                          <Input
                            placeholder="e.g. Family A"
                            value={donationRecipient}
                            onChange={(e) => setDonationRecipient(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Volunteer</Label>
                          <Select value={donationVolunteer} onValueChange={setDonationVolunteer}>
                            <SelectTrigger><SelectValue placeholder="Select volunteer" /></SelectTrigger>
                            <SelectContent>
                              {volunteers.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Donation Type</Label>
                          <div className="flex gap-3 pt-1">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="radio"
                                checked={donationFull}
                                onChange={() => { setDonationFull(true); setDonationAmount("") }}
                              />
                              Full card (${selectedCard.remainingBalance.toFixed(2)})
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="radio"
                                checked={!donationFull}
                                onChange={() => setDonationFull(false)}
                              />
                              Partial amount
                            </label>
                          </div>
                        </div>
                        {!donationFull && (
                          <div className="space-y-1">
                            <Label>Amount ($)</Label>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="0.00"
                              value={donationAmount}
                              onChange={(e) => setDonationAmount(e.target.value)}
                            />
                          </div>
                        )}
                        <div className="sm:col-span-2 space-y-1">
                          <Label>Notes (optional)</Label>
                          <Input
                            placeholder="e.g. Donated to family for weekly groceries"
                            value={donationNotes}
                            onChange={(e) => setDonationNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      {donationError && <p className="text-sm text-red-500">{donationError}</p>}
                      <div className="flex gap-2 pt-1">
                        <Button onClick={handleRecordDonation} size="sm">Confirm Donation</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setShowDonationForm(false); setDonationError("") }}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  {cardTransactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No transactions recorded for this card.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-left">
                            <th className="pb-2 pr-4 font-medium">Date & Time</th>
                            <th className="pb-2 pr-4 font-medium">Type</th>
                            <th className="pb-2 pr-4 font-medium">Amount</th>
                            <th className="pb-2 pr-4 font-medium">Volunteer</th>
                            <th className="pb-2 pr-4 font-medium">Recipient</th>
                            <th className="pb-2 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cardTransactions.map((t) => (
                            <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="py-3 pr-4 whitespace-nowrap">{formatDate(t.date)}</td>
                              <td className="py-3 pr-4">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.type === "spend" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                                  {t.type === "spend" ? "Spend" : "Donation"}
                                </span>
                              </td>
                              <td className="py-3 pr-4 font-medium">-${t.amount.toFixed(2)}</td>
                              <td className="py-3 pr-4">{t.volunteer}</td>
                              <td className="py-3 pr-4">{t.recipient ?? "—"}</td>
                              <td className="py-3 text-muted-foreground">{t.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
