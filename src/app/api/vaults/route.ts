import { NextRequest, NextResponse } from "next/server"
import { readVaults, writeVaults } from "@/lib/storage"
import { Vault } from "@/types/vault"

export async function GET() {
  try {
    const vaults = await readVaults()
    return NextResponse.json(vaults)
  } catch (error) {
    console.error("Error reading vaults:", error)
    return NextResponse.json(
      { error: "Failed to read vaults" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, color } = body

    if (!name || !type || !color) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, color" },
        { status: 400 }
      )
    }

    const vaults = await readVaults()
    const newVault: Vault = {
      id: crypto.randomUUID(),
      name,
      type,
      color,
      createdAt: new Date(),
    }

    vaults.push(newVault)
    await writeVaults(vaults)

    return NextResponse.json(newVault, { status: 201 })
  } catch (error) {
    console.error("Error creating vault:", error)
    return NextResponse.json(
      { error: "Failed to create vault" },
      { status: 500 }
    )
  }
}

