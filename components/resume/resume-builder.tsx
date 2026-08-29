"use client"

import React, { useState, useEffect, useRef } from "react"
import { ResumePreview } from "./resume-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Save, AlertCircle, Plus, Trash2, LayoutTemplate, CheckCircle, Brain, LayoutDashboard, FileDown } from "lucide-react"
import { saveResume } from "@/app/(dashboard)/resume/create/actions"

type Experience = { id: string; role: string; company: string; year: string; details: string }
type Project = { id: string; name: string; tools: string; year: string; details: string }
type Education = { id: string; degree: string; university: string; year: string }

type ResumeFormState = {
  name: string
  role: string
  email: string
  phone: string
  location: string
  linkedin: string
  portfolio: string
  summary: string
  experience: Experience[]
  projects: Project[]
  education: Education[]
  skills: string
}

const DEFAULT_STATE: ResumeFormState = {
  name: "Jane Doe",
  role: "Software Engineer",
  email: "jane@example.com",
  phone: "+1 555-0100",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/janedoe",
  portfolio: "janedoe.com",
  summary: "Results-driven Software Engineer with 4 years of experience building scalable web applications. Passionate about clean code, robust architecture, and user-centric design.",
  experience: [
    {
      id: "1",
      role: "Senior Frontend Developer",
      company: "Tech Solutions Inc.",
      year: "2021 - Present",
      details: "Led the migration to Next.js, improving page load speeds by 40%.\nMentored junior developers and established code review guidelines."
    }
  ],
  projects: [
    {
      id: "1",
      name: "E-Commerce Platform",
      tools: "Next.js, Tailwind CSS, Stripe",
      year: "2023",
      details: "Built a fully functional e-commerce platform processing over $10k in monthly transactions."
    }
  ],
  education: [
    {
      id: "1",
      degree: "B.S. Computer Science",
      university: "State University",
      year: "2017 - 2021"
    }
  ],
  skills: "JavaScript, TypeScript, React, Node.js, Next.js, Tailwind CSS"
}

const escapeLatex = (str: string) => {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

const generateLatex = (data: ResumeFormState) => {
  const contactParts = []
  if (data.email) contactParts.push(escapeLatex(data.email))
  if (data.phone) contactParts.push(escapeLatex(data.phone))
  if (data.location) contactParts.push(escapeLatex(data.location))
  if (data.linkedin) contactParts.push(escapeLatex(data.linkedin))
  if (data.portfolio) contactParts.push(escapeLatex(data.portfolio))
  
  return `\\documentclass[11pt]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\begin{document}
\\begin{center}
{\\LARGE \\textbf{${escapeLatex(data.name) || 'Your Name'}}}\\\\
${escapeLatex(data.role) || 'Professional Title'}\\\\
${contactParts.join(' \\,|\\, ')}
\\end{center}

\\section*{Summary}
${escapeLatex(data.summary) || 'Professional summary goes here.'}

\\section*{Experience}
${data.experience.length ? data.experience.map(exp => `\\textbf{${escapeLatex(exp.role) || 'Role'}} \\hfill ${escapeLatex(exp.year) || 'Year'}\\\\
${escapeLatex(exp.company) || 'Company'}
\\begin{itemize}[leftmargin=*]
${exp.details.split('\\n').filter(d => d.trim()).map(d => `\\item ${escapeLatex(d)}`).join('\\n')}
\\end{itemize}
`).join('\\n') : '\\textit{No experience added yet.}'}

\\section*{Projects}
${data.projects.length ? data.projects.map(proj => `\\textbf{${escapeLatex(proj.name) || 'Project Name'}} \\hfill ${escapeLatex(proj.year) || 'Year'}\\\\
\\textit{${escapeLatex(proj.tools) || 'Tools Used'}}
\\begin{itemize}[leftmargin=*]
${proj.details.split('\\n').filter(d => d.trim()).map(d => `\\item ${escapeLatex(d)}`).join('\\n')}
\\end{itemize}
`).join('\\n') : '\\textit{No projects added yet.}'}

\\section*{Skills}
${escapeLatex(data.skills) || 'Your skills go here.'}

\\section*{Education}
${data.education.length ? data.education.map(edu => `\\textbf{${escapeLatex(edu.degree) || 'Degree'}} \\hfill ${escapeLatex(edu.year) || 'Year'}\\\\
${escapeLatex(edu.university) || 'University'}`).join('\\n\\vspace{1em}\\n') : '\\textit{No education added yet.}'}
\\end{document}`
}

export function ResumeBuilder() {
  const router = useRouter()
  const [form, setForm] = useState<ResumeFormState>(DEFAULT_STATE)
  const [isCompiling, setIsCompiling] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Track active view on mobile
  const [activeTab, setActiveTab] = useState<'editor'|'preview'>('editor')

  // Debounced compilation
  useEffect(() => {
    const latex = generateLatex(form)
    const compileTimer = setTimeout(() => {
      compileLatex(latex)
    }, 1500)

    return () => clearTimeout(compileTimer)
  }, [form])

  const currentCompileRef = useRef(0)

  const compileLatex = async (code: string) => {
    const requestId = ++currentCompileRef.current
    setIsCompiling(true)
    setError(null)
    
    try {
      const res = await fetch("/api/resume/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex: code })
      })

      if (requestId !== currentCompileRef.current) return

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.error?.message || errorData?.error?.type || "Failed to compile document")
      }

      const blob = await res.blob()
      const newPdfUrl = URL.createObjectURL(blob)
      
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      
      setPdfUrl(newPdfUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsCompiling(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const latex = generateLatex(form)
      await saveResume(latex, pdfUrl, null)
      setShowSuccessModal(true)
    } catch (err: any) {
      alert("Error saving resume: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // --- Handlers ---
  const updateForm = (key: keyof ResumeFormState, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const addExperience = () => {
    setForm(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Date.now().toString(), role: "", company: "", year: "", details: "" }]
    }))
  }

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setForm(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }))
  }

  const removeExperience = (id: string) => {
    setForm(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }))
  }
  
  const addProject = () => {
    setForm(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now().toString(), name: "", tools: "", year: "", details: "" }]
    }))
  }

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setForm(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj)
    }))
  }

  const removeProject = (id: string) => {
    setForm(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }))
  }

  const addEducation = () => {
    setForm(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), degree: "", university: "", year: "" }]
    }))
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }))
  }

  const removeEducation = (id: string) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  return (
    <div className="flex flex-col absolute -top-6 -left-6 -right-6 -bottom-24 md:-top-8 md:-left-8 md:-right-8 md:-bottom-8 bg-background/50 z-10 overflow-hidden">
      
      {/* Builder Toolbar */}
      <div className="shrink-0 h-16 border-b border-border/50 bg-card flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
             <LayoutTemplate className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Standard Professional</h2>
            <p className="text-xs text-muted-foreground">Auto-saving structured template</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mobile view toggle */}
          <div className="flex md:hidden bg-muted rounded-full p-1 border border-border/50">
             <Button 
               variant={activeTab === 'editor' ? 'default' : 'ghost'} 
               size="sm" 
               className={`h-8 rounded-full ${activeTab === 'editor' ? 'shadow-sm' : ''}`}
               onClick={() => setActiveTab('editor')}
             >
               Edit
             </Button>
             <Button 
               variant={activeTab === 'preview' ? 'default' : 'ghost'} 
               size="sm" 
               className={`h-8 rounded-full ${activeTab === 'preview' ? 'shadow-sm' : ''}`}
               onClick={() => setActiveTab('preview')}
             >
               Preview
             </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <a 
              href={pdfUrl || "#"} 
              download="My_Resume.pdf" 
              className={isCompiling || !pdfUrl ? "pointer-events-none opacity-50" : ""}
            >
              <Button 
                variant="outline" 
                disabled={isCompiling || !pdfUrl} 
                className="rounded-full shadow-sm px-6"
                type="button"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download
              </Button>
            </a>

            <Button 
              onClick={handleSave} 
              disabled={isSaving || isCompiling || !pdfUrl} 
              className="rounded-full shadow-sm px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Resume"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT PANE: Editor */}
        <div className={`w-full md:w-[500px] lg:w-[600px] flex-col overflow-y-auto border-r border-border/50 bg-background/50 p-6 space-y-8 ${activeTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
               Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <Label>Professional Title</Label>
                <Input value={form.role} onChange={e => updateForm('role', e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+1 555-0100" />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => updateForm('location', e.target.value)} placeholder="San Francisco, CA" />
              </div>
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input value={form.linkedin} onChange={e => updateForm('linkedin', e.target.value)} placeholder="linkedin.com/in/janedoe" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Portfolio / Website</Label>
                <Input value={form.portfolio} onChange={e => updateForm('portfolio', e.target.value)} placeholder="janedoe.com" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2">Professional Summary</h3>
            <div className="space-y-1.5">
              <Textarea 
                value={form.summary} 
                onChange={e => updateForm('summary', e.target.value)} 
                placeholder="A brief summary of your professional background..."
                className="min-h-[100px] resize-y"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
               <h3 className="text-lg font-bold">Experience</h3>
               <Button variant="ghost" size="sm" onClick={addExperience} className="h-8 text-primary">
                 <Plus className="w-4 h-4 mr-1" /> Add Role
               </Button>
            </div>
            
            <div className="space-y-6">
              {form.experience.map((exp) => (
                <Card key={exp.id} className="relative group bg-card shadow-sm border-border/50">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    onClick={() => removeExperience(exp.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <CardContent className="p-4 space-y-4 pt-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Role Title</Label>
                        <Input value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} placeholder="Software Engineer" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Company</Label>
                        <Input value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="Tech Inc." />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time Period</Label>
                      <Input value={exp.year} onChange={e => updateExperience(exp.id, 'year', e.target.value)} placeholder="2021 - Present" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description (one bullet point per line)</Label>
                      <Textarea 
                        value={exp.details} 
                        onChange={e => updateExperience(exp.id, 'details', e.target.value)} 
                        placeholder="Developed new features..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {form.experience.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No experience added.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
               <h3 className="text-lg font-bold">Projects</h3>
               <Button variant="ghost" size="sm" onClick={addProject} className="h-8 text-primary">
                 <Plus className="w-4 h-4 mr-1" /> Add Project
               </Button>
            </div>
            
            <div className="space-y-6">
              {form.projects.map((proj) => (
                <Card key={proj.id} className="relative group bg-card shadow-sm border-border/50">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    onClick={() => removeProject(proj.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <CardContent className="p-4 space-y-4 pt-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Project Name</Label>
                        <Input value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} placeholder="E-Commerce Platform" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tools / Tech Stack</Label>
                        <Input value={proj.tools} onChange={e => updateProject(proj.id, 'tools', e.target.value)} placeholder="React, Node.js" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time Period / Date</Label>
                      <Input value={proj.year} onChange={e => updateProject(proj.id, 'year', e.target.value)} placeholder="2023" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description (one bullet point per line)</Label>
                      <Textarea 
                        value={proj.details} 
                        onChange={e => updateProject(proj.id, 'details', e.target.value)} 
                        placeholder="Built a fully functional..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {form.projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No projects added.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2">Skills</h3>
            <div className="space-y-1.5">
              <Textarea 
                value={form.skills} 
                onChange={e => updateForm('skills', e.target.value)} 
                placeholder="JavaScript, React, Node.js..."
                className="min-h-[80px] resize-y"
              />
            </div>
          </section>

          <section className="space-y-4">
             <div className="flex items-center justify-between border-b pb-2">
               <h3 className="text-lg font-bold">Education</h3>
               <Button variant="ghost" size="sm" onClick={addEducation} className="h-8 text-primary">
                 <Plus className="w-4 h-4 mr-1" /> Add Education
               </Button>
            </div>
            
            <div className="space-y-4">
              {form.education.map((edu) => (
                <Card key={edu.id} className="relative group bg-card shadow-sm border-border/50">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    onClick={() => removeEducation(edu.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <CardContent className="p-4 space-y-4 pt-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Degree / Certification</Label>
                        <Input value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="B.S. Computer Science" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Institution</Label>
                        <Input value={edu.university} onChange={e => updateEducation(edu.id, 'university', e.target.value)} placeholder="University Name" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time Period</Label>
                      <Input value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} placeholder="2017 - 2021" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {form.education.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No education added.</p>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT PANE: Live Preview */}
        <div className={`flex-1 flex flex-col bg-muted/20 relative ${activeTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
          <div className="absolute inset-0 m-4 md:m-6 bg-card rounded-2xl border border-border/50 shadow-md overflow-hidden flex flex-col">
            <div className="h-10 bg-muted/30 border-b border-border/50 flex items-center justify-center px-4 shrink-0">
               <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Live Document Preview</span>
            </div>
            <div className="flex-1 relative">
               <ResumePreview pdfUrl={pdfUrl} isCompiling={isCompiling} error={error} />
            </div>
          </div>
        </div>

      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm p-6 rounded-2xl shadow-xl border border-border/50 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
               <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Resume Saved!</h3>
              <p className="text-muted-foreground text-sm">Your resume has been saved successfully. What would you like to do next?</p>
            </div>
            <div className="flex flex-col gap-3 w-full pt-2">
              <Button onClick={() => router.push('/resume/intelligence')} className="w-full gap-2 rounded-full">
                <Brain className="w-4 h-4" /> Analyze Resume
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full gap-2 rounded-full">
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Button>
              <Button onClick={() => setShowSuccessModal(false)} variant="ghost" className="w-full text-muted-foreground rounded-full">
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
