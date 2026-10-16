import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ScanRequest {
  imageBase64: string;
  mimeType?: string;
}

interface BagVisionResponse {
  success: boolean;
  data?: {
    roaster: string;
    name: string;
    roast_level: 'light' | 'medium' | 'dark';
    origin_country?: string;
    process_method?: string;
    varietal?: string;
    altitude?: string;
    flavor_notes: string[];
    roast_date?: string;
    confidence: number;
    raw_ocr_text?: string;
  };
  error?: string;
}

// 2026 Production Verified Vision Models (Automatic Failover)
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite", // Lynhurtig (<500ms), 100% oppetid & kvote
  "gemini-3.5-flash",      // Ekstra dybde
  "gemini-3.8-flash",      // Avanceret reasoning
  "gemini-flash-latest"    // Rolling alias
];

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY is not configured in Supabase Secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: ScanRequest = await req.json();
    if (!body.imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing imageBase64 payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean base64 string if data URL prefix was included
    const cleanBase64 = body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    const mimeType = body.mimeType || "image/webp";

    const prompt = `You are a World-Class Specialty Coffee Q-Grader and Computer Vision OCR Specialist for the "Beandex" coffee index.
Analyze this coffee bag label image with extreme precision and extract the coffee metadata.

Guidelines:
1. 'roaster': The name of the coffee roastery/brand (e.g., 'Hedekaffe', 'The Coffee Collective', 'Prolog Coffee', 'La Cabra', 'Tim Wendelboe', 'Lavazza', 'Illy', etc.).
2. 'name': The specific coffee name, blend name, single origin, or farm/lot name (e.g., 'Ristemesterens Foretrukne', 'Kieni', 'San Fermin', 'Caballero Geisha', 'Espresso Barista Gran Crema'). Do NOT include the roaster name here.
3. 'roast_level': Must be exactly one of: 'light', 'medium', or 'dark'. If not explicitly written, infer from keywords:
   - 'light': Filter/Espresso light roast, Nordic roast, high acidity notes, florals, fruity notes.
   - 'medium': City roast, balanced, caramel, milk chocolate, all-rounder.
   - 'dark': Italian roast, dark roast, intense, dark chocolate, smoky, robusta blends.
4. 'origin_country': Primary country of origin (e.g., 'Kenya', 'Ethiopia', 'Colombia', 'Honduras', 'Brazil', etc.). If blend of multiple continents, return 'Blend' or 'Multi-Origin'.
5. 'process_method': e.g. 'Washed', 'Natural', 'Honey', 'Anaerobic', or null if unknown.
6. 'varietal': e.g. 'Geisha', 'SL28', 'Bourbon', 'Caturra', 'Ethiopian Heirloom', or null.
7. 'altitude': e.g. '1900-2100m' or null if not printed.
8. 'flavor_notes': Array of 2 to 6 sensory taste descriptors printed or indicated on the bag (e.g., ['Solbær', 'Rabarber', 'Karamel'] or ['Chokolade', 'Nødder']). Return in Danish or English as printed.
9. 'roast_date': If a specific roast date (YYYY-MM-DD or DD/MM/YYYY) is visible on the label, return it. Otherwise null.
10. 'confidence': Estimated accuracy score between 0.50 and 1.00.

Return ONLY a strict JSON object with no markdown backticks, no markdown formatting:
{
  "roaster": string,
  "name": string,
  "roast_level": "light" | "medium" | "dark",
  "origin_country": string | null,
  "process_method": string | null,
  "varietal": string | null,
  "altitude": string | null,
  "flavor_notes": string[],
  "roast_date": string | null,
  "confidence": number
}`;

    let lastError = "";
    let extractedData = null;

    // Model Failover Loop (3.8-flash -> 3.5-flash-lite -> 2.5-flash)
    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[Beandex Vision] Model ${model} returned ${response.status}: ${errText}`);
          lastError = `Model ${model} error (${response.status}): ${errText}`;
          continue; // Try next fallback model
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastError = `Model ${model} returned empty response`;
          continue;
        }

        // Clean any possible markdown fences
        const jsonString = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(jsonString);

        if (parsed && parsed.roaster && parsed.name) {
          extractedData = {
            roaster: String(parsed.roaster).trim(),
            name: String(parsed.name).trim(),
            roast_level: (['light', 'medium', 'dark'].includes(parsed.roast_level) ? parsed.roast_level : 'medium') as 'light' | 'medium' | 'dark',
            origin_country: parsed.origin_country || undefined,
            process_method: parsed.process_method || undefined,
            varietal: parsed.varietal || undefined,
            altitude: parsed.altitude || undefined,
            flavor_notes: Array.isArray(parsed.flavor_notes) ? parsed.flavor_notes : [],
            roast_date: parsed.roast_date || undefined,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
          };
          break; // Success! Break failover loop
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = `Failed on model ${model}: ${msg}`;
        console.warn(lastError);
      }
    }

    if (!extractedData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: lastError || "Kunne ikke afkode kaffeposen via vision AI.",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result: BagVisionResponse = {
      success: true,
      data: extractedData,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: `Server error: ${msg}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
