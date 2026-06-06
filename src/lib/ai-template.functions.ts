import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Takes a base64 data URL of a point-table screenshot and asks Gemini to
 * remove all overlay text/lines/rows, keeping only the clean background.
 * Returns the cleaned image as a data URL.
 */
export const aiExtractBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { image_data_url: string }) => {
    if (!d?.image_data_url?.startsWith("data:image/")) {
      throw new Error("Invalid image payload");
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    // admin check
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r: { role: string }) => r.role === "admin")) {
      throw new Error("Admin only");
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Remove ALL overlay content from this point-table image: erase every row, every team name, every number, every rank badge, every column header, every grid line, and every text label. Keep ONLY the underlying decorative background — the colored gradients, lighting, logos, brand graphics, frames and decorative shapes. Do NOT keep any words, rankings, or table grid. Output a clean empty background image ready to be used as a reusable point-table template, same dimensions and overall artistic style as the input.",
              },
              { type: "image_url", image_url: { url: data.image_data_url } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Rate limited, try again later");
      if (resp.status === 402) throw new Error("AI credits exhausted, top up workspace");
      throw new Error(`AI gateway error: ${resp.status}`);
    }
    const json = await resp.json();
    const msg = json?.choices?.[0]?.message;
    const imgPart = msg?.images?.[0]?.image_url?.url
      ?? (Array.isArray(msg?.content)
            ? msg.content.find((c: { type: string; image_url?: { url: string } }) => c?.type === "image_url")?.image_url?.url
            : undefined);
    if (!imgPart) throw new Error("AI did not return an image");
    return { image_data_url: imgPart as string };
  });

const FF_THEMES = [
  "futuristic neon cyber arena with blazing orange and electric blue lights",
  "molten lava volcano battleground with glowing embers and dark rocks",
  "icy arctic warzone with cyan glow and shattered glass shards",
  "jungle ruins with golden temple lights and emerald mist",
  "desert sandstorm coliseum with amber sun rays and ancient banners",
  "galactic space stadium with purple nebula and starfield",
  "underground bunker with red alarm lights and metallic plates",
  "rainy neon Tokyo rooftop with hot pink and teal reflections",
  "post-apocalyptic wasteland with flaming wreckage and orange smoke",
  "thunderstorm sky arena with lightning bolts and royal blue clouds",
  "samurai dojo with sakura petals and crimson banners",
  "esports stage with massive LED screens and confetti lasers",
];

async function generateOne(apiKey: string, prompt: string) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create a vertical 1080x1350 cinematic Free Fire esports tournament point-table BACKGROUND image. Theme: ${prompt}. Include a bold Free Fire / battle-royale vibe with dramatic lighting, smoke, particles, and a clear empty center area where a table will be overlaid. DO NOT draw any table, rows, columns, numbers, team names, ranks, text, words, letters or grid lines. Output ONLY the decorative background art. Ultra HD, dramatic, esports poster style.`,
            },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limited, try again later");
    if (resp.status === 402) throw new Error("AI credits exhausted, top up workspace");
    throw new Error(`AI gateway error: ${resp.status}`);
  }
  const json = await resp.json();
  const msg = json?.choices?.[0]?.message;
  const imgPart = msg?.images?.[0]?.image_url?.url
    ?? (Array.isArray(msg?.content)
          ? msg.content.find((c: { type: string; image_url?: { url: string } }) => c?.type === "image_url")?.image_url?.url
          : undefined);
  if (!imgPart) throw new Error("AI did not return an image");
  return imgPart as string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) throw new Error("Admin only");
}

function pickThemes(n: number) {
  const pool = [...FF_THEMES];
  const out: string[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

/** Generate ONE random Free Fire esports background template. */
export const aiGenerateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const theme = pickThemes(1)[0];
    const url = await generateOne(apiKey, theme);
    return { image_data_url: url, theme };
  });

/** Generate 5 random Free Fire esports background templates in parallel. */
export const aiGenerateBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const themes = pickThemes(5);
    const results = await Promise.allSettled(themes.map((t) => generateOne(apiKey, t)));
    const items = results
      .map((r, i) => r.status === "fulfilled" ? { image_data_url: r.value, theme: themes[i] } : null)
      .filter(Boolean) as { image_data_url: string; theme: string }[];
    if (!items.length) throw new Error("All generations failed");
    return { items };
  });

const VARIANT_COLORS = [
  { name: "Crimson", hex: "#ef4444" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Violet", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
];

async function generateVariant(apiKey: string, color: { name: string; hex: string }) {
  const prompt = `Create a vertical 1080x1350 MINIMAL clean point-table background, dark base with subtle ${color.name.toLowerCase()} (${color.hex}) gradient glow, soft vignette, no busy details, just elegant solid dark canvas with hints of ${color.name.toLowerCase()} light leaks on the corners. Leave the entire center fully empty for an overlay table. DO NOT include any table, rows, text, numbers, team names, ranks, grid lines, words or letters. Pure clean minimalist esports background only.`;
  return generateOne(apiKey, prompt);
}

/** Generate clean minimal "None"-style variants in 6 different colors. */
export const aiGenerateVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const results = await Promise.allSettled(VARIANT_COLORS.map((c) => generateVariant(apiKey, c)));
    const items = results
      .map((r, i) => r.status === "fulfilled"
        ? { image_data_url: r.value, color_name: VARIANT_COLORS[i].name, accent: VARIANT_COLORS[i].hex }
        : null)
      .filter(Boolean) as { image_data_url: string; color_name: string; accent: string }[];
    if (!items.length) throw new Error("All variant generations failed");
    return { items };
  });