import { promises as fs } from "fs"
import path from "path"
import { Vault, Asset } from "@/types/vault"

// Get data directory from environment variable, default to ./data
const getDataDir = (): string => {
  return process.env.DATA_DIR || path.join(process.cwd(), "data")
}

const getVaultsPath = (): string => {
  return path.join(getDataDir(), "vaults.json")
}

const getAssetsPath = (): string => {
  return path.join(getDataDir(), "assets.json")
}

// Ensure data directory exists
export const ensureDataDir = async (): Promise<void> => {
  const dataDir = getDataDir()
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read vaults from file
export const readVaults = async (): Promise<Vault[]> => {
  await ensureDataDir()
  const filePath = getVaultsPath()
  try {
    const data = await fs.readFile(filePath, "utf-8")
    const vaults = JSON.parse(data)
    // Convert date strings back to Date objects
    return vaults.map((v: any) => ({
      ...v,
      createdAt: new Date(v.createdAt),
    }))
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // File doesn't exist, return empty array
      return []
    }
    throw error
  }
}

// Write vaults to file
export const writeVaults = async (vaults: Vault[]): Promise<void> => {
  await ensureDataDir()
  const filePath = getVaultsPath()
  await fs.writeFile(filePath, JSON.stringify(vaults, null, 2), "utf-8")
}

// Read assets from file
export const readAssets = async (): Promise<Asset[]> => {
  await ensureDataDir()
  const filePath = getAssetsPath()
  try {
    const data = await fs.readFile(filePath, "utf-8")
    const assets = JSON.parse(data)
    // Convert date strings back to Date objects
    return assets.map((a: any) => ({
      ...a,
      updatedAt: new Date(a.updatedAt),
    }))
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // File doesn't exist, return empty array
      return []
    }
    throw error
  }
}

// Write assets to file
export const writeAssets = async (assets: Asset[]): Promise<void> => {
  await ensureDataDir()
  const filePath = getAssetsPath()
  await fs.writeFile(filePath, JSON.stringify(assets, null, 2), "utf-8")
}

