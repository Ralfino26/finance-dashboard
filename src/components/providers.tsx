"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AddVaultDialog } from "@/components/add-vault-dialog"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AddVaultDialog />
      {children}
    </SidebarProvider>
  )
}

