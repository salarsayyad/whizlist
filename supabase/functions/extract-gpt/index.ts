// supabase/functions/extract-web-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

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
  required?: boolean
  examples?: any[]
}

interface RequestBody {
  url: string
  fields: Field[]
  extractionMethod?: 'gpt' | 'claude' | 'structured' // Default to 'gpt'
  includeMetadata?: boolean
}

// Clean and prepare text content from HTML
function extractTextContent(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (!doc) return ''

  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, noscript')
  scripts.forEach(el => el.remove())

  // Extract meaningful content
  const contentSelectors = [
    'main', 'article', '[role="main"]', '.content', '#content',
    'body' // fallback to body if no main content area found
  ]

  let mainContent = ''
  for (const selector of contentSelectors) {
    const element = doc.querySelector(selector)
    if (element) {
      mainContent = element.textContent || ''
      break
    }
  }

  // If no main content found, use body
  if (!mainContent) {
    mainContent = doc.body?.textContent || ''
  }

  // Also extract specific valuable content
  const metadata: Record<string, string> = {}
  
  // Title
  const title = doc.querySelector('title')?.textContent || 
                doc.querySelector('h1')?.textContent || 
                doc.querySelector('[property="og:title"]')?.getAttribute('content') || ''
  if (title) metadata.title = title.trim()

  // Description
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                     doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''
  if (description) metadata.description = description.trim()

  // Extract structured data if present
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]')
  const structuredData: any[] = []
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}')
      structuredData.push(data)
    } catch (e) {
      // Ignore parsing errors
    }
  })

  // Compile final content
  let finalContent = mainContent.trim()
  
  // Add metadata to content for better extraction
  if (metadata.title) {
    finalContent = `Title: ${metadata.title}\n\n${finalContent}`
  }
  if (metadata.description) {
    finalContent = `Description: ${metadata.description}\n\n${finalContent}`
  }
  if (structuredData.length > 0) {
    finalContent = `${finalContent}\n\nStructured Data: ${JSON.stringify(structuredData, null, 2)}`
  }

  // Clean up excessive whitespace
  return finalContent.replace(/\s+/g, ' ').substring(0, 15000) // Limit content length
}

// Build extraction prompt for LLM
function buildExtractionPrompt(fields: Field[], content: string): string {
  const fieldDescriptions = fields.map(field => {
    let desc = `- ${field.name} (${field.dataType}): ${field.description}`
    if (field.required) desc += ' [REQUIRED]'
    if (field.examples && field.examples.length > 0) {
      desc += ` Examples: ${JSON.stringify(field.examples)}`
    }
    if (field.dataType === 'array' && field.arrayItemType === 'object' && field.objectSchema) {
      const subFields = field.objectSchema.map(f => 
        `    - ${f.name} (${f.dataType}): ${f.description}`
      ).join('\n')
      desc += `\n  Object structure:\n${subFields}`
    }
    return desc
  }).join('\n')

  const schema = generateJsonSchema(fields)

  return `Extract the following information from the provided web content.
Return the data as a valid JSON object matching this exact structure:

${JSON.stringify(schema, null, 2)}

Fields to extract:
${fieldDescriptions}

Important instructions:
1. Return ONLY valid JSON, no additional text or markdown
2. Use null for missing optional fields
3. For arrays, return empty array [] if no items found
4. For numbers, parse them correctly (remove currency symbols, commas, etc.)
5. For booleans, infer from context (presence of "free trial", "in stock", etc.)
6. Match the exact field names provided
7. Ensure all required fields have values

Web content:
${content}`
}

// Generate JSON schema example from fields
function generateJsonSchema(fields: Field[]): any {
  const schema: any = {}
  
  for (const field of fields) {
    switch (field.dataType) {
      case 'string':
        schema[field.name] = field.required ? "string value" : "string value or null"
        break
      case 'number':
        schema[field.name] = field.required ? 0 : "number or null"
        break
      case 'boolean':
        schema[field.name] = field.required ? true : "boolean or null"
        break
      case 'array':
        if (field.arrayItemType === 'object' && field.objectSchema) {
          schema[field.name] = [generateJsonSchema(field.objectSchema)]
        } else {
          schema[field.name] = [`${field.arrayItemType} values`]
        }
        break
      case 'object':
        if (field.objectSchema) {
          schema[field.name] = generateJsonSchema(field.objectSchema)
        } else {
          schema[field.name] = {}
        }
        break
    }
  }
  
  return schema
}

// Call OpenAI API for extraction
async function extractWithOpenAI(content: string, fields: Field[], apiKey: string): Promise<any> {
  const prompt = buildExtractionPrompt(fields, content)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extraction assistant. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

// Call Anthropic Claude API for extraction
async function extractWithClaude(content: string, fields: Field[], apiKey: string): Promise<any> {
  const prompt = buildExtractionPrompt(fields, content)
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content_text = data.content[0].text
  
  // Extract JSON from response (Claude might include some text around it)
  const jsonMatch = content_text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from Claude response')
  }
  
  return JSON.parse(jsonMatch[0])
}

// Fallback structured extraction without LLM
function structuredExtraction(doc: Document, fields: Field[]): any {
  const result: any = {}
  
  for (const field of fields) {
    switch (field.name) {
      // Common fields with known patterns
      case 'title':
      case 'productName':
      case 'name':
        result[field.name] = doc.querySelector('h1')?.textContent?.trim() ||
                            doc.querySelector('title')?.textContent?.trim() ||
                            doc.querySelector('[itemprop="name"]')?.textContent?.trim() ||
                            null
        break
        
      case 'price':
      case 'currentPrice':
        const priceText = doc.querySelector('[itemprop="price"]')?.textContent ||
                         doc.querySelector('.price')?.textContent ||
                         doc.querySelector('[class*="price"]')?.textContent ||
                         ''
        const priceMatch = priceText.match(/[\d,]+\.?\d*/)
        result[field.name] = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : null
        break
        
      case 'description':
      case 'productDescription':
        result[field.name] = doc.querySelector('[itemprop="description"]')?.textContent?.trim() ||
                            doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                            doc.querySelector('.description')?.textContent?.trim() ||
                            null
        break
        
      case 'images':
      case 'imageUrls':
        const images: string[] = []
        doc.querySelectorAll('img[itemprop="image"], .product-image img, [class*="gallery"] img')
          .forEach(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src')
            if (src) images.push(src)
          })
        result[field.name] = images
        break
        
      case 'inStock':
      case 'availability':
        const availText = doc.body?.textContent?.toLowerCase() || ''
        result[field.name] = availText.includes('in stock') || 
                           availText.includes('available') ||
                           !availText.includes('out of stock')
        break
        
      default:
        // For unknown fields, set to null or empty based on type
        if (field.dataType === 'array') {
          result[field.name] = []
        } else if (field.dataType === 'object') {
          result[field.name] = {}
        } else {
          result[field.name] = null
        }
    }
  }
  
  return result
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json()
    const { url, fields, extractionMethod = 'gpt', includeMetadata = false } = body

    // Validate inputs
    if (!url || !fields || !Array.isArray(fields) || fields.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Please provide url and fields array.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()
    const textContent = extractTextContent(html)
    
    // Perform extraction based on method
    let extractedData: any
    
    if (extractionMethod === 'structured') {
      // Use DOM-based extraction
      const doc = new DOMParser().parseFromString(html, 'text/html')
      if (!doc) throw new Error('Failed to parse HTML')
      extractedData = structuredExtraction(doc, fields)
    } else {
      // Use LLM-based extraction
      const apiKey = extractionMethod === 'claude' 
        ? Deno.env.get('ANTHROPIC_API_KEY')
        : Deno.env.get('OPENAI_API_KEY')
        
      if (!apiKey) {
        throw new Error(`${extractionMethod.toUpperCase()} API key not configured`)
      }

      if (extractionMethod === 'claude') {
        extractedData = await extractWithClaude(textContent, fields, apiKey)
      } else {
        extractedData = await extractWithOpenAI(textContent, fields, apiKey)
      }
    }

    // Prepare response
    const responseData: any = {
      success: true,
      data: extractedData,
      url: url
    }

    if (includeMetadata) {
      responseData.metadata = {
        extractionMethod,
        contentLength: textContent.length,
        timestamp: new Date().toISOString()
      }
    }

    return new Response(
      JSON.stringify(responseData),
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