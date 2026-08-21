"use client"

import { Loader2, FileWarning, ExternalLink } from "lucide-react"

interface ResumePreviewProps {
  pdfUrl: string | null
  isCompiling: boolean
  error: string | null
}

export function ResumePreview({ pdfUrl, isCompiling, error }: ResumePreviewProps) {
  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-destructive/5 backdrop-blur-sm animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20 shadow-sm">
          <FileWarning className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold text-destructive mb-2">Compilation Error</h3>
        <div className="max-w-md w-full bg-background rounded-xl border border-destructive/20 shadow-sm overflow-hidden text-left">
          <div className="bg-destructive/10 px-4 py-2 border-b border-destructive/10">
            <span className="text-xs font-mono font-semibold text-destructive">LaTeX Error</span>
          </div>
          <p className="text-sm text-destructive/90 overflow-auto max-h-48 p-4 font-mono leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-transparent">
      {isCompiling && !pdfUrl && (
        <div className="flex flex-col items-center gap-4 text-muted-foreground absolute inset-0 justify-center bg-background/80 backdrop-blur-md z-10 transition-all duration-300">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
          </div>
          <p className="font-medium tracking-wide">Compiling document...</p>
        </div>
      )}
      
      {pdfUrl ? (
        <div className="w-full h-full relative group">
          <iframe 
            src={`${pdfUrl}#toolbar=1&navpanes=0&view=Fit`} 
            className="w-full h-full border-0 transition-opacity duration-300"
            style={{ opacity: isCompiling ? 0.4 : 1 }}
            title="Resume Preview"
          />
        </div>
      ) : (
        <div className="text-muted-foreground flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border/50 flex items-center justify-center shadow-sm">
            <FileWarning className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium">Your resume preview will appear here</p>
        </div>
      )}
    </div>
  )
}
