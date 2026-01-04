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
import { CryptoSearch } from "@/components/crypto-search"
import { cn } from "@/lib/utils"

interface EditAssetDialogProps {
  vaultType: VaultType
}

export function EditAssetDialog({ vaultType }: EditAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [valueInEur, setValueInEur] = useState("")
  const [symbol, setSymbol] = useState("")
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [cryptoName, setCryptoName] = useState<string | null>(null)

  // Extract symbol from asset name for crypto
  const getSymbolFromName = (name: string): string | null => {
    // Try to extract symbol from name like "Bitcoin (BTC)" or "BTC"
    const match = name.match(/\(([A-Z0-9]+)\)/i)
    if (match) return match[1].toUpperCase()
    
    // Check if name itself is a symbol (3-5 uppercase letters)
    const upperName = name.toUpperCase().trim()
    if (/^[A-Z0-9]{2,10}$/.test(upperName)) {
      return upperName
    }
    
    return null
  }

  // Auto-update name and price for crypto when symbol changes
  useEffect(() => {
    if (vaultType === "crypto" && symbol && symbol !== getSymbolFromName(asset?.name || "")) {
      const fetchCryptoInfo = async () => {
        setLoadingPrice(true)
        try {
          const response = await fetch(`/api/crypto/price?symbol=${symbol.toUpperCase()}&info=true`)
          if (response.ok) {
            const data = await response.json()
            if (data.name && data.price) {
              setCryptoName(data.name)
              setName(data.name)
              // Calculate value if amount is also entered
              if (amount) {
                const calculatedValue = parseFloat(amount) * data.price
                setValueInEur(calculatedValue.toFixed(2))
              }
            } else {
              setCryptoName(null)
            }
          } else {
            setCryptoName(null)
          }
        } catch (error) {
          console.error("Failed to fetch crypto info:", error)
          setCryptoName(null)
        } finally {
          setLoadingPrice(false)
        }
      }

      const timeoutId = setTimeout(fetchCryptoInfo, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [symbol, vaultType, asset])

  // Auto-update price for crypto when amount changes
  useEffect(() => {
    if (vaultType === "crypto" && symbol && amount && cryptoName) {
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

      const timeoutId = setTimeout(fetchPrice, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [amount, symbol, vaultType, cryptoName])

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      const assetData = e.detail?.asset as Asset
      if (assetData) {
        setAsset(assetData)
        setName(assetData.name)
        setAmount(assetData.amount.toString())
        setValueInEur(assetData.valueInEur.toString())
        // Extract symbol from name for crypto
        if (vaultType === "crypto") {
          const extractedSymbol = getSymbolFromName(assetData.name)
          setSymbol(extractedSymbol || "")
          setCryptoName(extractedSymbol ? assetData.name : null)
        } else {
          setSymbol("")
          setCryptoName(null)
        }
        setOpen(true)
      }
    }
    window.addEventListener("open-edit-asset-dialog", handleOpen as EventListener)
    return () => window.removeEventListener("open-edit-asset-dialog", handleOpen as EventListener)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!asset) return
    // For crypto, we need symbol and amount, name and value are auto-filled
    if (vaultType === "crypto") {
      if (!symbol || !amount || !cryptoName) return
    } else {
      if (!name.trim() || !amount || !valueInEur) return
    }

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Asset</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the asset details.
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
                    // Fetch price immediately
                    if (amount) {
                      fetch(`/api/crypto/price?symbol=${option.symbol}`)
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.price && amount) {
                            const calculatedValue = parseFloat(amount) * data.price
                            setValueInEur(calculatedValue.toFixed(2))
                          }
                        })
                        .catch(console.error)
                    }
                  }}
                />
                <div className="grid gap-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    Name <span className="text-muted-foreground font-normal">(auto-filled)</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                    placeholder="Will be auto-filled from search"
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-base"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-amount" className="text-sm font-medium">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-valueInEur" className="text-sm font-medium">
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
                id="edit-valueInEur"
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

