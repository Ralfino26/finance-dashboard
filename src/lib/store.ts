import { Vault, Asset, VaultType } from "@/types/vault";

// Simple in-memory store for MVP - replace with proper state management later
let vaults: Vault[] = [];
let assets: Asset[] = [];

export const vaultStore = {
  getAll: (): Vault[] => vaults,
  
  getById: (id: string): Vault | undefined => vaults.find(v => v.id === id),
  
  create: (vault: Omit<Vault, "id" | "createdAt">): Vault => {
    const newVault: Vault = {
      ...vault,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    vaults.push(newVault);
    return newVault;
  },
  
  update: (id: string, updates: Partial<Omit<Vault, "id" | "createdAt">>): Vault | null => {
    const index = vaults.findIndex(v => v.id === id);
    if (index === -1) return null;
    vaults[index] = { ...vaults[index], ...updates };
    return vaults[index];
  },
  
  delete: (id: string): boolean => {
    const index = vaults.findIndex(v => v.id === id);
    if (index === -1) return false;
    vaults.splice(index, 1);
    // Also delete all assets in this vault
    assets = assets.filter(a => a.vaultId !== id);
    return true;
  },
};

export const assetStore = {
  getByVaultId: (vaultId: string): Asset[] => 
    assets.filter(a => a.vaultId === vaultId),
  
  getById: (id: string): Asset | undefined => assets.find(a => a.id === id),
  
  create: (asset: Omit<Asset, "id" | "updatedAt">): Asset => {
    const newAsset: Asset = {
      ...asset,
      id: crypto.randomUUID(),
      updatedAt: new Date(),
    };
    assets.push(newAsset);
    return newAsset;
  },
  
  update: (id: string, updates: Partial<Omit<Asset, "id" | "updatedAt">>): Asset | null => {
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return null;
    assets[index] = { ...assets[index], ...updates, updatedAt: new Date() };
    return assets[index];
  },
  
  delete: (id: string): boolean => {
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return false;
    assets.splice(index, 1);
    return true;
  },
  
  getTotalValue: (): number => {
    return assets.reduce((sum, asset) => sum + asset.valueInEur, 0);
  },
  
  getTotalValueByVault: (vaultId: string): number => {
    return assets
      .filter(a => a.vaultId === vaultId)
      .reduce((sum, asset) => sum + asset.valueInEur, 0);
  },
};

