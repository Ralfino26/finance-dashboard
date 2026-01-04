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
import { CryptoSearch } from "@/components/crypto-search"
import { cn } from "@/lib/utils"

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
  const [cryptoName, setCryptoName] = useState<string | null>(null)

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      if (e.detail?.vaultId === vaultId) {
        setOpen(true)
      }
    }
    window.addEventListener("open-asset-dialog", handleOpen as EventListener)
    return () => window.removeEventListener("open-asset-dialog", handleOpen as EventListener)
  }, [vaultId])

  // Auto-calculate value when amount changes (for crypto)
  useEffect(() => {
    if (vaultType === "crypto" && symbol && amount && parseFloat(amount) > 0) {
      const fetchPrice = async () => {
        setLoadingPrice(true)
        try {
          const response = await fetch(`/api/crypto/price?symbol=${symbol.toUpperCase()}&info=true`)
          if (response.ok) {
            const data = await response.json()
            console.log("Price API response:", data)
            if (data.price && data.price > 0) {
              const calculatedValue = parseFloat(amount) * data.price
              setValueInEur(calculatedValue.toFixed(2))
              // Also update name if we got it from the API
              if (data.name && !cryptoName) {
                setName(data.name)
                setCryptoName(data.name)
              }
            } else {
              console.warn("No valid price returned:", data)
              setValueInEur("")
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error("Price API error:", response.status, errorData)
            setValueInEur("")
          }
        } catch (error) {
          console.error("Failed to fetch price:", error)
          setValueInEur("")
        } finally {
          setLoadingPrice(false)
        }
      }

      const timeoutId = setTimeout(fetchPrice, 300)
      return () => clearTimeout(timeoutId)
    } else if (vaultType === "crypto" && (!symbol || !amount || parseFloat(amount) <= 0)) {
      // Reset value if symbol or amount is cleared
      setValueInEur("")
    }
  }, [amount, symbol, vaultType, cryptoName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // For crypto, we need symbol and amount, name and value are auto-filled
    if (vaultType === "crypto") {
      if (!symbol || !amount || !cryptoName) return
    } else {
      if (!name.trim() || !amount || !valueInEur) return
    }

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
      setCryptoName(null)
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Asset</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a new asset to this {vaultType} vault.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            {vaultType === "crypto" ? (
              <>
                <CryptoSearch
                  value={symbol}
                  onChange={(newSymbol) => {
                    setSymbol(newSymbol)
                    if (!newSymbol) {
                      setName("")
                      setCryptoName(null)
                    }
                  }}
                  onSelect={(option) => {
                    setSymbol(option.symbol)
                    setName(option.name)
                    setCryptoName(option.name)
                    // Fetch price immediately if amount is already entered
                    if (amount && parseFloat(amount) > 0) {
                      setLoadingPrice(true)
                      fetch(`/api/crypto/price?symbol=${option.symbol}&info=true`)
                        .then((res) => res.json())
                        .then((data) => {
                          console.log("Price on select:", data)
                          if (data.price && data.price > 0 && amount) {
                            const calculatedValue = parseFloat(amount) * data.price
                            setValueInEur(calculatedValue.toFixed(2))
                          } else {
                            setValueInEur("")
                          }
                        })
                        .catch((error) => {
                          console.error("Failed to fetch price on select:", error)
                          setValueInEur("")
                        })
                        .finally(() => setLoadingPrice(false))
                    }
                  }}
                />
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-muted-foreground font-normal">(auto-filled)</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                    placeholder="Will be auto-filled from search"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={vaultType === "investment" ? "e.g., Apple Inc." : "e.g., Savings Account"}
                    required
                  />
                </div>
                {vaultType === "investment" && (
                  <div className="grid gap-2">
                    <Label htmlFor="symbol">Symbol (optional)</Label>
                    <Input
                      id="symbol"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g., AAPL, TSLA"
                    />
                  </div>
                )}
              </>
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
              <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="text-base"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="valueInEur" className="text-sm font-medium">
                  Value in €
                </Label>
                {vaultType === "crypto" && loadingPrice && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Calculating...
                  </span>
                )}
              </div>
              <Input
                id="valueInEur"
                type="number"
                step="any"
                value={valueInEur}
                onChange={(e) => setValueInEur(e.target.value)}
                placeholder={vaultType === "crypto" ? "Auto-calculated" : "0.00"}
                required
                disabled={vaultType === "crypto"}
                className={cn(
                  "text-base",
                  vaultType === "crypto" && "bg-muted/50 cursor-not-allowed"
                )}
              />
              {vaultType === "crypto" && !loadingPrice && (
                <p className="text-xs text-muted-foreground mt-1">
                  Value is automatically calculated from current market price
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

