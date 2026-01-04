"use client"

import { useState, useEffect } from "react"
import { Home, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { vaultStore } from "@/lib/store"
import { Vault } from "@/types/vault"

export function AppSidebar() {
  const pathname = usePathname()
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVaults = async () => {
      try {
        const data = await vaultStore.getAll()
        setVaults(data)
      } catch (error) {
        console.error("Failed to load vaults:", error)
      } finally {
        setLoading(false)
      }
    }
    loadVaults()

    // Reload vaults when a custom event is dispatched (after creating a vault)
    const handleVaultUpdate = () => {
      loadVaults()
    }
    window.addEventListener("vault-updated", handleVaultUpdate)
    return () => window.removeEventListener("vault-updated", handleVaultUpdate)
  }, [])

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Vaults</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                // This will be handled by a dialog component
                window.dispatchEvent(new CustomEvent("open-vault-dialog"))
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Loading...
                  </div>
                </SidebarMenuItem>
              ) : (
                <>
                  {vaults.map((vault) => (
                    <VaultMenuItem key={vault.id} vault={vault} pathname={pathname} />
                  ))}
                  {vaults.length === 0 && (
                    <SidebarMenuItem>
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No vaults yet. Click + to add one.
                      </div>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function VaultMenuItem({ vault, pathname }: { vault: Vault; pathname: string }) {
  const isActive = pathname === `/vault/${vault.id}`
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/vault/${vault.id}`}>
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: vault.color }}
          />
          <span>{vault.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

