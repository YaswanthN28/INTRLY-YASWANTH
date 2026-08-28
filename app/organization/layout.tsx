import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthorizationService } from "@/services/authorization-service"
import Link from "next/link"
import { Building2, Users, FileBarChart, LogOut, ShieldAlert } from "lucide-react"

export default async function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Determine organizational memberships
  const memberships = await AuthorizationService.getUserMemberships(user.id)
  
  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4 bg-muted/10 p-6">
        <ShieldAlert className="w-12 h-12 text-destructive opacity-80" />
        <h1 className="text-2xl font-bold tracking-tight">Unauthorized Workspace</h1>
        <p className="text-muted-foreground max-w-md">
          You do not have access to an Organization Workspace. This area is restricted to authorized employer accounts.
        </p>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline mt-4">
          Return to Candidate Dashboard
        </Link>
      </div>
    )
  }

  // MVP: Pick the first authorized organization if multiple exist
  const activeOrgId = memberships[0].organizationId;
  const activeRole = memberships[0].role;

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6">
            <Link href="/organization/dashboard" className="flex items-center gap-2 font-bold tracking-tighter text-xl">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              INTRLY <span className="text-muted-foreground font-medium text-sm ml-1">Workspace</span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-6 text-sm font-medium">
              <Link href="/organization/dashboard" className="px-4 py-2 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2">
                <FileBarChart className="w-4 h-4" /> Pipeline
              </Link>
              {(activeRole === 'owner' || activeRole === 'admin') && (
                <>
                  <Link href="/organization/applications" className="px-4 py-2 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Applications
                  </Link>
                  <Link href="/organization/members" className="px-4 py-2 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
              {activeRole}
            </div>
            <Link href="/dashboard" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Exit Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {/* We can pass activeOrgId via a React Context in a future iteration, 
            but for Server Components MVP we will re-verify inside the page. */}
        {children}
      </main>
    </div>
  )
}
