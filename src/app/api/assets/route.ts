import { NextRequest, NextResponse } from "next/server"
import { readAssets, writeAssets } from "@/lib/storage"
import { Asset } from "@/types/vault"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get("vaultId")

    const assets = await readAssets()
    const filtered = vaultId
      ? assets.filter((a) => a.vaultId === vaultId)
      : assets

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("Error reading assets:", error)
    return NextResponse.json(
      { error: "Failed to read assets" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vaultId, name, amount, valueInEur } = body

    if (!vaultId || !name || amount === undefined || valueInEur === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: vaultId, name, amount, valueInEur" },
        { status: 400 }
      )
    }

    const assets = await readAssets()
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      vaultId,
      name,
      amount: parseFloat(amount),
      valueInEur: parseFloat(valueInEur),
      updatedAt: new Date(),
    }

    assets.push(newAsset)
    await writeAssets(assets)

    return NextResponse.json(newAsset, { status: 201 })
  } catch (error) {
    console.error("Error creating asset:", error)
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    )
  }
}

