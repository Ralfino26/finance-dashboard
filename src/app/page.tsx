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

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Wallet className="h-5 w-5" />
            Total Assets
          </CardTitle>
          <CardDescription className="text-sm">Combined value of all vaults</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold tracking-tight">
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
              <Card key={vault.id} className="hover:shadow-md transition-shadow border-border/50 cursor-pointer" onClick={() => window.location.href = `/vault/${vault.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: vault.color }}
                    />
                    <span className="truncate">{vault.name}</span>
                  </CardTitle>
                  <CardDescription className="capitalize text-xs">{vault.type} vault</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Total Value</span>
                      <p className="text-xl font-semibold mt-0.5">
                        €{totalValue.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Assets</span>
                      <p className="text-sm font-medium mt-0.5">{assetCount}</p>
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
