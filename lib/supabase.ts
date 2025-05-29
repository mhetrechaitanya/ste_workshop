import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Log the URL (but not the key for security reasons)
console.log("Initializing Supabase client with URL:", supabaseUrl)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!")
}

// Create the standard Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Server-side client with service role for admin operations
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing server-side Supabase environment variables!")
    return null
  }

  console.log("Creating server-side Supabase client with URL:", supabaseUrl)

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
    },
  })
}

// Helper function to get the storage URL with the correct format
export const getStorageUrl = (bucket: string, path: string) => {
  // Extract the project reference from the Supabase URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]
  if (!projectRef) {
    console.error("Could not extract project reference from Supabase URL")
    return null
  }

  // Construct the public URL using the S3 compatibility format
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
