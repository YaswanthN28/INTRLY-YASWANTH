"use client"

import React, { useState, useEffect, useRef } from "react"
import { ResumePreview } from "./resume-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Save, Download, AlertCircle, CheckCircle2, FileText, FileCode } from "lucide-react"
import { saveResume } from "@/app/(dashboard)/resume/create/actions"
import dynamic from "next/dynamic"

const LatexEditor = dynamic(() => import("./latex-editor").then(mod => mod.LatexEditor), { ssr: false })

const DEFAULT_LATEX = `\\documentclass[11pt]{article}

\\usepackage[margin=0.7in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}

\\begin{center}
{\\LARGE \\textbf{Your Name}}\\\\
Software Engineer\\\\
email@example.com \\,|\\, +91 00000 00000
\\end{center}

\\section*{Summary}

Professional summary goes here.

\\section*{Experience}

\\textbf{Software Engineer} \\hfill 2024 -- Present\\\\
Company Name

\\begin{itemize}[leftmargin=*]
    \\item Achievement or responsibility.
    \\item Achievement or responsibility.
\\end{itemize}

\\section*{Skills}

JavaScript, TypeScript, React, Node.js

\\section*{Education}

\\textbf{Bachelor of Technology in Computer Science} \\hfill 2020 -- 2024\\\\
University Name

\\end{document}`

export function ResumeBuilder() {
  const [latex, setLatex] = useState(DEFAULT_LATEX)
  const [isCompiling, setIsCompiling] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [atsScore, setAtsScore] = useState<any>(null)

  // Debounced compilation
  useEffect(() => {
    const compileTimer = setTimeout(() => {
      compileLatex(latex)
    }, 1000)

    return () => clearTimeout(compileTimer)
  }, [latex])

  // Track the latest compilation request to avoid race conditions
  const currentCompileRef = React.useRef(0)

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

      // If another compilation started after this one, ignore this response
      if (requestId !== currentCompileRef.current) return

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.error?.message || errorData?.error?.type || "Failed to compile")
      }

      const blob = await res.blob()
      const newPdfUrl = URL.createObjectURL(blob)
      
      // Cleanup previous blob URL to prevent memory leaks
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
      
      setPdfUrl(newPdfUrl)

      const atsHeader = res.headers.get("X-ATS-Score")
      if (atsHeader) {
        try {
          setAtsScore(JSON.parse(atsHeader))
        } catch (e) {}
      }
    } catch (err: any) {
      setError(err.message)
      // We don't clear the pdfUrl on error so the user can still see their last working state
      // but we do show the error message. Wait, instructions say:
      // "Do not display the old placeholder PDF in any of these states."
      // If it's an error, error takes precedence in UI.
    } finally {
      setIsCompiling(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async () => {
    try {
      await saveResume(latex, pdfUrl, atsScore?.score)
      alert("Your resume has been saved successfully.")
    } catch (err: any) {
      alert("Error saving resume: " + err.message)
    }
  }

  const handleDownloadLatex = () => {
    const blob = new Blob([latex], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "intrly_resume.tex"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">Paste or write LaTeX code. Preview generates automatically.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => compileLatex(latex)} disabled={isCompiling} className="border-border/50 bg-background hover:bg-muted">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Create
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadLatex} className="border-border/50 bg-background hover:bg-muted">
            <FileCode className="w-4 h-4 mr-2" />
            Export .tex
          </Button>
          {pdfUrl && (
            <Button variant="outline" size="sm" asChild className="border-border/50 bg-background hover:bg-muted">
              <a href={pdfUrl} download="intrly_resume.pdf" target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
          )}
          <Button size="sm" onClick={handleSave} className="shadow-sm">
            <Save className="w-4 h-4 mr-2" />
            Save Resume
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Editor Side */}
        <div className="flex-1 flex flex-col min-h-0 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="h-12 border-b border-border/50 bg-muted/20 flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-xs font-mono text-muted-foreground">main.tex</span>
            <div className="w-16"></div>
          </div>
          <div className="flex-1 relative">
            <LatexEditor value={latex} onChange={setLatex} />
          </div>
        </div>

        {/* Preview Side */}
        <div className="flex-[1.2] flex flex-col gap-6 min-h-0">
          <div className="flex-1 relative bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
            <div className="h-12 border-b border-border/50 bg-muted/20 flex items-center px-4 justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</span>
              {isCompiling && (
                <span className="text-xs text-primary flex items-center gap-1.5 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  Compiling...
                </span>
              )}
            </div>
            <div className="flex-1 relative bg-muted/10">
              <ResumePreview 
                pdfUrl={pdfUrl} 
                isCompiling={isCompiling} 
                error={error} 
              />
            </div>
          </div>

          {error ? (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col gap-2 items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-destructive opacity-80" />
              <p className="text-sm font-medium text-destructive">Compilation failed</p>
              <p className="text-xs text-muted-foreground">ATS analysis unavailable until valid resume source is provided.</p>
            </div>
          ) : atsScore ? (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" 
                      strokeDasharray={`${atsScore.score * 2.827} 282.7`} 
                      className={atsScore.score >= 80 ? "text-green-500" : atsScore.score >= 60 ? "text-amber-500" : "text-destructive"} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="absolute text-xl font-bold">{atsScore.score}</span>
                </div>
                <span className="text-xs text-muted-foreground mt-2 font-medium uppercase tracking-wider">ATS Score</span>
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {atsScore.checks.map((check: any, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                    {check.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <span className={`text-sm ${check.passed ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                      {check.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col gap-2 items-center justify-center text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-80" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Compiled successfully</p>
              <p className="text-xs text-muted-foreground">Waiting for ATS analysis...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
