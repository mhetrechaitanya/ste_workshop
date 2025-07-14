const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...')
  
  const bucketName = 'workshop-images'
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName)
    
    if (bucketExists) {
      console.log('✅ Bucket already exists')
      
      // Make sure it's public
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: 2097152 // 2MB
      })
      
      if (updateError) {
        console.warn(`⚠️  Could not update bucket settings: ${updateError.message}`)
      } else {
        console.log('✅ Bucket settings updated')
      }
    } else {
      console.log('📦 Creating bucket...')
      
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 2097152 // 2MB
      })
      
      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`)
      }
      
      console.log('✅ Bucket created successfully')
    }
    
    // Test upload
    console.log('🧪 Testing upload...')
    
    // Create a tiny test image (1x1 transparent pixel)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    const testImageBuffer = Buffer.from(testImageBase64, 'base64')
    
    const testFileName = `test-${Date.now()}.png`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      throw new Error(`Test upload failed: ${uploadError.message}`)
    }
    
    console.log('✅ Test upload successful')
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFileName)
    
    console.log(`🔗 Test file URL: ${urlData.publicUrl}`)
    
    // Clean up test file
    await supabase.storage.from(bucketName).remove([testFileName])
    console.log('🧹 Test file cleaned up')
    
    console.log('🎉 Storage setup complete!')
    console.log('\n💡 Your workshop image uploads should now work!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupStorage() 