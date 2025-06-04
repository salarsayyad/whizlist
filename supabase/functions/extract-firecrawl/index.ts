import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Firecrawl API configuration
const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v1";
const POLLING_INTERVAL_MS = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 60; // 2 minutes max

interface ExtractJobResponse {
  success: boolean;
  id?: string;
  error?: string;
}

interface ExtractStatusResponse {
  success: boolean;
  status: "processing" | "completed" | "failed" | "cancelled";
  data?: any;
  error?: string;
  expiresAt?: string;
}

interface ProductData {
  product_name: string;
  product_description?: string;
  price?: string;
  image_url?: string;
}

/**
 * Poll the extraction job status until completion
 */
async function pollExtractStatus(
  jobId: string,
  apiKey: string
): Promise<ProductData> {
  for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
    // Wait before polling (except first attempt)
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
    }

    try {
      const response = await fetch(`${FIRECRAWL_API_BASE}/extract/${jobId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Status check failed: ${response.status} - ${error}`);
      }

      const result: ExtractStatusResponse = await response.json();

      // Check job status
      switch (result.status) {
        case "completed":
          if (result.success && result.data) {
            return result.data;
          }
          throw new Error("Extraction completed but no data returned");
        
        case "failed":
          throw new Error(result.error || "Extraction failed");
        
        case "cancelled":
          throw new Error("Extraction was cancelled");
        
        case "processing":
          // Continue polling
          console.log(`Attempt ${attempt + 1}: Job still processing...`);
          break;
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);
      // Re-throw on last attempt
      if (attempt === MAX_POLLING_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw new Error("Extraction timed out after 2 minutes");
}

/**
 * Main request handler
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get API key from environment
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable not set");
    }

    // Define the product extraction schema (JSON Schema format)
    const productSchema = {
      type: "object",
      properties: {
        product_name: {
          type: "string",
          description: "The name or title of the main product on the page",
        },
        product_description: {
          type: "string",
          description: "The description or details about the product",
        },
        price: {
          type: "string",
          description: "The current price of the product including currency symbol",
        },
        image_url: {
          type: "string",
          description: "The URL of the main product image",
        },
      },
      required: ["product_name"],
    };

    // Start extraction job
    console.log("Starting extraction for URL:", url);
    
    const extractResponse = await fetch(`${FIRECRAWL_API_BASE}/extract`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: [url],
        prompt: "Extract the main product information from this page including the product name, description, current price with currency symbol, and the main product image URL. Focus only on the primary product being sold.",
        schema: productSchema,
        showSources: false,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
          waitFor: 2000, // Wait for dynamic content
          timeout: 30000,
          blockAds: true,
        },
      }),
    });

    if (!extractResponse.ok) {
      const error = await extractResponse.text();
      throw new Error(`Failed to start extraction: ${extractResponse.status} - ${error}`);
    }

    const extractJob: ExtractJobResponse = await extractResponse.json();
    
    if (!extractJob.success || !extractJob.id) {
      throw new Error(extractJob.error || "Failed to create extraction job");
    }

    console.log("Extraction job created with ID:", extractJob.id);

    // Poll for results
    const extractedData = await pollExtractStatus(extractJob.id, apiKey);
    
    console.log("Extraction completed successfully");

    // Format response
    const response = {
      title: extractedData.product_name || "",
      description: extractedData.product_description || "",
      price: extractedData.price || null,
      image_url: extractedData.image_url || null,
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});