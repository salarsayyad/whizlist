// Supabase Edge Function ▸ URL Field Extractor (Hyperbrowser)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Hyperbrowser } from "npm:@hyperbrowser/sdk"
import { z } from "npm:zod"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json()
    const { urls, prompt, schema } = body

    // Validate inputs
    if (!urls || !Array.isArray(urls) || urls.length === 0 || !prompt || !schema) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request. Please provide urls array, prompt, and schema.' 
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

    // Create Zod schema from the provided schema object
    const zodSchema = z.object(
      Object.entries(schema).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value.type === "string" ? z.string().nullable() : z.any()
      }), {})
    )

    // Extract data from URL
    const result = await client.extract.startAndWait({
      urls,
      prompt,
      schema: zodSchema,
      sessionOptions: {
        useStealth: true,
        solveCaptchas: true,
      },
    })

    // Return extracted data
    return new Response(
      JSON.stringify({
        success: true,
        data: result // Return first result since we only support one URL for now
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