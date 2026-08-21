"use client"

import { usePathname } from "next/navigation"
import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const pathname = usePathname()
  
  // Create breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean)
  
  return (
    <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu button (placeholder for actual implementation) */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground capitalize">
            {segments[0] || 'Dashboard'}
          </span>
          {segments.length > 1 && (
            <>
              <span>/</span>
              <span className="capitalize">{segments[1]}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-9 w-64 rounded-full border border-border/50 bg-muted/30 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
        </Button>
      </div>
    </header>
  )
}
