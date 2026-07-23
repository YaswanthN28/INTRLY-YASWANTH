"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { useResume } from "@/hooks/use-resume-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, UploadCloud, X, CheckCircle2, Loader2, FileIcon } from "lucide-react"

export function ResumeUpload({ userId }: { userId: string }) {
  const { currentResume, isLoadingResume, uploadResume, isUploading, getResumeUrl } = useResume(userId)
  const [error, setError] = React.useState<string | null>(null)
  
  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    setError(null)
    const file = acceptedFiles[0]
    
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.")
      return
    }

    try {
      await uploadResume(file)
    } catch (err: any) {
      setError(err.message || "Failed to upload resume")
    }
  }, [uploadResume])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const handlePreview = async () => {
    if (!currentResume) return
    try {
      const url = await getResumeUrl(currentResume.file_url)
      window.open(url, '_blank')
    } catch (err: any) {
      setError("Failed to open preview: " + err.message)
    }
  }

  if (isLoadingResume) {
    return (
      <Card className="w-full flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume</CardTitle>
        <CardDescription>Upload your latest resume to personalize your interview.</CardDescription>
      </CardHeader>
      <CardContent>
        {currentResume ? (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-sm truncate max-w-[200px] sm:max-w-xs">{currentResume.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {(currentResume.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(currentResume.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>Preview</Button>
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <Button variant="secondary" size="sm" disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Replace
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50 hover:border-muted-foreground/50"
            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="flex flex-col items-center text-primary">
                <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                <p className="font-medium">Uploading securely...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="font-medium text-foreground mb-1">
                  {isDragActive ? "Drop your resume here" : "Click or drag your resume to upload"}
                </p>
                <p className="text-sm mb-4">Support for PDF and DOCX (Max 10MB)</p>
                <Button type="button" variant="secondary" className="pointer-events-none">Select File</Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {currentResume && !error && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p>Resume uploaded successfully!</p>
            </div>
            
            {currentResume.raw_json && (
              <div className="p-4 border rounded-lg bg-card text-sm space-y-3 shadow-sm">
                <p className="font-semibold text-primary text-base border-b pb-2">Parsing Results</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                  <div className="space-y-1">
                    <p><span className="font-medium text-foreground">Name:</span> {currentResume.raw_json.name || 'Not found'}</p>
                    <p><span className="font-medium text-foreground">Email:</span> {currentResume.raw_json.email || 'Not found'}</p>
                    <p><span className="font-medium text-foreground">Experience:</span> {currentResume.raw_json.totalExperienceYears} years</p>
                  </div>
                  
                  {currentResume.raw_json.roleDetails?.primaryRole ? (
                    <div className="space-y-2 bg-primary/5 p-3 rounded-md border border-primary/10">
                      <div>
                        <p className="font-semibold text-primary">Primary Role</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-medium text-foreground">{currentResume.raw_json.roleDetails.primaryRole.role}</span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                            {currentResume.raw_json.roleDetails.primaryRole.confidence}% Match
                          </span>
                        </div>
                      </div>
                      
                      {currentResume.raw_json.roleDetails.secondaryRoles?.length > 0 && (
                        <div className="pt-2 border-t border-primary/10">
                          <p className="text-xs text-muted-foreground mb-1">Secondary Matches:</p>
                          <div className="flex flex-col gap-1">
                            {currentResume.raw_json.roleDetails.secondaryRoles.map((secRole: any) => (
                              <div key={secRole.role} className="flex items-center justify-between text-xs">
                                <span>{secRole.role}</span>
                                <span>{secRole.confidence}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p><span className="font-medium text-foreground">Role:</span> {currentResume.raw_json.detectedRole || 'Not found'}</p>
                    </div>
                  )}
                </div>
                
                {currentResume.extracted_skills && currentResume.extracted_skills.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="font-medium text-foreground mb-2 text-xs uppercase tracking-wider">Detected Technologies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentResume.extracted_skills.map((skill: string) => (
                        <span key={skill} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md shadow-sm border border-border/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 mt-2 border-t flex justify-end">
                  <Button 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/interview/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ resumeId: currentResume.id })
                        });
                        const data = await res.json();
                        if (data.success) {
                           window.location.href = `/interview/${data.interviewId}`;
                        } else {
                           alert(data.error);
                        }
                      } catch(err) {
                        alert("Failed to generate interview");
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    Generate Custom Interview
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
