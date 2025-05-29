"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function StorageDiagnostics() {
  const [buckets, setBuckets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testBucketName] = useState("workshop-images")
  const [testBucketStatus, setTestBucketStatus] = useState<"checking" | "exists" | "not-exists" | "error">("checking")
  const [testFileStatus, setTestFileStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [testFileError, setTestFileError] = useState<string | null>(null)
  const [testFileUrl, setTestFileUrl] = useState<string | null>(null)

  const fetchBuckets = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.storage.listBuckets()
      if (error) throw error
      setBuckets(data || [])

      // Check if test bucket exists
      const bucketExists = data?.some((bucket) => bucket.name === testBucketName)
      setTestBucketStatus(bucketExists ? "exists" : "not-exists")
    } catch (err) {
      console.error("Error fetching buckets:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch buckets")
      setTestBucketStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const createTestBucket = async () => {
    setTestBucketStatus("checking")
    try {
      const { error } = await supabase.storage.createBucket(testBucketName, {
        public: true,
      })
      if (error) throw error

      // Update bucket to be public
      await supabase.storage.updateBucket(testBucketName, {
        public: true,
      })

      setTestBucketStatus("exists")
      fetchBuckets()
    } catch (err) {
      console.error("Error creating test bucket:", err)
      setTestBucketStatus("error")
    }
  }

  const testFileUpload = async () => {
    setTestFileStatus("uploading")
    setTestFileError(null)
    setTestFileUrl(null)

    try {
      // Create a small test file (1x1 transparent pixel)
      const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "image/png" })
      const file = new File([blob], "test-pixel.png", { type: "image/png" })

      // Upload the test file
      const fileName = `test-${Date.now()}.png`
      const { data, error: uploadError } = await supabase.storage.from(testBucketName).upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: urlData } = supabase.storage.from(testBucketName).getPublicUrl(fileName)

      setTestFileUrl(urlData.publicUrl)
      setTestFileStatus("success")
    } catch (err) {
      console.error("Error in test upload:", err)
      setTestFileError(err instanceof Error ? err.message : "Unknown error")
      setTestFileStatus("error")
    }
  }

  useEffect(() => {
    fetchBuckets()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Storage Diagnostics</CardTitle>
        <CardDescription>Test and troubleshoot Supabase Storage functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Available Buckets</h3>
          <Button variant="outline" size="sm" onClick={fetchBuckets} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <div className="p-4">
            {loading ? (
              <div className="text-center py-4">Loading buckets...</div>
            ) : buckets.length > 0 ? (
              <ul className="space-y-2">
                {buckets.map((bucket) => (
                  <li key={bucket.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                    <span className="font-medium">{bucket.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${bucket.public ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {bucket.public ? "Public" : "Private"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No buckets found</div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Test Bucket: {testBucketName}</h3>

          <div className="rounded-md border p-4">
            <div className="flex items-center mb-4">
              <div className="mr-4">
                {testBucketStatus === "checking" && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
                {testBucketStatus === "exists" && <CheckCircle className="h-5 w-5 text-green-500" />}
                {testBucketStatus === "not-exists" && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                {testBucketStatus === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
              <div>
                <p className="font-medium">
                  {testBucketStatus === "checking" && "Checking bucket..."}
                  {testBucketStatus === "exists" && "Bucket exists"}
                  {testBucketStatus === "not-exists" && "Bucket does not exist"}
                  {testBucketStatus === "error" && "Error checking bucket"}
                </p>
              </div>
            </div>

            {testBucketStatus === "not-exists" && (
              <Button onClick={createTestBucket} variant="secondary" size="sm">
                Create Test Bucket
              </Button>
            )}

            {testBucketStatus === "exists" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Test File Upload</h4>
                  <Button
                    onClick={testFileUpload}
                    variant="outline"
                    size="sm"
                    disabled={testFileStatus === "uploading"}
                  >
                    {testFileStatus === "uploading" ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Test File"
                    )}
                  </Button>
                </div>

                {testFileStatus === "success" && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Upload Successful</AlertTitle>
                    <AlertDescription>
                      <p>Test file was uploaded successfully.</p>
                      {testFileUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">File URL:</p>
                          <a
                            href={testFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs break-all text-blue-500 hover:underline"
                          >
                            {testFileUrl}
                          </a>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {testFileStatus === "error" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Upload Failed</AlertTitle>
                    <AlertDescription>
                      {testFileError || "An unknown error occurred during the test upload."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)}...
        </p>
      </CardFooter>
    </Card>
  )
}
