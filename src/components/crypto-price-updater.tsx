"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Asset } from "@/types/vault"

// Map common crypto symbols to CoinGecko IDs (client-side version)
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOT: "polkadot",
  DOGE: "dogecoin",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  ATOM: "cosmos",
  LTC: "litecoin",
  UNI: "uniswap",
  LINK: "chainlink",
  ALGO: "algorand",
  VET: "vechain",
  THETA: "theta-token",
  FIL: "filecoin",
  TRX: "tron",
  ETC: "ethereum-classic",
  XLM: "stellar",
  XMR: "monero",
  AAVE: "aave",
  MKR: "maker",
  COMP: "compound-governance-token",
  YFI: "yearn-finance",
  SNX: "havven",
  SUSHI: "sushi",
  CRV: "curve-dao-token",
}

function getSymbolFromAssetName(name: string): string | null {
  const upperName = name.toUpperCase()

  // Check if name contains a known symbol
  for (const symbol of Object.keys(SYMBOL_TO_ID)) {
    if (upperName.includes(symbol)) {
      return symbol
    }
  }

  // Check if the name itself is a known symbol
  if (SYMBOL_TO_ID[upperName]) {
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

