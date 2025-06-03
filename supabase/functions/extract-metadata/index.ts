import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractionField {
  type: string;
  description: string;
  required?: boolean;
}

interface ExtractionRequest {
  url: string;
  fields: Record<string, ExtractionField>;
}

class ContentExtractor {
  private doc: any;
  private url: string;

  constructor(html: string, url: string) {
    const parser = new DOMParser();
    this.doc = parser.parseFromString(html, "text/html");
    this.url = url;
  }

  extractData(): Record<string, string | null> {
    const data: Record<string, string | null> = {};

    // Extract title
    data.title = this.extractTitle();
    
    // Extract description
    data.description = this.extractDescription();
    
    // Extract prices
    const prices = this.extractPrices();
    data.originalPrice = prices.originalPrice;
    data.salePrice = prices.salePrice;
    
    // Extract image
    data.imageUrl = this.extractImage();

    return data;
  }

  private extractTitle(): string | null {
    // Try product-specific elements first
    const productTitle = 
      this.doc.querySelector('[class*="product"][class*="title"]')?.textContent ||
      this.doc.querySelector('[class*="product"][class*="name"]')?.textContent ||
      this.doc.querySelector('[id*="product"][id*="title"]')?.textContent ||
      this.doc.querySelector('h1')?.textContent;

    if (productTitle) {
      return productTitle.trim();
    }

    // Fall back to meta tags
    return (
      this.doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      this.doc.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ||
      this.doc.querySelector('title')?.textContent ||
      null
    );
  }

  private extractDescription(): string | null {
    // Try product-specific elements first
    const productDescription = 
      this.doc.querySelector('[class*="product"][class*="description"]')?.textContent ||
      this.doc.querySelector('[id*="product"][id*="description"]')?.textContent;

    if (productDescription) {
      return productDescription.trim();
    }

    // Fall back to meta tags
    return (
      this.doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      this.doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
      this.doc.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ||
      null
    );
  }

  private extractPrices(): { originalPrice: string | null; salePrice: string | null } {
    const prices = {
      originalPrice: null as string | null,
      salePrice: null as string | null
    };

    // Try structured data first
    const jsonLdScripts = this.doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data.offers) {
          if (data.offers.price) {
            prices.originalPrice = data.offers.price.toString();
          }
          if (data.offers.salePrice) {
            prices.salePrice = data.offers.salePrice.toString();
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Try common price selectors
    if (!prices.originalPrice && !prices.salePrice) {
      const priceSelectors = [
        '[class*="price"]',
        '[id*="price"]',
        '[class*="product-price"]',
        '[data-price]'
      ];

      for (const selector of priceSelectors) {
        const elements = this.doc.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          if (text) {
            // Look for price patterns
            const priceMatch = text.match(/[\d,.]+/);
            if (priceMatch) {
              if (
                element.classList.contains('sale') || 
                element.classList.contains('special') ||
                element.classList.contains('discount')
              ) {
                prices.salePrice = priceMatch[0];
              } else {
                prices.originalPrice = priceMatch[0];
              }
            }
          }
        }
      }
    }

    return prices;
  }

  private extractImage(): string | null {
    // Try meta tags first
    const metaImage = 
      this.doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
      this.doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content");

    if (metaImage) {
      return this.resolveUrl(metaImage);
    }

    // Try product image selectors
    const imageSelectors = [
      '[class*="product"][class*="image"] img',
      '[id*="product"][id*="image"] img',
      '.product-image img',
      '#product-image img',
      '[data-zoom-image]'
    ];

    for (const selector of imageSelectors) {
      const img = this.doc.querySelector(selector);
      if (img) {
        const src = img.getAttribute('data-zoom-image') || 
                   img.getAttribute('data-large-image') || 
                   img.getAttribute('src');
        if (src) {
          return this.resolveUrl(src);
        }
      }
    }

    return null;
  }

  private resolveUrl(relativeUrl: string): string {
    try {
      return new URL(relativeUrl, this.url).href;
    } catch {
      return relativeUrl;
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, fields } = await req.json() as ExtractionRequest;

    if (!url || !fields) {
      throw new Error("Missing required parameters: url and fields");
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const extractor = new ContentExtractor(html, url);
    const extractedData = extractor.extractData();

    // Validate required fields
    for (const [field, config] of Object.entries(fields)) {
      if (config.required && !extractedData[field]) {
        throw new Error(`Required field "${field}" could not be extracted`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
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
        status: 400
      }
    );
  }
});