// Simple URL Field Extractor - Supabase Edge Function
// Deploy: supabase functions deploy simple-extractor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, fields } = await req.json();

    // Validate inputs
    if (!url || !fields) {
      throw new Error("Missing required parameters: url and fields");
    }

    // Fetch the webpage
    console.log(`Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    // Get HTML content
    const html = await response.text();
    
    // Extract text content from HTML (simple approach)
    const textContent = extractTextFromHTML(html);
    console.log(`Extracted ${textContent.length} characters of text`);

    // Create extraction prompt
    const prompt = createPrompt(fields, textContent);

    // Call OpenAI
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a web data extractor. Extract the requested information and return ONLY valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 1000
      }),
    });

    if (!completion.ok) {
      const error = await completion.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await completion.json();
    const extractedData = JSON.parse(result.choices[0].message.content);

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        url: url
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// Simple HTML text extraction
function extractTextFromHTML(html: string): string {
  // Remove script and style content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  
  // Extract text from common content tags
  const contentPatterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi,
    /<p[^>]*>([^<]+)<\/p>/gi,
    /<span[^>]*>([^<]+)<\/span>/gi,
    /<div[^>]*>([^<]+)<\/div>/gi,
    /<li[^>]*>([^<]+)<\/li>/gi,
    /<td[^>]*>([^<]+)<\/td>/gi,
    /<meta\s+name="description"\s+content="([^"]+)"/i,
    /<meta\s+property="og:title"\s+content="([^"]+)"/i,
    /<meta\s+property="og:description"\s+content="([^"]+)"/i,
  ];

  let extractedText = "";
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    extractedText += `Title: ${titleMatch[1].trim()}\n\n`;
  }

  // Extract meta description
  const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (metaMatch) {
    extractedText += `Description: ${metaMatch[1].trim()}\n\n`;
  }

  // Remove all HTML tags and get plain text
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  
  // Limit text length to avoid token limits
  const maxLength = 4000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + "...";
  }

  return extractedText + "Content:\n" + text;
}

// Create extraction prompt
function createPrompt(fields: any, content: string): string {
  const fieldDescriptions = Object.entries(fields)
    .map(([name, field]: [string, any]) => {
      return `- ${name}: ${field.description} (type: ${field.type})`;
    })
    .join("\n");

  return `Extract the following information from this webpage content:

${fieldDescriptions}

Return the data as a JSON object with these exact field names.
For missing fields, use null.
Ensure numbers are returned as numbers, not strings.

Webpage content:
${content}`;
}

/* 
Example usage:

POST /functions/v1/simple-extractor
{
  "url": "https://example.com/product",
  "fields": {
    "title": {
      "type": "string",
      "description": "Product title"
    },
    "price": {
      "type": "number", 
      "description": "Product price as a number"
    },
    "available": {
      "type": "boolean",
      "description": "Is the product in stock?"
    }
  }
}

Response:
{
  "success": true,
  "data": {
    "title": "Example Product",
    "price": 99.99,
    "available": true
  },
  "url": "https://example.com/product"
}
*/