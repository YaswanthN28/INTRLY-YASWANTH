"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, History, LogOut, Trophy, FileText, Menu, Sparkles, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/(auth)/actions"

interface SidebarProps {
  userEmail?: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/resume/create", label: "Create Resume", icon: <FileText className="w-4 h-4" /> },
    { href: "/resume/upload", label: "Upload Resume", icon: <FileText className="w-4 h-4" /> },
    { href: "/history", label: "History", icon: <History className="w-4 h-4" /> },
  ]

  return (
    <aside className="w-64 border-r flex flex-col bg-card shrink-0 shadow-sm hidden md:flex z-10 transition-all">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-border/50">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          INTRLY
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          Menu
        </div>
        {navLinks.map(link => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard' && link.href !== '/history')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {link.icon} {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer Profile & Actions */}
      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-3 px-2 py-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-foreground">{userEmail}</p>
            <p className="text-[10px] text-muted-foreground">Pro Member</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <form action={signOut} className="flex-1">
            <Button variant="outline" size="sm" type="submit" className="w-full gap-2 justify-center text-muted-foreground border-border/50 hover:bg-destructive hover:text-destructive-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </form>
          <Button 
            variant="outline" 
            size="icon"
            className="shrink-0 h-9 w-9 border-border/50"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </aside>
  )
}
