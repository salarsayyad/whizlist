// Supabase Edge Function ▸ URL Field Extractor (Hyperbrowser)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Hyperbrowser } from "https://esm.sh/@hyperbrowser/sdk"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Field {
  name: string
  description: string
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object'
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object'
  objectSchema?: Field[]
}

interface RequestBody {
  url: string
  fields: Field[]
}

// Helper function to build Zod schema from field definitions
function buildZodSchema(fields: Field[]): z.ZodObject<any> {
  const schemaObj: Record<string, any> = {}
  
  for (const field of fields) {
    switch (field.dataType) {
      case 'string':
        schemaObj[field.name] = z.string()
        break
      case 'number':
        schemaObj[field.name] = z.number()
        break
      case 'boolean':
        schemaObj[field.name] = z.boolean()
        break
      case 'array':
        if (field.arrayItemType === 'string') {
          schemaObj[field.name] = z.array(z.string())
        } else if (field.arrayItemType === 'number') {
          schemaObj[field.name] = z.array(z.number())
        } else if (field.arrayItemType === 'boolean') {
          schemaObj[field.name] = z.array(z.boolean())
        } else if (field.arrayItemType === 'object' && field.objectSchema) {
          schemaObj[field.name] = z.array(buildZodSchema(field.objectSchema))
        }
        break
      case 'object':
        if (field.objectSchema) {
          schemaObj[field.name] = buildZodSchema(field.objectSchema)
        }
        break
    }
  }
  
  return z.object(schemaObj)
}

// Helper function to build extraction prompt from field definitions
function buildExtractionPrompt(fields: Field[]): string {
  const fieldDescriptions = fields.map(field => {
    let desc = `- ${field.name}: ${field.description}`
    if (field.dataType === 'array' && field.arrayItemType === 'object' && field.objectSchema) {
      const subFields = field.objectSchema.map(f => `  - ${f.name}: ${f.description}`).join('\n')
      desc += `\n${subFields}`
    }
    return desc
  }).join('\n')
  
  return `Extract the following information from the page:\n${fieldDescriptions}`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json()
    const { url, fields } = body

    // Validate inputs
    if (!url || !fields || !Array.isArray(fields) || fields.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Please provide url and fields array.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Hyperbrowser API key from environment
    const apiKey = Deno.env.get('HYPERBROWSER_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Hyperbrowser API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Hyperbrowser client
    const client = new Hyperbrowser({ apiKey })

    // Build Zod schema and extraction prompt
    const schema = buildZodSchema(fields)
    const prompt = buildExtractionPrompt(fields)

    // Extract data from URL
    const result = await client.extract.startAndWait({
      urls: [url],
      prompt: prompt,
      schema: schema,
    })

    // Return extracted data
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        extractedFields: fields.map(f => f.name)
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

// Example request body:
/*
{
  "url": "https://example.com/product",
  "fields": [
    {
      "name": "productName",
      "description": "The name of the product",
      "dataType": "string"
    },
    {
      "name": "price",
      "description": "The price of the product",
      "dataType": "number"
    },
    {
      "name": "features",
      "description": "List of product features",
      "dataType": "array",
      "arrayItemType": "string"
    },
    {
      "name": "specifications",
      "description": "Technical specifications",
      "dataType": "array",
      "arrayItemType": "object",
      "objectSchema": [
        {
          "name": "spec",
          "description": "Specification name",
          "dataType": "string"
        },
        {
          "name": "value",
          "description": "Specification value",
          "dataType": "string"
        }
      ]
    }
  ]
}
*/