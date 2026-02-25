"use client"

import { useState, useMemo } from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import redemptionData from "../redemption/data.json"
import { STORE_CATEGORIES, CATEGORY_RAW, TreemapCell } from "@/lib/treemap"

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Grocery", "Fast Food", "Clothing", "Other"]
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50]


// ── Nav button for pagination ─────────────────────────────────────────────────

function PagBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e8f0] text-sm text-[#525252] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f1f5f9] transition-colors"
    >
      {children}
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const cards = redemptionData.cards
  const transactions = redemptionData.transactions

  // Summary stats
  const totalCards = cards.length
  const totalRemaining = cards.reduce((s, c) => s + c.remainingBalance, 0)
  const totalRedeemed = cards.reduce((s, c) => s + (c.initialBalance - c.remainingBalance), 0)
  const activeCount = cards.filter(c => c.status === "Active").length

  // Per-store breakdown
  const storeBreakdown = useMemo(() => {
    const map = new Map<string, {
      store: string; category: string; count: number
      remaining: number; redeemed: number; donated: number
    }>()
    for (const c of cards) {
      const cat = STORE_CATEGORIES[c.store] ?? "Other"
      if (!map.has(c.store)) {
        map.set(c.store, { store: c.store, category: cat, count: 0, remaining: 0, redeemed: 0, donated: 0 })
      }
      const e = map.get(c.store)!
      e.count += 1
      e.remaining += c.remainingBalance
      e.redeemed += c.initialBalance - c.remainingBalance
    }
    for (const t of transactions) {
      if (t.type === "donation") {
        const card = cards.find((c) => c.id === t.cardId)
        if (card) {
          const e = map.get(card.store)
          if (e) e.donated += t.amount
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.remaining - a.remaining)
  }, [cards, transactions])

  // Filtered stores by active tab
  const filteredStores = activeCategory === "All"
    ? storeBreakdown
    : storeBreakdown.filter((s) => s.category === activeCategory)

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStores.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const paginatedStores = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredStores.slice(start, start + rowsPerPage)
  }, [filteredStores, safePage, rowsPerPage])

  // Treemap data
  const treemapData = useMemo(() => {
    const source = activeCategory === "All"
      ? storeBreakdown
      : storeBreakdown.filter((s) => s.category === activeCategory)
    return source
      .filter((s) => s.remaining > 0)
      .map((s) => ({
        name: s.store,
        size: parseFloat(s.remaining.toFixed(2)),
        remaining: parseFloat(s.remaining.toFixed(2)),
        redeemed: parseFloat(s.redeemed.toFixed(2)),
        category: s.category,
      }))
  }, [storeBreakdown, activeCategory])

  // Store status: "done" if all cards active, else "in-process"
  function getStoreStatus(store: string): "done" | "in-process" {
    const storeCards = cards.filter(c => c.store === store)
    return storeCards.every(c => c.status === "Active") ? "done" : "in-process"
  }

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat)
    setPage(1)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>

        {/* ── Figma-style page header ── */}
        <div className="border-b h-12 flex items-center shrink-0 px-0">
          <div className="flex items-center gap-4 pl-5 w-full">
            <SidebarTrigger className="bg-white border border-[#e2e8f0] rounded-[6px] p-2 size-8 flex items-center justify-center" />
            <Separator orientation="vertical" className="h-4 bg-[#e5e5e5]" />
            <span className="font-medium text-[16px] text-[#0a0a0a]">Inventory</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex flex-col gap-6 p-6">

            {/* ── Category tabs ── */}
            <div className="border border-[#cbd5e1] rounded-[6px] inline-flex w-fit bg-white px-[5px] py-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 text-sm rounded-[4px] font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-[#f1f5f9] text-[#0a0a0a]"
                      : "text-[#a3a3a3] hover:text-[#0a0a0a]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* ── Value Distribution (Treemap) ── */}
            <div className="border border-[#e2e8f0] rounded-[12px] p-5">
              <p className="text-sm font-semibold text-[#0a0a0a]">Value Distribution</p>
              <p className="text-xs text-[#737373] mt-0.5">Tile size = remaining balance · hover for details</p>
              <div className="mt-4">
                {treemapData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-sm text-[#737373]">
                    No remaining balance in this category.
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <Treemap
                        data={treemapData}
                        dataKey="size"
                        aspectRatio={16 / 9}
                        content={(props) => <TreemapCell {...props} />}
                      >
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div className="bg-white border border-[#e2e8f0] rounded-[8px] shadow-md px-3 py-2 text-sm min-w-[140px]">
                                <p className="font-semibold text-[#0a0a0a] mb-1">{d.name}</p>
                                <div className="space-y-0.5 text-xs">
                                  <p className="text-green-600">Remaining: <span className="font-medium">${d.remaining?.toFixed(2)}</span></p>
                                  <p className="text-orange-500">Redeemed: <span className="font-medium">${d.redeemed?.toFixed(2)}</span></p>
                                  <p className="text-[#737373] mt-1">{d.category}</p>
                                </div>
                              </div>
                            )
                          }}
                        />
                      </Treemap>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-3 justify-center">
                      {Object.entries(CATEGORY_RAW).map(([c, color]) => (
                        <div key={c} className="flex items-center gap-1.5 text-xs text-[#737373]">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {c}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-4">
              {/* Total Cards */}
              <div className="border border-[#e2e8f0] rounded-[12px] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#737373]">Total Cards</p>
                  <span className="text-xs bg-[#f1f5f9] text-[#525252] px-2 py-0.5 rounded-full font-medium">
                    → +{activeCount}
                  </span>
                </div>
                <p className="text-[32px] font-semibold text-[#0a0a0a] mt-1 leading-none">{totalCards}</p>
                <p className="text-xs text-[#737373] mt-2">Active cards</p>
              </div>

              {/* Remaining Value */}
              <div className="border border-[#e2e8f0] rounded-[12px] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#737373]">Remaining Value</p>
                  <span className="text-xs bg-[#f1f5f9] text-[#525252] px-2 py-0.5 rounded-full font-medium">
                    → +{filteredStores.length}
                  </span>
                </div>
                <p className="text-[32px] font-semibold text-[#0a0a0a] mt-1 leading-none">
                  ${Math.round(totalRemaining).toLocaleString()}
                </p>
                <p className="text-xs text-[#737373] mt-2">Available across all cards</p>
              </div>

              {/* Total Redeemed */}
              <div className="border border-[#e2e8f0] rounded-[12px] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#737373]">Total Redeemed</p>
                  <span className="text-xs bg-[#f1f5f9] text-[#525252] px-2 py-0.5 rounded-full font-medium">
                    → +{filteredStores.length}
                  </span>
                </div>
                <p className="text-[32px] font-semibold text-[#0a0a0a] mt-1 leading-none">
                  ${Math.round(totalRedeemed).toLocaleString()}
                </p>
                <p className="text-xs text-[#737373] mt-2">Total value spent or donated out from all cards</p>
              </div>
            </div>

            {/* ── Store Table ── */}
            <div className="border border-[#e2e8f0] rounded-[12px] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#fafafa] hover:bg-[#fafafa]">
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Header</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Section Type</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Status</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Target</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Limit</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Reviewer</TableHead>
                    <TableHead className="py-3 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStores.map((row) => {
                    const status = getStoreStatus(row.store)
                    const limit = Math.round(row.remaining + row.redeemed)
                    return (
                      <TableRow key={row.store} className="hover:bg-[#fafafa] border-[#e2e8f0]">
                        <TableCell className="text-sm font-medium text-[#0a0a0a] py-3">{row.store}</TableCell>
                        <TableCell className="text-sm text-[#737373] py-3">{row.category}</TableCell>
                        <TableCell className="py-3">
                          {status === "done" ? (
                            <span className="flex items-center gap-1.5 text-sm text-green-600">
                              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                              Done
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-sm text-[#737373]">
                              <span className="w-2 h-2 rounded-full border border-[#a3a3a3] shrink-0" />
                              In Process
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-[#0a0a0a] py-3">{row.count}</TableCell>
                        <TableCell className="text-sm text-[#0a0a0a] py-3">{limit}</TableCell>
                        <TableCell className="text-sm text-[#737373] py-3">System</TableCell>
                        <TableCell className="py-3">
                          <button className="text-[#a3a3a3] hover:text-[#525252] px-1 transition-colors text-base tracking-widest">
                            ···
                          </button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* ── Pagination footer ── */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] bg-white">
                <p className="text-xs text-[#737373]">
                  0 of {filteredStores.length} row(s) selected
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-[#737373]">
                    <span>Rows per page</span>
                    <select
                      value={rowsPerPage}
                      onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
                      className="border border-[#e2e8f0] rounded-[4px] px-1.5 py-0.5 text-xs text-[#0a0a0a] bg-white"
                    >
                      {ROWS_PER_PAGE_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-[#737373]">
                    Page {safePage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <PagBtn onClick={() => setPage(1)} disabled={safePage === 1}>«</PagBtn>
                    <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</PagBtn>
                    <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</PagBtn>
                    <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</PagBtn>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
