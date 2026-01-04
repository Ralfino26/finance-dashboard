"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { vaultStore } from "@/lib/store"
import { VaultType } from "@/types/vault"

const VAULT_TYPES: { value: VaultType; label: string }[] = [
  { value: "crypto", label: "Crypto" },
  { value: "investment", label: "Investment" },
  { value: "cash", label: "Cash" },
]

const DEFAULT_COLORS = {
  crypto: "#22c55e",
  investment: "#3b82f6",
  cash: "#f59e0b",
}

export function AddVaultDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<VaultType>("crypto")
  const [color, setColor] = useState(DEFAULT_COLORS.crypto)

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("open-vault-dialog", handleOpen)
    return () => window.removeEventListener("open-vault-dialog", handleOpen)
  }, [])

  useEffect(() => {
    setColor(DEFAULT_COLORS[type])
  }, [type])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    vaultStore.create({
      name: name.trim(),
      type,
      color,
    })

    setName("")
    setType("crypto")
    setColor(DEFAULT_COLORS.crypto)
    setOpen(false)
    window.location.reload() // Simple refresh for MVP
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Vault</DialogTitle>
          <DialogDescription>
            Create a new vault to organize your assets.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Investeringen via Revolut"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as VaultType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {VAULT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 rounded-md border border-input cursor-pointer"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Vault</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

