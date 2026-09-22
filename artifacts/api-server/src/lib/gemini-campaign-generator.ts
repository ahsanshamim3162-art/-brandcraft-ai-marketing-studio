import { GenerateCampaignResponse, type CampaignBrief, type CampaignStrategy } from "@workspace/api-zod";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";

function briefAsText(brief: CampaignBrief): string {
  return Object.entries(brief)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");
}

function stripMarkdown fences(value: string): string {
  return value.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function textFromGeminiResponse(payload: unknown): string {
  const candidate = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    ?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty campaign strategy.");
  return text;
}

const responseShape = `{
  "diagnosis": { "businessContext": "string", "userProvidedFacts": ["string"], "marketingProblem": "string", "strategicAssumptions": ["string"], "recommendedApproach": "string" },
  "overview": { "campaignName": "string", "concept": "string", "objective": "string" },
  "marketingProblem": "string", "audienceTension": "string", "consumerInsight": "string",
  "targetAudience": { "primary": "string", "secondary": "string", "characteristics": ["string"] },
  "positioning": "string", "strategicDirection": "string", "bigIdea": "string", "keyMessage": "string",
  "creativeDirection": { "visualDirection": "string", "tone": "string", "storytelling": "string", "suggestedStyle": "string" },
  "contentIdeas": [{ "format": "string", "title": "string", "description": "string", "whyRelevant": "string", "audience": "string", "strategicLink": "string" }],
  "digitalActivation": [{ "channel": "string", "what": "string", "why": "string", "audience": "string", "strategicLink": "string" }],
  "offlineActivation": [{ "channel": "string", "what": "string", "why": "string", "audience": "string", "strategicLink": "string" }],
  "creatorStrategy": { "channel": "string", "what": "string", "why": "string", "audience": "string", "strategicLink": "string" },
  "timeline": [{ "phase": "string", "timing": "string", "focus": "string", "actions": ["string"] }],
  "budgetAllocation": [{ "channel": "string", "percentage": 0, "amount": 0, "rationale": "string" }],
  "kpis": [{ "metric": "string", "why": "string", "signal": "string" }],
  "strategicRationale": "string", "qualityCheck": ["string"]
}`;

export async function generateCampaignWithGemini(brief: CampaignBrief): Promise<CampaignStrategy> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the API server.");

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const prompt = `You are BrandCraft's senior marketing strategy engine. Produce a client-ready campaign strategy, not a chatbot response.\n\nUse only the submitted brief below as factual source material. Do not invent research, statistics, market shares, competitor claims, product features, or customer findings. Where evidence is missing, label it as a working assumption or validation task. Every recommendation must connect to the business objective, audience, stated challenge, product, differentiation, budget, duration, and big idea. Avoid generic advice such as simply running ads. Do not mention Gemini, AI, prompts, APIs, or implementation.\n\nReturn ONLY valid JSON matching this exact shape. All string fields must be substantive and specific to the brief. Budget percentages must total 100 and amounts must total the submitted budget.\n\nJSON shape:\n${responseShape}\n\nSubmitted campaign brief:\n${briefAsText(brief)}`;

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, responseMimeType: "application/json" },
      }),
    });
  } catch (error) {
    throw new Error(`Unable to reach Gemini: ${error instanceof Error ? error.message : "network error"}`);
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Gemini request failed (${response.status}): ${detail || response.statusText}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Gemini returned an unreadable response.");
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(stripMarkdown fences(textFromGeminiResponse(payload)));
  } catch {
    throw new Error("Gemini did not return valid JSON for the campaign strategy.");
  }

  const parsed = GenerateCampaignResponse.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(`Gemini returned an invalid campaign strategy: ${parsed.error.issues[0]?.path.join(".") || "response shape"}`);
  }

  const budgetTotal = parsed.data.budgetAllocation.reduce((sum, item) => sum + item.percentage, 0);
  const amountTotal = parsed.data.budgetAllocation.reduce((sum, item) => sum + item.amount, 0);
  if (Math.abs(budgetTotal - 100) > 0.01 || Math.abs(amountTotal - brief.budgetAmount) > 1) {
    throw new Error("Gemini returned a budget allocation that does not match the submitted budget.");
  }

  return parsed.data;
}
