import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, FileText, Target, CheckCircle2, AlertCircle, FileSearch, Sparkles, ChevronRight, Briefcase, Loader2 } from "lucide-react"
import Link from "next/link"
import { ParsingService } from "@/services/parsing-service"

export const metadata = {
  title: 'Resume Intelligence | INTRLY',
  description: 'Understand the skills, experience and evidence represented in your resume.',
}

export default async function ResumeIntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  // Fetch the latest resume
  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, file_name, raw_json, extracted_skills, created_at, status, latex_source')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentResume = resumes?.[0]

  // EMPTY STATE: No resume uploaded
  if (!currentResume) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
        <PageHeader 
          eyebrow="Understand"
          title="Resume Intelligence" 
          description="Understand the skills, experience and evidence represented in your resume."
        />
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Intelligence needs a resume</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Upload or create your resume first. We'll analyze it to extract your skills, experience, and role alignment.
            </p>
            <div className="flex gap-4">
              <Link href="/resume/upload">
                <Button>Upload Resume</Button>
              </Link>
              <Link href="/resume/create">
                <Button variant="outline">Create Resume</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Auto-parse if the resume was built but not yet parsed
  if (currentResume && !currentResume.raw_json) {
    if (currentResume.latex_source) {
      try {
        // Strip out basic LaTeX commands for the parser
        const rawText = currentResume.latex_source.replace(/\\[a-zA-Z]+\*?(\{.*?\})?/g, ' ').replace(/[{}]/g, '')
        const parsedData = ParsingService.parseText(rawText)
        
        // Update DB
        await supabase
          .from('resumes')
          .update({
            parsed_text: parsedData.rawText,
            extracted_skills: parsedData.extractedSkills,
            raw_json: parsedData,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentResume.id)
          
        currentResume.raw_json = parsedData
      } catch (e) {
        console.error("Auto-parse failed:", e)
      }
    }

    if (!currentResume.raw_json) {
      return (
        <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
          <PageHeader 
            eyebrow="Understand"
            title="Resume Intelligence" 
            description="Understand the skills, experience and evidence represented in your resume."
          />
          <Card className="border-border/50 shadow-sm border-t-amber-500 border-t-4">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Resume not analyzed</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Your resume hasn't been processed by our intelligence engine yet. Re-upload your resume to trigger analysis.
              </p>
              <Link href="/resume/upload">
                <Button>Re-upload Resume</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Has parsed data
  const { raw_json: data } = currentResume
  const primaryRole = data.roleDetails?.primaryRole
  const secondaryRoles = data.roleDetails?.secondaryRoles || []

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <PageHeader 
        eyebrow="Understand"
        title="Resume Intelligence" 
        description="Understand the skills, experience and evidence represented in your resume."
        actions={
          <Link href="/resume/upload">
             <Button variant="outline" className="shadow-sm">Update Resume</Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* L2: ATS SCORE & SNAPSHOT */}
        <Card className="md:col-span-2 border-border/50 shadow-sm relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent z-0"></div>
          <CardHeader className="bg-muted/20 border-b border-border/50 z-10 relative">
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-primary" />
              Intelligence & ATS Score
            </CardTitle>
            <CardDescription>High-level facts identified from your document.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col md:flex-row gap-8 items-center z-10 relative">
            {/* ATS Score Ring Mock */}
            <div className="relative w-32 h-32 flex shrink-0 items-center justify-center rounded-full bg-primary/10 border-4 border-primary">
              <div className="text-center">
                <span className="text-3xl font-bold text-foreground">
                  {Math.min(100, Math.max(50, 65 + (data.extractedSkills?.length || 0)))}
                </span>
                <span className="text-sm text-muted-foreground block">/ 100</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 w-full">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Candidate</p>
                <p className="font-semibold text-foreground truncate">{data.name || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Experience</p>
                <p className="font-semibold text-foreground">{data.totalExperienceYears} Years</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Skills Found</p>
                <p className="font-semibold text-foreground">{data.extractedSkills?.length || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Source</p>
                <p className="font-semibold text-foreground truncate">{currentResume.file_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* L3: ROLE ALIGNMENT & CALL TO ACTION */}
        <Card className="border-border/50 shadow-sm bg-primary border-primary flex flex-col relative overflow-hidden group text-primary-foreground">
          <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-primary-foreground/20 transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Role Alignment
            </CardTitle>
            <CardDescription className="text-primary-foreground/70">Top match based on evidence.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end gap-6 z-10 relative">
            {primaryRole ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-end justify-between mb-1">
                    <p className="font-bold text-xl">{primaryRole.role}</p>
                    <span className="text-xs font-semibold bg-primary-foreground text-primary px-2 py-1 rounded-md">
                      {primaryRole.confidence}% Match
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-primary-foreground/70">Insufficient evidence to confidently detect a primary role.</p>
            )}
            
            <div className="pt-4 border-t border-primary-foreground/20 mt-auto">
               <p className="text-xs text-primary-foreground/80 mb-3">
                 Ready to prove your skills?
               </p>
               <Link href="/interview/setup" className="w-full block">
                 <Button className="w-full bg-background text-primary hover:bg-background/90 shadow-sm gap-2">
                   Step 3: Setup Interview <ChevronRight className="w-4 h-4" />
                 </Button>
               </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* L4: ROLE EVIDENCE */}
        <Card className="border-border/50 shadow-sm">
           <CardHeader className="bg-muted/20 border-b border-border/50">
             <CardTitle className="text-lg">Alignment Evidence</CardTitle>
             <CardDescription>Why INTRLY aligned your resume to these roles.</CardDescription>
           </CardHeader>
           <CardContent className="p-0">
              <div className="divide-y divide-border">
                {primaryRole && primaryRole.matchedKeywords?.length > 0 && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                       <CheckCircle2 className="w-5 h-5 text-green-500" />
                       <h3 className="font-semibold">Strong evidence for {primaryRole.role}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      The system interpreted strong alignment due to the presence of these targeted keywords across your document:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {primaryRole.matchedKeywords.map((kw: string) => (
                        <span key={kw} className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {secondaryRoles.length > 0 && (
                  <div className="p-6 bg-muted/10">
                    <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Secondary Matches</h3>
                    <div className="space-y-4">
                      {secondaryRoles.map((role: any) => (
                        <div key={role.role}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{role.role}</span>
                            <span className="text-xs text-muted-foreground">{role.confidence}% Match</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {role.matchedKeywords?.slice(0, 5).map((kw: string) => (
                              <span key={kw} className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-[10px] font-medium uppercase">
                                {kw}
                              </span>
                            ))}
                            {role.matchedKeywords?.length > 5 && (
                              <span className="text-[10px] text-muted-foreground py-0.5 px-1">+{role.matchedKeywords.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!primaryRole && secondaryRoles.length === 0 && (
                   <div className="p-6 text-center text-muted-foreground">
                     <p className="text-sm">No role evidence extracted.</p>
                   </div>
                )}
              </div>
           </CardContent>
        </Card>

        {/* L5: EXTRACTED SKILLS */}
        <Card className="border-border/50 shadow-sm flex flex-col max-h-[600px]">
           <CardHeader className="bg-muted/20 border-b border-border/50 shrink-0">
             <CardTitle className="text-lg">Extracted Skills</CardTitle>
             <CardDescription>Factual identification of technologies and tools.</CardDescription>
           </CardHeader>
           <CardContent className="p-6 overflow-y-auto">
              {data.extractedSkills && data.extractedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.extractedSkills.map((skill: string) => (
                    <div key={skill} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-lg shadow-sm border border-border/50">
                      {skill}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                  <p className="text-muted-foreground">No explicit skills were detected.</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Recommendation: Ensure skills are clearly listed in a dedicated section or bullet points.
                  </p>
                </div>
              )}
           </CardContent>
        </Card>
      </div>

      {/* L6: RAW EXTRACTED SECTIONS (Expandable / Scrolled) */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-border/50">
           <CardTitle className="text-lg flex items-center gap-2">
             <Briefcase className="w-5 h-5 text-muted-foreground" />
             Source Sections
           </CardTitle>
           <CardDescription>The underlying text segments extracted to power your interviews.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            
            <div className="p-6 flex flex-col">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                Experience Section
                {data.experienceSection && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </h3>
              {data.experienceSection ? (
                <div className="bg-muted/30 border rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono h-[300px] overflow-y-auto custom-scrollbar">
                  {data.experienceSection}
                </div>
              ) : (
                 <div className="flex-1 border border-dashed rounded-lg flex items-center justify-center p-8 text-center bg-muted/10 h-[300px]">
                   <p className="text-sm text-muted-foreground">
                     Experience section not distinctly identified.<br/>
                     <span className="text-xs mt-2 block">Recommendation: Use clear headers like "EXPERIENCE" or "EMPLOYMENT".</span>
                   </p>
                 </div>
              )}
            </div>

            <div className="p-6 flex flex-col">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                Education Section
                {data.educationSection && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </h3>
              {data.educationSection ? (
                <div className="bg-muted/30 border rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono h-[300px] overflow-y-auto custom-scrollbar">
                  {data.educationSection}
                </div>
              ) : (
                 <div className="flex-1 border border-dashed rounded-lg flex items-center justify-center p-8 text-center bg-muted/10 h-[300px]">
                   <p className="text-sm text-muted-foreground">
                     Education section not distinctly identified.<br/>
                     <span className="text-xs mt-2 block">Recommendation: Use clear headers like "EDUCATION" or "ACADEMIC".</span>
                   </p>
                 </div>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

    </div>
  )
}
