"use client"

import { useState, useEffect } from "react"
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
  Lock,
  PanelLeftClose,
  PanelLeft
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navGroups = [
    {
      title: "Resume Setup",
      items: [
        { href: "/resume/create", label: "Resume Builder", icon: <PenTool className="w-4 h-4 shrink-0" /> },
        { href: "/resume/upload", label: "Upload Resume", icon: <FileUp className="w-4 h-4 shrink-0" /> },
      ]
    },
    {
      title: "Intelligence",
      items: [
        { href: "/resume/intelligence", label: "Analysis", icon: <Brain className="w-4 h-4 shrink-0" /> }
      ]
    },
    {
      title: "Interviews",
      items: [
        { href: "/interview/setup", label: "Start Interview", icon: <Target className="w-4 h-4 shrink-0" /> },
        { href: "/history", label: "Past Interviews", icon: <History className="w-4 h-4 shrink-0" /> }
      ]
    },
    {
      title: "Results & Jobs",
      items: [
        { href: "/interview/results", label: "Job Matches", icon: <Briefcase className="w-4 h-4 shrink-0" /> },
      ]
    }
  ]

  return (
    <aside className={`border-r flex flex-col bg-card shrink-0 shadow-sm hidden md:flex z-10 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Brand */}
      <div className={`h-16 flex items-center px-4 border-b border-border/50 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 truncate">
              INTRLY
            </span>
          </div>
        )}
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group, idx) => (
          <div key={idx} className="contents">
            {isCollapsed && <div className="h-4"></div>}
            {group.items.map(link => {
                const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard' && link.href !== '/history' && link.href !== '#')
                
                if ((link as any).disabled) {
                  return (
                    <div
                      key={link.label}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground/60 cursor-not-allowed select-none`}
                      title="Coming Soon"
                    >
                      <div className="flex items-center gap-3">
                        {link.icon} {!isCollapsed && <span className="truncate">{link.label}</span>}
                      </div>
                      {!isCollapsed && <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                    </div>
                  )
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={isCollapsed ? link.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring ${isCollapsed ? 'justify-center' : ''} ${
                      isActive 
                        ? "bg-primary/10 text-primary font-semibold shadow-sm border border-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    {link.icon} {!isCollapsed && <span className="truncate">{link.label}</span>}
                  </Link>
                )
              })}
          </div>
        ))}
      </nav>

      {/* Footer Profile & Actions */}
      <div className={`p-4 border-t border-border/50 bg-muted/20 shrink-0 ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{userEmail || "Candidate"}</p>
              <p className="text-xs text-muted-foreground truncate">INTRLY Profile</p>
            </div>
          </div>
        )}
        
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
          <form action={signOut} className={isCollapsed ? "" : "flex-1"}>
            <Button variant="outline" size="icon" type="submit" className={`text-muted-foreground border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-full gap-2 justify-center'}`} title="Sign Out">
              <LogOut className="w-4 h-4" /> {!isCollapsed && "Sign Out"}
            </Button>
          </form>
          <Button 
            variant="outline" 
            size="icon"
            className="shrink-0 h-10 w-10 border-border transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            suppressHydrationWarning
          >
            {mounted && theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
