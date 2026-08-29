import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { InterviewGenerationService } from '@/services/interview-generation-service';

export async function POST(request: NextRequest) {
  try {
    const { resumeId, focusRequirement } = await request.json();

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

    // 1. Fetch Resume & Role
    const { data: resume } = await supabase
      .from('resumes')
      .select('raw_json')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (!resume) {
       return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const parsed = resume.raw_json;
    const primaryRole = parsed?.basics?.label || null;
    const totalExperienceYears = parsed?.work?.length || 0; // rough proxy
    const skills = parsed?.skills?.map((s: any) => s.name) || [];
    
    // Fetch user target role
    const targetRole = user.user_metadata?.target_role || primaryRole || 'General Candidate';

    // 2. Generate Questions
    const generatedQuestions = InterviewGenerationService.generate(targetRole, totalExperienceYears, skills, focusRequirement);

    // 3. Store Session
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
      return NextResponse.json({ 
        error: `DB Error: ${insertError.message}. Details: ${insertError.details || 'None'}` 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, interviewId: interview.id });

  } catch (error: any) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
