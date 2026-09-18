import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clipboard,
  Copy,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import {
  getGetCampaignQueryKey,
  getGetCampaignSummaryQueryKey,
  getListCampaignsQueryKey,
  useDeleteCampaign,
  useGenerateCampaign,
  useGetCampaign,
  useGetCampaignSummary,
  useListCampaigns,
  useSaveCampaign,
  useUpdateCampaign,
  type AudienceProfile,
  type Campaign,
  type CampaignBrief,
  type CampaignStrategy,
  type ContentIdea,
  type TimelinePhase,
} from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Link, Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const emptyBrief: CampaignBrief = {
  brandName: "",
  industry: "",
  product: "",
  targetAudience: "",
  objective: "",
  location: "",
  duration: "",
  budgetAmount: 0,
  budgetCurrency: "BDT",
  brandPersonality: "",
  challenge: "",
  additionalInformation: "",
};

const queryClient = new QueryClient();

const industries = [
  "Food & Beverage",
  "Retail & E-commerce",
  "Technology & SaaS",
  "Health & Wellness",
  "Education",
  "Finance",
  "Travel & Hospitality",
  "Professional Services",
  "Other",
];
const objectives = [
  "Brand Awareness",
  "Product Launch",
  "Lead Generation",
  "Sales",
  "Customer Retention",
  "Engagement",
  "Foot Traffic",
  "Other",
];
const personalities = [
  "Premium",
  "Friendly",
  "Bold",
  "Youthful",
  "Professional",
  "Emotional",
  "Playful",
  "Minimal",
  "Other",
];

function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { error?: string } }).data;
    if (data?.error) return data.error;
  }
  return fallback;
}

function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/campaign-generator", label: "Campaign Generator", icon: WandSparkles },
    { href: "/campaigns", label: "Campaign Library", icon: BriefcaseBusiness },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="brand-name">BrandCraft</div>
            <div className="brand-caption">Strategy workspace</div>
          </div>
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            data-testid="button-close-navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">BC</div>
          <div className="workspace-copy">
            <span className="eyebrow">Workspace</span>
            <strong>BrandCraft Studio</strong>
          </div>
          <ChevronRight size={16} />
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              className={`nav-link ${location === href ? "nav-link-active" : ""}`}
              onClick={() => setMobileOpen(false)}
              data-testid={`link-${label.toLowerCase().replaceAll(" ", "-")}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-prompt">
            <div className="prompt-icon"><Sparkles size={16} /></div>
            <div>
              <strong>Turn a brief into a plan</strong>
              <p>Build a campaign strategy in minutes.</p>
            </div>
          </div>
          <div className="profile-row">
            <div className="profile-avatar">AS</div>
            <div className="profile-copy">
              <strong>Ahsan Shamim</strong>
              <span>Strategy lead</span>
            </div>
            <MoreHorizontal size={16} />
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-sidebar-backdrop" />}
      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            data-testid="button-open-navigation"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-context">
            <span>BrandCraft Studio</span>
            <ChevronRight size={14} />
            <span className="topbar-current">{location === "/" ? "Overview" : location.startsWith("/campaigns") ? "Campaigns" : "Campaign Generator"}</span>
          </div>
          <div className="topbar-actions">
            <Link href="/campaign-generator" className="button button-primary button-small" data-testid="link-topbar-new-campaign">
              <Plus size={16} />
              New campaign
            </Link>
          </div>
        </header>
        <div className="page-wrap">{children}</div>
      </main>
    </div>
  );
}

function Home() {
  const { data: summary } = useGetCampaignSummary();
  const { data: campaigns, isLoading } = useListCampaigns();

  return (
    <div className="page page-overview">
      <div className="page-heading heading-with-action">
        <div>
          <span className="kicker">Workspace overview</span>
          <h1>Make the next move clearer.</h1>
          <p>Turn the raw thinking behind your marketing into a plan your team can act on.</p>
        </div>
        <Link href="/campaign-generator" className="button button-primary" data-testid="link-start-campaign">
          <WandSparkles size={17} />
          Build a campaign
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-badge"><Sparkles size={14} /> Strategy, without the blank page</div>
          <h2>A sharper brief is the start of better work.</h2>
          <p>BrandCraft gives your team a structured route from what you know about the business to a campaign worth putting into market.</p>
          <Link href="/campaign-generator" className="text-link" data-testid="link-hero-generator">Start with a brief <ArrowUpRight size={15} /></Link>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring orbit-ring-one" />
          <div className="orbit-ring orbit-ring-two" />
          <div className="orbit-center"><Lightbulb size={26} /></div>
          <span className="orbit-node orbit-node-one"><Target size={16} /></span>
          <span className="orbit-node orbit-node-two"><Users size={16} /></span>
          <span className="orbit-node orbit-node-three"><BarChart3 size={16} /></span>
        </div>
      </section>

      <section className="stat-grid" aria-label="Campaign summary">
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><BriefcaseBusiness size={18} /></div>
          <div><span className="stat-label">Saved campaigns</span><strong data-testid="text-total-campaigns">{summary?.totalCampaigns ?? 0}</strong></div>
          <span className="stat-note">All time</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-mint"><BarChart3 size={18} /></div>
          <div><span className="stat-label">Created this month</span><strong data-testid="text-month-campaigns">{summary?.thisMonth ?? 0}</strong></div>
          <span className="stat-note">Current month</span>
        </div>
        <div className="stat-card stat-card-wide">
          <div className="stat-icon stat-icon-orange"><Sparkles size={18} /></div>
          <div><span className="stat-label">Latest strategy</span><strong data-testid="text-latest-campaign">{summary?.latestCampaign ?? "No campaign yet"}</strong></div>
          <Link href="/campaigns" className="stat-link" data-testid="link-view-library">View library <ArrowUpRight size={14} /></Link>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><span className="kicker">Recent work</span><h2>Campaign library</h2></div>
          <Link href="/campaigns" className="subtle-link" data-testid="link-see-all-campaigns">See all <ArrowUpRight size={14} /></Link>
        </div>
        {isLoading ? <LoadingRow label="Loading your campaign workspace" /> : campaigns?.length ? (
          <div className="recent-grid">
            {campaigns.slice(0, 3).map((campaign) => <CampaignCard campaign={campaign} key={campaign.id} />)}
          </div>
        ) : <EmptyState compact />}
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = true,
  type = "text",
  error,
  options,
  hint,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  error?: string;
  options?: string[];
  hint?: string;
}) {
  return (
    <label className={`field ${error ? "field-error" : ""}`} data-testid={`field-${name}`}>
      <span className="field-label">{label}{required && <em> *</em>}</span>
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} data-testid={`select-${name}`}>
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} data-testid={`input-${name}`} />
      )}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error-message">{error}</span>}
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  required = true,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className={`field field-full ${error ? "field-error" : ""}`} data-testid={`field-${name}`}>
      <span className="field-label">{label}{required && <em> *</em>}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} data-testid={`textarea-${name}`} />
      {error && <span className="field-error-message">{error}</span>}
    </label>
  );
}

function GeneratorPage() {
  const [, setLocation] = useLocation();
  const editId = new URLSearchParams(window.location.search).get("edit");
  const queryClient = useQueryClient();
  const [brief, setBrief] = useState<CampaignBrief>(emptyBrief);
  const [strategy, setStrategy] = useState<CampaignStrategy | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CampaignBrief, string>>>({});
  const [stage, setStage] = useState(0);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(editId);
  const [showForm, setShowForm] = useState(true);
  const [copyState, setCopyState] = useState(false);
  const { data: editCampaign, isLoading: loadingEdit } = useGetCampaign(editId ?? "", {
    query: {
      enabled: Boolean(editId),
      queryKey: getGetCampaignQueryKey(editId ?? ""),
    },
  });
  const generate = useGenerateCampaign();
  const save = useSaveCampaign();
  const update = useUpdateCampaign();
  const stages = ["Analyzing your brief", "Finding the audience tension", "Developing the campaign idea", "Building the activation plan", "Finalizing the strategy"];

  useEffect(() => {
    if (editCampaign) {
      setBrief(editCampaign.brief);
      setStrategy(editCampaign.strategy);
      setSavedId(editCampaign.id);
      setShowForm(false);
    }
  }, [editCampaign]);

  useEffect(() => {
    if (!generate.isPending) {
      setStage(0);
      return;
    }
    setStage(0);
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, stages.length - 1)), 700);
    return () => window.clearInterval(timer);
  }, [generate.isPending, stages.length]);

  const updateBrief = (key: keyof CampaignBrief, value: string | number) => {
    setBrief((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setNotice(null);
  };

  const validate = () => {
    const required: (keyof CampaignBrief)[] = ["brandName", "industry", "product", "targetAudience", "objective", "location", "duration", "brandPersonality", "challenge"];
    const nextErrors: Partial<Record<keyof CampaignBrief, string>> = {};
    for (const key of required) if (!String(brief[key] ?? "").trim()) nextErrors[key] = "This field is required.";
    if (!brief.budgetAmount || brief.budgetAmount < 0) nextErrors.budgetAmount = "Enter a budget amount.";
    if (!brief.budgetCurrency.trim()) nextErrors.budgetCurrency = "Choose a currency.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const generateCampaign = () => {
    if (!validate()) {
      setNotice({ type: "error", text: "Complete the highlighted fields to generate your strategy." });
      return;
    }
    setNotice(null);
    generate.mutate({ data: brief }, {
      onSuccess: (result) => {
        setStrategy(result);
        setShowForm(false);
        setNotice({ type: "success", text: "Your campaign strategy is ready to review." });
      },
      onError: (error) => setNotice({ type: "error", text: getErrorMessage(error, "We couldn't generate the strategy. Please try again.") }),
    });
  };

  const saveCampaign = () => {
    if (!strategy) return;
    setNotice(null);
    const onSuccess = (campaign: Campaign) => {
      setSavedId(campaign.id);
      queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCampaignSummaryQueryKey() });
      setNotice({ type: "success", text: savedId ? "Campaign updated in your library." : "Campaign saved to your library." });
    };
    if (savedId) {
      update.mutate({ id: savedId, data: { brief, strategy } }, {
        onSuccess,
        onError: (error) => setNotice({ type: "error", text: getErrorMessage(error, "We couldn't update this campaign.") }),
      });
    } else {
      save.mutate({ data: { brief, strategy } }, {
        onSuccess,
        onError: (error) => setNotice({ type: "error", text: getErrorMessage(error, "We couldn't save this campaign.") }),
      });
    }
  };

  const copyCampaign = async () => {
    if (!strategy) return;
    const text = `${strategy.overview.campaignName}\n\n${strategy.overview.concept}\n\nBig idea\n${strategy.bigIdea}\n\nKey message\n${strategy.keyMessage}\n\nStrategic rationale\n${strategy.strategicRationale}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(true);
      window.setTimeout(() => setCopyState(false), 1800);
    } catch {
      setNotice({ type: "error", text: "Copy is unavailable in this browser. Select the strategy text to copy it manually." });
    }
  };

  if (loadingEdit) return <div className="page centered-state"><LoadingRow label="Opening campaign brief" /></div>;

  return (
    <div className="page page-generator">
      <div className="page-heading">
        <span className="kicker">Campaign Generator</span>
        <h1>Turn your brief into a campaign strategy.</h1>
        <p>Give BrandCraft the context behind the business. Get a clear, structured route to market.</p>
      </div>

      {notice && <div className={`notice notice-${notice.type}`} role="status" data-testid="status-generator"><span>{notice.type === "success" ? <Check size={16} /> : <X size={16} />}</span>{notice.text}</div>}

      {showForm && (
        <section className="brief-layout">
          <div className="brief-intro">
            <div className="step-marker">01</div>
            <span className="kicker">The marketing brief</span>
            <h2>Start with the signal, not the noise.</h2>
            <p>Specific context creates a sharper strategy. Tell us what matters about the brand, the market, and the moment.</p>
            <div className="brief-aside">
              <div className="aside-line"><Check size={14} /><span>Structured for real campaign planning</span></div>
              <div className="aside-line"><Check size={14} /><span>Recommendations grounded in your inputs</span></div>
              <div className="aside-line"><Check size={14} /><span>Editable, saveable, and ready to share</span></div>
            </div>
          </div>
          <div className="form-card">
            <div className="form-section-heading"><div><h2>Tell us about the campaign</h2><p>Fields marked with <em>*</em> are required.</p></div><span className="form-progress">1 of 1</span></div>
            <div className="form-grid">
              <Field label="Brand / business name" name="brandName" value={brief.brandName} onChange={(value) => updateBrief("brandName", value)} placeholder="e.g. Mango Valley" error={errors.brandName} />
              <Field label="Industry" name="industry" value={brief.industry} onChange={(value) => updateBrief("industry", value)} options={industries} error={errors.industry} />
              <Field label="Product / service" name="product" value={brief.product} onChange={(value) => updateBrief("product", value)} placeholder="What are you marketing?" error={errors.product} />
              <Field label="Target audience" name="targetAudience" value={brief.targetAudience} onChange={(value) => updateBrief("targetAudience", value)} placeholder="Who should care most?" error={errors.targetAudience} />
              <Field label="Campaign objective" name="objective" value={brief.objective} onChange={(value) => updateBrief("objective", value)} options={objectives} error={errors.objective} />
              <Field label="Target location / market" name="location" value={brief.location} onChange={(value) => updateBrief("location", value)} placeholder="e.g. Dhaka, Bangladesh" error={errors.location} />
              <Field label="Campaign duration" name="duration" value={brief.duration} onChange={(value) => updateBrief("duration", value)} placeholder="e.g. 30 days" error={errors.duration} />
              <div className="budget-field">
                <span className="field-label">Budget <em>*</em></span>
                <div className="budget-input">
                  <select value={brief.budgetCurrency} onChange={(event) => updateBrief("budgetCurrency", event.target.value)} data-testid="select-budgetCurrency">
                    <option value="BDT">৳ BDT</option><option value="USD">$ USD</option><option value="EUR">€ EUR</option><option value="GBP">£ GBP</option>
                  </select>
                  <input type="number" min="0" value={brief.budgetAmount || ""} onChange={(event) => updateBrief("budgetAmount", Number(event.target.value))} placeholder="50,000" data-testid="input-budgetAmount" />
                </div>
                {errors.budgetAmount && <span className="field-error-message">{errors.budgetAmount}</span>}
              </div>
              <Field label="Brand personality" name="brandPersonality" value={brief.brandPersonality} onChange={(value) => updateBrief("brandPersonality", value)} options={personalities} error={errors.brandPersonality} />
              <TextAreaField label="Key problem / challenge" name="challenge" value={brief.challenge} onChange={(value) => updateBrief("challenge", value)} placeholder="What is making this campaign necessary right now?" error={errors.challenge} />
              <TextAreaField label="Additional information" name="additionalInformation" value={brief.additionalInformation ?? ""} onChange={(value) => updateBrief("additionalInformation", value)} required={false} placeholder="Anything else the strategy should know? (optional)" />
            </div>
            <div className="form-actions"><span className="form-footnote"><Sparkles size={14} /> Your strategy is generated from this brief.</span><button className="button button-primary" onClick={generateCampaign} disabled={generate.isPending} data-testid="button-generate-campaign">{generate.isPending ? <><LoaderCircle size={17} className="spin" /> Building strategy...</> : <><WandSparkles size={17} /> Generate campaign <ArrowUpRight size={16} /></>}</button></div>
          </div>
        </section>
      )}

      {generate.isPending && <GenerationProgress stage={stage} stages={stages} />}

      {strategy && !generate.isPending && (
        <StrategyView
          strategy={strategy}
          brief={brief}
          savedId={savedId}
          copyState={copyState}
          isSaving={save.isPending || update.isPending}
          onEdit={() => { setShowForm(true); setNotice(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onRegenerate={generateCampaign}
          onCopy={copyCampaign}
          onSave={saveCampaign}
          onBackToLibrary={() => setLocation("/campaigns")}
        />
      )}
    </div>
  );
}

function GenerationProgress({ stage, stages }: { stage: number; stages: string[] }) {
  return <section className="processing-panel" data-testid="status-generation-progress"><div className="processing-orb"><Sparkles size={22} /></div><div className="processing-copy"><span className="kicker">BrandCraft is working</span><h2>{stages[stage]}</h2><p>Building a strategy around your audience, objective, and market context.</p><div className="stage-list">{stages.map((item, index) => <div className={`stage-item ${index < stage ? "stage-done" : ""} ${index === stage ? "stage-active" : ""}`} key={item}>{index < stage ? <Check size={14} /> : index === stage ? <LoaderCircle size={14} className="spin" /> : <span className="stage-dot" />}{item}</div>)}</div></div></section>;
}

function StrategyView({
  strategy,
  brief,
  savedId,
  copyState,
  isSaving,
  onEdit,
  onRegenerate,
  onCopy,
  onSave,
  onBackToLibrary,
}: {
  strategy: CampaignStrategy;
  brief: CampaignBrief;
  savedId: string | null;
  copyState: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onSave: () => void;
  onBackToLibrary: () => void;
}) {
  return (
    <div className="strategy-workspace">
      <div className="strategy-topbar">
        <div><span className="kicker">Campaign strategy</span><h2 data-testid="text-campaign-name">{strategy.overview.campaignName}</h2><p>{brief.brandName} · {brief.industry} · {brief.location}</p></div>
        <div className="strategy-actions"><button className="button button-secondary button-small" onClick={onEdit} data-testid="button-edit-brief"><FileText size={15} /> Edit brief</button><button className="button button-secondary button-small" onClick={onRegenerate} data-testid="button-regenerate-campaign"><RefreshCw size={15} /> Regenerate</button><button className="button button-secondary button-small" onClick={onCopy} data-testid="button-copy-campaign">{copyState ? <Check size={15} /> : <Copy size={15} />} {copyState ? "Copied" : "Copy campaign"}</button><button className="button button-primary button-small" onClick={onSave} disabled={isSaving} data-testid="button-save-campaign">{isSaving ? <LoaderCircle size={15} className="spin" /> : savedId ? <Check size={15} /> : <Bookmark size={15} />} {savedId ? "Update campaign" : "Save campaign"}</button></div>
      </div>
      <div className="strategy-meta-row"><span><Target size={14} /> {strategy.overview.objective}</span><span><BriefcaseBusiness size={14} /> {brief.duration}</span><span><BarChart3 size={14} /> {brief.budgetCurrency} {brief.budgetAmount.toLocaleString()} planning input</span></div>
      <div className="strategy-grid">
        <StrategyCard title="Campaign overview" icon={<Lightbulb size={17} />} className="strategy-card-featured"><h3>{strategy.overview.concept}</h3><p className="large-copy">{strategy.strategicRationale}</p></StrategyCard>
        <StrategyCard title="Consumer insight" icon={<Users size={17} />}><p>{strategy.consumerInsight}</p></StrategyCard>
        <StrategyCard title="Positioning" icon={<Target size={17} />}><p>{strategy.positioning}</p></StrategyCard>
        <StrategyCard title="Big campaign idea" icon={<Sparkles size={17} />} className="strategy-card-idea"><span className="idea-label">The central thought</span><h3>{strategy.bigIdea}</h3><div className="message-block"><span>Key message</span><strong>{strategy.keyMessage}</strong></div></StrategyCard>
        <AudienceCard audience={strategy.targetAudience} />
        <CreativeCard direction={strategy.creativeDirection} />
        <ContentCard ideas={strategy.contentIdeas} />
        <ListCard title="Digital activation" icon={<Send size={17} />} items={strategy.digitalActivation} />
        <ListCard title="Offline activation" icon={<BriefcaseBusiness size={17} />} items={strategy.offlineActivation} />
        <StrategyCard title="Influencer / creator strategy" icon={<Users size={17} />}><p>{strategy.influencerStrategy}</p></StrategyCard>
        <TimelineCard phases={strategy.timeline} />
        <BudgetCard brief={brief} allocations={strategy.budgetAllocation} />
        <ListCard title="KPIs to watch" icon={<BarChart3 size={17} />} items={strategy.kpis} />
      </div>
      <div className="strategy-footer"><span><Sparkles size={14} /> Strategic recommendations are generated from your brief and should be refined with live market learning.</span><button className="text-link" onClick={onBackToLibrary} data-testid="button-back-to-library">Go to campaign library <ArrowUpRight size={15} /></button></div>
    </div>
  );
}

function StrategyCard({ title, icon, children, className = "" }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`strategy-card ${className}`}><div className="card-title"><span className="card-icon">{icon}</span><h3>{title}</h3></div>{children}</section>;
}
function AudienceCard({ audience }: { audience: AudienceProfile }) {
  return <StrategyCard title="Target audience" icon={<Users size={17} />}><div className="audience-columns"><div><span className="mini-label">Primary</span><p>{audience.primary}</p></div><div><span className="mini-label">Secondary</span><p>{audience.secondary}</p></div></div><div className="tag-list">{audience.characteristics.map((item) => <span className="tag" key={item}>{item}</span>)}</div></StrategyCard>;
}
function CreativeCard({ direction }: { direction: CampaignStrategy["creativeDirection"] }) {
  return <StrategyCard title="Creative direction" icon={<Sparkles size={17} />}><div className="creative-list"><div><span className="mini-label">Visual direction</span><p>{direction.visualDirection}</p></div><div><span className="mini-label">Tone</span><p>{direction.tone}</p></div><div><span className="mini-label">Storytelling</span><p>{direction.storytelling}</p></div><div><span className="mini-label">Suggested style</span><p>{direction.suggestedStyle}</p></div></div></StrategyCard>;
}
function ContentCard({ ideas }: { ideas: ContentIdea[] }) {
  return <StrategyCard title="Content ideas" icon={<FileText size={17} />}><div className="content-ideas">{ideas.map((idea, index) => <div className="content-idea" key={idea.title}><span className="content-number">0{index + 1}</span><div><span className="mini-label">{idea.format}</span><strong>{idea.title}</strong><p>{idea.description}</p></div></div>)}</div></StrategyCard>;
}
function ListCard({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return <StrategyCard title={title} icon={icon}><ul className="strategy-list">{items.map((item) => <li key={item}><Check size={15} /><span>{item}</span></li>)}</ul></StrategyCard>;
}
function TimelineCard({ phases }: { phases: TimelinePhase[] }) {
  return <StrategyCard title="Campaign timeline" icon={<BarChart3 size={17} />} className="strategy-card-wide"><div className="timeline">{phases.map((phase, index) => <div className="timeline-item" key={phase.phase}><div className="timeline-marker">{index + 1}</div><div className="timeline-copy"><div className="timeline-heading"><strong>{phase.phase}</strong><span>{phase.timing}</span></div><p>{phase.focus}</p><ul>{phase.actions.map((action) => <li key={action}>{action}</li>)}</ul></div></div>)}</div></StrategyCard>;
}
function BudgetCard({ brief, allocations }: { brief: CampaignBrief; allocations: CampaignStrategy["budgetAllocation"] }) {
  return <StrategyCard title="Budget allocation" icon={<BarChart3 size={17} />}><p className="muted-copy">Strategic recommendation for {brief.budgetCurrency} {brief.budgetAmount.toLocaleString()}; not a projection of market performance.</p><div className="budget-bars">{allocations.map((item) => <div className="budget-row" key={item.channel}><div className="budget-row-heading"><span>{item.channel}</span><strong>{item.percentage}%</strong></div><div className="progress-track"><span style={{ width: `${item.percentage}%` }} /></div><p>{item.rationale}</p></div>)}</div></StrategyCard>;
}

function CampaignCard({ campaign, onDelete }: { campaign: { id: string; name: string; brandName: string; industry: string; objective: string; createdAt: string | Date; updatedAt: string | Date }; onDelete?: (id: string) => void }) {
  return <article className="campaign-card" data-testid={`card-campaign-${campaign.id}`}><div className="campaign-card-top"><span className="campaign-icon"><Sparkles size={17} /></span><button className="icon-button card-more" aria-label={`More actions for ${campaign.name}`} data-testid={`button-more-campaign-${campaign.id}`}><MoreHorizontal size={17} /></button></div><Link href={`/campaigns/${campaign.id}`} className="campaign-card-link" data-testid={`link-open-campaign-${campaign.id}`}><h3>{campaign.name}</h3><p>{campaign.brandName}</p><div className="campaign-card-meta"><span>{campaign.industry}</span><span>{campaign.objective}</span></div></Link><div className="campaign-card-footer"><span>{formatDate(campaign.updatedAt)}</span><div className="card-actions"><Link href={`/campaign-generator?edit=${campaign.id}`} className="card-action-link" data-testid={`link-edit-campaign-${campaign.id}`}>Edit</Link>{onDelete && <button className="card-action-link card-action-danger" onClick={() => onDelete(campaign.id)} data-testid={`button-delete-campaign-${campaign.id}`}><Trash2 size={13} /> Delete</button>}</div></div></article>;
}

function LibraryPage() {
  const queryClient = useQueryClient();
  const { data: campaigns, isLoading, isError } = useListCampaigns();
  const { data: summary } = useGetCampaignSummary();
  const remove = useDeleteCampaign();
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => campaigns?.filter((campaign) => `${campaign.name} ${campaign.brandName} ${campaign.industry} ${campaign.objective}`.toLowerCase().includes(search.toLowerCase())) ?? [], [campaigns, search]);

  const deleteCampaign = (id: string) => {
    if (!window.confirm("Delete this campaign from your library?")) return;
    remove.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCampaignSummaryQueryKey() });
        setNotice("Campaign deleted from your library.");
      },
      onError: (error) => setNotice(getErrorMessage(error, "We couldn't delete that campaign.")),
    });
  };

  return <div className="page page-library"><div className="page-heading heading-with-action"><div><span className="kicker">Campaign Library</span><h1>Your thinking, kept in motion.</h1><p>Reopen a strategy, refine the brief, or start the next campaign.</p></div><Link href="/campaign-generator" className="button button-primary" data-testid="link-library-new-campaign"><Plus size={17} /> New campaign</Link></div>{notice && <div className="notice notice-success" role="status" data-testid="status-library"><Check size={16} />{notice}</div>}<div className="library-toolbar"><div className="library-count"><strong>{summary?.totalCampaigns ?? campaigns?.length ?? 0}</strong> campaigns in your workspace</div><label className="search-field"><Clipboard size={16} /><input type="search" placeholder="Search campaigns" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-search-campaigns" /></label></div>{isLoading ? <LoadingRow label="Loading your campaigns" /> : isError ? <div className="error-state"><X size={22} /><h2>We couldn't load your library</h2><p>Refresh the page or try again in a moment.</p></div> : filtered.length ? <div className="library-grid">{filtered.map((campaign) => <CampaignCard campaign={campaign} onDelete={deleteCampaign} key={campaign.id} />)}</div> : search ? <div className="empty-state"><div className="empty-icon"><Clipboard size={22} /></div><h2>No campaigns match that search.</h2><p>Try a different brand, industry, or objective.</p><button className="button button-secondary" onClick={() => setSearch("")} data-testid="button-clear-search">Clear search</button></div> : <EmptyState />}</div>;
}

function CampaignDetailPage() {
  const [, setLocation] = useLocation();
  const id = window.location.pathname.split("/").pop() ?? "";
  const { data: campaign, isLoading, isError } = useGetCampaign(id, { query: { enabled: Boolean(id), queryKey: getGetCampaignQueryKey(id) } });
  if (isLoading) return <div className="page centered-state"><LoadingRow label="Opening campaign strategy" /></div>;
  if (isError || !campaign) return <div className="page centered-state"><div className="error-state"><X size={22} /><h2>Campaign not found</h2><p>This campaign may have been deleted or is no longer available.</p><Link href="/campaigns" className="button button-secondary" data-testid="link-detail-back-library"><ArrowLeft size={16} /> Back to library</Link></div></div>;
  return <div className="page page-detail"><button className="back-link" onClick={() => setLocation("/campaigns")} data-testid="button-detail-back"><ArrowLeft size={15} /> Campaign library</button><div className="page-heading heading-with-action"><div><span className="kicker">Saved campaign · {formatDate(campaign.updatedAt)}</span><h1>{campaign.name}</h1><p>{campaign.brief.brandName} · {campaign.brief.industry} · {campaign.brief.location}</p></div><Link href={`/campaign-generator?edit=${campaign.id}`} className="button button-primary" data-testid="link-detail-edit"><FileText size={16} /> Edit campaign</Link></div><StrategyView strategy={campaign.strategy} brief={campaign.brief} savedId={campaign.id} copyState={false} isSaving={false} onEdit={() => setLocation(`/campaign-generator?edit=${campaign.id}`)} onRegenerate={() => setLocation(`/campaign-generator?edit=${campaign.id}`)} onCopy={() => navigator.clipboard.writeText(JSON.stringify(campaign.strategy, null, 2))} onSave={() => setLocation(`/campaign-generator?edit=${campaign.id}`)} onBackToLibrary={() => setLocation("/campaigns")} /></div>;
}

function EmptyState({ compact = false }: { compact?: boolean }) {
  return <div className={`empty-state ${compact ? "empty-state-compact" : ""}`}><div className="empty-icon"><Sparkles size={22} /></div><h2>No campaigns yet.</h2><p>Create your first campaign with BrandCraft and give your next idea a clear direction.</p><Link href="/campaign-generator" className="button button-primary" data-testid="link-empty-create-campaign"><WandSparkles size={16} /> Create your first campaign</Link></div>;
}
function LoadingRow({ label }: { label: string }) {
  return <div className="loading-state" data-testid="status-loading"><LoaderCircle size={20} className="spin" /><span>{label}...</span></div>;
}
function NotFound() {
  return <div className="page centered-state"><div className="error-state"><h2>Page not found</h2><p>That BrandCraft page doesn't exist.</p><Link href="/" className="button button-primary" data-testid="link-not-found-home">Back to overview</Link></div></div>;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/campaign-generator" component={GeneratorPage} /><Route path="/campaigns" component={LibraryPage} /><Route path="/campaigns/:id" component={CampaignDetailPage} /><Route component={NotFound} /></Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><AppShell><RoutedErrorBoundary><Router /></RoutedErrorBoundary></AppShell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}