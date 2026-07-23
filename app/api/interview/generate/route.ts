import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { InterviewGenerationService } from '@/services/interview-generation-service';

export async function POST(request: NextRequest) {
  try {
    const { resumeId } = await request.json();

    if (!resumeId) {
      return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {}
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the parsed resume
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('raw_json')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !resume || !resume.raw_json) {
      return NextResponse.json({ error: 'Failed to fetch resume data' }, { status: 404 });
    }

    const rawJson = resume.raw_json;
    const primaryRole = rawJson.roleDetails?.primaryRole?.role || rawJson.detectedRole;
    
    // Generate the questions deterministically
    const generatedQuestions = InterviewGenerationService.generate(
      primaryRole, 
      rawJson.totalExperienceYears || 0, 
      rawJson.extractedSkills || []
    );

    // Save the interview session
    const { data: interview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        questions: generatedQuestions,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Interview insert error:", insertError);
      return NextResponse.json({ error: 'Failed to create interview session' }, { status: 500 });
    }

    return NextResponse.json({ success: true, interviewId: interview.id });

  } catch (error: any) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
