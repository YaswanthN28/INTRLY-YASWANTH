import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, CheckCircle, Video, BarChart3, Upload } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-white">
      
      {/* Navigation - Luxury style: Minimalist, spaced out, delicate */}
      <header className="h-24 flex items-center justify-between px-6 md:px-16 bg-background/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-foreground/5">
        <div className="flex items-center gap-3">
          <span className="font-serif text-2xl tracking-widest text-primary">
            INTRLY.
          </span>
        </div>
        <nav className="flex items-center gap-10">
          <Link href="/login" className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors">
            Sign In
          </Link>
          <Button asChild className="rounded-full bg-primary/90 text-white hover:bg-primary px-8 h-10 text-xs font-medium uppercase tracking-widest border border-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all duration-500 font-sans">
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section - Elegant, centered or beautifully balanced, large serif type */}
      <main className="pt-32 pb-24 md:pt-48 md:pb-32 px-6 md:px-16 max-w-7xl mx-auto flex flex-col items-center text-center relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-primary mb-8 block">
          Elevate Your Career
        </span>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight text-foreground mb-8 leading-[1.1] max-w-5xl">
          Master the art of the <br className="hidden md:block"/>
          <span className="italic text-primary">interview.</span>
        </h1>
        
        <p className="text-lg md:text-xl font-light text-foreground/70 max-w-2xl leading-relaxed mb-12">
          Experience a new standard of preparation. Engage with our sophisticated AI avatar to refine your presence, articulate your value, and command the room.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <Button size="lg" className="rounded-full h-14 w-full sm:w-auto px-10 text-sm font-medium uppercase tracking-[0.15em] bg-foreground text-background hover:bg-primary transition-all duration-500 shadow-xl shadow-foreground/10" asChild>
            <Link href="/signup">
              Begin Journey
            </Link>
          </Button>
          <Link href="#how-it-works" className="text-sm font-medium uppercase tracking-[0.15em] text-foreground/60 hover:text-primary transition-colors flex items-center gap-2 group border-b border-transparent hover:border-primary pb-1">
            Discover How <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* Features Section - Editorial layout, thin lines */}
      <section id="features" className="py-24 md:py-32 border-t border-foreground/10 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground max-w-lg">
              Sophisticated tools for the modern professional.
            </h2>
            <p className="text-foreground/60 font-light max-w-sm text-lg leading-relaxed">
              Our bespoke AI platform offers an unparalleled environment to perfect your interviewing technique.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
            <FeatureCard 
              number="I"
              title="Intelligent Avatar"
              description="A deeply realistic conversational partner that adapts dynamically to your unique narrative and tone."
            />
            <FeatureCard 
              number="II"
              title="Real-Time Insights"
              description="Subtle, instantaneous analysis of your cadence, sentiment, and structural delivery."
            />
            <FeatureCard 
              number="III"
              title="Refined Analytics"
              description="A comprehensive dossier detailing your performance, tailored to elevate your specific strengths."
            />
          </div>
        </div>
      </section>

      {/* How it Works - Minimalist steps */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="text-center mb-24">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-primary mb-6 block">The Process</span>
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight">Three steps to mastery.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-foreground/10"></div>
            
            <Step number="01" title="Curate" description="Upload your professional history. Our system crafts a bespoke interview tailored exclusively to your background." />
            <Step number="02" title="Engage" description="Enter a distraction-free, high-fidelity environment to converse naturally with our AI." />
            <Step number="03" title="Refine" description="Review a meticulously detailed breakdown of your session to perfect your future performance." />
          </div>
        </div>
      </section>

      {/* Footer - Elegant, spacious */}
      <footer className="bg-foreground text-background py-20 border-t border-foreground/10">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-4 lg:col-span-5">
              <span className="font-serif text-3xl tracking-widest mb-6 block text-primary-foreground">
                INTRLY.
              </span>
              <p className="text-background/60 font-light max-w-sm leading-relaxed mb-8">
                The premier destination for elite interview preparation. Refine your narrative, secure your future.
              </p>
              <div className="flex gap-6 text-xs uppercase tracking-[0.2em] text-background/50">
                <a href="#" className="hover:text-primary-foreground transition-colors">Twitter</a>
                <a href="#" className="hover:text-primary-foreground transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-primary-foreground transition-colors">Instagram</a>
              </div>
            </div>
            
            <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
              <div>
                <h4 className="font-medium uppercase tracking-[0.15em] text-xs mb-8 text-background/40">Platform</h4>
                <ul className="space-y-4 font-light text-sm text-background/80">
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Experience</a></li>
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Membership</a></li>
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Enterprise</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium uppercase tracking-[0.15em] text-xs mb-8 text-background/40">Journal</h4>
                <ul className="space-y-4 font-light text-sm text-background/80">
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Articles</a></li>
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Insights</a></li>
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Success Stories</a></li>
                </ul>
              </div>
              
              <div className="col-span-2 sm:col-span-1">
                <h4 className="font-medium uppercase tracking-[0.15em] text-xs mb-8 text-background/40">House</h4>
                <ul className="space-y-4 font-light text-sm text-background/80">
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Our Story</a></li>
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-primary-foreground transition-colors">Legal</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-background/10 flex flex-col sm:flex-row justify-between items-center text-xs font-light text-background/40 tracking-wider uppercase">
            <p>&copy; {new Date().getFullYear()} INTRLY. All rights reserved.</p>
            <p className="mt-4 sm:mt-0">Elegance in Preparation</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex flex-col group">
      <div className="text-primary/40 font-serif text-5xl mb-6 font-light italic transition-colors group-hover:text-primary">{number}</div>
      <div className="h-px w-12 bg-foreground/20 mb-6 transition-all group-hover:w-full group-hover:bg-primary/50 duration-500"></div>
      <h3 className="text-xl font-serif tracking-wide mb-4">{title}</h3>
      <p className="font-light text-foreground/70 leading-relaxed text-sm">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center relative z-10 group">
      <div className="w-24 h-24 rounded-full bg-background border border-foreground/10 flex items-center justify-center mb-8 shadow-2xl shadow-foreground/5 transition-transform duration-700 group-hover:-translate-y-2">
         <span className="font-serif text-2xl text-primary font-light">{number}</span>
      </div>
      <h3 className="text-lg font-serif tracking-wide mb-4">{title}</h3>
      <p className="font-light text-foreground/60 leading-relaxed text-sm max-w-xs">{description}</p>
    </div>
  )
}
