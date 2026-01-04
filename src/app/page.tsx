"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { assetStore, vaultStore } from "@/lib/store"
import { Wallet } from "lucide-react"

export default function OverviewPage() {
  const vaults = vaultStore.getAll()
  const totalValue = assetStore.getTotalValue()

  const vaultSummaries = vaults.map((vault) => ({
    vault,
    totalValue: assetStore.getTotalValueByVault(vault.id),
    assetCount: assetStore.getByVaultId(vault.id).length,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Total value of all your assets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Total Assets
          </CardTitle>
          <CardDescription>Combined value of all vaults</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            €{totalValue.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Vaults</h2>
        {vaultSummaries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No vaults yet. Click the + button in the sidebar to create one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vaultSummaries.map(({ vault, totalValue, assetCount }) => (
              <Card key={vault.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: vault.color }}
                    />
                    {vault.name}
                  </CardTitle>
                  <CardDescription className="capitalize">{vault.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="text-lg font-semibold">
                        €{totalValue.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Assets</span>
                      <span className="text-sm font-medium">{assetCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
