"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { assetStore, vaultStore } from "@/lib/store"
import { Wallet } from "lucide-react"
import { Vault } from "@/types/vault"

interface VaultSummary {
  vault: Vault
  totalValue: number
  assetCount: number
}

export default function OverviewPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [vaultSummaries, setVaultSummaries] = useState<VaultSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vaultsData, totalValueData] = await Promise.all([
          vaultStore.getAll(),
          assetStore.getTotalValue(),
        ])

        setVaults(vaultsData)
        setTotalValue(totalValueData)

        // Load summaries for each vault
        const summaries = await Promise.all(
          vaultsData.map(async (vault) => {
            const [assets, total] = await Promise.all([
              assetStore.getByVaultId(vault.id),
              assetStore.getTotalValueByVault(vault.id),
            ])
            return {
              vault,
              totalValue: total,
              assetCount: assets.length,
            }
          })
        )

        setVaultSummaries(summaries)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Reload when vaults are updated
    const handleUpdate = () => {
      loadData()
    }
    window.addEventListener("vault-updated", handleUpdate)
    window.addEventListener("asset-updated", handleUpdate)
    return () => {
      window.removeEventListener("vault-updated", handleUpdate)
      window.removeEventListener("asset-updated", handleUpdate)
    }
  }, [])

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
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : vaultSummaries.length === 0 ? (
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
