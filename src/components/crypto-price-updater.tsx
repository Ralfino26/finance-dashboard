"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Asset } from "@/types/vault"

// Extract symbol from asset name
function getSymbolFromAssetName(name: string): string | null {
  // Try to extract symbol from name like "Bitcoin (BTC)" or "BTC"
  const match = name.match(/\(([A-Z0-9]+)\)/i)
  if (match) return match[1].toUpperCase()
  
  // Check if name itself is a symbol (2-10 uppercase alphanumeric)
  const upperName = name.toUpperCase().trim()
  if (/^[A-Z0-9]{2,10}$/.test(upperName)) {
    return upperName
  }
  
  return null
}

interface CryptoPriceUpdaterProps {
  assets: Asset[]
  onPriceUpdate: (assetId: string, newValue: number) => void
}

export function CryptoPriceUpdater({ assets, onPriceUpdate }: CryptoPriceUpdaterProps) {
  const [updating, setUpdating] = useState(false)

  const updatePrices = async () => {
    setUpdating(true)
    try {
      // Extract symbols from asset names
      const symbols: string[] = []
      const assetSymbolMap = new Map<string, string>()

      for (const asset of assets) {
        const symbol = getSymbolFromAssetName(asset.name)
        if (symbol) {
          symbols.push(symbol)
          assetSymbolMap.set(asset.id, symbol)
        }
      }

      if (symbols.length === 0) {
        alert("No crypto symbols found in asset names")
        return
      }

      // Fetch prices for all symbols
      const response = await fetch(`/api/crypto/price?symbols=${symbols.join(",")}`)
      if (!response.ok) {
        throw new Error("Failed to fetch prices")
      }

      const prices = await response.json()

      // Update each asset's value
      for (const asset of assets) {
        const symbol = assetSymbolMap.get(asset.id)
        if (symbol && prices[symbol]) {
          const newValue = asset.amount * prices[symbol]
          onPriceUpdate(asset.id, newValue)
        }
      }
    } catch (error) {
      console.error("Failed to update prices:", error)
      alert("Failed to update prices. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Button
      onClick={updatePrices}
      disabled={updating}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`} />
      {updating ? "Updating..." : "Refresh Prices"}
    </Button>
  )
}

