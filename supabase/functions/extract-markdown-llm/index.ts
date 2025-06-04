// supabase/functions/scrape-and-extract/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// HTML to Markdown converter
class HtmlToMarkdown {
  private dom: Document;

  constructor(html: string) {
    const parser = new DOMParser();
    this.dom = parser.parseFromString(html, 'text/html')!;
  }

  convert(): string {
    // Remove script and style elements
    this.removeElements(['script', 'style', 'nav', 'footer', 'aside', 'header']);
    
    // Process the body or main content
    const body = this.dom.querySelector('body') || this.dom;
    return this.processElement(body).trim();
  }

  private removeElements(selectors: string[]) {
    selectors.forEach(selector => {
      const elements = this.dom.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }

  private processElement(element: any): string {
    if (!element) return '';
    
    if (element.nodeType === 3) { // Text node
      return element.textContent?.trim() || '';
    }

    if (element.nodeType !== 1) return ''; // Not an element node

    const tagName = element.tagName?.toLowerCase();
    const children = Array.from(element.childNodes || []);
    const childText = children.map(child => this.processElement(child)).join('');

    switch (tagName) {
      case 'h1':
        return `\n# ${childText}\n\n`;
      case 'h2':
        return `\n## ${childText}\n\n`;
      case 'h3':
        return `\n### ${childText}\n\n`;
      case 'h4':
        return `\n#### ${childText}\n\n`;
      case 'h5':
        return `\n##### ${childText}\n\n`;
      case 'h6':
        return `\n###### ${childText}\n\n`;
      case 'p':
        return `${childText}\n\n`;
      case 'br':
        return '\n';
      case 'strong':
      case 'b':
        return `**${childText}**`;
      case 'em':
      case 'i':
        return `*${childText}*`;
      case 'code':
        return `\`${childText}\``;
      case 'pre':
        return `\n\`\`\`\n${childText}\n\`\`\`\n\n`;
      case 'a':
        const href = element.getAttribute('href');
        return href ? `[${childText}](${href})` : childText;
      case 'img':
        const src = element.getAttribute('src');
        const alt = element.getAttribute('alt') || '';
        return src ? `![${alt}](${src})` : '';
      case 'ul':
        return `\n${childText}\n`;
      case 'ol':
        return `\n${childText}\n`;
      case 'li':
        return `- ${childText}\n`;
      case 'blockquote':
        return `\n> ${childText}\n\n`;
      case 'table':
        return this.processTable(element);
      case 'div':
      case 'section':
      case 'article':
      case 'main':
        return `${childText}\n`;
      default:
        return childText;
    }
  }

  private processTable(table: any): string {
    const rows = Array.from(table.querySelectorAll('tr') || []);
    if (rows.length === 0) return '';

    let markdown = '\n';
    rows.forEach((row: any, index: number) => {
      const cells = Array.from(row.querySelectorAll('td, th') || []);
      const rowText = cells.map((cell: any) => this.processElement(cell).trim()).join(' | ');
      markdown += `| ${rowText} |\n`;
      
      // Add header separator after first row
      if (index === 0) {
        const separator = cells.map(() => '---').join(' | ');
        markdown += `| ${separator} |\n`;
      }
    });
    return markdown + '\n';
  }
}

// Web scraper with stealth capabilities
class StealthScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private getStealthHeaders(): Record<string, string> {
    return {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Charset': 'utf-8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    };
  }

  async scrape(url: string, options: {
    timeout?: number;
    waitTime?: number;
    retries?: number;
  } = {}): Promise<{
    success: boolean;
    html?: string;
    markdown?: string;
    metadata?: any;
    error?: string;
  }> {
    const { timeout = 30000, waitTime = 2000, retries = 3 } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Scraping attempt ${attempt}/${retries} for URL: ${url}`);

        // Add random delay to avoid detection
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getStealthHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        // Wait before processing to simulate human behavior
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // Extract metadata
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        if (!doc) {
          throw new Error('Failed to parse HTML');
        }

        const metadata = this.extractMetadata(doc);

        // Convert to markdown
        const converter = new HtmlToMarkdown(html);
        const markdown = converter.convert();

        return {
          success: true,
          html,
          markdown,
          metadata
        };

      } catch (error) {
        console.error(`Scraping attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown scraping error'
          };
        }
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded'
    };
  }

  private extractMetadata(doc: Document): any {
    const getMetaContent = (name: string) => {
      const meta = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta?.getAttribute('content') || null;
    };

    const title = doc.querySelector('title')?.textContent || 
                  getMetaContent('og:title') || 
                  getMetaContent('twitter:title') || '';

    const description = getMetaContent('description') || 
                       getMetaContent('og:description') || 
                       getMetaContent('twitter:description') || '';

    return {
      title: title.trim(),
      description: description.trim(),
      ogTitle: getMetaContent('og:title'),
      ogDescription: getMetaContent('og:description'),
      ogImage: getMetaContent('og:image'),
      ogUrl: getMetaContent('og:url'),
      twitterTitle: getMetaContent('twitter:title'),
      twitterDescription: getMetaContent('twitter:description'),
      twitterImage: getMetaContent('twitter:image'),
      author: getMetaContent('author'),
      keywords: getMetaContent('keywords'),
      robots: getMetaContent('robots'),
      canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      language: doc.documentElement?.getAttribute('lang') || getMetaContent('language'),
    };
  }
}

// LLM-based data extractor
class DataExtractor {
  private apiKey: string;
  private model: string;
  private apiUrl: string;

  constructor(apiKey: string, provider: 'openai' | 'anthropic' = 'openai', model?: string) {
    this.apiKey = apiKey;
    
    if (provider === 'anthropic') {
      this.apiUrl = 'https://api.anthropic.com/v1/messages';
      this.model = model || 'claude-3-sonnet-20240229';
    } else {
      this.apiUrl = 'https://api.openai.com/v1/chat/completions';
      this.model = model || 'gpt-4-turbo-preview';
    }
  }

  async extract(content: string, prompt: string, schema?: any, systemPrompt?: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const fullPrompt = this.buildExtractionPrompt(content, prompt, schema);
      const messages = [
        {
          role: 'system',
          content: systemPrompt || 'You are an expert at extracting structured data from web content. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ];

      const response = await this.callLLM(messages);
      
      if (!response.success) {
        return { success: false, error: response.error };
      }

      try {
        const extractedData = JSON.parse(response.content);
        return { success: true, data: extractedData };
      } catch (parseError) {
        return { 
          success: false, 
          error: `Failed to parse LLM response as JSON: ${parseError}` 
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }

  private buildExtractionPrompt(content: string, prompt: string, schema?: any): string {
    let fullPrompt = `${prompt}\n\nContent to extract from:\n\n${content}\n\n`;
    
    if (schema) {
      fullPrompt += `Please extract the data according to this JSON schema:\n${JSON.stringify(schema, null, 2)}\n\n`;
    }
    
    fullPrompt += 'Respond with a valid JSON object containing the extracted data.';
    return fullPrompt;
  }

  private async callLLM(messages: any[]): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }> {
    try {
      let requestBody: any;
      let headers: Record<string, string>;

      if (this.apiUrl.includes('anthropic')) {
        // Anthropic API format
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        };

        requestBody = {
          model: this.model,
          max_tokens: 4000,
          messages: messages.filter(m => m.role !== 'system'),
          system: messages.find(m => m.role === 'system')?.content
        };
      } else {
        // OpenAI API format
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };

        requestBody = {
          model: this.model,
          messages: messages,
          max_tokens: 4000,
          temperature: 0.1
        };
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`LLM API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      let content: string;
      if (this.apiUrl.includes('anthropic')) {
        content = data.content?.[0]?.text || '';
      } else {
        content = data.choices?.[0]?.message?.content || '';
      }

      return { success: true, content };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown LLM error'
      };
    }
  }
}

// Default extraction schema
const DEFAULT_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "The main title or headline of the page"
    },
    description: {
      type: "string",
      description: "A brief description or summary of the page content"
    },
    author: {
      type: "string",
      description: "The author or creator of the content if available"
    },
    publishDate: {
      type: "string",
      description: "The publication date if available"
    },
    mainContent: {
      type: "string",
      description: "The main textual content of the page"
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "Key topics, tags, or keywords related to the content"
    },
    category: {
      type: "string",
      description: "The category or type of content (e.g., article, product, news, blog post)"
    },
    contact: {
      type: "object",
      properties: {
        email: { type: "string" },
        phone: { type: "string" },
        address: { type: "string" }
      },
      description: "Contact information if available"
    },
    links: {
      type: "array",
      items: { type: "string" },
      description: "Important URLs or links mentioned in the content"
    },
    price: {
      type: "string",
      description: "Price information if this is a product or service page"
    }
  },
  required: ["title", "mainContent"],
  additionalProperties: true
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { 
      url, 
      extractionPrompt, 
      extractionSchema, 
      systemPrompt,
      includeMarkdown = true,
      llmProvider = 'openai',
      llmModel,
      timeout = 30000,
      waitTime = 2000,
      retries = 3
    } = await req.json();

    // Validate required parameters
    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid URL format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get LLM API key based on provider
    const llmApiKey = llmProvider === 'anthropic' 
      ? Deno.env.get('ANTHROPIC_API_KEY')
      : Deno.env.get('OPENAI_API_KEY');

    if (!llmApiKey) {
      throw new Error(`${llmProvider.toUpperCase()}_API_KEY environment variable is required`);
    }

    let result: any = {};

    // Step 1: Scrape URL in stealth mode and convert to markdown
    console.log(`Scraping URL in stealth mode: ${url}`);
    
    const scraper = new StealthScraper();
    const scrapeResult = await scraper.scrape(url, {
      timeout,
      waitTime,
      retries
    });

    if (!scrapeResult.success) {
      throw new Error(`Scraping failed: ${scrapeResult.error}`);
    }

    if (includeMarkdown) {
      result.scrapeData = {
        url: url,
        markdown: scrapeResult.markdown,
        metadata: scrapeResult.metadata
      };
    }

    // Step 2: Extract structured data using LLM
    console.log(`Extracting structured data using ${llmProvider} API`);
    
    const extractor = new DataExtractor(llmApiKey, llmProvider as 'openai' | 'anthropic', llmModel);
    
    const contentToExtract = scrapeResult.markdown || scrapeResult.html || '';
    const promptToUse = extractionPrompt || "Extract all relevant information from this webpage including title, description, main content, author, dates, contact information, and any other important details.";
    const schemaToUse = extractionSchema || DEFAULT_EXTRACTION_SCHEMA;
    const systemPromptToUse = systemPrompt || "You are an expert at extracting structured data from web content. Extract the requested information accurately and comprehensively. Always respond with valid JSON.";

    const extractResult = await extractor.extract(
      contentToExtract,
      promptToUse,
      schemaToUse,
      systemPromptToUse
    );

    if (!extractResult.success) {
      throw new Error(`Data extraction failed: ${extractResult.error}`);
    }

    result.extractedData = extractResult.data;

    // Prepare final response
    const response = {
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      data: result,
      metadata: {
        processingTime: Date.now(),
        stealthMode: true,
        markdownIncluded: includeMarkdown,
        llmProvider: llmProvider,
        llmModel: llmModel || (llmProvider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview')
      }
    };

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse, null, 2),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});