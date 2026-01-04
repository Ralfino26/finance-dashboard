// Crypto price service using CoinGecko API (free, no API key required)

export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  priceEur: number
}

const COINGECKO_API = "https://api.coingecko.com/api/v3"

export interface CryptoInfo {
  symbol: string
  name: string
  price: number
}

// Cache for prices (5 minute TTL)
let priceCache: Map<string, { price: number; timestamp: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Cache for coins list (24 hour TTL - this list doesn't change often)
let coinsListCache: { coins: Array<{ id: string; symbol: string; name: string }>; timestamp: number } | null = null
const COINS_LIST_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Fetch all available coins from CoinGecko
export async function getCoinsList(): Promise<Array<{ id: string; symbol: string; name: string }>> {
  // Check cache first
  if (coinsListCache && Date.now() - coinsListCache.timestamp < COINS_LIST_CACHE_TTL) {
    if (coinsListCache.coins.length > 0) {
      return coinsListCache.coins
    }
    // Cache exists but is empty - clear it and refetch
    console.warn("Cache exists but is empty, clearing and refetching")
    coinsListCache = null
  }

  try {
    console.log("Fetching coins list from CoinGecko...")
    const response = await fetch(`${COINGECKO_API}/coins/list`, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`CoinGecko API error: ${response.status} - ${errorText}`)
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const coins = await response.json()
    
    if (!Array.isArray(coins) || coins.length === 0) {
      console.error("Invalid coins list response:", coins)
      return []
    }
    
    console.log(`Successfully fetched ${coins.length} coins`)
    coinsListCache = { coins, timestamp: Date.now() }
    return coins
  } catch (error) {
    console.error("Error fetching coins list:", error)
    return []
  }
}

// Find coin by symbol (case-insensitive) - uses API market cap ranking only
async function findCoinBySymbol(symbol: string): Promise<{ id: string; name: string } | null> {
  const upperSymbol = symbol.toUpperCase()

  // Search in full coins list
  const coins = await getCoinsList()
  if (coins.length === 0) {
    console.error(`Coins list is empty, cannot find symbol: ${symbol}`)
    return null
  }
  
  console.log(`Searching for symbol ${symbol} in ${coins.length} coins`)

  // Find all matches - ensure symbol exists and matches
  const matches = coins.filter((c) => {
    if (!c || !c.symbol) return false
    return c.symbol.toUpperCase() === upperSymbol
  })
  
  if (matches.length === 0) {
    console.warn(`No matches found for symbol ${symbol} in ${coins.length} coins`)
    // Try to find similar symbols for debugging
    const similar = coins.filter((c) => c.symbol && c.symbol.toUpperCase().includes(upperSymbol)).slice(0, 3)
    if (similar.length > 0) {
      console.warn(`Similar symbols found:`, similar.map(c => `${c.symbol} (${c.name})`))
    }
    return null
  }
  
  console.log(`Found ${matches.length} matches for symbol ${symbol}`)

  // Use market cap ranking from API - trust the API's ranking
  let marketCapRankings: Map<string, number> | null = null
  try {
    const response = await fetch(`${COINGECKO_API}/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=250&page=1`)
    if (response.ok) {
      const markets = await response.json()
      if (Array.isArray(markets) && markets.length > 0) {
        marketCapRankings = new Map()
        markets.forEach((coin: { id: string; market_cap_rank: number | null }) => {
          if (coin.id && coin.market_cap_rank && coin.market_cap_rank > 0) {
            marketCapRankings!.set(coin.id, coin.market_cap_rank)
          }
        })
      }
    }
  } catch (error) {
    console.warn("Could not fetch market cap rankings:", error)
  }
  
  // Sort by market cap rank from API (lower rank = more popular)
  // Trust the API - no custom scoring, no fallbacks
  if (!marketCapRankings || marketCapRankings.size === 0) {
    // If no rankings available, cannot determine popularity - return null
    return null
  }
  
  const sortedMatches = matches.sort((a, b) => {
    const rankA = marketCapRankings!.get(a.id)
    const rankB = marketCapRankings!.get(b.id)
    
    // If either coin has no rank, put it at the end
    if (!rankA && !rankB) return 0
    if (!rankA) return 1
    if (!rankB) return -1
    
    // Lower rank = more popular
    return rankA - rankB
  })
  
  if (sortedMatches.length > 0) {
    return {
      id: sortedMatches[0].id,
      name: sortedMatches[0].name,
    }
  }
  
  return null
}

export async function getCryptoInfo(symbol: string): Promise<CryptoInfo | null> {
  const upperSymbol = symbol.toUpperCase()

  // Find coin by symbol (dynamic search only)
  const coin = await findCoinBySymbol(upperSymbol)
  if (!coin) {
    console.warn(`Unknown crypto symbol: ${symbol} - coin not found in list`)
    return null
  }

  const coinId = coin.id
  const name = coin.name
  
  if (!coinId) {
    console.error(`Invalid coin data for symbol ${symbol}:`, coin)
    return null
  }

  // Check cache first
  const cached = priceCache.get(upperSymbol)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      symbol: upperSymbol,
      name,
      price: cached.price,
    }
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

    return {
      symbol: upperSymbol,
      name,
      price,
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return null
  }
}

export async function getCryptoPrice(symbol: string): Promise<number | null> {
  const info = await getCryptoInfo(symbol)
  return info?.price ?? null
}

export async function getMultipleCryptoPrices(
  symbols: string[]
): Promise<Map<string, number>> {
  const prices = new Map<string, number>()

  // Find all coin IDs dynamically
  const coinIds = new Set<string>()
  const symbolToCoinId = new Map<string, string>()

  for (const symbol of symbols) {
    const upperSymbol = symbol.toUpperCase()
    const coin = await findCoinBySymbol(upperSymbol)
    if (coin) {
      coinIds.add(coin.id)
      symbolToCoinId.set(upperSymbol, coin.id)
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

// This function is no longer needed - we use search instead
export function getSymbolFromAssetName(name: string): string | null {
  return null
}

