import { PageHeader } from "@/components/dashboard/page-header"
import { MockInterviewRoom } from "./mock-room"

export const metadata = {
  title: 'Mock Interview | INTRLY',
  description: 'Practice with our conversational AI.',
}

export default function MockInterviewPage({ searchParams }: { searchParams: { role?: string } }) {
  const role = searchParams.role || "Software Engineer"
  
  return (
    <div className="max-w-[1200px] mx-auto h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="shrink-0 mb-6">
        <PageHeader 
          eyebrow="Interview"
          title="Mock Interview" 
          description={`Practicing for: ${role}. You can end the interview at any time to get feedback.`}
        />
      </div>
      
      <div className="flex-1 min-h-0 bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
         <MockInterviewRoom role={role} />
      </div>
    </div>
  )
}
