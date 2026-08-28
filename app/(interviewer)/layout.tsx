import { ReactNode } from "react"
import { Building2 } from "lucide-react"

export default function InterviewerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight text-lg text-foreground">INTRLY</span>
          <div className="h-4 w-px bg-border mx-2" />
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Interviewer Portal</span>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  )
}
