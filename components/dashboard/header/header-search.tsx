"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function HeaderSearch() {
  return (
    <div className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar..."
        className="w-64 border-transparent bg-muted/50 pl-9 focus:border-border focus:bg-background"
      />
    </div>
  )
}