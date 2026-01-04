import { NextRequest, NextResponse } from "next/server"
import { readVaults, writeVaults, readAssets, writeAssets } from "@/lib/storage"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vaults = await readVaults()
    const vault = vaults.find((v) => v.id === id)

    if (!vault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 })
    }

    return NextResponse.json(vault)
  } catch (error) {
    console.error("Error reading vault:", error)
    return NextResponse.json(
      { error: "Failed to read vault" },
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
    const vaults = await readVaults()
    const index = vaults.findIndex((v) => v.id === id)

    if (index === -1) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 })
    }

    vaults[index] = { ...vaults[index], ...body }
    await writeVaults(vaults)

    return NextResponse.json(vaults[index])
  } catch (error) {
    console.error("Error updating vault:", error)
    return NextResponse.json(
      { error: "Failed to update vault" },
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
    const vaults = await readVaults()
    const index = vaults.findIndex((v) => v.id === id)

    if (index === -1) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 })
    }

    vaults.splice(index, 1)
    await writeVaults(vaults)

    // Also delete all assets in this vault
    const assets = await readAssets()
    const filteredAssets = assets.filter((a) => a.vaultId !== id)
    await writeAssets(filteredAssets)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting vault:", error)
    return NextResponse.json(
      { error: "Failed to delete vault" },
      { status: 500 }
    )
  }
}

