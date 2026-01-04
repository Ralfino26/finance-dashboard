"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { assetStore } from "@/lib/store"
import { Asset, VaultType } from "@/types/vault"

interface EditAssetDialogProps {
  vaultType: VaultType
}

export function EditAssetDialog({ vaultType }: EditAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [valueInEur, setValueInEur] = useState("")
  const [loadingPrice, setLoadingPrice] = useState(false)

  // Extract symbol from asset name for crypto
  const getSymbolFromName = (name: string): string | null => {
    const upperName = name.toUpperCase()
    const symbols = ["BTC", "ETH", "BNB", "SOL", "ADA", "XRP", "DOT", "DOGE", "MATIC", "AVAX", "ATOM", "LTC", "UNI", "LINK", "ALGO", "VET", "THETA", "FIL", "TRX", "ETC", "XLM", "XMR", "AAVE", "MKR", "COMP", "YFI", "SNX", "SUSHI", "CRV"]
    for (const symbol of symbols) {
      if (upperName.includes(symbol)) return symbol
    }
    if (symbols.includes(upperName)) return upperName
    return null
  }

  // Auto-update price for crypto when amount changes
  useEffect(() => {
    if (vaultType === "crypto" && asset && amount) {
      const symbol = getSymbolFromName(asset.name)
      if (symbol) {
        const fetchPrice = async () => {
          setLoadingPrice(true)
          try {
            const response = await fetch(`/api/crypto/price?symbol=${symbol}`)
            if (response.ok) {
              const data = await response.json()
              if (data.price) {
                const calculatedValue = parseFloat(amount) * data.price
                setValueInEur(calculatedValue.toFixed(2))
              }
            }
          } catch (error) {
            console.error("Failed to fetch price:", error)
          } finally {
            setLoadingPrice(false)
          }
        }

        const timeoutId = setTimeout(fetchPrice, 500)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [amount, vaultType, asset])

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      const assetData = e.detail?.asset as Asset
      if (assetData) {
        setAsset(assetData)
        setName(assetData.name)
        setAmount(assetData.amount.toString())
        setValueInEur(assetData.valueInEur.toString())
        setOpen(true)
      }
    }
    window.addEventListener("open-edit-asset-dialog", handleOpen as EventListener)
    return () => window.removeEventListener("open-edit-asset-dialog", handleOpen as EventListener)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!asset || !name.trim() || !amount || !valueInEur) return

    try {
      await assetStore.update(asset.id, {
        name: name.trim(),
        amount: parseFloat(amount),
        valueInEur: parseFloat(valueInEur),
      })

      setAsset(null)
      setName("")
      setAmount("")
      setValueInEur("")
      setOpen(false)
      // Dispatch event to update components
      window.dispatchEvent(new CustomEvent("asset-updated"))
    } catch (error) {
      console.error("Failed to update asset:", error)
      alert("Failed to update asset. Please try again.")
    }
  }

  const handleDelete = async () => {
    if (!asset) return
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        await assetStore.delete(asset.id)
        setAsset(null)
        setOpen(false)
        // Dispatch event to update components
        window.dispatchEvent(new CustomEvent("asset-updated"))
      } catch (error) {
        console.error("Failed to delete asset:", error)
        alert("Failed to delete asset. Please try again.")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Update the asset details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-valueInEur">
                Value in €
                {vaultType === "crypto" && loadingPrice && (
                  <span className="ml-2 text-xs text-muted-foreground">(Updating price...)</span>
                )}
              </Label>
              <Input
                id="edit-valueInEur"
                type="number"
                step="any"
                value={valueInEur}
                onChange={(e) => setValueInEur(e.target.value)}
                placeholder={vaultType === "crypto" ? "Auto-calculated from price" : "0.00"}
                required
                disabled={vaultType === "crypto" && loadingPrice}
              />
              {vaultType === "crypto" && asset && getSymbolFromName(asset.name) && (
                <p className="text-xs text-muted-foreground">
                  Value auto-updates based on current market price
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

