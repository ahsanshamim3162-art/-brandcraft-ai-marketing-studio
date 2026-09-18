import { type CampaignBrief, type CampaignStrategy } from "@workspace/api-zod";

export interface CampaignGenerationProvider {
  generate(brief: CampaignBrief): CampaignStrategy;
}

export class MockAIProvider implements CampaignGenerationProvider {
  generate(brief: CampaignBrief): CampaignStrategy {
    return generateCampaignStrategy(brief);
  }
}

export const campaignGenerationProvider: CampaignGenerationProvider =
  new MockAIProvider();

function compact(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function money(brief: CampaignBrief): string {
  return `${brief.budgetCurrency} ${brief.budgetAmount.toLocaleString()}`;
}

function isB2B(brief: CampaignBrief): boolean {
  const text = `${brief.industry} ${brief.product} ${brief.targetAudience}`.toLowerCase();
  return /(software|saas|enterprise|b2b|industrial|wholesale|logistics|professional services)/.test(
    text,
  );
}

export function generateCampaignStrategy(brief: CampaignBrief): CampaignStrategy {
  const brand = compact(brief.brandName);
  const product = compact(brief.product);
  const audience = compact(brief.targetAudience);
  const location = compact(brief.location);
  const objective = compact(brief.objective);
  const personality = compact(brief.brandPersonality);
  const challenge = compact(brief.challenge);
  const b2b = isB2B(brief);
  const campaignName = `${brand} / ${objective}`;
  const creatorLine = b2b
    ? `Subject-matter voices in ${brief.industry} can translate ${product} into credible proof for decision-makers. Prioritize expert-led explainers and customer evidence over broad creator reach.`
    : `Local creators and trusted community voices can make ${product} feel familiar in ${location}, but the role is to demonstrate real use rather than add reach for its own sake.`;

  return {
    overview: {
      campaignName,
      concept: `${product}, made for the way ${audience} already live, work, and choose.`,
      objective,
    },
    consumerInsight: `${audience} are not only looking for ${product}; they are looking for a choice that fits their real routine in ${location}. When the category feels crowded or ${challenge.toLowerCase()}, a clear point of view and tangible proof make the decision easier.`,
    targetAudience: {
      primary: audience,
      secondary: b2b
        ? "Team leads, procurement partners, and internal champions who influence the final decision."
        : `People close to ${audience} who shape recommendations, sharing, and repeat consideration.`,
      characteristics: [
        `Lives or operates in ${location}`,
        `Responds to ${personality.toLowerCase()} communication when it is backed by a useful reason to believe`,
        `Needs a clear answer to: why this product, why now?`,
        `Likely to discover brands through practical proof, social context, and peer signals`,
      ],
    },
    positioning: `Position ${product} as the ${personality.toLowerCase()} choice for ${audience} in ${location} — a focused alternative to generic category promises, with a benefit they can recognize in everyday use.`,
    bigIdea: `Make it unmistakably ${brand}: show the moment when ${product} turns a familiar need into a better choice.`,
    keyMessage: `${product} gives ${audience} a more ${personality.toLowerCase()} way to move toward ${objective.toLowerCase()}, without asking them to settle for a generic option.`,
    creativeDirection: {
      visualDirection: `Use close, specific moments from ${location} and the audience's real context. Let the product appear in use, with simple visual proof and a recognizable ${personality.toLowerCase()} point of view.`,
      tone: `${personality}; direct, human, and confident rather than over-produced.`,
      storytelling: `Start with the tension: a familiar need, a crowded choice set, or a routine that is harder than it should be. Introduce ${product} as the clear shift, then land on a reason to act.`,
      suggestedStyle: `A modular campaign system built from short lived-in scenes, one strong visual cue, and a repeatable line that can scale across digital and physical touchpoints.`,
    },
    contentIdeas: [
      {
        format: "Short-form video",
        title: "The moment it clicks",
        description: `A 20–30 second scenario showing ${audience} moving from the category frustration to the specific moment ${product} makes easier.`,
      },
      {
        format: "Social carousel",
        title: "The ${brand} difference",
        description: `A proof-led carousel that contrasts the generic category expectation with three concrete reasons ${product} is a better fit.`,
      },
      {
        format: "Story / Reel",
        title: "Choose your version",
        description: `A participatory prompt built around the routines, preferences, or trade-offs of ${audience}, ending with a product-forward recommendation.`,
      },
      {
        format: "Static creative",
        title: "One clear reason",
        description: `A bold single-message visual: one audience truth, one product benefit, and one next step — optimized for fast understanding.`,
      },
      {
        format: "Customer proof",
        title: "Made real by people like you",
        description: `A lightweight testimonial or use-case series that shows how ${product} fits a real ${location} context instead of relying on generic claims.`,
      },
    ],
    digitalActivation: [
      `Launch a sequential paid-social story for ${audience}: tension, product proof, then a ${objective.toLowerCase()}-aligned call to action.`,
      `Build a landing page or campaign hub that leads with the ${brand} difference and gives visitors one clear next action.`,
      `Retarget people who watch, save, visit, or engage with a proof-led message tailored to their observed interest.`,
      `Use search and social copy variations around the audience's language for the problem: "${challenge}".`,
    ],
    offlineActivation: [
      `Create a focused ${location} touchpoint where ${audience} can experience or understand ${product} in a real context.`,
      `Equip frontline teams, partners, or community hosts with a short story and proof points so the campaign survives beyond paid media.`,
      `Turn the central visual cue into a small-format physical asset that makes the brand easy to recognize and remember.`,
    ],
    influencerStrategy: creatorLine,
    timeline: [
      {
        phase: "Phase 1 — Awareness",
        timing: "Days 1–7",
        focus: "Make the problem and the brand point of view recognizable.",
        actions: [
          "Release the hero idea and first short-form assets",
          "Test two audience-specific opening messages",
          "Build an engaged audience for retargeting",
        ],
      },
      {
        phase: "Phase 2 — Engagement",
        timing: "Days 8–18",
        focus: "Turn attention into product understanding and consideration.",
        actions: [
          "Publish proof-led content and customer context",
          "Activate community, partner, or creator voices where relevant",
          "Retarget high-intent viewers with a deeper product story",
        ],
      },
      {
        phase: "Phase 3 — Conversion",
        timing: "Days 19–26",
        focus: `Give ${audience} a simple next step tied to ${objective.toLowerCase()}.`,
        actions: [
          "Concentrate spend on the strongest message and audience segment",
          "Use a single conversion-focused landing experience",
          "Remove friction from the final action with clear proof and FAQs",
        ],
      },
      {
        phase: "Phase 4 — Retention",
        timing: "Days 27–30 and onward",
        focus: "Make the first action feel like the beginning of a relationship.",
        actions: [
          "Follow up with education, usage, or community content",
          "Collect qualitative feedback and customer proof",
          "Document winning language for the next campaign cycle",
        ],
      },
    ],
    budgetAllocation: [
      {
        channel: "Paid social and video",
        percentage: 35,
        rationale: "Efficiently build reach and retarget people who show a meaningful signal.",
      },
      {
        channel: "Creative production",
        percentage: 25,
        rationale: "Fund enough variations to learn which audience truth earns attention.",
      },
      {
        channel: "Conversion experience",
        percentage: 15,
        rationale: "Support the landing page, offer, or sales enablement needed to convert interest.",
      },
      {
        channel: "Community and partnerships",
        percentage: 15,
        rationale: "Add trusted context and local relevance in the market.",
      },
      {
        channel: "Measurement and contingency",
        percentage: 10,
        rationale: "Protect room for learning, tracking, and reallocating spend.",
      },
    ],
    kpis: [
      `Reach and qualified impressions among ${audience}`,
      "Video completion, saves, shares, and meaningful engagement rate",
      `Landing page visits and conversion actions connected to ${objective.toLowerCase()}`,
      "Cost per qualified action and conversion rate by audience/message",
      `Customer or partner feedback on ${product} differentiation`,
    ],
    strategicRationale: `This direction answers the stated challenge — ${challenge} — without losing the brief's focus on ${audience}, ${location}, and ${objective.toLowerCase()}. It keeps the recommended ${money(brief)} budget as a strategic planning input, not a promise of market performance. The system is designed to learn quickly from audience response and scale the clearest ${brand} proof.`,
  };
}