"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon, AlertCircle, Loader2 } from "lucide-react"
import NextImage from "next/image" // Renamed to avoid conflict
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // Add state for preview image
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Clean up preview image when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      if (previewImage) {
        URL.revokeObjectURL(previewImage)
        setPreviewImage(null)
      }
      setSelectedFile(null)
    }
  }, [isDialogOpen, previewImage])

  // Update the handleUpload function to use our new API route and handle errors better
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("No file selected")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", selectedFile)
      
      // Add filename and content type explicitly to help the server identify the file correctly
      formData.append("filename", selectedFile.name)
      formData.append("contentType", selectedFile.type)

      console.log("Uploading file:", selectedFile.name, "type:", selectedFile.type, "size:", selectedFile.size)

      // First test if API is reachable
      console.log("Testing API connectivity...")
      try {
        const testResponse = await fetch("/api/test", {
          method: "POST",
        })
        console.log("API test response:", testResponse.status)
        if (!testResponse.ok) {
          throw new Error("API is not accessible")
        }
      } catch (testError) {
        console.error("API test failed:", testError)
        throw new Error("Cannot connect to server. Please check your connection and try again.")
      }

      // Send the file to our API route
      console.log("Sending upload request...")
      const response = await fetch("/api/s3/upload", {
        method: "POST",
        body: formData,
      })

      console.log("Upload response status:", response.status, response.statusText)

      let data
      try {
        // Try to parse the response as JSON
        data = await response.json()
        console.log("Upload response data:", data)
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        // If response isn't JSON, get the text for debugging
        const text = await response.text()
        console.error("Response text:", text)
        throw new Error(`Upload failed: ${response.status} ${response.statusText}. Server returned invalid response.`)
      }

      if (!response.ok) {
        // Handle non-200 responses
        const errorMessage = data?.error || `Upload failed: ${response.status} ${response.statusText}`
        console.error("Upload error details:", data)
        throw new Error(errorMessage)
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to upload image")
      }

      console.log("Upload successful, image URL:", data.url)

      // Call the onChange handler with the new URL
      onChange(data.url)
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error uploading image:", error)
      let errorMessage = "Failed to upload image"
      
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage = "Network error: Cannot connect to server. Please check your internet connection."
        } else if (error.message.includes("Server configuration error")) {
          errorMessage = "Server configuration issue. Please contact support."
        } else {
          errorMessage = error.message
        }
      }
      
      setUploadError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)

    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    console.log("File selected:", file.name, file.type, file.size)

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File size must be less than 2MB")
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("File must be in JPG, JPEG, PNG, or WEBP format")
      return
    }

    // Create preview and validate dimensions
    const objectUrl = URL.createObjectURL(file)
    setPreviewImage(objectUrl)

    // Use window.Image instead of just Image to ensure we use the browser's built-in Image constructor
    const img = new window.Image()
    img.onload = () => {
      if (img.width < 800 || img.height < 600) {
        setUploadError("Image resolution must be at least 800x600 pixels")
        setPreviewImage(null)
        URL.revokeObjectURL(objectUrl)
        return
      }

      // If all validations pass, set the selected file
      setSelectedFile(file)
    }

    img.onerror = () => {
      setUploadError("Failed to load image. Please try another file.")
      setPreviewImage(null)
      URL.revokeObjectURL(objectUrl)
    }

    img.src = objectUrl
  }

  const handleRemove = () => {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSelectNewFile = () => {
    // Clear previous file and errors
    setUploadError(null)
    setSelectedFile(null)
    if (previewImage) {
      URL.revokeObjectURL(previewImage)
      setPreviewImage(null)
    }

    // Trigger file input click
    fileInputRef.current?.click()
  }

  const openImageDialog = () => {
    // Reset states when opening dialog
    setUploadError(null)
    setSelectedFile(null)
    if (previewImage) {
      URL.revokeObjectURL(previewImage)
      setPreviewImage(null)
    }
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="relative aspect-video w-full max-w-[400px] overflow-hidden rounded-md border border-border">
          <NextImage
            src={value || "/placeholder.svg"}
            alt="Workshop image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && openImageDialog()}
          className={`flex aspect-video w-full max-w-[400px] flex-col items-center justify-center rounded-md border border-dashed border-border ${
            !disabled ? "cursor-pointer bg-muted/30 hover:bg-muted/50" : "bg-muted/10"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2 p-4 text-center">
            <div className="rounded-full bg-background p-2">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">Click to add an image</div>
            <div className="text-xs text-muted-foreground">Upload a JPG, PNG or WEBP image (max 2MB)</div>
          </div>
        </div>
      )}

      <div>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={openImageDialog}>
          <ImageIcon className="mr-2 h-4 w-4" />
          {value ? "Change image" : "Add image"}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
            <DialogDescription>
              Upload an image for your workshop. The image should be in JPG, PNG, or WEBP format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              {previewImage ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border">
                  <NextImage
                    src={previewImage || "/placeholder.svg"}
                    alt="Selected image preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={handleSelectNewFile}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 hover:bg-muted/50"
                >
                  <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or WEBP. Max size 2MB. Min resolution 800x600px.
                  </p>
                </div>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {previewImage ? (
                <Button type="button" onClick={handleUpload} disabled={isUploading || !selectedFile} className="w-full">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Image"
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Select File
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}