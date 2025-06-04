// supabase/functions/html-extractor/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"



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

// Simple data extractor using DOM parsing and pattern matching
class SimpleDataExtractor {
  private doc: Document;

  constructor(html: string) {
    const parser = new DOMParser();
    this.doc = parser.parseFromString(html, 'text/html')!;
  }

  extractFields(fields: string[] = []): any {
    const extractedData: any = {};

    // Default fields to extract if none specified
    const fieldsToExtract = fields.length > 0 ? fields : [
      'title', 'description', 'author', 'publishDate', 'content',
      'headings', 'links', 'images', 'contact', 'price', 'categories'
    ];

    fieldsToExtract.forEach(field => {
      try {
        extractedData[field] = this.extractField(field);
      } catch (error) {
        console.warn(`Failed to extract field '${field}':`, error);
        extractedData[field] = null;
      }
    });

    return extractedData;
  }

  private extractField(field: string): any {
    switch (field.toLowerCase()) {
      case 'title':
        return this.extractTitle();
      case 'description':
        return this.extractDescription();
      case 'author':
        return this.extractAuthor();
      case 'publishdate':
      case 'date':
        return this.extractPublishDate();
      case 'content':
      case 'maincontent':
        return this.extractMainContent();
      case 'headings':
        return this.extractHeadings();
      case 'links':
        return this.extractLinks();
      case 'images':
        return this.extractImages();
      case 'contact':
        return this.extractContactInfo();
      case 'price':
        return this.extractPrice();
      case 'categories':
      case 'tags':
        return this.extractCategories();
      case 'emails':
        return this.extractEmails();
      case 'phones':
        return this.extractPhones();
      case 'addresses':
        return this.extractAddresses();
      default:
        return this.extractCustomField(field);
    }
  }

  private extractTitle(): string {
    const selectors = [
      'h1',
      '.title',
      '.page-title',
      '.post-title',
      '.article-title',
      '[data-testid="title"]',
      'title'
    ];

    for (const selector of selectors) {
      const element = this.doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    return '';
  }

  private extractDescription(): string {
    const selectors = [
      '.description',
      '.summary',
      '.excerpt',
      '.lead',
      '.subtitle',
      'meta[name="description"]',
      'meta[property="og:description"]'
    ];

    for (const selector of selectors) {
      const element = this.doc.querySelector(selector);
      if (selector.startsWith('meta')) {
        const content = element?.getAttribute('content');
        if (content?.trim()) return content.trim();
      } else if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    return '';
  }

  private extractAuthor(): string {
    const selectors = [
      '.author',
      '.byline',
      '.writer',
      '[rel="author"]',
      '.post-author',
      '.article-author',
      'meta[name="author"]'
    ];

    for (const selector of selectors) {
      const element = this.doc.querySelector(selector);
      if (selector.startsWith('meta')) {
        const content = element?.getAttribute('content');
        if (content?.trim()) return content.trim();
      } else if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    return '';
  }

  private extractPublishDate(): string {
    const selectors = [
      'time[datetime]',
      '.publish-date',
      '.date',
      '.post-date',
      '.article-date',
      'meta[property="article:published_time"]'
    ];

    for (const selector of selectors) {
      const element = this.doc.querySelector(selector);
      if (element?.getAttribute('datetime')) {
        return element.getAttribute('datetime')!;
      } else if (selector.startsWith('meta')) {
        const content = element?.getAttribute('content');
        if (content?.trim()) return content.trim();
      } else if (element?.textContent?.trim()) {
        const dateText = element.textContent.trim();
        // Try to parse and validate the date
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString();
        }
        return dateText;
      }
    }

    return '';
  }

  private extractMainContent(): string {
    const selectors = [
      'main',
      'article',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.page-content',
      '#content'
    ];

    for (const selector of selectors) {
      const element = this.doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // Fallback: get all paragraph text
    const paragraphs = Array.from(this.doc.querySelectorAll('p'));
    return paragraphs
      .map(p => p.textContent?.trim() || '')
      .filter(text => text.length > 0)
      .join('\n\n');
  }

  private extractHeadings(): string[] {
    const headings = Array.from(this.doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headings
      .map(h => h.textContent?.trim() || '')
      .filter(text => text.length > 0);
  }

  private extractLinks(): string[] {
    const links = Array.from(this.doc.querySelectorAll('a[href]'));
    return links
      .map(link => link.getAttribute('href') || '')
      .filter(href => href.length > 0 && !href.startsWith('#'))
      .map(href => {
        try {
          return new URL(href, window.location?.href || 'http://example.com').href;
        } catch {
          return href;
        }
      });
  }

  private extractImages(): string[] {
    const images = Array.from(this.doc.querySelectorAll('img[src]'));
    return images
      .map(img => img.getAttribute('src') || '')
      .filter(src => src.length > 0)
      .map(src => {
        try {
          return new URL(src, window.location?.href || 'http://example.com').href;
        } catch {
          return src;
        }
      });
  }

  private extractContactInfo(): any {
    const contactInfo: any = {};

    // Extract emails
    contactInfo.emails = this.extractEmails();

    // Extract phones
    contactInfo.phones = this.extractPhones();

    // Extract addresses
    contactInfo.addresses = this.extractAddresses();

    return contactInfo;
  }

  private extractEmails(): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const bodyText = this.doc.body?.textContent || '';
    const emails = bodyText.match(emailRegex) || [];
    
    // Also check for mailto links
    const mailtoLinks = Array.from(this.doc.querySelectorAll('a[href^="mailto:"]'));
    const mailtoEmails = mailtoLinks.map(link => 
      link.getAttribute('href')?.replace('mailto:', '') || ''
    ).filter(email => email.length > 0);

    return [...new Set([...emails, ...mailtoEmails])];
  }

  private extractPhones(): string[] {
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const bodyText = this.doc.body?.textContent || '';
    const phones = bodyText.match(phoneRegex) || [];
    
    // Also check for tel links
    const telLinks = Array.from(this.doc.querySelectorAll('a[href^="tel:"]'));
    const telPhones = telLinks.map(link => 
      link.getAttribute('href')?.replace('tel:', '') || ''
    ).filter(phone => phone.length > 0);

    return [...new Set([...phones, ...telPhones])];
  }

  private extractAddresses(): string[] {
    const addressSelectors = [
      '.address',
      '.location',
      '.contact-address',
      '[itemtype*="PostalAddress"]'
    ];

    const addresses: string[] = [];

    for (const selector of addressSelectors) {
      const elements = Array.from(this.doc.querySelectorAll(selector));
      elements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && text.length > 10) { // Basic filter for address-like text
          addresses.push(text);
        }
      });
    }

    return addresses;
  }

  private extractPrice(): string {
    const priceSelectors = [
      '.price',
      '.cost',
      '.amount',
      '.currency',
      '[data-price]',
      '.price-current',
      '.sale-price'
    ];

    // Price regex patterns
    const priceRegex = /[$€£¥₹]\s*[\d,]+\.?\d*/g;

    for (const selector of priceSelectors) {
      const element = this.doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // Fallback: search for price patterns in text
    const bodyText = this.doc.body?.textContent || '';
    const priceMatches = bodyText.match(priceRegex);
    if (priceMatches && priceMatches.length > 0) {
      return priceMatches[0];
    }

    return '';
  }

  private extractCategories(): string[] {
    const categorySelectors = [
      '.category',
      '.tag',
      '.tags',
      '.categories',
      '.label',
      '.badge',
      'meta[name="keywords"]'
    ];

    const categories: string[] = [];

    for (const selector of categorySelectors) {
      if (selector.startsWith('meta')) {
        const meta = this.doc.querySelector(selector);
        const content = meta?.getAttribute('content');
        if (content) {
          categories.push(...content.split(',').map(s => s.trim()));
        }
      } else {
        const elements = Array.from(this.doc.querySelectorAll(selector));
        elements.forEach(element => {
          const text = element.textContent?.trim();
          if (text && text.length > 0) {
            categories.push(text);
          }
        });
      }
    }

    return [...new Set(categories)].filter(cat => cat.length > 0);
  }

  private extractCustomField(field: string): any {
    // Try to find elements by class name, id, or data attribute
    const selectors = [
      `.${field}`,
      `#${field}`,
      `[data-${field}]`,
      `[data-testid="${field}"]`,
      `[class*="${field}"]`
    ];

    for (const selector of selectors) {
      try {
        const element = this.doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      } catch {
        // Invalid selector, continue
      }
    }

    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { 
      url, 
      fields = [], // Array of specific fields to extract
      includeMarkdown = true,
      includeMetadata = true,
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

    let result: any = {};

    // Step 1: Scrape URL in stealth mode
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

    // Step 2: Extract data fields using DOM parsing
    console.log(`Extracting data fields from HTML`);
    
    const extractor = new SimpleDataExtractor(scrapeResult.html!);
    const extractedData = extractor.extractFields(fields);

    result.extractedData = extractedData;

    // Step 3: Include markdown and metadata if requested
    if (includeMarkdown) {
      result.markdown = scrapeResult.markdown;
    }

    if (includeMetadata) {
      result.metadata = scrapeResult.metadata;
    }

    // Prepare final response
    const response = {
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      data: result,
      config: {
        fieldsRequested: fields.length > 0 ? fields : 'all default fields',
        markdownIncluded: includeMarkdown,
        metadataIncluded: includeMetadata,
        processingTime: Date.now()
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