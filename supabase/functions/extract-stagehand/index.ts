// Supabase Edge Function ▸ URL Field Extractor (Stagehand + Browserbase)
// =============================================================================
// Now supports explicit **types** per requested field.  Allowed types:
//   "string"  →  z.string()
//   "number"  →  z.number().transform(Number)
//   "boolean" →  z.boolean().transform((v) => (typeof v === "string" ? v === "true" : !!v))
//   Default fallback is string.
//
// ──────────────────────────────────────────────────────────────────────────────
// Env vars (set in Project → Settings → Functions):
//   BROWSERBASE_API_KEY
//
// Expected JSON POST body:
// {
//   "url": "https://books.toscrape.com/",
//   "fields": [
//     { "name": "title", "type": "string", "description": "Book title" },
//     { "name": "price", "type": "number", "description": "Numeric price" },
//     { "name": "inStock", "type": "boolean", "description": "Is item in stock" }
//   ]
// }
// ──────────────────────────────────────────────────────────────────────────────
// Response:
// { "data": { "title": "…", "price": 12.9, "inStock": true }, "tookMs": 1412 }
//
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stagehand } from "npm:@browserbasehq/stagehand";
import { z } from "zod";

// ▸ Types ----------------------------------------------------------------------
interface FieldSpec {
  name: string;
  type?: "string" | "number" | "boolean"; // default → string
  description?: string;
}
interface ReqBody {
  url: string;
  fields: FieldSpec[];
}

// ▸ Entry ----------------------------------------------------------------------
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Check for API key
  const apiKey = Deno.env.get("BROWSERBASE_API_KEY");
  if (!apiKey) {
    return jsonError("BROWSERBASE_API_KEY not configured", 500);
  }

  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { url, fields } = body;
  if (!url || !Array.isArray(fields) || fields.length === 0) {
    return jsonError("url and non-empty fields array required", 400);
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return jsonError("Invalid URL provided", 400);
  }

  const started = Date.now();
  let stagehand: Stagehand | null = null;
  
  try {
    // Initialize Stagehand session with API key
    stagehand = new Stagehand({ 
      env: "BROWSERBASE", 
      verbose: 0,
      apiKey // Explicitly pass the API key
    });
    
    await stagehand.init();
    const { page } = stagehand;

    await page.goto(url, { waitUntil: "load", timeout: 30000 });

    // Build dynamic Zod schema & extraction instruction
    const schema = makeZodSchema(fields);
    const instruction = buildInstruction(fields);

    // Extract via Browserbase LLM
    const extracted = await page.extract({ instruction, schema });

    await stagehand.close();
    stagehand = null;

    // Coerce numbers/booleans as needed (schema transformations already applied)
    return jsonResponse({ data: extracted, tookMs: Date.now() - started });
  } catch (err) {
    console.error("Extraction error:", err);
    
    // Clean up on error
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (closeErr) {
        console.error("Error closing Stagehand:", closeErr);
      }
    }
    
    return jsonError(err instanceof Error ? err.message : "Unexpected error", 500);
  }
});

// ▸ Helper functions -----------------------------------------------------------
function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function jsonError(message: string, status = 500) {
  return jsonResponse({ error: message }, status);
}

/**
 * Dynamically create a Zod schema with correct primitive types, optional.
 * Numeric/boolean conversions are handled via transform() with proper error handling.
 */
function makeZodSchema(fields: FieldSpec[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const f of fields) {
    switch (f.type) {
      case "number":
        shape[f.name] = z
          .union([z.number(), z.string(), z.null()])
          .transform((v) => {
            if (v === null || v === undefined) return null;
            if (typeof v === "number") return v;
            const num = Number(v);
            return isNaN(num) ? null : num;
          })
          .nullable();
        break;
        
      case "boolean":
        shape[f.name] = z
          .union([z.boolean(), z.string(), z.null()])
          .transform((v) => {
            if (v === null || v === undefined) return null;
            if (typeof v === "boolean") return v;
            if (typeof v === "string") {
              const lower = v.toLowerCase().trim();
              return lower === "true" || lower === "yes" || lower === "1";
            }
            return false;
          })
          .nullable();
        break;
        
      default:
        shape[f.name] = z.string().nullable();
    }
  }
  
  return z.object(shape);
}

function buildInstruction(fields: FieldSpec[]) {
  const list = fields
    .map((f) => {
      const typeStr = f.type || "string";
      const desc = f.description || "No description provided";
      return `- ${f.name} (${typeStr}): ${desc}`;
    })
    .join("\n");
    
  return `Extract the following fields from the current page, matching the specified types:\n${list}`;
}