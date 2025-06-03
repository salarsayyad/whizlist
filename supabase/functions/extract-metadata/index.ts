// Enhanced URL Field Extractor - Supabase Edge Function
// Deploy: supabase functions deploy enhanced-extractor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types inspired by HyperAgent
interface ExtractionField {
  name: string;
  description: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  selector?: string; // CSS selector for direct extraction
  xpath?: string; // XPath for more complex extraction
}

interface ExtractionRequest {
  url: string;
  fields: Record<string, ExtractionField>;
  options?: {
    waitForSelector?: string; // Wait for element to appear
    screenshot?: boolean; // Take screenshot if supported
    maxRetries?: number;
    retryDelay?: number;
    userAgent?: string;
    headers?: Record<string, string>;
  };
}

interface ExtractionStep {
  type: "fetch" | "parse" | "extract" | "validate";
  status: "pending" | "success" | "failed";
  message?: string;
  data?: any;
}

interface ExtractionResult {
  success: boolean;
  data?: Record<string, any>;
  url: string;
  steps: ExtractionStep[];
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
    contentLength?: number;
    extractionTime?: number;
  };
  error?: string;
}

// Retry mechanism inspired by HyperAgent
async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000 } = options;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Retry failed");
}

// Enhanced HTML content extraction
class ContentExtractor {
  private doc: any;
  private url: string;

  constructor(html: string, url: string) {
    const parser = new DOMParser();
    this.doc = parser.parseFromString(html, "text/html");
    this.url = url;
  }

  // Extract metadata
  extractMetadata(): Record<string, string> {
    const metadata: Record<string, string> = {};
    
    // Title
    const title = this.doc.querySelector("title")?.textContent || 
                  this.doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
                  this.doc.querySelector('meta[name="twitter:title"]')?.getAttribute("content");
    if (title) metadata.title = title.trim();

    // Description
    const description = this.doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
                       this.doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
                       this.doc.querySelector('meta[name="twitter:description"]')?.getAttribute("content");
    if (description) metadata.description = description.trim();

    // Image
    const image = this.doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
                 this.doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content");
    if (image) metadata.image = this.resolveUrl(image);

    // Structured data (prices, ratings, etc.)
    const jsonLdScripts = this.doc.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script: any) => {
      try {
        const data = JSON.parse(script.textContent);
        this.extractStructuredData(data, metadata);
      } catch (e) {
        // Ignore parse errors
      }
    });

    return metadata;
  }

  // Extract structured data from JSON-LD
  private extractStructuredData(data: any, metadata: Record<string, string>): void {
    if (data["@type"] === "Product" || data.type === "Product") {
      if (data.offers) {
        metadata.price = data.offers.price || data.offers.lowPrice;
        metadata.currency = data.offers.priceCurrency;
        metadata.availability = data.offers.availability;
      }
      if (data.aggregateRating) {
        metadata.rating = data.aggregateRating.ratingValue;
        metadata.reviewCount = data.aggregateRating.reviewCount;
      }
    }
  }

  // Resolve relative URLs
  private resolveUrl(relativeUrl: string): string {
    try {
      return new URL(relativeUrl, this.url).href;
    } catch {
      return relativeUrl;
    }
  }

  // Extract by CSS selector
  extractBySelector(selector: string): string | null {
    const element = this.doc.querySelector(selector);
    return element ? this.extractElementText(element) : null;
  }

  // Extract by XPath
  extractByXPath(xpath: string): string | null {
    // Note: deno-dom has limited XPath support, so we'll use CSS selectors as fallback
    // In a real implementation, you might want to use a more robust XPath library
    return null; // Placeholder
  }

  // Extract all text from an element
  private extractElementText(element: any): string {
    // Remove script and style elements
    const scripts = element.querySelectorAll("script, style");
    scripts.forEach((el: any) => el.remove());
    
    return element.textContent.trim();
  }

  // Extract tables as structured data
  extractTables(): any[] {
    const tables: any[] = [];
    const tableElements = this.doc.querySelectorAll("table");
    
    tableElements.forEach((table: any) => {
      const headers: string[] = [];
      const rows: any[] = [];
      
      // Extract headers
      const headerCells = table.querySelectorAll("thead th, thead td");
      headerCells.forEach((cell: any) => {
        headers.push(this.extractElementText(cell));
      });
      
      // Extract rows
      const rowElements = table.querySelectorAll("tbody tr");
      rowElements.forEach((row: any) => {
        const rowData: Record<string, string> = {};
        const cells = row.querySelectorAll("td, th");
        cells.forEach((cell: any, index: number) => {
          const header = headers[index] || `column_${index}`;
          rowData[header] = this.extractElementText(cell);
        });
        if (Object.keys(rowData).length > 0) {
          rows.push(rowData);
        }
      });
      
      if (rows.length > 0) {
        tables.push({ headers, rows });
      }
    });
    
    return tables;
  }

  // Extract lists as arrays
  extractLists(): string[][] {
    const lists: string[][] = [];
    const listElements = this.doc.querySelectorAll("ul, ol");
    
    listElements.forEach((list: any) => {
      const items: string[] = [];
      const listItems = list.querySelectorAll("li");
      listItems.forEach((item: any) => {
        const text = this.extractElementText(item);
        if (text) items.push(text);
      });
      if (items.length > 0) {
        lists.push(items);
      }
    });
    
    return lists;
  }

  // Get main content (inspired by readability algorithms)
  extractMainContent(): string {
    // Remove non-content elements
    const nonContentSelectors = [
      "script", "style", "nav", "header", "footer", 
      "aside", ".sidebar", ".advertisement", ".ad",
      "#comments", ".comments"
    ];
    
    nonContentSelectors.forEach(selector => {
      const elements = this.doc.querySelectorAll(selector);
      elements.forEach((el: any) => el.remove());
    });

    // Try to find main content container
    const contentSelectors = [
      "main", "article", '[role="main"]', 
      ".main-content", "#main-content",
      ".post-content", ".entry-content"
    ];
    
    for (const selector of contentSelectors) {
      const element = this.doc.querySelector(selector);
      if (element) {
        return this.extractElementText(element);
      }
    }
    
    // Fallback to body
    return this.extractElementText(this.doc.body);
  }
}

// Create extraction prompt with better structure
function createExtractionPrompt(
  fields: Record<string, ExtractionField>, 
  extractor: ContentExtractor,
  metadata: Record<string, string>
): { prompt: string; context: string } {
  // First try direct extraction
  const directExtractions: Record<string, any> = {};
  
  for (const [name, field] of Object.entries(fields)) {
    if (field.selector) {
      const value = extractor.extractBySelector(field.selector);
      if (value) directExtractions[name] = value;
    }
  }

  // Prepare context with structured data
  const tables = extractor.extractTables();
  const lists = extractor.extractLists();
  const mainContent = extractor.extractMainContent();
  
  const context = {
    metadata,
    directExtractions,
    tables: tables.slice(0, 3), // Limit to avoid token overflow
    lists: lists.slice(0, 5),
    mainContent: mainContent.substring(0, 3000), // Limit content
  };

  const fieldDescriptions = Object.entries(fields)
    .filter(([name, _]) => !directExtractions[name])
    .map(([name, field]) => {
      return `- ${name}: ${field.description} (type: ${field.type}, required: ${field.required || false})`;
    })
    .join("\n");

  const prompt = `Extract the following information from the provided webpage data:

${fieldDescriptions}

Use the structured data when available (metadata, tables, lists).
Return ONLY a JSON object with the requested fields.
For missing required fields, use null.
Ensure all values match their specified types.

Context includes:
- Page metadata
- Already extracted values
- Structured tables and lists
- Main content text`;

  return { prompt, context: JSON.stringify(context, null, 2) };
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const steps: ExtractionStep[] = [];
  const startTime = Date.now();

  try {
    const body: ExtractionRequest = await req.json();
    const { url, fields, options = {} } = body;

    // Validate inputs
    if (!url || !fields) {
      throw new Error("Missing required parameters: url and fields");
    }

    // Step 1: Fetch webpage
    steps.push({ type: "fetch", status: "pending" });
    
    const fetchOptions = {
      headers: {
        "User-Agent": options.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ...options.headers,
      }
    };

    console.log(`Fetching: ${url}`);
    const response = await retry(
      () => fetch(url, fetchOptions),
      { maxRetries: options.maxRetries || 3, delay: options.retryDelay || 1000 }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    steps[steps.length - 1].status = "success";
    steps[steps.length - 1].data = { 
      status: response.status, 
      contentLength: html.length 
    };

    // Step 2: Parse HTML
    steps.push({ type: "parse", status: "pending" });
    const extractor = new ContentExtractor(html, url);
    const metadata = extractor.extractMetadata();
    steps[steps.length - 1].status = "success";
    steps[steps.length - 1].data = metadata;

    // Step 3: Extract data
    steps.push({ type: "extract", status: "pending" });
    const { prompt, context } = createExtractionPrompt(fields, extractor, metadata);

    // Call OpenAI
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const completion = await retry(
      () => fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o", // Use mini for cost efficiency
          messages: [
            {
              role: "system",
              content: "You are a precise web data extractor. Extract only the requested information and return valid JSON. Be accurate and concise."
            },
            {
              role: "user",
              content: `${prompt}\n\nWebpage data:\n${context}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0,
          max_tokens: 1000
        }),
      }),
      { maxRetries: 2 }
    );

    if (!completion.ok) {
      const error = await completion.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await completion.json();
    const extractedData = JSON.parse(result.choices[0].message.content);
    steps[steps.length - 1].status = "success";
    steps[steps.length - 1].data = extractedData;

    // Step 4: Validate extracted data
    steps.push({ type: "validate", status: "pending" });
    const validatedData = validateExtractedData(extractedData, fields);
    steps[steps.length - 1].status = "success";

    const extractionTime = Date.now() - startTime;

    const response_data: ExtractionResult = {
      success: true,
      data: validatedData,
      url: url,
      steps: steps,
      metadata: {
        ...metadata,
        extractionTime,
        contentLength: html.length,
      }
    };

    return new Response(
      JSON.stringify(response_data),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error:", error);
    
    // Update last step status if exists
    if (steps.length > 0 && steps[steps.length - 1].status === "pending") {
      steps[steps.length - 1].status = "failed";
      steps[steps.length - 1].message = error.message;
    }
    
    const response_data: ExtractionResult = {
      success: false,
      url: req.url,
      steps: steps,
      error: error.message
    };
    
    return new Response(
      JSON.stringify(response_data),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// Validate and clean extracted data
function validateExtractedData(
  data: Record<string, any>, 
  fields: Record<string, ExtractionField>
): Record<string, any> {
  const validated: Record<string, any> = {};
  
  for (const [name, field] of Object.entries(fields)) {
    const value = data[name];
    
    // Check required fields
    if (field.required && (value === null || value === undefined)) {
      throw new Error(`Required field "${name}" is missing`);
    }
    
    // Type validation and conversion
    if (value !== null && value !== undefined) {
      switch (field.type) {
        case "number":
          const num = typeof value === "string" ? 
            parseFloat(value.replace(/[^0-9.-]/g, "")) : 
            Number(value);
          validated[name] = isNaN(num) ? null : num;
          break;
          
        case "boolean":
          validated[name] = Boolean(value);
          break;
          
        case "array":
          validated[name] = Array.isArray(value) ? value : [value];
          break;
          
        case "object":
          validated[name] = typeof value === "object" ? value : { value };
          break;
          
        default:
          validated[name] = String(value);
      }
    } else {
      validated[name] = null;
    }
  }
  
  return validated;
}