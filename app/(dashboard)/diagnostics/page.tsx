"use client"

import { useState } from "react"
import { SupabaseDiagnostics } from "@/components/supabase-diagnostics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUpload } from "@/components/ui/image-upload"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function DiagnosticsPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const testDirectUpload = async () => {
    try {
      setTestResult(null)

      // Create a small test file (1x1 transparent pixel)
      const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
      const byteString = window.atob(base64Data)
      const arrayBuffer = new ArrayBuffer(byteString.length)
      const int8Array = new Uint8Array(arrayBuffer)
      for (let i = 0; i < byteString.length; i++) {
        int8Array[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([int8Array], { type: "image/png" })
      const file = new File([blob], "test-pixel.png", { type: "image/png" })

      // Try to upload directly to Supabase
      const { data, error } = await supabase.storage.from("workshop-images").upload(`test-${Date.now()}.png`, file)

      if (error) {
        setTestResult({
          success: false,
          message: `Upload failed: ${error.message}`,
        })
      } else {
        // Get the URL
        const { data: urlData } = supabase.storage.from("workshop-images").getPublicUrl(data.path)

        setTestResult({
          success: true,
          message: `Upload successful! Path: ${data.path}`,
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">System Diagnostics</h1>

      <Tabs defaultValue="supabase">
        <TabsList>
          <TabsTrigger value="supabase">Supabase Storage</TabsTrigger>
          <TabsTrigger value="image-upload">Image Upload Test</TabsTrigger>
          <TabsTrigger value="direct-test">Direct Upload Test</TabsTrigger>
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="supabase" className="mt-6">
          <SupabaseDiagnostics />
        </TabsContent>

        <TabsContent value="image-upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Image Upload</CardTitle>
              <CardDescription>Try uploading an image to test if the storage integration is working</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload value={imageUrl} onChange={setImageUrl} />

              {imageUrl && (
                <div className="mt-4">
                  <p className="mb-2 font-medium">Uploaded Image URL:</p>
                  <code className="block w-full overflow-x-auto rounded bg-muted p-2 text-sm">{imageUrl}</code>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direct-test" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Direct Upload Test</CardTitle>
              <CardDescription>Test a direct upload to Supabase Storage bypassing the component</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testDirectUpload}>Test Direct Upload</Button>

                {testResult && (
                  <Alert variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{testResult.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="env" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Check if your Supabase environment variables are properly set</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</p>
                  <p className="text-sm">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL
                      ? `✅ Set (${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...)`
                      : "❌ Not set"}
                  </p>
                </div>

                <div>
                  <p className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</p>
                  <p className="text-sm">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set (hidden for security)" : "❌ Not set"}
                  </p>
                </div>

                <div className="rounded-md bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    Note: Make sure these environment variables are correctly set in your deployment environment. If
                    you're running locally, check your .env.local file.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
