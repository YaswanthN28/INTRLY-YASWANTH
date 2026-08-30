"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  History, 
  PenTool,
  Brain,
  ClipboardCheck,
  Briefcase,
  Menu,
  X,
  Lock,
  FileUp,
  Target
} from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Primary bottom bar links
  const primaryLinks = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/resume/create", label: "Create", icon: <PenTool className="w-5 h-5" /> },
    { href: "/history", label: "Practice", icon: <History className="w-5 h-5" /> },
  ]

  // All structural groups for the expanding menu
  const menuGroups = [
    {
      title: "Create",
      items: [
        { href: "/resume/create", label: "Resume Builder", icon: <PenTool className="w-4 h-4" /> },
        { href: "/resume/upload", label: "Upload Resume", icon: <FileUp className="w-4 h-4" /> },
      ]
    },
    {
      title: "Understand",
      items: [
        { href: "/resume/intelligence", label: "Resume Intelligence", icon: <Brain className="w-4 h-4" /> }
      ]
    },
    {
      title: "Practice",
      items: [
        { href: "/history", label: "Practice History", icon: <History className="w-4 h-4" /> }
      ]
    },
    {
      title: "Prove",
      items: [
        { href: "#", label: "Real Interview", icon: <ClipboardCheck className="w-4 h-4" />, disabled: true },
        { href: "/readiness", label: "Role Readiness", icon: <Target className="w-4 h-4" />, disabled: false }
      ]
    },
    {
      title: "Discover",
      items: [
        { href: "#", label: "Opportunities", icon: <Briefcase className="w-4 h-4" />, disabled: true }
      ]
    }
  ]

  return (
    <>
      {/* Expanding Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm animate-in fade-in duration-300 pb-24 overflow-y-auto">
          <div className="p-6 pt-12 space-y-8">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                INTRLY
              </span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {menuGroups.map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map(link => {
                      const isActive = pathname === link.href && link.href !== '#'
                      
                      if ((link as any).disabled) {
                        return (
                          <div
                            key={link.label}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 text-muted-foreground/50 font-medium"
                          >
                            {link.icon} {link.label}
                            <span className="ml-auto text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full">Soon</span>
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                            isActive 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "bg-muted/30 text-foreground hover:bg-muted"
                          }`}
                        >
                          {link.icon} {link.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border flex justify-around items-center px-2 py-3 pb-[env(safe-area-inset-bottom,12px)] shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]">
        {primaryLinks.map(link => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard' && link.href !== '/history')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-all duration-300 ${
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground hover:scale-105"
              }`}
            >
              {link.icon}
              <span className="text-[10px] font-medium mt-0.5">{link.label}</span>
            </Link>
          )
        })}
        
        {/* Trigger for expanded menu */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center gap-1 min-w-[64px] transition-all duration-300 ${
            isMenuOpen ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground hover:scale-105"
          }`}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="text-[10px] font-medium mt-0.5">Menu</span>
        </button>
      </div>
    </>
  )
}
