import { HyperAgent } from '@hyperbrowser/agent';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';

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
      apiKey: process.env.OPENAI_API_KEY,
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
    const $ = cheerio.load(html);

    // Try to find the product title
    const title = $('title').text() ||
                 $('meta[property="og:title"]').attr('content') ||
                 $('h1').first().text() ||
                 '';

    // Try to find the product description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="twitter:description"]').attr('content') ||
                       '';

    // Try to find the product price
    const price = $('meta[property="product:price:amount"]').attr('content') ||
                 $('[class*="price"]').first().text() ||
                 null;

    // Try to find the product image
    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content') ||
                    $('meta[property="product:image"]').attr('content') ||
                    $('link[rel="image_src"]').attr('href') ||
                    $('img[class*="product"]').first().attr('src') ||
                    null;

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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).end();
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    // Try HyperAgent first for intelligent extraction
    let productData = await extractWithHyperAgent(url);

    // Fall back to DOM parsing if HyperAgent fails
    if (!productData) {
      productData = await extractWithDOMParser(url);
    }

    if (!productData) {
      throw new Error('Failed to extract product data');
    }

    return res.status(200).json(productData);
  } catch (error) {
    console.error('Error extracting product data:', error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
}