import { NextRequest, NextResponse } from "next/server"

const COINGECKO_API = "https://api.coingecko.com/api/v3"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const limit = parseInt(searchParams.get("limit") || "20")

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  try {
    // Use CoinGecko's native search API
    const response = await fetch(`${COINGECKO_API}/search?query=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error(`CoinGecko search API error: ${response.status}`)
    }

    const data = await response.json()
    const coins = data.coins || []
    
    if (coins.length === 0) {
      return NextResponse.json([])
    }

    // CoinGecko search API already returns results sorted by relevance
    // Trust the API's ranking - just format the response
    const results = coins
      .slice(0, limit)
      .map((coin: { 
        id: string
        name: string
        symbol: string
        api_symbol?: string
      }) => ({
        id: coin.id,
        symbol: (coin.symbol || coin.api_symbol || '').toUpperCase(),
        name: coin.name,
      }))

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error searching coins:", error)
    return NextResponse.json(
      { error: "Failed to search coins" },
      { status: 500 }
    )
  }
}

