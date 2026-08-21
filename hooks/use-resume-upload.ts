import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { resumeService } from "@/services/resume-service"

export function useResume(userId: string) {
  const queryClient = useQueryClient()

  const { data: currentResume, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resume', userId],
    queryFn: () => resumeService.getLatestResume(userId),
    enabled: !!userId,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Upload via secure server-side API endpoint for validation
      const formData = new FormData()
      formData.append("resume", file)

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed on the server')
      }
      
      const data = await response.json()
      
      // 2. Fetch the updated full resume record
      const resume = await resumeService.getLatestResume(userId)
      if (!resume) throw new Error("Resume record not found after upload")
      
      return resume
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', userId] })
    },
  })
  
  const getUrlMutation = useMutation({
    mutationFn: (path: string) => resumeService.getResumeUrl(path),
  })

  return {
    currentResume,
    isLoadingResume,
    uploadResume: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    getResumeUrl: getUrlMutation.mutateAsync,
  }
}
