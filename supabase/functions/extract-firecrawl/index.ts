import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v1";
const MAX_POLL_ATTEMPTS = 60; // 2 minutes max with 2-second intervals
const POLL_INTERVAL_MS = 2000;

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

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        throw new Error(error.error || "Failed to check extraction status");
      }

      const result = await statusResponse.json();

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
    const { url } = await req.json();
    
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

    // Initiate the extraction job
    const extractResponse = await fetch(`${FIRECRAWL_API_BASE}/extract`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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
      })
    });

    if (!extractResponse.ok) {
      const error = await extractResponse.json();
      throw new Error(error.error || "Failed to initiate extraction");
    }

    const extractResult = await extractResponse.json();

    // Check if the extraction job was created successfully
    if (!extractResult.success || !extractResult.id) {
      throw new Error("Failed to start extraction job");
    }

    console.log(`Extraction job created with ID: ${extractResult.id}`);

    // Poll for the extraction results
    const extractedData = await pollForResults(extractResult.id, apiKey);

    // The extracted data should match our schema
    // Extract endpoint returns the data directly, not in an array
    const product = extractedData;

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