"use client"

import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarMobileToggleProps {
  open: boolean
  onToggle: () => void
  onClose: () => void
}

export function SidebarMobileToggle({
  open,
  onToggle,
  onClose,
}: SidebarMobileToggleProps) {
  return (
    <>
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="bg-card shadow-sm"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}
    </>
  )
}