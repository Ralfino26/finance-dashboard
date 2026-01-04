"use client"

import { use, useState, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { vaultStore, assetStore } from "@/lib/store"
import { AddAssetDialog } from "@/components/add-asset-dialog"
import { EditAssetDialog } from "@/components/edit-asset-dialog"
import { Plus, Pencil } from "lucide-react"
import { Vault, Asset } from "@/types/vault"

export default function VaultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [vault, setVault] = useState<Vault | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vaultData, assetsData, totalValueData] = await Promise.all([
          vaultStore.getById(id),
          assetStore.getByVaultId(id),
          assetStore.getTotalValueByVault(id),
        ])

        if (!vaultData) {
          notFound()
          return
        }

        setVault(vaultData)
        setAssets(assetsData)
        setTotalValue(totalValueData)
      } catch (error) {
        console.error("Failed to load vault data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Reload when assets are updated
    const handleUpdate = () => {
      loadData()
    }
    window.addEventListener("asset-updated", handleUpdate)
    return () => window.removeEventListener("asset-updated", handleUpdate)
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!vault) {
    notFound()
    return null
  }

  return (
    <div className="space-y-6">
      <AddAssetDialog vaultId={id} vaultType={vault.type} />
      <EditAssetDialog vaultType={vault.type} />
      
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="h-6 w-6 rounded-full"
              style={{ backgroundColor: vault.color }}
            />
            <h1 className="text-3xl font-bold tracking-tight">{vault.name}</h1>
          </div>
          <p className="text-muted-foreground capitalize mt-1">{vault.type} vault</p>
        </div>
        <Button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-asset-dialog", { detail: { vaultId: id } }))
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Value</CardTitle>
          <CardDescription>Combined value of all assets in this vault</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            €{totalValue.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Assets</h2>
        {assets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No assets yet. Click "Add Asset" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {assets.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{asset.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("open-edit-asset-dialog", { detail: { asset } }))
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="font-medium">{asset.amount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value: </span>
                          <span className="font-medium">
                            €{asset.valueInEur.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
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

