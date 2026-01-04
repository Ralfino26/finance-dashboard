export type VaultType = "crypto" | "investment" | "cash";

export interface Vault {
  id: string;
  name: string;
  type: VaultType;
  color: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  vaultId: string;
  name: string;
  amount: number;
  valueInEur: number;
  updatedAt: Date;
}

export interface CryptoAsset extends Asset {
  symbol: string;
}

export interface InvestmentAsset extends Asset {
  symbol: string;
}

export interface CashAsset extends Asset {
  currency: string;
}

