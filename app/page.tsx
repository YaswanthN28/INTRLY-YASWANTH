import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Navigation */}
      <header className="container mx-auto px-4 h-20 flex items-center justify-between relative z-10 border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center font-bold text-primary-foreground">
            I
          </div>
          <span className="font-bold text-xl tracking-tight">INTRLY</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 -mt-20 pt-20">
        
        {/* Background blobs for premium feel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border/50 text-sm font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          Simulate real interviews instantly
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 mb-6">
          Master your next interview with AI.
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
          Upload your resume, get a personalized AI interviewer, and practice real-world scenarios. No fluff, just realistic preparation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20" asChild>
            <Link href="/signup">Start Practicing Now</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur" asChild>
            <Link href="#features">See how it works</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
