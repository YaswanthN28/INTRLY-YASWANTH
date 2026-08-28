"use client"

import { usePathname } from "next/navigation"
import { Bell, Search, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  const pathname = usePathname()
  
  // Custom mapping for meaningful hierarchy (rather than flat routes)
  const getBreadcrumbs = () => {
    if (pathname === '/dashboard') return [{ label: "Overview" }]
    if (pathname.includes('/resume/create')) return [{ label: "Create", href: "#" }, { label: "Resume Builder" }]
    if (pathname.includes('/resume/upload')) return [{ label: "Create", href: "#" }, { label: "Upload Resume" }]
    if (pathname.includes('/history')) return [{ label: "Practice", href: "#" }, { label: "History" }]
    if (pathname.includes('/report')) return [{ label: "Practice", href: "/history" }, { label: "Interview Report" }]
    
    // Fallback
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return [{ label: "Overview" }]
    return segments.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1) }))
  }

  const breadcrumbs = getBreadcrumbs()
  
  return (
    <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 sticky top-0 transition-all duration-300">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        {breadcrumbs.map((crumb, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground/50" />}
            {crumb.href && idx < breadcrumbs.length - 1 && crumb.href !== "#" ? (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className={idx === breadcrumbs.length - 1 ? "text-foreground font-semibold" : ""}>
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
          <input 
            type="text" 
            placeholder="Search roles, skills..." 
            className="h-10 w-64 rounded-full border border-border bg-muted/30 pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-300 placeholder:text-muted-foreground/70"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted transition-all duration-300">
          <Bell className="w-5 h-5 text-foreground/80" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}
