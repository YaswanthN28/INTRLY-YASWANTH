"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  History, 
  LogOut, 
  Trophy, 
  PenTool, 
  FileUp, 
  Brain, 
  ClipboardCheck, 
  Target, 
  Briefcase,
  Sparkles, 
  Moon, 
  Sun,
  Lock
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/(auth)/actions"

interface SidebarProps {
  userEmail?: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const navGroups = [
    {
      title: "Overview",
      items: [
        { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
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
        { href: "/readiness", label: "Role Readiness", icon: <Target className="w-4 h-4" />, disabled: false },
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
    <aside className="w-72 border-r flex flex-col bg-card shrink-0 shadow-sm hidden md:flex z-10 transition-all duration-300">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-border/50 shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          INTRLY
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-3">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map(link => {
                const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard' && link.href !== '/history' && link.href !== '#')
                
                if (link.disabled) {
                  return (
                    <div
                      key={link.label}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground/60 cursor-not-allowed select-none"
                      title="Coming Soon"
                    >
                      <div className="flex items-center gap-3">
                        {link.icon} {link.label}
                      </div>
                      <Lock className="w-3 h-3 text-muted-foreground/40" />
                    </div>
                  )
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive 
                        ? "bg-primary/10 text-primary font-semibold shadow-sm border border-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    {link.icon} {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile & Actions */}
      <div className="p-4 border-t border-border/50 bg-muted/20 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{userEmail || "Candidate"}</p>
            <p className="text-xs text-muted-foreground">INTRLY Profile</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <form action={signOut} className="flex-1">
            <Button variant="outline" size="sm" type="submit" className="w-full gap-2 justify-center text-muted-foreground border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </form>
          <Button 
            variant="outline" 
            size="icon"
            className="shrink-0 h-9 w-9 border-border transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
