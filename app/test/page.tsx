import { createClient } from "@/lib/supabase/server"

export default async function SupabaseTestPage() {
  const supabase = await createClient()

  // Fetch the authenticated user
  const { data, error } = await supabase.auth.getUser()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Auth Status:</h2>
        {error ? (
          <div className="text-destructive">
            <p className="font-medium">Error fetching user:</p>
            <pre className="mt-2 bg-black/10 p-2 rounded text-sm">{JSON.stringify(error, null, 2)}</pre>
            <p className="mt-4 text-sm text-muted-foreground">This is expected if you are not currently logged in.</p>
          </div>
        ) : (
          <div className="text-primary">
            <p className="font-medium">Successfully connected! User is logged in.</p>
            <pre className="mt-2 bg-black/10 p-2 rounded text-sm">{JSON.stringify(data.user, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-sm text-muted-foreground">
        If you see an Auth error above, but not a "Connection Refused" or "Invalid URL" error, it means the connection to your Supabase project is working perfectly and you just need to sign up/in!
      </div>
    </div>
  )
}
