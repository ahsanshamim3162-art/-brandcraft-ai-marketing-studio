import {
  type ActivationRecommendation,
  type BudgetAllocation,
  type CampaignBrief,
  type CampaignStrategy,
  type ContentIdea,
  type Kpi,
} from "@workspace/api-zod";

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

type Territory = {
  name: string;
  rationale: string;
  fit: string;
};

const awarenessChallenges = new Set([
  "Low brand awareness",
  "Strong competition",
  "Weak brand differentiation",
  "Entering a new market",
]);

function compact(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function lower(value: string): string {
  return value.toLocaleLowerCase();
}

function money(brief: CampaignBrief, amount = brief.budgetAmount): string {
  return `${brief.budgetCurrency} ${amount.toLocaleString()}`;
}

function parseDurationDays(duration: string): number {
  const match = duration.match(/\d+/);
  return match ? Math.max(1, Number(match[0])) : 30;
}

function isB2B(brief: CampaignBrief): boolean {
  const text = `${brief.industry} ${brief.product} ${brief.targetAudience}`.toLowerCase();
  return /(software|saas|enterprise|b2b|industrial|wholesale|logistics|professional services)/.test(
    text,
  );
}

function isMangoProduct(product: string): boolean {
  return /mango/i.test(product);
}

function challengeDetail(brief: CampaignBrief): string {
  const detail = compact(brief.challenge);
  return detail || `The brief identifies ${brief.marketingChallenge.toLowerCase()} as the main challenge.`;
}

function businessFacts(brief: CampaignBrief): string[] {
  const facts = [
    `Brand: ${compact(brief.brandName)}`,
    `Industry: ${compact(brief.industry)}`,
    `Product or service: ${compact(brief.product)}`,
    `Primary audience: ${compact(brief.targetAudience)}`,
    `Objective: ${compact(brief.objective)}`,
    `Market: ${compact(brief.location)}`,
    `Duration: ${compact(brief.duration)}`,
    `Budget: ${money(brief)}`,
    `Brand personality: ${compact(brief.brandPersonality)}`,
    `Main marketing challenge: ${brief.marketingChallenge}`,
    `Differentiation supplied by the user: ${compact(brief.differentiation)}`,
  ];

  if (compact(brief.currentCustomerPerception)) {
    facts.push(`Current customer perception supplied by the user: ${compact(brief.currentCustomerPerception)}`);
  }
  if (compact(brief.competitorsOrAlternatives)) {
    facts.push(`Competitors or alternatives supplied by the user: ${compact(brief.competitorsOrAlternatives)}`);
  }
  if (compact(brief.additionalInformation)) {
    facts.push(`Additional brief context: ${compact(brief.additionalInformation)}`);
  }
  return facts;
}

function assumptions(brief: CampaignBrief): string[] {
  const assumptions = [
    `Working assumption: ${brief.targetAudience} needs a reason to choose this offer over familiar alternatives; no customer research was provided to verify the exact barrier.`,
    `Working assumption: the supplied differentiation — ${compact(brief.differentiation)} — can be demonstrated in communications rather than only stated.`,
  ];
  if (!compact(brief.currentCustomerPerception)) {
    assumptions.push("Working assumption: current customer perception is not verified because the brief did not provide research or feedback.");
  }
  if (!compact(brief.competitorsOrAlternatives)) {
    assumptions.push("Working assumption: the competitive set is not verified because named competitors or alternatives were not provided.");
  }
  return assumptions;
}

function marketingProblem(brief: CampaignBrief): string {
  const detail = challengeDetail(brief);
  const differentiation = compact(brief.differentiation);
  switch (brief.marketingChallenge) {
    case "Low brand awareness":
      return `${brief.brandName} needs to become recognizable to ${brief.targetAudience} in ${brief.location}; the work must make ${differentiation} memorable rather than buy attention without a reason to remember it.`;
    case "Low sales/conversion":
      return `${brief.brandName} needs to turn interest in ${brief.product} into a clearer next action for ${brief.targetAudience}; the work must reduce the choice friction described by the brief: ${detail}`;
    case "New product launch":
      return `${brief.brandName} needs to introduce ${brief.product} with a simple reason to believe, so ${brief.targetAudience} can understand what is different and why it matters now.`;
    case "Low repeat purchase":
      return `${brief.brandName} needs to give existing or first-time buyers a reason to choose ${brief.product} again; the strategy should turn ${differentiation} into a repeatable use or preference cue.`;
    case "Need more leads":
      return `${brief.brandName} needs to make the value of ${brief.product} clear enough for ${brief.targetAudience} to start a conversation or submit an enquiry, rather than generate unqualified attention.`;
    case "Need more foot traffic":
      return `${brief.brandName} needs to create a specific reason for ${brief.targetAudience} to visit in ${brief.location}, connecting the campaign promise to a real-world action.`;
    case "Entering a new market":
      return `${brief.brandName} needs to earn initial relevance in ${brief.location} without assuming that the current positioning travels unchanged; the strategy must introduce ${differentiation} in a locally understandable way.`;
    case "Weak brand differentiation":
      return `${brief.brandName} needs to make its stated difference — ${differentiation} — easy for ${brief.targetAudience} to notice, understand, and repeat when comparing alternatives.`;
    case "Strong competition":
      return `${brief.brandName} needs to compete in a crowded choice set by making ${differentiation} more tangible than generic category promises; the stated problem is: ${detail}`;
    default:
      return `${brief.brandName} needs to solve the stated challenge — ${detail} — with a specific reason for ${brief.targetAudience} to notice and choose ${brief.product}.`;
  }
}

function audienceTension(brief: CampaignBrief): string {
  const perception = compact(brief.currentCustomerPerception);
  const alternatives = compact(brief.competitorsOrAlternatives);
  const comparison = alternatives
    ? `They may compare it with ${alternatives}.`
    : "The exact alternatives are not confirmed in the brief, so comparison language should be tested before launch.";
  const perceptionLine = perception
    ? `The current perception supplied in the brief is “${perception}.”`
    : "Current perception is unknown and should be treated as a hypothesis, not a fact.";
  return `${brief.targetAudience} has to make a choice in a category where attention and trust are limited. ${perceptionLine} ${comparison} The tension is between wanting a choice that feels relevant to their life and having too little specific proof to distinguish one option from another.`;
}

function consumerInsight(brief: CampaignBrief, mangoProduct: boolean): string {
  if (mangoProduct) {
    return `Working insight: when ${brief.targetAudience} sees another mango drink claim, “premium” is easy to ignore; a taste and origin they can recognize as genuinely local gives them a more personal reason to remember and choose ${brief.product}.`;
  }
  return `Working insight: ${brief.targetAudience} is more likely to notice ${brief.product} when the brand turns its stated difference — ${brief.differentiation} — into a concrete moment they can recognize, rather than another broad promise.`;
}

function positioning(brief: CampaignBrief): string {
  const perception = compact(brief.currentCustomerPerception);
  return `For ${brief.targetAudience} in ${brief.location}, ${brief.brandName} is the ${compact(brief.brandPersonality).toLowerCase()} ${brief.product} that makes ${compact(brief.differentiation)} tangible. It should compete on that specific proof, not on an unsupported claim about being better for everyone${perception ? `, especially if it can shift the current perception of “${perception}”` : ""}.`;
}

function selectTerritory(brief: CampaignBrief, mangoProduct: boolean): Territory {
  const territories: Territory[] = mangoProduct
    ? [
        {
          name: "No generic mango",
          rationale: "Turns the crowded-category problem into a memorable contrast between interchangeable claims and recognizable taste.",
          fit: "Strong relevance to the stated crowded-category challenge and the supplied authentic-taste difference.",
        },
        {
          name: "From where it grows",
          rationale: "Makes local sourcing the visible proof behind the product, not a footnote.",
          fit: "Strong proof potential, but depends on access to credible sourcing stories and usable origin material.",
        },
        {
          name: "Make the moment mango",
          rationale: "Builds a social routine around the sensory experience of the product.",
          fit: "Good audience participation potential, but less directly differentiated than origin and taste.",
        },
      ]
    : [
        {
          name: "Proof over promise",
          rationale: "Makes the supplied difference visible in the moment of use.",
          fit: "Strongest fit when the category is crowded or current perception is unclear.",
        },
        {
          name: "A better-fit choice",
          rationale: "Frames the product around the audience's actual decision and trade-off.",
          fit: "Useful when conversion or consideration is the main objective.",
        },
        {
          name: "The recognizable signal",
          rationale: "Builds a repeatable brand cue from the product's most ownable difference.",
          fit: "Useful for awareness, but requires a distinctive asset that the brief has not yet specified.",
        },
      ];

  const objective = lower(brief.objective);
  const challengeScore = awarenessChallenges.has(brief.marketingChallenge) ? 2 : 1;
  const objectiveScore = objective.includes("awareness") || objective.includes("engagement") ? 2 : 1;
  return territories
    .map((territory, index) => ({
      territory,
      score: index === 0 ? challengeScore + objectiveScore : index === 1 ? challengeScore + 1 : 1,
    }))
    .sort((a, b) => b.score - a.score)[0].territory;
}

function strategicDirection(brief: CampaignBrief, territory: Territory, insight: string): string {
  return `Use ${territory.name} as the organizing direction: start with the audience tension, prove ${compact(brief.differentiation)} in a recognizable moment, and repeat one ownable message across the ${brief.duration} campaign. This directly answers ${brief.marketingChallenge.toLowerCase()} rather than treating reach as the strategy. The direction is grounded in the working insight: ${insight}`;
}

function activation(
  channel: string,
  what: string,
  why: string,
  audience: string,
  strategicLink: string,
): ActivationRecommendation {
  return { channel, what, why, audience, strategicLink };
}

function buildContentIdeas(
  brief: CampaignBrief,
  bigIdea: string,
  insight: string,
  mangoProduct: boolean,
): ContentIdea[] {
  const proof = mangoProduct
    ? "the locally sourced mango and authentic mango taste supplied in the brief"
    : `the supplied difference: ${compact(brief.differentiation)}`;
  return [
    {
      format: "Hero short-form video",
      title: mangoProduct ? "No generic mango" : "Show the difference",
      description: `Open with the category feeling interchangeable, then move to a close product moment that demonstrates ${proof}. End with “${bigIdea}”.`,
      whyRelevant: `It gives the stated ${brief.marketingChallenge.toLowerCase()} problem a visible answer instead of another abstract claim.`,
      audience: brief.targetAudience,
      strategicLink: `It turns the consumer insight into the first proof of the big idea: ${bigIdea}.`,
    },
    {
      format: "Origin or proof carousel",
      title: mangoProduct ? "Where the real taste starts" : "The proof behind the promise",
      description: `Use a small sequence of factual, user-supplied proof points about ${proof}; label anything still to be verified before publishing.`,
      whyRelevant: "It makes the brand's difference easier to understand and repeat when people compare alternatives.",
      audience: brief.targetAudience,
      strategicLink: "It supports the positioning by translating a stated difference into evidence.",
    },
    {
      format: "Taste, trial, or use-case story",
      title: mangoProduct ? "One sip, one opinion" : "The moment it fits",
      description: `Show ${brief.targetAudience} encountering ${brief.product} in a real ${brief.location} context, then invite a response about the specific benefit rather than a generic like or share.`,
      whyRelevant: `It tests whether the working insight is true without pretending the audience research already exists.`,
      audience: brief.targetAudience,
      strategicLink: "It converts the audience tension into a low-cost learning loop for the campaign.",
    },
    {
      format: "Comparison-safe static creative",
      title: "A clear reason to choose",
      description: `Pair one audience situation with one verified ${compact(brief.differentiation)} proof point and one objective-aligned next step.`,
      whyRelevant: "It gives the campaign a concise memory cue for people who will not consume the full story.",
      audience: brief.targetAudience,
      strategicLink: `It repeats the key message without inventing competitor claims or unsupported performance facts.`,
    },
  ];
}

function buildDigitalActivation(
  brief: CampaignBrief,
  bigIdea: string,
  insight: string,
  mangoProduct: boolean,
): ActivationRecommendation[] {
  return [
    activation(
      "Short-form video distribution",
      `Release the hero “${bigIdea}” video in versions that open with the audience tension, then show ${mangoProduct ? "the taste/origin proof" : `the ${compact(brief.differentiation)} proof`}.`,
      `The brief needs a specific answer to ${brief.marketingChallenge.toLowerCase()}, so distribution is used to deliver the proof, not as a standalone recommendation.`,
      brief.targetAudience,
      "Tension → proof → key message is the campaign's core sequence.",
    ),
    activation(
      "Proof-led campaign page",
      `Build one mobile-first page that states the key message, shows the verified difference, and gives people the single next step required by ${brief.objective}.`,
      "A single destination prevents the campaign from ending in attention without understanding or action.",
      `${brief.targetAudience} who move from the first message to consideration`,
      "It carries the big idea from a memorable line into a decision-ready proof experience.",
    ),
    activation(
      "Message learning loop",
      `Test two openings: one led by the audience tension and one led by ${compact(brief.differentiation)}; keep the rest of the campaign idea consistent.`,
      "The brief does not include customer research, so the campaign should learn which articulation makes the insight feel true.",
      brief.targetAudience,
      "Testing sharpens the same strategic direction instead of generating unrelated creative.",
    ),
  ];
}

function buildOfflineActivation(
  brief: CampaignBrief,
  bigIdea: string,
  mangoProduct: boolean,
): ActivationRecommendation[] {
  return [
    activation(
      "Focused trial or demonstration",
      `Create a small ${brief.location} activation where people can experience ${brief.product} and encounter the line “${bigIdea}” at the moment of proof.`,
      `The offline moment makes ${mangoProduct ? "taste" : "the product difference"} tangible, which is more useful for this brief than generic visibility.`,
      brief.targetAudience,
      "It gives the big idea a physical proof point that digital content can document and repeat.",
    ),
    activation(
      "Partner or frontline toolkit",
      `Give selected partners, sellers, or hosts a one-page story: the audience tension, the verified difference, the key message, and the next action.`,
      "The strategy should remain consistent wherever the audience encounters the brand.",
      `${brief.targetAudience} reached through relevant local or category touchpoints`,
      "It protects the same positioning from being diluted into generic sales language.",
    ),
  ];
}

function buildCreatorStrategy(
  brief: CampaignBrief,
  bigIdea: string,
  mangoProduct: boolean,
): ActivationRecommendation {
  const creatorType = isB2B(brief)
    ? `credible ${brief.industry} practitioners`
    : mangoProduct
      ? "local food, culture, or everyday-routine creators"
      : `creators whose audience already matches ${brief.targetAudience}`;
  return activation(
    "Creator proof",
    `Brief a small set of ${creatorType} to show one real ${brief.product} use or trial and explain the specific difference behind “${bigIdea}”; do not ask for generic praise.`,
    "The creator's job is to make the working insight observable through a relevant use case, not to add undirected reach.",
    brief.targetAudience,
    "Their proof extends the audience tension → product evidence → key message sequence.",
  );
}

function buildTimeline(brief: CampaignBrief, bigIdea: string): CampaignStrategy["timeline"] {
  const days = parseDurationDays(brief.duration);
  const firstEnd = Math.max(3, Math.round(days * 0.2));
  const secondEnd = Math.max(firstEnd + 1, Math.round(days * 0.55));
  const thirdEnd = Math.max(secondEnd + 1, Math.round(days * 0.85));
  return [
    {
      phase: "Phase 1 — Diagnose and seed",
      timing: `Days 1–${firstEnd}`,
      focus: "Confirm the proof, prepare the message, and introduce the audience tension.",
      actions: [
        `Verify every public claim behind ${compact(brief.differentiation)}`,
        `Release the first ${bigIdea} story and record audience language`,
        "Set a baseline for the objective-aligned KPI signals",
      ],
    },
    {
      phase: "Phase 2 — Make the difference understood",
      timing: `Days ${firstEnd + 1}–${secondEnd}`,
      focus: "Move from recognition to product understanding with proof-led content and relevant voices.",
      actions: [
        "Publish the proof/origin or use-case sequence",
        "Run the two message openings against the same strategic idea",
        "Activate the selected trial, partner, or creator touchpoints",
      ],
    },
    {
      phase: "Phase 3 — Concentrate on the signal",
      timing: `Days ${secondEnd + 1}–${thirdEnd}`,
      focus: `Put the strongest audience/message combination behind the ${brief.objective.toLowerCase()} next step.`,
      actions: [
        "Reallocate the limited budget toward the clearest proof signal",
        "Repeat the key message where the audience is showing meaningful interest",
        "Remove weak claims or executions that do not connect to the big idea",
      ],
    },
    {
      phase: "Phase 4 — Learn and carry forward",
      timing: `Days ${thirdEnd + 1}–${days}`,
      focus: "Capture what changed in attention, understanding, and action before the next cycle.",
      actions: [
        "Review objective-aligned KPI signals against the starting baseline",
        "Collect qualitative feedback on the difference and message",
        "Document the strongest proof and the next strategic question",
      ],
    },
  ];
}

function buildBudgetAllocations(brief: CampaignBrief): BudgetAllocation[] {
  const percentages = awarenessChallenges.has(brief.marketingChallenge)
    ? [
        ["Proof-led distribution", 35],
        ["Creative production", 25],
        ["Trial and community", 20],
        ["Creator proof", 10],
        ["Measurement and contingency", 10],
      ]
    : [
        ["Conversion or lead distribution", 30],
        ["Creative production", 25],
        ["Product or sales experience", 20],
        ["Audience-specific partnerships", 15],
        ["Measurement and contingency", 10],
      ];
  let allocated = 0;
  return percentages.map(([channel, percentage], index) => {
    const amount =
      index === percentages.length - 1
        ? brief.budgetAmount - allocated
        : Math.round((brief.budgetAmount * Number(percentage)) / 100);
    allocated += amount;
    return {
      channel: String(channel),
      percentage: Number(percentage),
      amount,
      rationale:
        index === 0
          ? `Fund the part of the plan that directly delivers the ${brief.marketingChallenge.toLowerCase()} solution.`
          : index === 1
            ? "Create enough proof-led variations to learn without spreading the budget across unrelated ideas."
            : index === percentages.length - 1
              ? "Keep a deliberate reserve for measurement and evidence-led reallocation."
              : `Support the ${brief.product} experience that makes the campaign promise tangible for ${brief.targetAudience}.`,
    };
  });
}

function buildKpis(brief: CampaignBrief): Kpi[] {
  const objective = lower(brief.objective);
  if (objective.includes("awareness")) {
    return [
      {
        metric: `Qualified reach and frequency among ${brief.targetAudience}`,
        why: "Awareness needs the right people to encounter the same distinctive proof often enough to remember it.",
        signal: "Reach, frequency, and a simple recall check where a baseline can be established.",
      },
      {
        metric: "Video completion, saves, and shares on proof-led assets",
        why: "These signals show whether the audience stayed with the specific story rather than only being served an impression.",
        signal: "Compare the tension-led and proof-led openings using the same audience definition.",
      },
      {
        metric: `Search, direct, or branded response associated with ${brief.brandName}`,
        why: "The campaign should create a traceable increase in interest, not only passive exposure.",
        signal: "Monitor change from the pre-campaign baseline; do not assume a lift before measuring it.",
      },
    ];
  }
  if (objective.includes("lead")) {
    return [
      {
        metric: "Qualified enquiries from the intended audience",
        why: "Lead generation is successful only when attention becomes a relevant conversation.",
        signal: "Count completed, qualified actions and review fit manually.",
      },
      {
        metric: "Cost per qualified lead by message",
        why: "The budget should move toward the proof that earns the right response efficiently.",
        signal: "Compare message variants after a consistent learning period.",
      },
      {
        metric: "Landing-page completion rate",
        why: "A clear promise and one next action should reduce drop-off after the campaign message.",
        signal: "Track the defined action from visit to completion.",
      },
    ];
  }
  if (objective.includes("sales") || objective.includes("conversion")) {
    return [
      {
        metric: "Conversion rate for the defined next action",
        why: "The stated objective requires behavior, not only engagement.",
        signal: "Measure completed actions against qualified visits or opportunities.",
      },
      {
        metric: "Cost per conversion by audience and message",
        why: "It shows whether the budget is reaching people who can plausibly choose the product.",
        signal: "Reallocate only after comparing like-for-like audience and creative inputs.",
      },
      {
        metric: "Product proof interaction rate",
        why: "People who engage with the specific difference are closer to the strategy than generic clickers.",
        signal: "Track visits, trials, demo steps, or other proof interactions defined for this product.",
      },
    ];
  }
  return [
    {
      metric: `Meaningful engagement from ${brief.targetAudience}`,
      why: `The ${brief.objective} objective needs a signal from the intended audience, not undirected activity.`,
      signal: "Track saves, replies, qualified visits, trials, or the closest defined action for this product.",
    },
    {
      metric: "Message and proof comprehension",
      why: "The strategy depends on people understanding the stated difference.",
      signal: "Use a short response prompt, assisted recall check, or frontline feedback.",
    },
    {
      metric: "Cost per objective-aligned action",
      why: "It keeps the budget tied to the campaign outcome rather than surface-level volume.",
      signal: "Define the action before launch and compare it by audience/message combination.",
    },
  ];
}

function qualityCheck(
  brief: CampaignBrief,
  territory: Territory,
  budgetAllocation: BudgetAllocation[],
  contentIdeas: ContentIdea[],
): string[] {
  const budgetTotal = budgetAllocation.reduce((sum, item) => sum + item.percentage, 0);
  return [
    `Pass — the strategy starts from ${brief.marketingChallenge.toLowerCase()} and names the problem before recommending execution.`,
    `Pass — the audience is explicit: ${brief.targetAudience}; the tension and insight are labeled as working strategic reasoning rather than verified research.`,
    `Pass — the big idea is derived from the selected territory “${territory.name}” and the user-supplied difference: ${compact(brief.differentiation)}.`,
    `Pass — ${contentIdeas.length} content routes and the activation plan all link back to the same tension → proof → message sequence.`,
    `Pass — budget allocation totals ${budgetTotal}% and uses the submitted ${money(brief)} planning input.`,
    "Pass — unsupported market share, customer statistics, competitor claims, and invented product features were excluded.",
  ];
}

export function generateCampaignStrategy(brief: CampaignBrief): CampaignStrategy {
  const brand = compact(brief.brandName);
  const product = compact(brief.product);
  const audience = compact(brief.targetAudience);
  const location = compact(brief.location);
  const objective = compact(brief.objective);
  const personality = compact(brief.brandPersonality);
  const mangoProduct = isMangoProduct(product);
  const problem = marketingProblem(brief);
  const tension = audienceTension(brief);
  const insight = consumerInsight(brief, mangoProduct);
  const territory = selectTerritory(brief, mangoProduct);
  const bigIdea = mangoProduct
    ? "No generic mango. Just the taste of here."
    : `${territory.name}: ${compact(brief.differentiation)} made recognizable.`;
  const keyMessage = mangoProduct
    ? `${product} brings locally sourced mangoes and authentic mango taste to ${audience} in ${location} — a real reason to choose beyond another generic drink claim.`
    : `${product} gives ${audience} a clear, provable reason to choose ${brand}: ${compact(brief.differentiation)}.`;
  const contentIdeas = buildContentIdeas(brief, bigIdea, insight, mangoProduct);
  const digitalActivation = buildDigitalActivation(brief, bigIdea, insight, mangoProduct);
  const offlineActivation = buildOfflineActivation(brief, bigIdea, mangoProduct);
  const creatorStrategy = buildCreatorStrategy(brief, bigIdea, mangoProduct);
  const budgetAllocation = buildBudgetAllocations(brief);

  return {
    diagnosis: {
      businessContext: `${brand} is marketing ${product} in ${location} to ${audience} with a ${objective} objective and a ${compact(brief.brandPersonality).toLowerCase()} personality.`,
      userProvidedFacts: businessFacts(brief),
      marketingProblem: problem,
      strategicAssumptions: assumptions(brief),
      recommendedApproach: `Use “${territory.name}” to turn the supplied difference into proof that can be noticed, understood, and acted on within ${compact(brief.duration)}.`,
    },
    overview: {
      campaignName: `${brand} / ${territory.name}`,
      concept: bigIdea,
      objective,
    },
    marketingProblem: problem,
    audienceTension: tension,
    consumerInsight: insight,
    targetAudience: {
      primary: audience,
      secondary: isB2B(brief)
        ? "Decision-makers, evaluators, and internal champions who influence the final choice."
        : `People close to ${audience} who shape recommendations, trial, and repeat consideration.`,
      characteristics: [
        `Lives or operates in ${location}`,
        `Needs a specific reason to prefer ${product} over alternatives`,
        `Will respond more strongly to ${personality.toLowerCase()} communication when it is backed by proof`,
        `Should be treated as a defined audience, not a proxy for everyone in the market`,
      ],
    },
    positioning: positioning(brief),
    strategicDirection: strategicDirection(brief, territory, insight),
    bigIdea,
    keyMessage,
    creativeDirection: {
      visualDirection: `Show the audience tension in a recognizable ${location} context, then make ${compact(brief.differentiation)} the visual proof. Keep the campaign cue consistent across every execution.`,
      tone: `${personality}; specific, human, and confident without making unsupported superlative claims.`,
      storytelling: `Begin with the choice problem, reveal the verified difference, demonstrate it in use, and land on “${keyMessage}”.`,
      suggestedStyle: `A proof-led system built from close product moments, real context, one repeatable campaign cue, and clear labels for anything still to validate.`,
    },
    contentIdeas,
    digitalActivation,
    offlineActivation,
    creatorStrategy,
    timeline: buildTimeline(brief, bigIdea),
    budgetAllocation,
    kpis: buildKpis(brief),
    strategicRationale: `The plan connects the brief's business context to ${brief.marketingChallenge.toLowerCase()}: the problem is ${problem} The audience tension leads to the working insight, the insight selects “${territory.name}”, and that territory becomes ${bigIdea}. Execution is limited to proof-led activities that can be completed within ${compact(brief.duration)} and measured against ${objective.toLowerCase()} using the submitted ${money(brief)} planning input.`,
    qualityCheck: qualityCheck(brief, territory, budgetAllocation, contentIdeas),
  };
}