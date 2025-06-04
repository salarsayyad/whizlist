// Supabase Edge Function ▸ URL Field Extractor (Hyperbrowser)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Hyperbrowser } from "https://esm.sh/@hyperbrowser/sdk"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Field {
  name: string
  description: string
  dataType: string
  required?: boolean
  selector?: string
  fallbackSelectors?: string[]
}

interface RequestBody {
  url: string
  fields: Field[]
  options?: {
    waitForSelectors?: string[]
    timeout?: number
    retries?: number
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json()
    const { url, fields, options = {} } = body

    // Validate inputs
    if (!url || !fields || !Array.isArray(fields) || fields.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request. Please provide url and fields array.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Hyperbrowser API key from environment
    const apiKey = Deno.env.get('HYPERBROWSER_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Hyperbrowser API key not configured' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Hyperbrowser client
    const client = new Hyperbrowser({ apiKey })

    // Extract data from URL using provided selectors
    const result = await client.extract.startAndWait({
      urls: [url],
      selectors: fields.map(field => ({
        name: field.name,
        selector: field.selector,
        fallbackSelectors: field.fallbackSelectors,
        required: field.required
      })),
      options: {
        waitForSelectors: options.waitForSelectors,
        timeout: options.timeout,
        retries: options.retries
      }
    })

    // Return extracted data
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Extraction error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to extract data', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})