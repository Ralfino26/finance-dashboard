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
import { VaultType } from "@/types/vault"

interface AddAssetDialogProps {
  vaultId: string
  vaultType: VaultType
}

export function AddAssetDialog({ vaultId, vaultType }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [valueInEur, setValueInEur] = useState("")
  const [symbol, setSymbol] = useState("")
  const [currency, setCurrency] = useState("EUR")
  const [loadingPrice, setLoadingPrice] = useState(false)

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      if (e.detail?.vaultId === vaultId) {
        setOpen(true)
      }
    }
    window.addEventListener("open-asset-dialog", handleOpen as EventListener)
    return () => window.removeEventListener("open-asset-dialog", handleOpen as EventListener)
  }, [vaultId])

  // Auto-fetch price for crypto when symbol and amount are entered
  useEffect(() => {
    if (vaultType === "crypto" && symbol && amount) {
      const fetchPrice = async () => {
        setLoadingPrice(true)
        try {
          const response = await fetch(`/api/crypto/price?symbol=${symbol.toUpperCase()}`)
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

      // Debounce the API call
      const timeoutId = setTimeout(fetchPrice, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [symbol, amount, vaultType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !amount || !valueInEur) return

    try {
      await assetStore.create({
        vaultId,
        name: name.trim(),
        amount: parseFloat(amount),
        valueInEur: parseFloat(valueInEur),
      })

      setName("")
      setAmount("")
      setValueInEur("")
      setSymbol("")
      setCurrency("EUR")
      setOpen(false)
      // Dispatch event to update components
      window.dispatchEvent(new CustomEvent("asset-updated"))
    } catch (error) {
      console.error("Failed to create asset:", error)
      alert("Failed to create asset. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>
            Add a new asset to this {vaultType} vault.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={vaultType === "crypto" ? "e.g., Bitcoin" : vaultType === "investment" ? "e.g., Apple Inc." : "e.g., Savings Account"}
                required
              />
            </div>
            {(vaultType === "crypto" || vaultType === "investment") && (
              <div className="grid gap-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder={vaultType === "crypto" ? "e.g., BTC" : "e.g., AAPL"}
                />
              </div>
            )}
            {vaultType === "cash" && (
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="e.g., EUR, USD"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valueInEur">
                Value in €
                {vaultType === "crypto" && loadingPrice && (
                  <span className="ml-2 text-xs text-muted-foreground">(Loading price...)</span>
                )}
              </Label>
              <Input
                id="valueInEur"
                type="number"
                step="any"
                value={valueInEur}
                onChange={(e) => setValueInEur(e.target.value)}
                placeholder={vaultType === "crypto" ? "Auto-calculated from price" : "0.00"}
                required
                disabled={vaultType === "crypto" && loadingPrice}
              />
              {vaultType === "crypto" && symbol && (
                <p className="text-xs text-muted-foreground">
                  Enter symbol (e.g., BTC) and amount to auto-calculate value
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Asset</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

