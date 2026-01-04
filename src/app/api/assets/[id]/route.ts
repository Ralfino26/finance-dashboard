import { NextRequest, NextResponse } from "next/server"
import { readAssets, writeAssets } from "@/lib/storage"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const assets = await readAssets()
    const asset = assets.find((a) => a.id === id)

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error("Error reading asset:", error)
    return NextResponse.json(
      { error: "Failed to read asset" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const assets = await readAssets()
    const index = assets.findIndex((a) => a.id === id)

    if (index === -1) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    assets[index] = {
      ...assets[index],
      ...body,
      updatedAt: new Date(),
    }

    // Convert numeric fields if provided
    if (body.amount !== undefined) {
      assets[index].amount = parseFloat(body.amount)
    }
    if (body.valueInEur !== undefined) {
      assets[index].valueInEur = parseFloat(body.valueInEur)
    }

    await writeAssets(assets)

    return NextResponse.json(assets[index])
  } catch (error) {
    console.error("Error updating asset:", error)
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const assets = await readAssets()
    const index = assets.findIndex((a) => a.id === id)

    if (index === -1) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    assets.splice(index, 1)
    await writeAssets(assets)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting asset:", error)
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    )
  }
}

