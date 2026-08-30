import { PageHeader } from "@/components/dashboard/page-header"
import { RealInterviewRoom } from "./real-room"

export const metadata = {
  title: 'Real-Time Interview | INTRLY',
  description: 'Live simulation with code editor and screen sharing.',
}

export default async function RealInterviewPage(props: { searchParams: Promise<{ role?: string }> | { role?: string } }) {
  const searchParams = await props.searchParams
  const role = searchParams?.role || "Software Engineer"
  
  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-6.5rem)] flex flex-col min-h-0 animate-in fade-in duration-500">
      <div className="shrink-0 mb-3">
        <PageHeader 
          eyebrow="Real-Time Simulation"
          title={`Interview: ${role}`}
          description="You are being evaluated out of 100. Screen will be locked in full screen during your session."
        />
      </div>
      
      <div className="flex-1 min-h-0 bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
         <RealInterviewRoom role={role} />
      </div>
    </div>
  )
}
