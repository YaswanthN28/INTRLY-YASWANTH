import { PageHeader } from "@/components/dashboard/page-header"
import { NewVideoRoom } from "./video-room"

export const metadata = {
  title: 'AI Video Interview | INTRLY',
  description: 'Live bidirectional AI video interview.',
}

export default function AIInterviewPage({ searchParams }: { searchParams: { role?: string, mode?: string } }) {
  const role = searchParams.role || "Software Engineer"
  const isCoding = searchParams.mode === 'coding'
  
  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="shrink-0 mb-4">
        <PageHeader 
          eyebrow="New Experience"
          title={`Live AI Interview: ${role}`}
          description="Interactive bidirectional AI interview with Aarav."
        />
      </div>
      
      <div className="flex-1 min-h-0 bg-black border border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
         <NewVideoRoom role={role} isCoding={isCoding} />
      </div>
    </div>
  )
}
