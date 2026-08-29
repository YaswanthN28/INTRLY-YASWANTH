import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { MobileNav } from "@/components/dashboard/mobile-nav"

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

  return (
    <div className="h-screen flex bg-background selection:bg-primary/20 overflow-hidden">
      <Sidebar userEmail={user.email} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10 relative h-full">
        <Header />
        <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 overflow-y-auto w-full relative">
          <div className="max-w-[1600px] mx-auto w-full h-full relative">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
