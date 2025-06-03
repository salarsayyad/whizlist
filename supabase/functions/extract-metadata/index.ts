// Follow this deploy guide to integrate the Deno runtime:
// https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chromium } from "npm:playwright@1.40.0";
import { z } from "npm:zod@3.22.4";
import OpenAI from "npm:openai@4.20.1";
import Anthropic from "npm:@anthropic-ai/sdk@0.16.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Request validation schema
const RequestSchema = z.object({
  url: z.string().url(),
  fields: z.record(z.object({
    type: z.enum(["string", "number", "boolean", "array", "object"]),
    description: z.string(),
    required: z.boolean().optional().default(true),
    items: z.any().optional(),
    properties: z.any().optional(),
  })),
  llm: z.object({
    provider: z.enum(["openai", "anthropic"]).default("openai"),
    model: z.string().optional(),
    apiKey: z.string().optional(),
  }).optional(),
  options: z.object({
    waitForSelector: z.string().optional(),
    waitForTimeout: z.number().optional().default(3000),
    fullPage: z.boolean().optional().default(false),
    userAgent: z.string().optional(),
    viewport: z.object({
      width: z.number(),
      height: z.number(),
    }).optional(),
    timeout: z.number().optional().default(30000),
  }).optional(),
});

// Convert field definitions to a structured prompt
function createExtractionPrompt(fields: Record<string, any>): string {
  const fieldDescriptions = Object.entries(fields)
    .map(([name, field]) => {
      let typeInfo = `- ${name} (${field.type}): ${field.description}`;
      if (field.type === "array" && field.items) {
        typeInfo += ` [array of ${field.items.type || 'items'}]`;
      }
      if (field.type === "object" && field.properties) {
        const props = Object.keys(field.properties).join(", ");
        typeInfo += ` {properties: ${props}}`;
      }
      if (field.required === false) {
        typeInfo += " (optional)";
      }
      return typeInfo;
    })
    .join("\n");

  return `Extract the following information from the webpage content and screenshot:

${fieldDescriptions}

Return the extracted data as a valid JSON object with the exact field names specified above. 
For arrays, return empty arrays [] if no items found.
For optional fields, omit them if not found.
Ensure numbers are returned as actual numbers, not strings.
For booleans, return true or false based on the content.`;
}

// Convert fields to JSON schema for structured output
function createJsonSchema(fields: Record<string, any>): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    let fieldSchema: any = {
      description: fieldDef.description,
    };

    switch (fieldDef.type) {
      case "string":
        fieldSchema.type = "string";
        break;
      case "number":
        fieldSchema.type = "number";
        break;
      case "boolean":
        fieldSchema.type = "boolean";
        break;
      case "array":
        fieldSchema.type = "array";
        if (fieldDef.items) {
          fieldSchema.items = createJsonSchema({ item: fieldDef.items }).properties.item;
        } else {
          fieldSchema.items = { type: "string" };
        }
        break;
      case "object":
        fieldSchema.type = "object";
        if (fieldDef.properties) {
          const nestedSchema = createJsonSchema(fieldDef.properties);
          fieldSchema.properties = nestedSchema.properties;
          if (nestedSchema.required?.length > 0) {
            fieldSchema.required = nestedSchema.required;
          }
        } else {
          fieldSchema.properties = {};
        }
        break;
    }

    properties[fieldName] = fieldSchema;
    if (fieldDef.required !== false) {
      required.push(fieldName);
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

// Extract content using OpenAI
async function extractWithOpenAI(
  content: string,
  screenshot: string,
  fields: Record<string, any>,
  apiKey: string,
  model: string = "gpt-4-vision-preview"
): Promise<any> {
  const openai = new OpenAI({ apiKey });
  const prompt = createExtractionPrompt(fields);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a web data extraction expert. Extract the requested information accurately from the provided webpage content and screenshot."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "text", text: `\n\nWebpage content:\n${content.substring(0, 10000)}` },
            { 
              type: "image_url", 
              image_url: { 
                url: `data:image/png;base64,${screenshot}`,
                detail: "high"
              } 
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 4096,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(result);
  } catch (error) {
    console.error("OpenAI extraction error:", error);
    throw new Error(`OpenAI extraction failed: ${error.message}`);
  }
}

// Extract content using Anthropic
async function extractWithAnthropic(
  content: string,
  screenshot: string,
  fields: Record<string, any>,
  apiKey: string,
  model: string = "claude-3-opus-20240229"
): Promise<any> {
  const anthropic = new Anthropic({ apiKey });
  const prompt = createExtractionPrompt(fields);

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0,
      system: "You are a web data extraction expert. Extract the requested information accurately from the provided webpage content and screenshot. Always respond with valid JSON only.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "text", text: `\n\nWebpage content:\n${content.substring(0, 10000)}` },
            { 
              type: "image", 
              source: {
                type: "base64",
                media_type: "image/png",
                data: screenshot
              }
            }
          ]
        }
      ]
    });

    const result = response.content[0]?.text;
    if (!result) {
      throw new Error("No response from Anthropic");
    }

    // Extract JSON from the response (in case it includes explanatory text)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON in response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Anthropic extraction error:", error);
    throw new Error(`Anthropic extraction failed: ${error.message}`);
  }
}

// Clean and extract text content from page
async function getPageContent(page: any): Promise<string> {
  return await page.evaluate(() => {
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());

    // Get text content
    const textContent = document.body.innerText || document.body.textContent || '';
    
    // Also get important metadata
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const h1 = document.querySelector('h1')?.innerText || '';
    
    // Get structured data if available
    const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(script => {
        try {
          return JSON.parse(script.textContent || '');
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Combine all content
    let content = `Title: ${title}\n`;
    if (metaDescription) content += `Description: ${metaDescription}\n`;
    if (h1 && h1 !== title) content += `H1: ${h1}\n`;
    content += `\nContent:\n${textContent}`;
    
    if (jsonLd.length > 0) {
      content += `\n\nStructured Data:\n${JSON.stringify(jsonLd, null, 2)}`;
    }

    return content;
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let browser = null;

  try {
    // Parse and validate request
    const body = await req.json();
    const validatedData = RequestSchema.parse(body);

    // Initialize browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      userAgent: validatedData.options?.userAgent,
      viewport: validatedData.options?.viewport || { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    // Set timeout
    const timeoutMs = validatedData.options?.timeout || 30000;
    page.setDefaultTimeout(timeoutMs);

    // Navigate to URL
    console.log(`Navigating to: ${validatedData.url}`);
    await page.goto(validatedData.url, {
      waitUntil: 'networkidle',
      timeout: timeoutMs,
    });

    // Wait for specific selector if provided
    if (validatedData.options?.waitForSelector) {
      await page.waitForSelector(validatedData.options.waitForSelector, {
        timeout: timeoutMs,
      });
    }

    // Additional wait time
    if (validatedData.options?.waitForTimeout) {
      await page.waitForTimeout(validatedData.options.waitForTimeout);
    }

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: validatedData.options?.fullPage || false,
      type: 'png',
    });
    const screenshot = screenshotBuffer.toString('base64');

    // Get page content
    const content = await getPageContent(page);

    // Close browser before LLM call to free resources
    await browser.close();
    browser = null;

    // Extract data using LLM
    const llmProvider = validatedData.llm?.provider || 'openai';
    const apiKey = validatedData.llm?.apiKey || 
      (llmProvider === 'anthropic' 
        ? Deno.env.get('ANTHROPIC_API_KEY')
        : Deno.env.get('OPENAI_API_KEY'));

    if (!apiKey) {
      throw new Error(`API key not provided for ${llmProvider}`);
    }

    let extractedData;
    if (llmProvider === 'anthropic') {
      extractedData = await extractWithAnthropic(
        content,
        screenshot,
        validatedData.fields,
        apiKey,
        validatedData.llm?.model
      );
    } else {
      extractedData = await extractWithOpenAI(
        content,
        screenshot,
        validatedData.fields,
        apiKey,
        validatedData.llm?.model
      );
    }

    // Validate extracted data matches schema
    const responseSchema = createJsonSchema(validatedData.fields);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        metadata: {
          url: validatedData.url,
          extractedAt: new Date().toISOString(),
          contentLength: content.length,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Extraction error:", error);

    // Clean up browser if still open
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    // Determine error details
    let status = 500;
    let errorMessage = "Internal server error";

    if (error instanceof z.ZodError) {
      status = 400;
      errorMessage = `Invalid request: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message?.includes('API key')) {
      status = 401;
      errorMessage = error.message;
    } else if (error.message?.includes('timeout')) {
      status = 408;
      errorMessage = "Page load timeout";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
      }
    );
  }
});

/* Example usage:

POST /functions/v1/smart-extractor
{
  "url": "https://example.com/product",
  "fields": {
    "productName": {
      "type": "string",
      "description": "The main product title"
    },
    "price": {
      "type": "number",
      "description": "Product price as a number"
    },
    "availability": {
      "type": "boolean",
      "description": "Is the product in stock?"
    },
    "images": {
      "type": "array",
      "description": "All product image URLs",
      "items": {
        "type": "string"
      }
    },
    "specifications": {
      "type": "object",
      "description": "Product specifications",
      "properties": {
        "weight": { "type": "string" },
        "dimensions": { "type": "string" },
        "material": { "type": "string" }
      },
      "required": false
    }
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4-vision-preview"
  },
  "options": {
    "waitForTimeout": 2000,
    "fullPage": false
  }
}
*/