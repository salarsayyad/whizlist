import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from "npm:@mendable/firecrawl-js";
import { z } from "npm:zod";

// CORS headers for browser compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the product schema using Zod
const productSchema = z.object({
  product_name: z.string(),
  product_description: z.string().optional(),
  price: z.string().optional(),
  image_url: z.string().optional()
});

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
    const { url } = await req.json();

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

    // Initialize FirecrawlApp
    const app = new FirecrawlApp({ apiKey });

    console.log("Starting product extraction for URL:", url);

    // Extract product data
    const extractResult = await app.extract([url], {
      prompt: "I need to extract the product name, product description, current price, and the main product image url for the main product on the page. Ignore everything else.",
      schema: productSchema,
    });

    // Check if extraction was successful
    if (!extractResult.success) {
      throw new Error(extractResult.error || "Extraction failed");
    }

    console.log("Extraction completed successfully");

    // The SDK returns the extracted data directly
    const productData = extractResult.data;

    // Format response to match expected output
    const response = {
      title: productData.product_name || "",
      description: productData.product_description || "",
      price: productData.price || null,
      image_url: productData.image_url || null,
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
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    const errorDetails = {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(errorDetails),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});