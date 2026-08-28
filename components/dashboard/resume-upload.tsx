"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { useResume } from "@/hooks/use-resume-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, UploadCloud, X, CheckCircle2, Loader2, ArrowRight, BrainCircuit, ScanSearch } from "lucide-react"
import Link from "next/link"

export function ResumeUpload({ userId }: { userId: string }) {
  const { currentResume, isLoadingResume, uploadResume, isUploading, getResumeUrl } = useResume(userId)
  const [error, setError] = React.useState<string | null>(null)
  
  // Local state for the multi-step upload & parsing flow
  const [uploadState, setUploadState] = React.useState<'idle' | 'uploading' | 'parsing' | 'success'>('idle')
  const [parsedData, setParsedData] = React.useState<any>(null)

  // Initialize state based on currentResume if returning to the page
  React.useEffect(() => {
    if (currentResume && uploadState === 'idle') {
      setUploadState('success')
      setParsedData(currentResume.raw_json || null)
    }
  }, [currentResume, uploadState])
  
  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    setError(null)
    const file = acceptedFiles[0]
    
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.")
      return
    }

    try {
      setUploadState('uploading')
      // 1. Upload file to Supabase securely
      const savedResume = await uploadResume(file)
      
      // 2. Parse the resume immediately to populate intelligence models
      setUploadState('parsing')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('resumeId', savedResume.id)

      const parseRes = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData
      })

      const parseResult = await parseRes.json()
      
      if (!parseRes.ok) {
        throw new Error(parseResult.error || "Failed to parse resume.")
      }
      
      setParsedData(parseResult.data)
      setUploadState('success')

    } catch (err: any) {
      setError(err.message || "Failed to process resume.")
      setUploadState('idle')
    }
  }, [uploadResume])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: uploadState === 'uploading' || uploadState === 'parsing'
  })

  if (isLoadingResume) {
    return (
      <Card className="w-full border-border/50 shadow-sm">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      
      {uploadState === 'success' && currentResume ? (
        <Card className="w-full border-border/50 shadow-sm border-t-4 border-t-primary overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Resume Processed</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Your resume has been successfully imported and securely stored.
                  </CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-4 border rounded-xl bg-card">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-xl">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{currentResume.file_name}</p>
                  <div className="flex gap-2 items-center text-xs text-muted-foreground mt-1">
                    <span>{(currentResume.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>Uploaded {new Date(currentResume.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto"
                  onClick={() => {
                    setUploadState('idle')
                    setParsedData(null)
                  }}
                >
                  Upload New
                </Button>
              </div>
            </div>

            {/* Structured Next Steps instead of raw JSON dump */}
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <div className="p-5 border rounded-xl bg-muted/20 relative overflow-hidden group">
                 <ScanSearch className="absolute -right-4 -bottom-4 w-24 h-24 text-primary/5 transition-transform group-hover:scale-110" />
                 <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-4 h-4 text-primary" /> Review Intelligence
                 </h4>
                 <p className="text-sm text-muted-foreground mb-4">
                   We've extracted your skills and experience to power your custom AI interviews.
                 </p>
                 {parsedData?.detectedRole && (
                    <div className="inline-flex items-center text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                      Detected Role: {parsedData.detectedRole}
                    </div>
                 )}
                 <Link href="/resume/intelligence" className="block w-full mt-auto">
                   <Button variant="outline" className="w-full">
                     View Resume Intelligence <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </Link>
              </div>

              <div className="p-5 border rounded-xl bg-primary/5 border-primary/20 relative overflow-hidden">
                 <h4 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                   Take the next step
                 </h4>
                 <p className="text-sm text-foreground/80 mb-6">
                   Ready to prove your skills? Generate a custom mock interview tailored exactly to this resume.
                 </p>
                 <Link href="/dashboard" className="w-full block">
                   <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                     Start Practice Interview <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full border-border/50 shadow-sm">
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`relative overflow-hidden border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center transition-all cursor-pointer m-6 ${
                isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:bg-muted/30 hover:border-muted-foreground/50"
              } ${(uploadState === 'uploading' || uploadState === 'parsing') ? "opacity-70 pointer-events-none" : ""}`}
            >
              <input {...getInputProps()} />
              
              {uploadState === 'uploading' ? (
                <div className="flex flex-col items-center text-primary animate-in zoom-in duration-300">
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <p className="font-semibold text-lg">Uploading Securely...</p>
                  <p className="text-sm text-muted-foreground mt-1">Encrypting and transferring file</p>
                </div>
              ) : uploadState === 'parsing' ? (
                <div className="flex flex-col items-center text-secondary-foreground animate-in zoom-in duration-300">
                  <div className="p-4 bg-secondary/20 rounded-full mb-4">
                    <BrainCircuit className="w-8 h-8 animate-pulse text-secondary-foreground" />
                  </div>
                  <p className="font-semibold text-lg">Extracting Experience...</p>
                  <p className="text-sm text-muted-foreground mt-1">Preparing data for your custom interviews</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className={`p-5 rounded-full mb-5 transition-colors duration-300 ${isDragActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <UploadCloud className={`w-10 h-10 ${isDragActive ? 'animate-bounce' : ''}`} />
                  </div>
                  <p className="font-bold text-xl text-foreground mb-2">
                    {isDragActive ? "Drop to upload" : "Select or drag your resume"}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm mb-8">
                    We accept standard PDF and DOCX files up to 10MB. We'll extract your skills and experience to build custom interviews.
                  </p>
                  <Button type="button" variant="secondary" className="px-8 rounded-full shadow-sm">Select File</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <X className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Upload Failed</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
