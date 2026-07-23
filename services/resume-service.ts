import { createClient } from "@/lib/supabase/client"

export type Resume = {
  id: string
  user_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  parsed_text?: string
  extracted_skills?: string[]
  raw_json?: any
}

export const resumeService = {
  async uploadResume(file: File, userId: string) {
    const supabase = createClient()
    
    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('resumes')
      .upload(filePath, file)

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    // 2. Get Public URL (or signed URL depending on bucket privacy, assuming private here we should get signed or construct path)
    // We store the path to fetch it securely later via the client
    const fileUrl = uploadData.path

    // 3. Save metadata to DB
    const { data: dbData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_url: fileUrl,
        file_name: file.name,
        file_type: file.type || fileExt,
        file_size: file.size,
      })
      .select()
      .single()

    if (dbError) {
      // rollback storage upload
      await supabase.storage.from('resumes').remove([filePath])
      throw new Error(`Database error: ${dbError.message}`)
    }

    return dbData as Resume
  },

  async getLatestResume(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return (data as Resume) || null
  },
  
  async getResumeUrl(path: string) {
    const supabase = createClient()
    // Using createSignedUrl for private buckets. Valid for 1 hour.
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(path, 3600)
      
    if (error) throw new Error(error.message)
    return data.signedUrl
  }
}
