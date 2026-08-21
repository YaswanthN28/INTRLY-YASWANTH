"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ResumeUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const validateFile = (selectedFile: File) => {
    setError(null)
    setSuccess(false)
    
    // Check extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'docx') {
      setError("Unsupported file type. Please upload a PDF or DOCX file.")
      return false
    }

    // Check size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Please upload a resume smaller than 10 MB.")
      return false
    }

    setFile(selectedFile)
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)
    setProgress(10) // Mock progress start

    try {
      const formData = new FormData()
      formData.append("resume", file)

      // Fake progress for UX
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90))
      }, 300)

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to upload file.")
      }

      setProgress(100)
      setSuccess(true)
      setFile(null)
      
    } catch (err: any) {
      setError(err.message || "Unable to upload resume")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-6 max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Upload Resume</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload an existing PDF or DOCX to prepare for Resume Intelligence.</p>
      </div>

      <div 
        className={`flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-colors ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border/60 bg-card hover:bg-muted/20"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && !uploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div>
              <p className="font-semibold text-foreground">Uploading resume...</p>
              <p className="text-sm text-muted-foreground">Preparing your document</p>
            </div>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-4 text-center text-green-600 dark:text-green-500">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="font-semibold text-lg">Resume uploaded successfully</p>
              <p className="text-sm text-muted-foreground mt-1 text-foreground/70">Your document is ready for Resume Intelligence.</p>
            </div>
            <Button onClick={(e) => { e.stopPropagation(); setSuccess(false); }} variant="outline" className="mt-4">
              Upload Another
            </Button>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-6 text-center w-full max-w-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg truncate max-w-xs">{file.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            {error && (
              <div className="w-full flex items-start gap-3 text-left p-4 bg-destructive/10 text-destructive rounded-xl text-sm border border-destructive/20">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3 w-full mt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={(e) => { e.stopPropagation(); setFile(null); setError(null); }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                disabled={!!error}
              >
                Upload
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center cursor-pointer">
            <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mb-2">
              <UploadCloud className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">Drag & drop your resume here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to choose PDF or DOCX</p>
            </div>
            
            {error && (
              <div className="mt-4 w-full max-w-xs flex items-start gap-3 text-left p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}
            
            <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground bg-muted/30 px-6 py-4 rounded-xl border border-border/50">
              <div className="flex justify-between gap-8">
                <span>Supported formats:</span>
                <span className="font-medium text-foreground">PDF, DOCX</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>Maximum size:</span>
                <span className="font-medium text-foreground">10 MB</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
