"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"

export function SupabaseDiagnostics() {
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "success" | "error">("checking")
  const [bucketStatus, setBucketStatus] = useState<"checking" | "exists" | "not-found" | "error">("checking")
  const [buckets, setBuckets] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated" | "error">("checking")
  const [detailedError, setDetailedError] = useState<any>(null)
  const [supabaseUrl, setSupabaseUrl] = useState<string | null>(null)

  const BUCKET_NAME = "workshop-images"

  const runDiagnostics = async () => {
    setIsLoading(true)
    setConnectionStatus("checking")
    setBucketStatus("checking")
    setAuthStatus("checking")
    setErrorMessage(null)
    setDetailedError(null)

    try {
      // Step 1: Check if we can connect to Supabase
      setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || null)

      // Simple health check
      const { data: healthData, error: healthError } = await supabase
        .from("admin_roles")
        .select("count()", { count: "exact" })
        .limit(1)

      if (healthError) {
        setConnectionStatus("error")
        setErrorMessage(`Connection error: ${healthError.message}`)
        setDetailedError(healthError)
        return
      }

      setConnectionStatus("success")

      // Step 2: Check authentication status
      const { data: authData } = await supabase.auth.getSession()

      if (authData?.session) {
        setAuthStatus("authenticated")
      } else {
        setAuthStatus("unauthenticated")
      }

      // Step 3: Check if the bucket exists
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        setBucketStatus("error")
        setErrorMessage(`Bucket list error: ${bucketsError.message}`)
        setDetailedError(bucketsError)
        return
      }

      setBuckets(bucketsData.map((b) => b.name))

      const bucketExists = bucketsData.some((bucket) => bucket.name === BUCKET_NAME)

      if (bucketExists) {
        setBucketStatus("exists")
      } else {
        setBucketStatus("not-found")
      }
    } catch (error) {
      setConnectionStatus("error")
      setErrorMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      setDetailedError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const createBucket = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      })

      if (error) {
        setErrorMessage(`Failed to create bucket: ${error.message}`)
        setDetailedError(error)
        return
      }

      // Refresh diagnostics
      await runDiagnostics()
    } catch (error) {
      setErrorMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      setDetailedError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Diagnostics</CardTitle>
          <CardDescription>Checking connection to Supabase and storage bucket status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="font-medium">Connection Status:</div>
              <div className="flex items-center gap-2">
                {connectionStatus === "checking" && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
                {connectionStatus === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                <span>
                  {connectionStatus === "checking" && "Checking connection..."}
                  {connectionStatus === "success" && "Connected to Supabase"}
                  {connectionStatus === "error" && "Connection failed"}
                </span>
              </div>
              {supabaseUrl && <div className="text-sm text-muted-foreground">URL: {supabaseUrl}</div>}
            </div>

            <div className="grid gap-2">
              <div className="font-medium">Authentication Status:</div>
              <div className="flex items-center gap-2">
                {authStatus === "checking" && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
                {authStatus === "authenticated" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {authStatus === "unauthenticated" && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                {authStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                <span>
                  {authStatus === "checking" && "Checking authentication..."}
                  {authStatus === "authenticated" && "Authenticated"}
                  {authStatus === "unauthenticated" && "Not authenticated (anonymous access)"}
                  {authStatus === "error" && "Authentication error"}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="font-medium">Storage Bucket Status:</div>
              <div className="flex items-center gap-2">
                {bucketStatus === "checking" && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
                {bucketStatus === "exists" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {bucketStatus === "not-found" && <XCircle className="h-5 w-5 text-red-500" />}
                {bucketStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                <span>
                  {bucketStatus === "checking" && "Checking bucket..."}
                  {bucketStatus === "exists" && `Bucket "${BUCKET_NAME}" exists`}
                  {bucketStatus === "not-found" && `Bucket "${BUCKET_NAME}" not found`}
                  {bucketStatus === "error" && "Error checking bucket"}
                </span>
              </div>
              {buckets.length > 0 && (
                <div className="text-sm text-muted-foreground">Available buckets: {buckets.join(", ")}</div>
              )}
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {detailedError && (
              <div className="rounded-md bg-muted p-4">
                <p className="font-medium">Detailed Error:</p>
                <pre className="mt-2 max-h-[200px] overflow-auto text-xs">{JSON.stringify(detailedError, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={runDiagnostics} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Diagnostics
              </>
            )}
          </Button>

          {bucketStatus === "not-found" && (
            <Button onClick={createBucket} disabled={isLoading} variant="secondary">
              Create Bucket
            </Button>
          )}
        </CardFooter>
      </Card>

      {bucketStatus === "exists" && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Bucket Policies</CardTitle>
            <CardDescription>Check and configure RLS policies for the "{BUCKET_NAME}" bucket</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Make sure your bucket has the following RLS policies:
                  <ul className="mt-2 list-disc pl-5">
                    <li>Public SELECT policy for reading images</li>
                    <li>Authenticated INSERT policy for uploading images</li>
                    <li>Authenticated UPDATE policy for modifying images</li>
                    <li>Authenticated DELETE policy for removing images</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="rounded-md bg-muted p-4">
                <p className="font-medium">SQL to Create Policies:</p>
                <pre className="mt-2 overflow-auto text-xs">
                  {`-- Policy for public read access to workshop images
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'workshop-images');

-- Policy for authenticated users to upload images
CREATE POLICY "Authenticated Upload Access" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'workshop-images' AND auth.role() = 'authenticated');

-- Policy for authenticated users to update their own images
CREATE POLICY "Authenticated Update Access" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'workshop-images' AND auth.role() = 'authenticated');

-- Policy for authenticated users to delete their own images
CREATE POLICY "Authenticated Delete Access" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'workshop-images' AND auth.role() = 'authenticated');`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
