import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { FireCrawlApp } from "npm:@mendable/firecrawl-js";
import { z } from "npm:zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const app = new FireCrawlApp({ apiKey });

    const schema = z.object({
      product_name: z.string(),
      product_description: z.string().optional(),
      price: z.string().optional(),
      image_url: z.string().optional()
    });

    const extractResult = await app.extract([url], {
      prompt: "I need to extract the product name, product description, current price, and the main product image url for the main product on the page. Ignore everything else.",
      schema,
    });

    if (!extractResult || !extractResult[0]) {
      throw new Error("Failed to extract product details");
    }

    const product = extractResult[0];

    return new Response(
      JSON.stringify({
        title: product.product_name,
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