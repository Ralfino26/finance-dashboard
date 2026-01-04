import { NextRequest, NextResponse } from "next/server"
import { getCryptoPrice, getMultipleCryptoPrices } from "@/lib/crypto-prices"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  const symbols = searchParams.get("symbols")

  try {
    if (symbols) {
      // Multiple symbols
      const symbolList = symbols.split(",").map((s) => s.trim())
      const prices = await getMultipleCryptoPrices(symbolList)
      const result = Object.fromEntries(prices)
      return NextResponse.json(result)
    } else if (symbol) {
      // Single symbol
      const price = await getCryptoPrice(symbol)
      if (price === null) {
        return NextResponse.json(
          { error: "Price not found for symbol" },
          { status: 404 }
        )
      }
      return NextResponse.json({ symbol, price })
    } else {
      return NextResponse.json(
        { error: "Missing symbol or symbols parameter" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error fetching crypto price:", error)
    return NextResponse.json(
      { error: "Failed to fetch crypto price" },
      { status: 500 }
    )
  }
}

