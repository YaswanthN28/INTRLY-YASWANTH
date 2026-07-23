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
      // 1. Upload to Supabase Storage and create DB record
      const resume = await resumeService.uploadResume(file, userId)
      
      // 2. Trigger the Parsing API route
      const formData = new FormData()
      formData.append('file', file)
      formData.append('resumeId', resume.id)
      
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Parsing failed on the server')
      }
      
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
