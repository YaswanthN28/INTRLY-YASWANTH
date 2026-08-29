import { PageHeader } from "@/components/dashboard/page-header"
import { RealInterviewRoom } from "./real-room"

export const metadata = {
  title: 'Real-Time Interview | INTRLY',
  description: 'Live simulation with code editor and screen sharing.',
}

export default function RealInterviewPage({ searchParams }: { searchParams: { role?: string } }) {
  const role = searchParams.role || "Software Engineer"
  
  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="shrink-0 mb-4">
        <PageHeader 
          eyebrow="Real-Time Simulation"
          title={`Interview: ${role}`}
          description="You are being evaluated out of 100. Score 80+ to unlock job matches."
        />
      </div>
      
      <div className="flex-1 min-h-0 bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
         <RealInterviewRoom role={role} />
      </div>
    </div>
  )
}
