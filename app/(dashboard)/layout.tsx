import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, History, LogOut, Trophy } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/history", label: "History", icon: <History className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r flex flex-col bg-card shrink-0">
        <div className="h-16 border-b flex items-center px-5 gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center font-bold text-primary-foreground text-sm">
            I
          </div>
          <span className="font-bold text-xl tracking-tight">INTRLY</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
            </div>
          </div>
          <form action={signOut} className="w-full">
            <Button variant="outline" size="sm" type="submit" className="w-full gap-2 justify-start text-muted-foreground">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center px-6 bg-card">
          <h2 className="font-semibold text-sm text-muted-foreground">Interview Platform</h2>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
