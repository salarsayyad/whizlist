import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { HyperAgent } from 'npm:@hyperbrowser/agent';
import { ChatOpenAI } from 'npm:@langchain/openai';
import { z } from 'npm:zod';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const productSchema = z.object({
  title: z.string().describe("The product title or name"),
  description: z.string().describe("A description of the product"),
  price: z.string().nullable().describe("The product price if available"),
  imageUrl: z.string().nullable().describe("URL of the product image if available"),
});

async function extractWithHyperAgent(url: string) {
  try {
    const llm = new ChatOpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
      model: 'gpt-4',
    });

    const agent = new HyperAgent({
      llm,
      debug: false,
    });

    const task = `Navigate to ${url} and extract the product information including title, description, price, and image URL`;

    const result = await agent.executeTask(task, {
      outputSchema: productSchema,
    });

    await agent.closeAgent();
    return result.output;
  } catch (error) {
    console.error('HyperAgent extraction failed:', error);
    return null;
  }
}

async function extractWithDOMParser(url: string) {
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
    console.error('DOM Parser extraction failed:', error);
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

    // Try HyperAgent first
    let productData = await extractWithHyperAgent(url);

    // Fall back to DOM Parser if HyperAgent fails
    if (!productData) {
      productData = await extractWithDOMParser(url);
    }

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