import { Vault, Asset, VaultType } from "@/types/vault"

// Client-side store that uses API routes
export const vaultStore = {
  getAll: async (): Promise<Vault[]> => {
    const response = await fetch("/api/vaults")
    if (!response.ok) {
      throw new Error("Failed to fetch vaults")
    }
    return response.json()
  },

  getById: async (id: string): Promise<Vault | undefined> => {
    const response = await fetch(`/api/vaults/${id}`)
    if (response.status === 404) {
      return undefined
    }
    if (!response.ok) {
      throw new Error("Failed to fetch vault")
    }
    return response.json()
  },

  create: async (
    vault: Omit<Vault, "id" | "createdAt">
  ): Promise<Vault> => {
    const response = await fetch("/api/vaults", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vault),
    })
    if (!response.ok) {
      throw new Error("Failed to create vault")
    }
    return response.json()
  },

  update: async (
    id: string,
    updates: Partial<Omit<Vault, "id" | "createdAt">>
  ): Promise<Vault | null> => {
    const response = await fetch(`/api/vaults/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error("Failed to update vault")
    }
    return response.json()
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/vaults/${id}`, {
      method: "DELETE",
    })
    if (response.status === 404) {
      return false
    }
    if (!response.ok) {
      throw new Error("Failed to delete vault")
    }
    return true
  },
}

export const assetStore = {
  getByVaultId: async (vaultId: string): Promise<Asset[]> => {
    const response = await fetch(`/api/assets?vaultId=${vaultId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch assets")
    }
    return response.json()
  },

  getAll: async (): Promise<Asset[]> => {
    const response = await fetch("/api/assets")
    if (!response.ok) {
      throw new Error("Failed to fetch assets")
    }
    return response.json()
  },

  getById: async (id: string): Promise<Asset | undefined> => {
    const response = await fetch(`/api/assets/${id}`)
    if (response.status === 404) {
      return undefined
    }
    if (!response.ok) {
      throw new Error("Failed to fetch asset")
    }
    return response.json()
  },

  create: async (asset: Omit<Asset, "id" | "updatedAt">): Promise<Asset> => {
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(asset),
    })
    if (!response.ok) {
      throw new Error("Failed to create asset")
    }
    return response.json()
  },

  update: async (
    id: string,
    updates: Partial<Omit<Asset, "id" | "updatedAt">>
  ): Promise<Asset | null> => {
    const response = await fetch(`/api/assets/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error("Failed to update asset")
    }
    return response.json()
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/assets/${id}`, {
      method: "DELETE",
    })
    if (response.status === 404) {
      return false
    }
    if (!response.ok) {
      throw new Error("Failed to delete asset")
    }
    return true
  },

  getTotalValue: async (): Promise<number> => {
    const assets = await assetStore.getAll()
    return assets.reduce((sum, asset) => sum + asset.valueInEur, 0)
  },

  getTotalValueByVault: async (vaultId: string): Promise<number> => {
    const assets = await assetStore.getByVaultId(vaultId)
    return assets.reduce((sum, asset) => sum + asset.valueInEur, 0)
  },
}
