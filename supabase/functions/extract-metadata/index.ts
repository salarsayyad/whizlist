import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function extractMetadata(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const title = doc.querySelector('title')?.textContent || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                       doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const price = doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content') ||
                 null;
    const imageUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                    doc.querySelector('meta[property="product:image"]')?.getAttribute('content') ||
                    doc.querySelector('link[rel="image_src"]')?.getAttribute('href') || null;

    return {
      title: title.trim(),
      description: description.trim(),
      price,
      imageUrl,
    };
  } catch (error) {
    console.error('Metadata extraction failed:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    const productData = await extractMetadata(url);

    if (!productData) {
      throw new Error('Failed to extract product data');
    }

    return new Response(
      JSON.stringify(productData),
      { 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});