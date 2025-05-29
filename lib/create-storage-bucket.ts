import { supabase } from "./supabase"

export async function createStorageBucket(bucketName: string) {
  try {
    console.log(`Checking if bucket ${bucketName} exists...`)

    // First, check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return {
        success: false,
        message: `Error checking if bucket exists: ${listError.message}`,
      }
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    if (bucketExists) {
      console.log(`Bucket ${bucketName} already exists`)

      // Update bucket to be public
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: 2097152, // 2MB in bytes
      })

      if (updateError) {
        console.error("Error updating bucket to be public:", updateError)
        return {
          success: true,
          message: `Bucket exists but could not update settings: ${updateError.message}`,
        }
      }

      return { success: true, message: `Bucket ${bucketName} already exists and is now public` }
    }

    console.log(`Creating bucket ${bucketName}...`)

    // Create the bucket if it doesn't exist
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 2097152, // 2MB in bytes
    })

    if (createError) {
      console.error("Error creating bucket:", createError)
      return {
        success: false,
        message: `Error creating bucket: ${createError.message}`,
      }
    }

    console.log(`Bucket ${bucketName} created successfully`)
    return { success: true, message: `Bucket ${bucketName} created successfully` }
  } catch (error) {
    console.error("Unexpected error in createStorageBucket:", error)
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
