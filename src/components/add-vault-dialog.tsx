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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await vaultStore.create({
        name: name.trim(),
        type,
        color,
      })

      setName("")
      setType("crypto")
      setColor(DEFAULT_COLORS.crypto)
      setOpen(false)
      // Dispatch event to update sidebar and other components
      window.dispatchEvent(new CustomEvent("vault-updated"))
    } catch (error) {
      console.error("Failed to create vault:", error)
      alert("Failed to create vault. Please try again.")
    }
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
              <Select value={type} onValueChange={(value) => setType(value as VaultType)}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Select vault type" />
                </SelectTrigger>
                <SelectContent>
                  {VAULT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

