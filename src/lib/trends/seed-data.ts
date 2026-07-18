import type { PromptRecipe } from "./metadata";
import type { RemotionCompositionId } from "../video/remotion-props";

export type CuratedTrendTemplateSeed = {
  slug: string;
  title: string;
  nicheTags: string[];
  structureDescription: string;
  remotionTemplateId: RemotionCompositionId;
  engagementNotes: string;
  sourcePattern: string;
  promptRecipe: PromptRecipe;
};

function recipe(
  hook: string,
  setup: string,
  beats: string[],
  visualPlan: string[],
  cta: string,
  generationNotes: string,
  proofCue?: string,
): PromptRecipe {
  return {
    avoid: ["generic motivational advice", "slow first frame", "fake metrics"],
    beats,
    cta,
    generationNotes,
    hook,
    proofCue,
    setup,
    visualPlan,
  };
}

export const curatedTrendTemplates = [
  {
    engagementNotes:
      "Works because the first frame names a daily operating pain, then the punchline resolves it in one visible product moment.",
    nicheTags: ["saas", "b2b", "sales"],
    promptRecipe: recipe(
      "POV: the lead finally has an owner",
      "Open on a chaotic handoff, then reveal the assignment workflow as the relief.",
      [
        "Five reps touched the same account.",
        "One routing rule assigns the owner.",
        "The next task appears before the tab closes.",
      ],
      ["Meme background", "Presenter reaction", "Product close-up"],
      "Ask the viewer to tag the teammate who owns routing.",
      "Use a dry, relieved tone and keep the caption readable over the meme background.",
      "No more mystery leads",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "saas-lead-owner-pov",
    sourcePattern:
      "POV hook with presenter greenscreen over a messy workflow meme",
    structureDescription:
      "POV hook, frozen meme background, presenter reaction in the corner, then one oversized caption naming the workflow fix.",
    title: "POV: the lead finally has an owner",
  },
  {
    engagementNotes:
      "Numbered slides create retention because viewers wait to compare all three before saving.",
    nicheTags: ["saas", "founder", "product"],
    promptRecipe: recipe(
      "3 tabs founders close after onboarding is fixed",
      "Frame the product as removing tab clutter during a launch week.",
      [
        "No more spreadsheet import tracker.",
        "No more Slack thread for approvals.",
        "No more guessing which asset shipped.",
      ],
      ["Dashboard screenshot", "Approval queue", "Calendar export"],
      "Prompt viewers to save the checklist for their next launch.",
      "Make each slide feel like a concrete before-and-after, not a feature list.",
      "Launch week cleanup",
    ),
    remotionTemplateId: "slideshow",
    slug: "saas-tabs-founders-close",
    sourcePattern: "three-reason carousel adapted to vertical short-form",
    structureDescription:
      "Three fast slides with a large numbered eyebrow, one pain tab per slide, and a final implied cleanup payoff.",
    title: "3 tabs founders close after onboarding is fixed",
  },
  {
    engagementNotes:
      "Long caption blocks earn saves when they feel like a note a smart operator would paste into a team doc.",
    nicheTags: ["saas", "support", "marketing"],
    promptRecipe: recipe(
      "Your best ad is hiding in the support inbox",
      "Turn repeated customer objections into a simple ad script.",
      [
        "Find the objection customers repeat.",
        "Quote the before-state in plain language.",
        "Show the product moment that removes it.",
        "End with the sentence support already uses.",
      ],
      ["Support inbox", "Highlighted quote", "Product moment", "Clean CTA"],
      "Invite viewers to mine one support thread today.",
      "Use line breaks aggressively so the wall of text feels intentional and skimmable.",
      "Customer objection",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "saas-support-inbox-ad",
    sourcePattern: "save-worthy wall of text with one highlighted insight",
    structureDescription:
      "Dense text post over subtle b-roll: contrarian headline, four short proof lines, and a source label that makes it feel operational.",
    title: "Your best ad is hiding in the support inbox",
  },
  {
    engagementNotes:
      "Fast product walkthroughs perform when the hook promises a specific outcome and each shot proves one step.",
    nicheTags: ["saas", "analytics", "growth"],
    promptRecipe: recipe(
      "I audited this funnel in 15 seconds",
      "Use a screen-by-screen teardown that finds one obvious revenue leak.",
      [
        "First click shows where traffic came from.",
        "Second click shows the dropped intent.",
        "Third click turns the winner into a task.",
      ],
      ["Source report", "Drop-off chart", "Task queue"],
      "Ask viewers to comment the funnel they would audit first.",
      "Keep the hook direct and let the shot labels do the explaining.",
      "One leak, one fix",
    ),
    remotionTemplateId: "hook-demo",
    slug: "saas-funnel-audit-15-seconds",
    sourcePattern: "screen-record hook demo with three labeled product shots",
    structureDescription:
      "Sharp audit hook, one-sentence subhook, then three labeled product shots that move from diagnosis to action.",
    title: "I audited this funnel in 15 seconds",
  },
  {
    engagementNotes:
      "Relatable founder frustration gets comments from people comparing their own broken stack.",
    nicheTags: ["saas", "operations"],
    promptRecipe: recipe(
      "When the weekly report writes itself",
      "Contrast manual reporting with an automated snapshot landing on schedule.",
      [
        "Monday used to start with exports.",
        "Now the report builds overnight.",
        "Everyone opens the same numbers.",
      ],
      ["Tired operator meme", "Report screenshot", "Calm reaction"],
      "Ask teams what report they still build by hand.",
      "Play the reaction as understated, not exaggerated.",
      "Spreadsheet retired",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "saas-weekly-report-writes-itself",
    sourcePattern: "reaction meme over office task relief",
    structureDescription:
      "POV caption over an office meme, quick presenter reaction, then a final caption that names the automated state.",
    title: "When the weekly report writes itself",
  },
  {
    engagementNotes:
      "The mini-framework format earns shares because it gives viewers language for a problem they already feel.",
    nicheTags: ["saas", "content", "founder"],
    promptRecipe: recipe(
      "The demo video formula that stops rambling",
      "Package a demo script into hook, proof, and one action.",
      [
        "Name the painful before-state.",
        "Show the smallest useful product moment.",
        "Close with the next workflow step.",
      ],
      ["Text hook", "Product frame", "CTA frame"],
      "Tell viewers to steal the three-line script.",
      "Avoid mentioning every feature; one visible transformation is enough.",
      "Hook, proof, action",
    ),
    remotionTemplateId: "slideshow",
    slug: "saas-demo-video-formula",
    sourcePattern: "mini-framework carousel with three reusable steps",
    structureDescription:
      "Three numbered text slides that teach a reusable demo-video formula using a concrete SaaS example.",
    title: "The demo video formula that stops rambling",
  },
  {
    engagementNotes:
      "A strong negative hook stops scroll because it challenges a habit without needing context.",
    nicheTags: ["saas", "sales", "founder"],
    promptRecipe: recipe(
      "Stop sending every lead the same follow-up",
      "Show how segmentation changes the message without making the workflow feel complex.",
      [
        "A demo watcher needs proof.",
        "A pricing visitor needs urgency.",
        "A repeat reader needs a direct ask.",
      ],
      ["Lead activity", "Segment labels", "Message preview"],
      "Ask viewers which follow-up they still send manually.",
      "Make the critique practical instead of scolding.",
      "Three intents",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "saas-follow-up-segmentation",
    sourcePattern: "hot-take text post with segmented examples",
    structureDescription:
      "Stop-doing-this headline, three line-separated examples, and a muted product b-roll loop behind the text.",
    title: "Stop sending every lead the same follow-up",
  },
  {
    engagementNotes:
      "Before-and-after demos make abstract automation obvious and give the viewer a reason to watch to the final state.",
    nicheTags: ["saas", "automation", "ops"],
    promptRecipe: recipe(
      "Before: 14 clicks. After: one approval",
      "Compress a tedious approval workflow into a clean three-shot product demo.",
      [
        "The request enters with context attached.",
        "The approver sees the exact risk.",
        "The task moves without a meeting.",
      ],
      ["Before queue", "Approval view", "Done state"],
      "Ask the viewer what workflow still takes too many clicks.",
      "Use crisp labels and avoid explaining the UI twice.",
      "14 clicks to one",
    ),
    remotionTemplateId: "hook-demo",
    slug: "saas-14-clicks-one-approval",
    sourcePattern: "before-after product walkthrough with click-count hook",
    structureDescription:
      "Click-count hook, quick subhook, then three product shots proving the workflow got shorter.",
    title: "Before: 14 clicks. After: one approval",
  },
  {
    engagementNotes:
      "Fitness viewers save routines that state the exact constraint before the exercises appear.",
    nicheTags: ["fitness", "wellness"],
    promptRecipe: recipe(
      "Desk shoulders? Do this before your next call",
      "Make a no-equipment routine feel specific to remote workers.",
      [
        "Open the chest for five breaths.",
        "Pull elbows back like a row.",
        "Reset the neck before the camera turns on.",
      ],
      ["Desk setup", "Stretch label", "Timer cue"],
      "Ask viewers to save it for tomorrow's first meeting.",
      "Use plain movement cues instead of clinical anatomy language.",
      "No equipment",
    ),
    remotionTemplateId: "slideshow",
    slug: "fitness-desk-shoulders-call",
    sourcePattern: "saveable micro-routine with numbered movement slides",
    structureDescription:
      "Problem hook followed by three timed exercise captions over simple movement b-roll placeholders.",
    title: "Desk shoulders? Do this before your next call",
  },
  {
    engagementNotes:
      "The creator-reaction frame invites comments because it validates the viewer's annoying gym experience.",
    nicheTags: ["fitness", "gym"],
    promptRecipe: recipe(
      "POV: the machine you need is always taken",
      "Turn a crowded-gym frustration into a quick substitution tip.",
      [
        "Same muscle, different station.",
        "Keep the tempo slow.",
        "Stop waiting for the perfect setup.",
      ],
      ["Crowded gym meme", "Coach reaction", "Substitution caption"],
      "Ask viewers which machine is always taken at their gym.",
      "Keep it funny first, useful second.",
      "Cable row swap",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "fitness-machine-always-taken",
    sourcePattern: "gym frustration POV with coach greenscreen tip",
    structureDescription:
      "POV gym complaint over meme background, trainer reaction, then one practical substitution caption.",
    title: "POV: the machine you need is always taken",
  },
  {
    engagementNotes:
      "Myth-busting text posts get saves when they replace one vague rule with a measurable cue.",
    nicheTags: ["fitness", "nutrition"],
    promptRecipe: recipe(
      "You do not need a perfect meal plan",
      "Give a flexible plate-building rule for busy lifters.",
      [
        "Pick one protein you already like.",
        "Add fiber you can repeat.",
        "Make the carb match the training day.",
        "Repeat before you redesign everything.",
      ],
      ["Plate b-roll", "Macro labels", "Shopping note"],
      "Tell viewers to save the four-line plate rule.",
      "Sound practical and calm; avoid transformation promises.",
      "Repeatable plate",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "fitness-not-perfect-meal-plan",
    sourcePattern: "nutrition hot take as dense saveable text",
    structureDescription:
      "Contrarian nutrition headline, four concise rules, and a source label over soft food-prep b-roll.",
    title: "You do not need a perfect meal plan",
  },
  {
    engagementNotes:
      "A form-check walkthrough rewards rewatching because each shot gives one specific visual cue.",
    nicheTags: ["fitness", "coaching"],
    promptRecipe: recipe(
      "Fix your squat setup in 20 seconds",
      "Use three visible setup cues before the rep starts.",
      [
        "Feet under the bar before you unrack.",
        "Ribs down before the first step.",
        "Knees track where the toes point.",
      ],
      ["Foot position", "Brace cue", "Knee path"],
      "Ask viewers to film one set from the side.",
      "Keep the demo instructional and avoid medical claims.",
      "Three setup cues",
    ),
    remotionTemplateId: "hook-demo",
    slug: "fitness-squat-setup-20-seconds",
    sourcePattern: "form correction hook demo with three labeled shots",
    structureDescription:
      "Specific fix hook, one subhook, then three labeled form checkpoints with a simple practice CTA.",
    title: "Fix your squat setup in 20 seconds",
  },
  {
    engagementNotes:
      "Routine templates perform because they make consistency feel smaller than motivation.",
    nicheTags: ["fitness", "wellness"],
    promptRecipe: recipe(
      "The 10-minute walk that actually counts",
      "Turn a low-friction habit into a clear energy-reset sequence.",
      [
        "First three minutes: no phone.",
        "Next four minutes: nasal breathing.",
        "Last three minutes: plan the next task.",
      ],
      ["Shoes by door", "Walking path", "Notebook close"],
      "Ask viewers to try it before their next work block.",
      "Keep the tone grounded and avoid overpromising health outcomes.",
      "Between calls reset",
    ),
    remotionTemplateId: "slideshow",
    slug: "fitness-10-minute-walk-counts",
    sourcePattern: "wellness routine carousel with timed blocks",
    structureDescription:
      "Time-boxed habit hook with three slides dividing a short walk into memorable blocks.",
    title: "The 10-minute walk that actually counts",
  },
  {
    engagementNotes:
      "Checklist phrasing makes the post feel immediately usable for beginners and coaches.",
    nicheTags: ["fitness", "training"],
    promptRecipe: recipe(
      "Your warmup is too random",
      "Replace random warmups with a three-part readiness checklist.",
      [
        "Raise temperature with one easy pattern.",
        "Mobilize the joint you will load.",
        "Prime the first lift at half speed.",
      ],
      ["Warmup mat", "Mobility cue", "First set"],
      "Prompt viewers to save it before leg day.",
      "Use concrete training language and avoid shaming.",
      "Ready, mobile, primed",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "fitness-random-warmup-checklist",
    sourcePattern: "coach checklist text post",
    structureDescription:
      "Direct critique headline followed by a three-line checklist over training b-roll.",
    title: "Your warmup is too random",
  },
  {
    engagementNotes:
      "The comparison frame drives comments from people debating which version feels more realistic.",
    nicheTags: ["fitness", "home-workout"],
    promptRecipe: recipe(
      "Hotel gym version of your usual leg day",
      "Translate a normal gym workout into a limited-equipment travel version.",
      [
        "Goblet squat replaces the barbell.",
        "Split squat replaces the machine.",
        "Tempo makes light dumbbells count.",
      ],
      ["Hotel gym shot", "Exercise swap", "Tempo caption"],
      "Ask viewers what workout they need a hotel version of.",
      "Keep the substitutions specific and doable.",
      "Limited equipment",
    ),
    remotionTemplateId: "hook-demo",
    slug: "fitness-hotel-gym-leg-day",
    sourcePattern: "limited-equipment workout demo with swap labels",
    structureDescription:
      "Travel constraint hook, three exercise swap shots, and a CTA asking for the next routine to translate.",
    title: "Hotel gym version of your usual leg day",
  },
  {
    engagementNotes:
      "The staged confusion hook is relatable and primes viewers to watch for the simple checkout fix.",
    nicheTags: ["ecommerce", "shopify", "conversion"],
    promptRecipe: recipe(
      "POV: your customer wants to buy but cannot find shipping",
      "Show checkout friction as the villain, then reveal the cleaner cart frame.",
      [
        "The shipping question appears before checkout.",
        "The free threshold is visible.",
        "The delivery estimate removes hesitation.",
      ],
      ["Confused shopper meme", "Cart screenshot", "Shipping badge"],
      "Ask viewers what question their customers ask before buying.",
      "Make the pain specific to cart anxiety, not a generic conversion tip.",
      "Shipping clarity",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "ecommerce-shipping-confusion-pov",
    sourcePattern: "shopper POV meme with checkout fix caption",
    structureDescription:
      "Customer-confusion POV over a meme background, then one oversized cart improvement caption.",
    title: "POV: your customer wants to buy but cannot find shipping",
  },
  {
    engagementNotes:
      "Specific product-page teardown slides get saves from operators who want a checklist to audit later.",
    nicheTags: ["ecommerce", "conversion"],
    promptRecipe: recipe(
      "3 product page details that sell before the button",
      "Teach the three pieces of context a buyer needs before add-to-cart.",
      [
        "Show scale next to something familiar.",
        "Name who the product is not for.",
        "Put the guarantee near the hesitation.",
      ],
      ["Scale image", "Fit note", "Guarantee block"],
      "Tell viewers to audit one product page with these three checks.",
      "Use buyer psychology language sparingly and keep examples concrete.",
      "Before the button",
    ),
    remotionTemplateId: "slideshow",
    slug: "ecommerce-product-page-before-button",
    sourcePattern: "conversion checklist carousel",
    structureDescription:
      "Three audit slides with product-page screenshots, each calling out one pre-button detail.",
    title: "3 product page details that sell before the button",
  },
  {
    engagementNotes:
      "Founder-style teardown text performs when it gives a sharper diagnosis than 'improve your ads'.",
    nicheTags: ["ecommerce", "ads", "brand"],
    promptRecipe: recipe(
      "Your ad is doing the product page's job",
      "Explain why the ad should sell the click, not carry the entire purchase decision.",
      [
        "The ad earns curiosity.",
        "The product page answers risk.",
        "The checkout removes delay.",
        "Stop forcing one asset to do all three.",
      ],
      ["Ad preview", "PDP proof", "Checkout trust cue"],
      "Ask viewers where their funnel is carrying too much weight.",
      "Make it feel like an operator note, not a marketing slogan.",
      "Asset roles",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "ecommerce-ad-doing-product-page-job",
    sourcePattern: "operator hot take with funnel role breakdown",
    structureDescription:
      "Big text hot take, four short funnel-role lines, and quiet commerce b-roll behind the copy.",
    title: "Your ad is doing the product page's job",
  },
  {
    engagementNotes:
      "A demo of tactile product proof helps viewers understand how to turn UGC clips into conversion assets.",
    nicheTags: ["ecommerce", "ugc", "beauty"],
    promptRecipe: recipe(
      "Turn one customer clip into three sales frames",
      "Show how to extract hook, proof, and CTA from a single UGC moment.",
      [
        "Clip one: the first-use reaction.",
        "Clip two: the texture close-up.",
        "Clip three: the reason to buy now.",
      ],
      ["UGC clip", "Close-up crop", "Offer frame"],
      "Ask viewers to re-cut one customer video today.",
      "Keep every shot tied to a buyer question.",
      "One clip, three jobs",
    ),
    remotionTemplateId: "hook-demo",
    slug: "ecommerce-one-customer-clip-three-frames",
    sourcePattern: "UGC repurposing demo with three output frames",
    structureDescription:
      "Repurposing hook, then three labeled shot crops that turn one customer clip into a short-form ad.",
    title: "Turn one customer clip into three sales frames",
  },
  {
    engagementNotes:
      "Inventory anxiety creates urgency without discounts, especially when tied to a familiar creator reaction format.",
    nicheTags: ["ecommerce", "fashion"],
    promptRecipe: recipe(
      "When the size everyone asked for is back",
      "Use restock excitement as the central payoff.",
      [
        "The comment section asked for it.",
        "The restock hits the site.",
        "The first size sells before lunch.",
      ],
      ["Restock meme", "Size selector", "Comment overlay"],
      "Ask viewers which color should restock next.",
      "Make the caption feel like community news, not a hard sell.",
      "Back in stock",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "ecommerce-size-restock-reaction",
    sourcePattern: "restock reaction meme with community comment cue",
    structureDescription:
      "Community request hook, reaction meme background, and a single restock caption with product UI proof.",
    title: "When the size everyone asked for is back",
  },
  {
    engagementNotes:
      "Comparison slides let shoppers self-identify, which increases comments and saves.",
    nicheTags: ["ecommerce", "home", "gift"],
    promptRecipe: recipe(
      "Pick the gift by the problem, not the person",
      "Reframe a gift guide around use cases instead of demographics.",
      [
        "For the friend who loses keys.",
        "For the sibling with a tiny kitchen.",
        "For the parent who hates setup.",
      ],
      ["Gift one", "Gift two", "Gift three"],
      "Ask viewers which problem is hardest to shop for.",
      "Keep the copy useful and avoid vague personality labels.",
      "Problem-led gift guide",
    ),
    remotionTemplateId: "slideshow",
    slug: "ecommerce-problem-led-gift-guide",
    sourcePattern: "gift guide carousel organized by problem",
    structureDescription:
      "Three recommendation slides, each matching one customer problem to one product angle.",
    title: "Pick the gift by the problem, not the person",
  },
  {
    engagementNotes:
      "The anti-discount argument gets shares from brand operators protecting margin.",
    nicheTags: ["ecommerce", "pricing", "brand"],
    promptRecipe: recipe(
      "Try this before another discount code",
      "Offer non-discount urgency options for a product launch.",
      [
        "Bundle the decision, not the price.",
        "Add a deadline tied to shipping.",
        "Make the bonus solve setup friction.",
      ],
      ["Bundle frame", "Shipping timer", "Bonus card"],
      "Ask operators what they use instead of discounts.",
      "Keep the advice margin-aware and practical.",
      "Protect the margin",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "ecommerce-before-another-discount-code",
    sourcePattern: "margin-protection text post with tactical alternatives",
    structureDescription:
      "Stop-discounting hook, three alternative urgency lines, and commerce b-roll with a proof cue.",
    title: "Try this before another discount code",
  },
  {
    engagementNotes:
      "The one-page teardown is useful because the viewer can compare each step to their own store immediately.",
    nicheTags: ["ecommerce", "shopify", "analytics"],
    promptRecipe: recipe(
      "Audit your abandoned cart page in 30 seconds",
      "Walk through the cart page as a buyer with three diagnostic questions.",
      [
        "Can I see total cost now?",
        "Do I know when it arrives?",
        "Can I recover if the size is wrong?",
      ],
      ["Cart total", "Delivery promise", "Return policy"],
      "Ask viewers to screenshot their cart and check the three labels.",
      "Use question labels instead of generic optimization terms.",
      "Three cart questions",
    ),
    remotionTemplateId: "hook-demo",
    slug: "ecommerce-abandoned-cart-page-audit",
    sourcePattern: "conversion audit walkthrough with three buyer questions",
    structureDescription:
      "Cart-audit hook, quick setup, and three product-page shots labeled with buyer questions.",
    title: "Audit your abandoned cart page in 30 seconds",
  },
  {
    engagementNotes:
      "Money content gets retention when the hook challenges a tiny daily habit instead of a huge financial goal.",
    nicheTags: ["finance", "personal-finance"],
    promptRecipe: recipe(
      "POV: the subscription you forgot is still winning",
      "Make forgotten recurring charges feel visible and fixable.",
      [
        "One trial became monthly.",
        "The renewal date is tomorrow.",
        "Cancel or keep, but decide on purpose.",
      ],
      ["Banking meme", "Subscription list", "Calendar cue"],
      "Ask viewers to check renewals before Friday.",
      "Avoid fear tactics; make the habit feel responsible.",
      "Forgotten renewal",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "finance-forgotten-subscription-pov",
    sourcePattern: "personal finance POV meme with micro-action caption",
    structureDescription:
      "POV money leak hook over meme background, creator reaction, then one practical renewal-check caption.",
    title: "POV: the subscription you forgot is still winning",
  },
  {
    engagementNotes:
      "Simple money rules earn saves when they avoid jargon and use exact decisions.",
    nicheTags: ["finance", "budgeting"],
    promptRecipe: recipe(
      "3 money rules for the week your paycheck hits",
      "Turn payday into a short checklist before spending starts.",
      [
        "Move bills before browsing.",
        "Name one flex category.",
        "Send future-you a small transfer.",
      ],
      ["Payday screen", "Budget line", "Transfer confirmation"],
      "Prompt viewers to save it for the next payday.",
      "Keep it educational, not financial advice.",
      "Payday checklist",
    ),
    remotionTemplateId: "slideshow",
    slug: "finance-paycheck-week-rules",
    sourcePattern: "payday checklist carousel",
    structureDescription:
      "Three numbered payday rules over app-style placeholders, ending on a simple save cue.",
    title: "3 money rules for the week your paycheck hits",
  },
  {
    engagementNotes:
      "A clear anti-hustle finance take earns trust because it lowers shame while still giving direction.",
    nicheTags: ["finance", "creator", "budgeting"],
    promptRecipe: recipe(
      "You do not need a side hustle to fix this",
      "Focus on cashflow visibility before extra income.",
      [
        "Find the expense that changes every month.",
        "Set a cap before the month starts.",
        "Review it weekly for ten minutes.",
        "Then decide if income is the real bottleneck.",
      ],
      ["Budget sheet", "Spending category", "Weekly review"],
      "Ask viewers which category moves around most.",
      "Avoid promising financial outcomes or personalized advice.",
      "Variable expense",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "finance-not-side-hustle-cashflow",
    sourcePattern: "finance hot take text post with practical sequence",
    structureDescription:
      "Contrarian finance headline, four plain-language steps, and a subdued money-app b-roll loop.",
    title: "You do not need a side hustle to fix this",
  },
  {
    engagementNotes:
      "Product walkthroughs in finance work when the visible action is tiny and compliant, like setting an alert.",
    nicheTags: ["finance", "investing"],
    promptRecipe: recipe(
      "Set this alert before you buy anything",
      "Show a watchlist alert workflow without giving investment advice.",
      [
        "Pick the price level before emotions hit.",
        "Add the reason in the note field.",
        "Wait for the alert instead of refreshing.",
      ],
      ["Watchlist", "Alert form", "Note field"],
      "Ask viewers what alert keeps them disciplined.",
      "Make the language educational and avoid ticker recommendations.",
      "Decision before emotion",
    ),
    remotionTemplateId: "hook-demo",
    slug: "finance-alert-before-buying",
    sourcePattern: "finance app micro-demo with discipline hook",
    structureDescription:
      "Behavioral finance hook, one compliance-safe setup line, and three app shots showing an alert workflow.",
    title: "Set this alert before you buy anything",
  },
  {
    engagementNotes:
      "Relatable tax-season stress performs when paired with one specific recordkeeping habit.",
    nicheTags: ["finance", "small-business"],
    promptRecipe: recipe(
      "When April asks where the receipts went",
      "Turn tax-time panic into a monthly receipt habit.",
      [
        "Snap the receipt before leaving.",
        "Attach it to the transaction.",
        "Review the uncategorized list monthly.",
      ],
      ["Tax meme", "Receipt capture", "Categorized transaction"],
      "Ask business owners what expense category gets messy fastest.",
      "Keep it light and avoid tax advice claims.",
      "Monthly receipt habit",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "finance-april-receipts-meme",
    sourcePattern: "tax-season reaction meme with recordkeeping tip",
    structureDescription:
      "Tax panic meme, presenter reaction, and a practical receipt workflow caption.",
    title: "When April asks where the receipts went",
  },
  {
    engagementNotes:
      "Comparison content gets comments because people recognize which spending pattern sounds like them.",
    nicheTags: ["finance", "budgeting"],
    promptRecipe: recipe(
      "Budget by friction, not by guilt",
      "Show three ways to make overspending harder without moralizing.",
      [
        "Move fun money to a separate card.",
        "Add a 24-hour wishlist rule.",
        "Delete the one app that gets you.",
      ],
      ["Card label", "Wishlist note", "App folder"],
      "Ask viewers which friction rule would help most.",
      "Use behavioral framing and avoid shame language.",
      "Less guilt, more friction",
    ),
    remotionTemplateId: "slideshow",
    slug: "finance-budget-by-friction",
    sourcePattern: "behavioral budgeting carousel",
    structureDescription:
      "Three slides that replace guilt-based budgeting with simple friction mechanics.",
    title: "Budget by friction, not by guilt",
  },
  {
    engagementNotes:
      "Founder-finance posts save well when they separate cash from profit in plain language.",
    nicheTags: ["finance", "founder", "saas"],
    promptRecipe: recipe(
      "Revenue is not the number that pays payroll",
      "Explain a cash timing issue with a concrete founder example.",
      [
        "Invoices booked do not equal cash collected.",
        "Annual contracts can hide monthly burn.",
        "Payroll needs the bank balance, not the dashboard.",
      ],
      ["Revenue dashboard", "Bank balance", "Payroll calendar"],
      "Ask founders what number they check every Friday.",
      "Stay educational and avoid accounting advice.",
      "Cash timing",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "finance-revenue-not-payroll-number",
    sourcePattern: "operator finance wall of text",
    structureDescription:
      "Sharp founder-finance headline, three cash-timing lines, and a proof cue over dashboard b-roll.",
    title: "Revenue is not the number that pays payroll",
  },
  {
    engagementNotes:
      "The visible step-by-step lowers intimidation and positions the product as a coach, not a broker.",
    nicheTags: ["finance", "planning"],
    promptRecipe: recipe(
      "Build a starter emergency fund rule in one screen",
      "Walk through a simple automation rule for a beginner savings habit.",
      [
        "Choose the account first.",
        "Pick an amount small enough to repeat.",
        "Name the rule so you remember why.",
      ],
      ["Account picker", "Amount field", "Rule name"],
      "Ask viewers what they would name their first rule.",
      "Avoid guarantees and frame as general education.",
      "Small enough to repeat",
    ),
    remotionTemplateId: "hook-demo",
    slug: "finance-starter-emergency-fund-rule",
    sourcePattern: "savings app setup demo with beginner hook",
    structureDescription:
      "Beginner-friendly hook, one setup sentence, and three labeled app shots creating an automation rule.",
    title: "Build a starter emergency fund rule in one screen",
  },
  {
    engagementNotes:
      "Food content gets saves when the first frame promises a repeatable weekday constraint.",
    nicheTags: ["food", "meal-prep"],
    promptRecipe: recipe(
      "The lunch bowl that survives Wednesday",
      "Make a meal-prep format about texture and assembly order.",
      [
        "Base stays dry until lunch.",
        "Crunch goes in its own container.",
        "Sauce hits right before eating.",
      ],
      ["Ingredients", "Container layers", "Finished bowl"],
      "Ask viewers what ingredient always gets soggy.",
      "Use sensory details and avoid diet claims.",
      "No soggy lunch",
    ),
    remotionTemplateId: "slideshow",
    slug: "food-lunch-bowl-survives-wednesday",
    sourcePattern: "meal-prep hack carousel with assembly order",
    structureDescription:
      "Three quick slides showing a durable lunch-bowl system with texture-preserving captions.",
    title: "The lunch bowl that survives Wednesday",
  },
  {
    engagementNotes:
      "Kitchen frustration memes travel well because the fix is obvious once named.",
    nicheTags: ["food", "cooking"],
    promptRecipe: recipe(
      "POV: your garlic burns while the pasta waits",
      "Turn a common timing mistake into one prep-order rule.",
      [
        "Start the pasta water first.",
        "Lower the pan before garlic.",
        "Save pasta water before draining.",
      ],
      ["Kitchen panic meme", "Pan close-up", "Timing caption"],
      "Ask viewers what always burns in their kitchen.",
      "Keep the cooking tip specific and non-judgmental.",
      "Timing fixes flavor",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "food-garlic-burns-pasta-waits",
    sourcePattern: "cooking mistake POV meme with one-rule fix",
    structureDescription:
      "Relatable kitchen mistake over a meme background, creator reaction, and a caption with the timing fix.",
    title: "POV: your garlic burns while the pasta waits",
  },
  {
    engagementNotes:
      "A dense recipe note works when it reads like the exact tip missing from the original recipe.",
    nicheTags: ["food", "baking"],
    promptRecipe: recipe(
      "The cookie note recipes forget to mention",
      "Explain one texture variable that changes the result.",
      [
        "Creamed butter traps air.",
        "Melted butter spreads faster.",
        "Chilled dough slows the edge before the center sets.",
        "Pick texture before you pick timing.",
      ],
      ["Butter texture", "Dough tray", "Cookie cross-section"],
      "Tell viewers to save it before their next batch.",
      "Make the science plain and avoid pretending there is one perfect cookie.",
      "Texture before timing",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "food-cookie-note-recipes-forget",
    sourcePattern: "baking science wall of text",
    structureDescription:
      "Baking hot-take headline with four short texture notes over simple ingredient b-roll.",
    title: "The cookie note recipes forget to mention",
  },
  {
    engagementNotes:
      "Step demos are rewatchable when each shot answers a visual doneness question.",
    nicheTags: ["food", "restaurant", "cooking"],
    promptRecipe: recipe(
      "How to plate takeout so it looks intentional",
      "Turn ordinary takeout into a simple plating transformation.",
      [
        "Move sauce to the base first.",
        "Stack height in the center.",
        "Finish with one fresh texture.",
      ],
      ["Plain container", "Plate base", "Final garnish"],
      "Ask viewers what takeout they want plated next.",
      "Keep it practical and avoid overly fancy language.",
      "Intentional, not fussy",
    ),
    remotionTemplateId: "hook-demo",
    slug: "food-plate-takeout-intentional",
    sourcePattern: "before-after food plating demo",
    structureDescription:
      "Transformation hook, then three labeled shots moving from takeout container to plated final frame.",
    title: "How to plate takeout so it looks intentional",
  },
  {
    engagementNotes:
      "Ingredient rescue content gets shares because viewers remember the fix when the problem happens.",
    nicheTags: ["food", "cooking"],
    promptRecipe: recipe(
      "When the soup tastes flat but not bad",
      "Name the difference between bland and unbalanced, then give the fix order.",
      [
        "Add salt if flavor is missing.",
        "Add acid if flavor feels heavy.",
        "Add fat if the finish feels thin.",
      ],
      ["Soup meme", "Lemon squeeze", "Taste caption"],
      "Ask viewers what dish always tastes flat.",
      "Use kitchen language a home cook can apply immediately.",
      "Salt, acid, fat",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "food-soup-tastes-flat",
    sourcePattern: "home-cook troubleshooting meme",
    structureDescription:
      "Flat-soup POV over reaction meme, followed by one caption that gives the taste-fix order.",
    title: "When the soup tastes flat but not bad",
  },
  {
    engagementNotes:
      "Fridge-cleanout formulas save well because they turn leftovers into a repeatable structure.",
    nicheTags: ["food", "meal-prep", "budget"],
    promptRecipe: recipe(
      "The clean-out-the-fridge dinner formula",
      "Make leftovers feel like a deliberate dinner template.",
      [
        "One cooked grain or bread.",
        "One protein that needs finishing.",
        "One sauce that makes it feel planned.",
      ],
      ["Fridge scan", "Ingredient trio", "Finished plate"],
      "Ask viewers what ingredient is currently sitting in their fridge.",
      "Make it flexible but still concrete.",
      "Leftovers become dinner",
    ),
    remotionTemplateId: "slideshow",
    slug: "food-clean-out-fridge-formula",
    sourcePattern: "leftover formula carousel",
    structureDescription:
      "Three-part formula slides showing how to assemble a flexible dinner from leftovers.",
    title: "The clean-out-the-fridge dinner formula",
  },
  {
    engagementNotes:
      "Restaurant operators share practical service notes that explain repeat visits without sounding like ads.",
    nicheTags: ["food", "restaurant", "hospitality"],
    promptRecipe: recipe(
      "The menu note that makes people order faster",
      "Show how a better descriptor reduces indecision.",
      [
        "Name the texture first.",
        "Add the flavor contrast.",
        "Remove the ingredient nobody asks about.",
        "Make the choice feel easy.",
      ],
      ["Menu close-up", "Dish detail", "Order screen"],
      "Ask operators which menu item needs a clearer description.",
      "Keep it useful for restaurants and creators alike.",
      "Texture first",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "food-menu-note-order-faster",
    sourcePattern: "restaurant operator copywriting text post",
    structureDescription:
      "Menu-writing headline, four compact copy rules, and a subtle dish b-roll layer.",
    title: "The menu note that makes people order faster",
  },
  {
    engagementNotes:
      "Visual cooking demos retain because viewers want to see whether the final texture matches the hook.",
    nicheTags: ["food", "cooking"],
    promptRecipe: recipe(
      "Make crispy edges without deep frying",
      "Demonstrate a pan technique that creates crisp texture with less mess.",
      [
        "Dry the surface before seasoning.",
        "Give the pan time to recover heat.",
        "Leave the food alone until the edge releases.",
      ],
      ["Dry surface", "Hot pan", "Crisp edge"],
      "Ask viewers what they want crispy next.",
      "Avoid health claims; focus on technique and texture.",
      "Do not move it yet",
    ),
    remotionTemplateId: "hook-demo",
    slug: "food-crispy-edges-no-deep-fry",
    sourcePattern: "cooking technique micro-demo",
    structureDescription:
      "Technique hook, one setup line, and three close-up shots showing the crisping sequence.",
    title: "Make crispy edges without deep frying",
  },
  {
    engagementNotes:
      "Beauty viewers save routines that name a specific skin or hair behavior instead of a broad transformation.",
    nicheTags: ["beauty", "skincare"],
    promptRecipe: recipe(
      "Your sunscreen is pilling for this reason",
      "Explain one layering mistake and the timing fix.",
      [
        "Too much moisturizer sits on top.",
        "Sunscreen grabs before it sets.",
        "Wait, then press instead of rubbing.",
      ],
      ["Product layers", "Timer cue", "Press technique"],
      "Ask viewers what product pills in their routine.",
      "Avoid medical claims and keep the guidance cosmetic.",
      "Wait before SPF",
    ),
    remotionTemplateId: "slideshow",
    slug: "beauty-sunscreen-pilling-reason",
    sourcePattern: "skincare troubleshooting carousel",
    structureDescription:
      "Problem hook with three product-layer slides and a simple application fix.",
    title: "Your sunscreen is pilling for this reason",
  },
  {
    engagementNotes:
      "The creator reaction format works because it makes a tiny beauty inconvenience feel universally understood.",
    nicheTags: ["beauty", "makeup"],
    promptRecipe: recipe(
      "POV: your concealer clocked out at 2 PM",
      "Turn midday creasing into a prep and touch-up tip.",
      [
        "Use less product near movement lines.",
        "Set only where it creases.",
        "Refresh with a finger, not another layer.",
      ],
      ["Makeup meme", "Under-eye close-up", "Touch-up caption"],
      "Ask viewers what makeup product disappears first.",
      "Keep the tone playful and practical.",
      "Less product, better refresh",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "beauty-concealer-clocked-out",
    sourcePattern: "makeup frustration POV meme",
    structureDescription:
      "Midday makeup POV over meme background, creator reaction, and a concise touch-up caption.",
    title: "POV: your concealer clocked out at 2 PM",
  },
  {
    engagementNotes:
      "Ingredient education saves well when it tells viewers what to pair and what to separate.",
    nicheTags: ["beauty", "skincare", "education"],
    promptRecipe: recipe(
      "Do not stack every active in one night",
      "Give a simple rotation rule for skincare actives.",
      [
        "Pick one exfoliating night.",
        "Keep retinoid night boring.",
        "Use barrier nights on purpose.",
        "Results need recovery time too.",
      ],
      ["Bathroom shelf", "Night labels", "Routine note"],
      "Tell viewers to save it before reorganizing their shelf.",
      "Use non-medical cosmetic language and avoid personalized advice.",
      "Recovery is part of results",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "beauty-do-not-stack-actives",
    sourcePattern: "skincare education wall of text",
    structureDescription:
      "Direct warning headline, four rotation lines, and quiet product-shelf b-roll.",
    title: "Do not stack every active in one night",
  },
  {
    engagementNotes:
      "Tutorial demos retain when they show the visible mistake before the correction.",
    nicheTags: ["beauty", "hair"],
    promptRecipe: recipe(
      "Fix flat roots without rewashing",
      "Demonstrate a quick root refresh sequence for second-day hair.",
      [
        "Mist only the roots that collapsed.",
        "Lift sections while drying upward.",
        "Finish with texture at the crown.",
      ],
      ["Flat root", "Dryer lift", "Texture finish"],
      "Ask viewers what second-day hair issue to fix next.",
      "Use visible technique labels and avoid hair-health claims.",
      "Second-day reset",
    ),
    remotionTemplateId: "hook-demo",
    slug: "beauty-flat-roots-no-rewash",
    sourcePattern: "beauty correction demo with three technique shots",
    structureDescription:
      "Problem-solution hook, then three labeled technique shots showing the root refresh.",
    title: "Fix flat roots without rewashing",
  },
  {
    engagementNotes:
      "Dupe-adjacent content drives comments when it frames the choice by use case rather than price alone.",
    nicheTags: ["beauty", "makeup", "ecommerce"],
    promptRecipe: recipe(
      "Pick the lip color by the coffee test",
      "Use a practical wear test as the buying frame.",
      [
        "Creamy color wins for quick photos.",
        "Matte color wins for long days.",
        "Stain wins when you hate reapplying.",
      ],
      ["Lip swatches", "Coffee cup", "Wear result"],
      "Ask viewers which test a product should pass next.",
      "Avoid claiming one product is universally best.",
      "Coffee test",
    ),
    remotionTemplateId: "slideshow",
    slug: "beauty-lip-color-coffee-test",
    sourcePattern: "beauty comparison carousel by practical test",
    structureDescription:
      "Three comparison slides matching lip product textures to a familiar wear scenario.",
    title: "Pick the lip color by the coffee test",
  },
  {
    engagementNotes:
      "Beauty myth posts earn shares when they lower pressure and replace perfection with a clear decision rule.",
    nicheTags: ["beauty", "skincare"],
    promptRecipe: recipe(
      "Your routine does not need ten steps",
      "Show a minimal routine logic for people overwhelmed by products.",
      [
        "Cleanse when there is something to remove.",
        "Treat one concern at a time.",
        "Moisturize enough to stay consistent.",
        "Protect in the morning.",
      ],
      ["Sink routine", "Treatment bottle", "SPF frame"],
      "Ask viewers what step they would remove first.",
      "Avoid medical advice and keep the language inclusive.",
      "Consistency over clutter",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "beauty-routine-not-ten-steps",
    sourcePattern: "minimal routine hot take",
    structureDescription:
      "Anti-overload headline, four practical routine lines, and product-shelf b-roll.",
    title: "Your routine does not need ten steps",
  },
  {
    engagementNotes:
      "Transformation demos feel more trustworthy when they focus on one technique change instead of a full makeover.",
    nicheTags: ["beauty", "makeup"],
    promptRecipe: recipe(
      "Make blush look lifted in one placement change",
      "Show the same product applied in a different placement.",
      [
        "Start higher than the cheek center.",
        "Blend toward the temple.",
        "Stop before the under-eye area gets heavy.",
      ],
      ["Old placement", "New placement", "Final blend"],
      "Ask viewers what product placement to compare next.",
      "Keep the demo visual and avoid face-shape absolutes.",
      "One placement change",
    ),
    remotionTemplateId: "hook-demo",
    slug: "beauty-blush-lifted-placement",
    sourcePattern: "makeup placement before-after demo",
    structureDescription:
      "One-change hook with three labeled close-ups comparing old placement, new placement, and final blend.",
    title: "Make blush look lifted in one placement change",
  },
  {
    engagementNotes:
      "Gaming memes get fast engagement when the first caption names a moment players immediately recognize.",
    nicheTags: ["gaming", "streaming"],
    promptRecipe: recipe(
      "POV: your teammate says 'one more' at 1 AM",
      "Use a late-night squad moment as the setup for a streaming or community angle.",
      [
        "The responsible choice was one match ago.",
        "The lobby is already queued.",
        "Everyone blames the teammate who asked.",
      ],
      ["Late-night meme", "Streamer reaction", "Lobby caption"],
      "Ask viewers who always says one more.",
      "Keep the joke familiar and avoid game-specific legal references.",
      "One more match",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "gaming-one-more-at-1am",
    sourcePattern: "gaming POV reaction meme",
    structureDescription:
      "POV squad caption over meme background, streamer-style reaction, then one lobby punchline caption.",
    title: "POV: your teammate says one more at 1 AM",
  },
  {
    engagementNotes:
      "Loadout and settings checklists retain because viewers compare each slide to their own setup.",
    nicheTags: ["gaming", "esports"],
    promptRecipe: recipe(
      "3 settings to check before blaming aim",
      "Turn frustration into a practical pre-match settings audit.",
      [
        "Sensitivity changed after an update.",
        "Audio mix hides the cue you need.",
        "Display mode adds delay you can feel.",
      ],
      ["Settings menu", "Audio slider", "Display toggle"],
      "Ask players which setting betrayed them recently.",
      "Keep advice general and game-agnostic.",
      "Check setup first",
    ),
    remotionTemplateId: "slideshow",
    slug: "gaming-settings-before-blaming-aim",
    sourcePattern: "gaming checklist carousel",
    structureDescription:
      "Three numbered settings slides that turn a common skill complaint into a concrete setup audit.",
    title: "3 settings to check before blaming aim",
  },
  {
    engagementNotes:
      "Creator strategy posts get saves when they separate highlight clips from clips that invite conversation.",
    nicheTags: ["gaming", "creator", "streaming"],
    promptRecipe: recipe(
      "Your best clip is not always the loudest moment",
      "Explain why context clips can outperform pure highlight reels.",
      [
        "The setup makes the payoff understandable.",
        "A decision point gives viewers something to debate.",
        "The aftermath creates a comment prompt.",
        "Clip for conversation, not volume.",
      ],
      ["Clip timeline", "Decision frame", "Comment prompt"],
      "Ask creators which clip got comments instead of just views.",
      "Use creator-operator language and avoid platform guarantees.",
      "Clip for conversation",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "gaming-best-clip-not-loudest",
    sourcePattern: "creator strategy wall of text",
    structureDescription:
      "Contrarian creator headline, four clip-selection rules, and blurred gameplay-style b-roll placeholder.",
    title: "Your best clip is not always the loudest moment",
  },
  {
    engagementNotes:
      "Tutorial demos get rewatches when each step maps to a repeatable decision during play.",
    nicheTags: ["gaming", "tutorial"],
    promptRecipe: recipe(
      "Win more fights by checking this before you peek",
      "Teach a pre-engagement checklist without naming one specific game.",
      [
        "Know where cover is before moving.",
        "Check whether the teammate can trade.",
        "Peek only after the reload finishes.",
      ],
      ["Cover angle", "Teammate position", "Reload cue"],
      "Ask players what habit they want broken down next.",
      "Keep the demo game-agnostic and easy to follow.",
      "Cover, trade, reload",
    ),
    remotionTemplateId: "hook-demo",
    slug: "gaming-before-you-peek-checklist",
    sourcePattern: "gameplay improvement hook demo",
    structureDescription:
      "Skill-improvement hook, one coaching subhook, then three labeled gameplay decision shots.",
    title: "Win more fights by checking this before you peek",
  },
  {
    engagementNotes:
      "Community-management jokes drive replies because every squad has a version of the same role.",
    nicheTags: ["gaming", "community"],
    promptRecipe: recipe(
      "When the quiet friend becomes the raid leader",
      "Use role reversal as the joke and community insight.",
      [
        "They said two words all night.",
        "Then the plan got complicated.",
        "Suddenly everyone is following instructions.",
      ],
      ["Raid meme", "Mic icon", "Command caption"],
      "Ask viewers who becomes leader under pressure.",
      "Keep the tone affectionate rather than mocking.",
      "Quiet leader reveal",
    ),
    remotionTemplateId: "greenscreen-meme",
    slug: "gaming-quiet-friend-raid-leader",
    sourcePattern: "squad role-reversal reaction meme",
    structureDescription:
      "Role-reversal POV over meme background with a final caption that names the unexpected leader moment.",
    title: "When the quiet friend becomes the raid leader",
  },
  {
    engagementNotes:
      "Setup tours get saves when they are organized by outcome instead of gear flexing.",
    nicheTags: ["gaming", "streaming", "creator"],
    promptRecipe: recipe(
      "Build the stream setup by problem, not gear",
      "Map each setup choice to a viewer or creator problem.",
      [
        "Bad audio loses trust first.",
        "Lighting fixes the facecam before a new camera does.",
        "Scene shortcuts stop dead air.",
      ],
      ["Mic setup", "Lighting angle", "Scene controls"],
      "Ask creators what problem they would fix first.",
      "Keep it pragmatic and avoid expensive gear worship.",
      "Problem-led setup",
    ),
    remotionTemplateId: "slideshow",
    slug: "gaming-stream-setup-by-problem",
    sourcePattern: "creator setup checklist carousel",
    structureDescription:
      "Three slides that tie stream setup choices to specific creator problems, not equipment status.",
    title: "Build the stream setup by problem, not gear",
  },
  {
    engagementNotes:
      "Patch-note explainers work when they translate mechanics into what players should actually do next.",
    nicheTags: ["gaming", "updates"],
    promptRecipe: recipe(
      "Patch notes are not a content plan",
      "Show creators how to turn updates into useful viewer angles.",
      [
        "Translate the change into a player problem.",
        "Record the old habit failing.",
        "Show the new habit working once.",
        "Publish the comparison, not the announcement.",
      ],
      ["Patch note", "Old habit", "New habit"],
      "Ask creators what update needs a comparison clip.",
      "Avoid claiming insider knowledge or using protected assets directly.",
      "Comparison beats announcement",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "gaming-patch-notes-not-content-plan",
    sourcePattern: "gaming creator strategy text post",
    structureDescription:
      "Creator hot take over gameplay-style b-roll, with four steps for translating patch notes into clips.",
    title: "Patch notes are not a content plan",
  },
  {
    engagementNotes:
      "Mechanical tutorials perform when viewers can apply the same three labels in their next match.",
    nicheTags: ["gaming", "tutorial", "esports"],
    promptRecipe: recipe(
      "Stop entering fights with no exit plan",
      "Teach a simple fight-entry rule using three visible map cues.",
      [
        "Mark the exit before the entry.",
        "Know who can see the cross.",
        "Reset if the first trade fails.",
      ],
      ["Map angle", "Sightline", "Reset route"],
      "Ask players which map habit they want next.",
      "Keep it general and do not reference one game's proprietary map names.",
      "Exit before entry",
    ),
    remotionTemplateId: "hook-demo",
    slug: "gaming-no-exit-plan-fights",
    sourcePattern: "tactical coaching hook demo",
    structureDescription:
      "Direct skill critique hook, one subhook, and three labeled decision frames with a practice CTA.",
    title: "Stop entering fights with no exit plan",
  },
  {
    engagementNotes:
      "Cross-niche productivity angles help SaaS and creator audiences save an idea for their own content calendar.",
    nicheTags: ["saas", "creator", "productivity"],
    promptRecipe: recipe(
      "Turn one customer question into a week of posts",
      "Show a content repurposing workflow from question to calendar.",
      [
        "Answer the question as a short tip.",
        "Turn the objection into a text post.",
        "Make the product moment a demo.",
      ],
      ["Question capture", "Draft list", "Calendar view"],
      "Ask viewers what customer question they hear every week.",
      "Keep the workflow concrete and avoid vague content advice.",
      "One question, three posts",
    ),
    remotionTemplateId: "hook-demo",
    slug: "creator-customer-question-week-posts",
    sourcePattern: "content repurposing product demo",
    structureDescription:
      "Question-to-calendar hook with three labeled product shots showing one input becoming multiple assets.",
    title: "Turn one customer question into a week of posts",
  },
  {
    engagementNotes:
      "Broad creator templates earn saves when the viewer can swap in their own niche immediately.",
    nicheTags: ["creator", "marketing", "saas"],
    promptRecipe: recipe(
      "The comment you should turn into tomorrow's video",
      "Teach creators to pick comments that reveal demand, not just compliments.",
      [
        "Look for a repeated confusion.",
        "Find a before-state in the wording.",
        "Answer with one visible example.",
        "Pin the comment so viewers see the source.",
      ],
      ["Comment screenshot", "Draft hook", "Pinned source"],
      "Ask creators to paste the comment they would answer next.",
      "Make the template feel reusable across niches.",
      "Demand in the comments",
    ),
    remotionTemplateId: "wall-of-text",
    slug: "creator-comment-tomorrow-video",
    sourcePattern: "comment-mining creator strategy post",
    structureDescription:
      "Comment-mining headline, four selection rules, and a source-label treatment that makes the idea feel native.",
    title: "The comment you should turn into tomorrow's video",
  },
] satisfies CuratedTrendTemplateSeed[];
