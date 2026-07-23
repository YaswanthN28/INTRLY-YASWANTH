import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InterviewClient } from "@/components/interview/interview-client"

export default async function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch the interview session
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !interview) {
    redirect("/dashboard")
  }

  // If questions are missing, something went wrong
  if (!interview.questions || interview.questions.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <p>No questions found for this interview.</p>
      </div>
    )
  }

  return <InterviewClient interviewId={interview.id} questions={interview.questions} />
}
