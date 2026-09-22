import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, campaignsTable } from "@workspace/db";
import {
  DeleteCampaignParams,
  GenerateCampaignBody,
  GenerateCampaignResponse,
  GetCampaignParams,
  GetCampaignResponse,
  GetCampaignSummaryResponse,
  ListCampaignsResponse,
  SaveCampaignBody,
  SaveCampaignResponse,
  UpdateCampaignBody,
  UpdateCampaignParams,
  UpdateCampaignResponse,
} from "@workspace/api-zod";
import { generateCampaignWithGemini } from "../lib/gemini-campaign-generator";

const router: IRouter = Router();

router.get("/campaigns", async (_req, res): Promise<void> => {
  const campaigns = await db
    .select({ id: campaignsTable.id, name: campaignsTable.name, brandName: campaignsTable.brandName, industry: campaignsTable.industry, objective: campaignsTable.objective, createdAt: campaignsTable.createdAt, updatedAt: campaignsTable.updatedAt })
    .from(campaignsTable)
    .orderBy(desc(campaignsTable.updatedAt));
  res.json(ListCampaignsResponse.parse(campaigns));
});

router.get("/campaigns/summary", async (_req, res): Promise<void> => {
  const campaigns = await db
    .select({ name: campaignsTable.name, createdAt: campaignsTable.createdAt })
    .from(campaignsTable)
    .orderBy(desc(campaignsTable.updatedAt));
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = campaigns.filter((campaign) => campaign.createdAt >= monthStart);
  res.json(GetCampaignSummaryResponse.parse({ totalCampaigns: campaigns.length, thisMonth: thisMonth.length, latestCampaign: campaigns[0]?.name ?? null }));
});

router.post("/campaigns/generate", async (req, res): Promise<void> => {
  const parsed = GenerateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please complete all required brief fields before generating." });
    return;
  }

  try {
    const strategy = await generateCampaignWithGemini(parsed.data);
    res.json(GenerateCampaignResponse.parse(strategy));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown campaign generation error.";
    const status = message.includes("GEMINI_API_KEY") ? 503 : 502;
    res.status(status).json({ error: `Campaign generation failed: ${message}` });
  }
});

router.post("/campaigns", async (req, res): Promise<void> => {
  const parsed = SaveCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "The campaign could not be saved because the brief or strategy is incomplete." });
    return;
  }
  const [campaign] = await db
    .insert(campaignsTable)
    .values({ name: parsed.data.strategy.overview.campaignName, brandName: parsed.data.brief.brandName, industry: parsed.data.brief.industry, objective: parsed.data.brief.objective, brief: parsed.data.brief, strategy: parsed.data.strategy })
    .returning();
  res.status(201).json(SaveCampaignResponse.parse(campaign));
});

router.get("/campaigns/:id", async (req, res): Promise<void> => {
  const params = GetCampaignParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid campaign identifier." }); return; }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, params.data.id));
  if (!campaign) { res.status(404).json({ error: "Campaign not found." }); return; }
  res.json(GetCampaignResponse.parse(campaign));
});

router.patch("/campaigns/:id", async (req, res): Promise<void> => {
  const params = UpdateCampaignParams.safeParse(req.params);
  const body = UpdateCampaignBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "The campaign update is not valid." }); return; }
  const updates: Partial<typeof campaignsTable.$inferInsert> = { updatedAt: new Date() };
  if (body.data.brief) { updates.brief = body.data.brief; updates.brandName = body.data.brief.brandName; updates.industry = body.data.brief.industry; updates.objective = body.data.brief.objective; }
  if (body.data.strategy) { updates.strategy = body.data.strategy; updates.name = body.data.strategy.overview.campaignName; }
  const [campaign] = await db.update(campaignsTable).set(updates).where(eq(campaignsTable.id, params.data.id)).returning();
  if (!campaign) { res.status(404).json({ error: "Campaign not found." }); return; }
  res.json(UpdateCampaignResponse.parse(campaign));
});

router.delete("/campaigns/:id", async (req, res): Promise<void> => {
  const params = DeleteCampaignParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid campaign identifier." }); return; }
  const [campaign] = await db.delete(campaignsTable).where(eq(campaignsTable.id, params.data.id)).returning({ id: campaignsTable.id });
  if (!campaign) { res.status(404).json({ error: "Campaign not found." }); return; }
  res.sendStatus(204);
});

export default router;
