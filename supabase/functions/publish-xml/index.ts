
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { items, bucket = 'xml-storage' } = await req.json()

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Items array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Publishing ${items.length} XML files to bucket: ${bucket}`)

    const results = []
    
    for (const item of items) {
      const { path, content } = item
      
      if (!path || !content) {
        console.error('Invalid item:', item)
        results.push({ path, success: false, error: 'Path and content are required' })
        continue
      }
      
      try {
        // Convert content to blob for upload
        const blob = new Blob([content], { type: 'application/xml' })
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(`published/${path}`, blob, {
            upsert: true,
            contentType: 'application/xml'
          })

        if (error) {
          console.error(`Error publishing ${path}:`, error)
          results.push({ path, success: false, error: error.message })
        } else {
          console.log(`Successfully published: ${path}`)
          results.push({ path, success: true, data: data.path })
        }
      } catch (itemError) {
        console.error(`Exception publishing ${path}:`, itemError)
        results.push({ path, success: false, error: itemError.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        publishedCount: successCount,
        totalCount: items.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Publish XML function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
