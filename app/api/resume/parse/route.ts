import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { ParsingService } from '@/services/parsing-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const resumeId = formData.get('resumeId') as string;

    if (!resumeId) {
      return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });
    }

    // Initialize Supabase Client early to fetch existing resume if needed
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

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rawText = '';

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text;
      } else if (file.type.includes('wordprocessingml') || file.name.endsWith('.docx')) {
        const docxData = await mammoth.extractRawText({ buffer });
        rawText = docxData.value;
      } else {
        return NextResponse.json({ error: 'Unsupported file type. Please upload PDF or DOCX.' }, { status: 400 });
      }
    } else {
      // Fetch the resume from DB to see if it has latex_source
      const { data: existingResume } = await supabase
        .from('resumes')
        .select('latex_source')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single();
        
      if (existingResume?.latex_source) {
        // Strip out basic LaTeX commands for the parser
        rawText = existingResume.latex_source.replace(/\\[a-zA-Z]+\*?(\{.*?\})?/g, ' ').replace(/[{}]/g, '');
      } else {
        return NextResponse.json({ error: 'Missing file and no source available to parse.' }, { status: 400 });
      }
    }

    // Process the text
    const parsedData = ParsingService.parseText(rawText);

    // Update the database record
    const { error: dbError } = await supabase
      .from('resumes')
      .update({
        parsed_text: parsedData.rawText,
        extracted_skills: parsedData.extractedSkills,
        raw_json: parsedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', resumeId)
      .eq('user_id', user.id);

    if (dbError) {
      console.error("Database update error:", dbError);
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Parsing error:", error);
    return NextResponse.json({ error: error.message || 'Parsing failed' }, { status: 500 });
  }
}
