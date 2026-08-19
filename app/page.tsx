import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, CheckCircle, Video, BarChart3, Upload } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen pointer-events-none animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen pointer-events-none animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] mix-blend-screen pointer-events-none animate-blob" style={{ animationDelay: '4s' }} />

      {/* Navigation */}
      <header className="container mx-auto px-6 h-24 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            I
          </div>
          <span className="font-extrabold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            INTRLY
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 pt-10 pb-20">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-md border border-white/10 text-sm font-medium mb-10 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-foreground/80">Intelligent Mock Interviews</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight max-w-5xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 dark:from-white dark:to-white/50 mb-8 leading-[1.1]">
          Ace your next interview with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">AI precision.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
          Upload your resume, interact with a real-time AI avatar, and get actionable feedback. Professional preparation that feels like the real thing.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/30 hover:scale-105 transition-transform" asChild>
            <Link href="/signup">
              Start Practicing Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full bg-background/50 backdrop-blur border-border/50 hover:bg-secondary/50 transition-colors" asChild>
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10 bg-black/40 border-y border-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to succeed</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Our platform combines cutting-edge AI with proven interview techniques.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Bot className="w-8 h-8 text-primary" />}
              title="Interactive 3D Avatar"
              description="Engage in a lifelike conversation with our real-time 3D AI interviewer that responds to your voice and expressions."
            />
            <FeatureCard 
              icon={<Video className="w-8 h-8 text-blue-400" />}
              title="Real-Time Analysis"
              description="We analyze your speech, tone, and pacing on the fly to provide immediate, actionable feedback."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-purple-400" />}
              title="Comprehensive Reports"
              description="Receive detailed scoring across technical, behavioral, and communication metrics after every session."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Three simple steps to interview mastery.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start justify-center max-w-5xl mx-auto">
            <Step number="1" title="Upload Resume" icon={<Upload className="w-6 h-6" />} description="We parse your experience to tailor questions specifically to your background." />
            <div className="hidden md:block w-px h-24 bg-gradient-to-b from-primary/50 to-transparent mt-10 rotate-[-90deg]"></div>
            <Step number="2" title="Start Interview" icon={<Video className="w-6 h-6" />} description="Face our AI avatar in a realistic, pressure-tested video environment." />
            <div className="hidden md:block w-px h-24 bg-gradient-to-b from-primary/50 to-transparent mt-10 rotate-[-90deg]"></div>
            <Step number="3" title="Get Feedback" icon={<CheckCircle className="w-6 h-6" />} description="Review your detailed scorecard and identify areas for improvement." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-muted-foreground relative z-10 bg-black/50">
        <p>&copy; {new Date().getFullYear()} INTRLY. All rights reserved.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-secondary/30 border border-white/5 backdrop-blur-md hover:bg-secondary/50 transition-all hover:scale-[1.02] duration-300">
      <div className="w-16 h-16 rounded-2xl bg-black/50 flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function Step({ number, title, description, icon }: { number: string, title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center max-w-xs relative group">
      <div className="w-16 h-16 rounded-full bg-secondary/80 border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="absolute top-[-10px] right-20 w-6 h-6 rounded-full bg-primary text-xs font-bold flex items-center justify-center text-primary-foreground">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
