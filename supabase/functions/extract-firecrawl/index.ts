import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v1";
const MAX_POLL_ATTEMPTS = 60; // 2 minutes max with 2-second intervals
const POLL_INTERVAL_MS = 2000;

// Helper function to safely parse JSON response
async function safeJsonParse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) {
    throw new Error("Empty response body");
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse JSON. Response text:", text);
    throw new Error(`Invalid JSON response: ${text.substring(0, 200)}...`);
  }
}

// Helper function to poll for extraction results
async function pollForResults(jobId: string, apiKey: string): Promise<any> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    // Wait before polling (except on first attempt)
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    try {
      // Check extraction status
      const statusResponse = await fetch(`${FIRECRAWL_API_BASE}/extract/${jobId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      console.log(`Poll attempt ${attempt + 1}: Status ${statusResponse.status}`);

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Poll error response:", errorText);
        throw new Error(`Status check failed: ${statusResponse.status} - ${errorText}`);
      }

      const result = await safeJsonParse(statusResponse);
      console.log("Poll result:", JSON.stringify(result).substring(0, 200));

      // Check if extraction is complete
      if (result.success && result.data) {
        return result.data;
      } else if (!result.success && result.error) {
        throw new Error(result.error);
      }
      // Continue polling if still processing
    } catch (error) {
      console.error(`Poll attempt ${attempt + 1} failed:`, error);
      // Continue polling unless it's the last attempt
      if (attempt === MAX_POLL_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw new Error("Extraction timed out after 2 minutes");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url } = body;
    
    console.log("Received request for URL:", url);
    
    if (!url) {
      throw new Error("URL is required");
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Define the JSON Schema for extraction (not Zod)
    const schema = {
      type: "object",
      properties: {
        product_name: {
          type: "string",
          description: "The name or title of the product"
        },
        product_description: {
          type: "string",
          description: "The description or details about the product"
        },
        price: {
          type: "string",
          description: "The current price of the product (including currency symbol)"
        },
        image_url: {
          type: "string",
          description: "The URL of the main product image"
        }
      },
      required: ["product_name"]
    };

    const extractPayload = {
      urls: [url],
      prompt: "Extract the product name, description, current price (with currency symbol), and main product image URL. Focus on the primary product being sold on the page.",
      schema: schema,
      showSources: false,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
        waitFor: 2000, // Wait for dynamic content to load
        blockAds: true
      }
    };

    console.log("Sending extract request with payload:", JSON.stringify(extractPayload).substring(0, 500));

    // Initiate the extraction job
    const extractResponse = await fetch(`${FIRECRAWL_API_BASE}/extract`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(extractPayload)
    });

    console.log(`Extract response status: ${extractResponse.status}`);

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error("Extract error response:", errorText);
      throw new Error(`Extract request failed: ${extractResponse.status} - ${errorText}`);
    }

    const extractResult = await safeJsonParse(extractResponse);
    console.log("Extract result:", JSON.stringify(extractResult));

    // Check if the extraction job was created successfully
    if (!extractResult.success || !extractResult.id) {
      throw new Error(`Failed to start extraction job: ${JSON.stringify(extractResult)}`);
    }

    console.log(`Extraction job created with ID: ${extractResult.id}`);

    // Poll for the extraction results
    const extractedData = await pollForResults(extractResult.id, apiKey);

    // The extracted data should match our schema
    // Extract endpoint returns the data directly, not in an array
    const product = extractedData;

    console.log("Final extracted product data:", JSON.stringify(product));

    return new Response(
      JSON.stringify({
        title: product.product_name || "",
        description: product.product_description || "",
        price: product.price || null,
        image_url: product.image_url || null
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
        error: error.message || "Failed to extract product details"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});