// Crypto price service using CoinGecko API (free, no API key required)

export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  priceEur: number
}

const COINGECKO_API = "https://api.coingecko.com/api/v3"

// Map common crypto symbols to CoinGecko IDs
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

// Cache for prices (5 minute TTL)
let priceCache: Map<string, { price: number; timestamp: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getCryptoPrice(symbol: string): Promise<number | null> {
  const upperSymbol = symbol.toUpperCase()
  const coinId = SYMBOL_TO_ID[upperSymbol]

  if (!coinId) {
    console.warn(`Unknown crypto symbol: ${symbol}`)
    return null
  }

  // Check cache first
  const cached = priceCache.get(upperSymbol)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price
  }

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=eur`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const price = data[coinId]?.eur

    if (!price) {
      console.warn(`No price found for ${symbol} (${coinId})`)
      return null
    }

    // Update cache
    priceCache.set(upperSymbol, { price, timestamp: Date.now() })

    return price
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return null
  }
}

export async function getMultipleCryptoPrices(
  symbols: string[]
): Promise<Map<string, number>> {
  const prices = new Map<string, number>()

  // Filter out unknown symbols and get unique coin IDs
  const coinIds = new Set<string>()
  const symbolToCoinId = new Map<string, string>()

  for (const symbol of symbols) {
    const upperSymbol = symbol.toUpperCase()
    const coinId = SYMBOL_TO_ID[upperSymbol]
    if (coinId) {
      coinIds.add(coinId)
      symbolToCoinId.set(upperSymbol, coinId)
    }
  }

  if (coinIds.size === 0) {
    return prices
  }

  try {
    const ids = Array.from(coinIds).join(",")
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=eur`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    // Map results back to symbols
    for (const [symbol, coinId] of symbolToCoinId.entries()) {
      const price = data[coinId]?.eur
      if (price) {
        prices.set(symbol, price)
        // Update cache
        priceCache.set(symbol, { price, timestamp: Date.now() })
      }
    }
  } catch (error) {
    console.error("Error fetching multiple crypto prices:", error)
  }

  return prices
}

export function getSymbolFromAssetName(name: string): string | null {
  // Try to extract symbol from asset name
  // Common patterns: "Bitcoin (BTC)", "BTC", "Bitcoin BTC", etc.
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

