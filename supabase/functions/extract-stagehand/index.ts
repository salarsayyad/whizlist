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
import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
import { Stagehand } from "https://esm.sh/@browserbasehq/stagehand@1.3.7?target=denonext";
import { z } from "https://esm.sh/zod@3.22.4?target=denonext";

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
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const { url, fields } = body;
  if (!url || !Array.isArray(fields) || fields.length === 0) {
    return jsonError("`url` and non‑empty `fields` array required", 400);
  }

  const started = Date.now();
  try {
    // Initialise Stagehand session
    const stagehand = new Stagehand({ env: "BROWSERBASE", verbose: 0 });
    await stagehand.init();
    const { page } = stagehand;

    await page.goto(url, { waitUntil: "load" });

    // Build dynamic Zod schema & extraction instruction
    const schema = makeZodSchema(fields);
    const instruction = buildInstruction(fields);

    // Extract via Browserbase LLM
    const extracted = await page.extract({ instruction, schema });

    await stagehand.close();

    // Coerce numbers/booleans as needed (schema transformations already applied)
    return jsonResponse({ data: extracted, tookMs: Date.now() - started });
  } catch (err) {
    console.error(err);
    return jsonError(err instanceof Error ? err.message : "Unexpected error", 500);
  }
});

// ▸ Helper functions -----------------------------------------------------------
function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
  });
}
function jsonError(message: string, status = 500) {
  return jsonResponse({ error: message }, status);
}

/**
 * Dynamically create a Zod schema with correct primitive types, optional.
 * Numeric/boolean conversions are handled via transform().
 */
function makeZodSchema(fields: FieldSpec[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    switch (f.type) {
      case "number":
        shape[f.name] = z
          .union([z.number(), z.string()])
          .transform((v) => (typeof v === "number" ? v : Number(v)))
          .optional();
        break;
      case "boolean":
        shape[f.name] = z
          .union([z.boolean(), z.string()])
          .transform((v) => (typeof v === "boolean" ? v : v.toLowerCase?.() === "true"))
          .optional();
        break;
      default:
        shape[f.name] = z.string().optional();
    }
  }
  return z.object(shape);
}

function buildInstruction(fields: FieldSpec[]) {
  const list = fields
    .map((f) => `- **${f.name}** (${f.type ?? "string"}) → ${f.description ?? ""}`)
    .join("\n");
  return `Extract the following fields from the current page, matching the specified types:\n${list}`;
}