import type { ClaudeAgentTask } from "./agent";

type ContentTaskFormat =
  "greenscreen_meme" | "hook_demo" | "slideshow" | "wall_of_text";

type FakeScript =
  | {
      caption: string;
      hashtags: string[];
      hook: string;
      memeCaption: string;
      reactionLabel: string;
    }
  | {
      caption: string;
      cta: string;
      demoSteps: Array<{
        caption: string;
        label: string;
      }>;
      hashtags: string[];
      hook: string;
      subhook: string;
    }
  | {
      caption: string;
      hashtags: string[];
      hook: string;
      slides: string[];
    }
  | {
      body: string;
      caption: string;
      hashtags: string[];
      hook: string;
    };

const contentFormatByTaskTitle: Record<string, ContentTaskFormat> = {
  "Content generation: Greenscreen meme": "greenscreen_meme",
  "Content generation: Hook demo": "hook_demo",
  "Content generation: Slideshow": "slideshow",
  "Content generation: Wall of text": "wall_of_text",
};

const hookAngleSeeds = [
  "The messy handoff before a campaign finally gets organized",
  "The first five seconds that make a buyer keep watching",
  "The hidden cost of turning every proof point into a meeting",
  "The before-and-after moment when a landing page becomes a script",
  "The operator shortcut for turning old website copy into fresh creative",
  "The mistake teams make when they ask AI for generic ad ideas",
  "The approval workflow that keeps strong UGC concepts from getting lost",
  "The way one product proof point becomes several short-form angles",
  "The reason saved ideas matter more than a long brainstorm doc",
  "The content calendar gap that appears after the first viral post",
  "The difference between a feature list and a scroll-stopping hook",
  "The customer objection that should become tomorrow's opening line",
  "The founder-led content system that does not need another spreadsheet",
  "The low-lift way to test platform-specific creative variations",
  "The overlooked source of high-intent UGC captions and hashtags",
  "The fast review ritual that separates usable ideas from noise",
  "The product walkthrough beat that makes the value obvious",
  "The planning moment where saved content becomes scheduled distribution",
  "The practical reason creative velocity beats one perfect post",
  "The social proof sequence that helps a skeptical buyer understand faster",
  "The content ops problem hiding behind inconsistent posting",
  "The repeatable script structure that makes niche software feel specific",
  "The export step that turns approved creative into trackable campaigns",
  "The workflow relief when content, renders, and calendar slots line up",
];

export function getFakeClaudeAgentTaskOutput(task: ClaudeAgentTask) {
  if (isBrandProfileTask(task)) {
    return fakeBrandProfileAnalysis();
  }

  const format = inferContentTaskFormat(task);

  if (format) {
    const count = getRequestedScriptCount(task);

    return {
      scripts: Array.from({ length: count }, (_value, index) =>
        fakeScriptForFormat(format, index),
      ),
    };
  }

  throw new Error(
    `No FASTLANE_FAKE_AI fixture is registered for task "${task.title ?? "untitled"}".`,
  );
}

function fakeBrandProfileAnalysis() {
  return {
    productDescription:
      "Fastlane is a content operations workspace that turns website messaging, product proof, and customer objections into short-form UGC concepts. Teams use it to generate scripts, review winners, render videos, and move approved posts into a publishing calendar without losing context.",
    audience:
      "Growth marketers, founder-led teams, and lean content operators who need a reliable way to turn existing brand material into platform-ready short-form creative.",
    tone: "Direct, practical, specific, and energetic without sounding hype-driven.",
    painPoints: [
      "Creative ideas get scattered across docs, chats, and spreadsheets.",
      "Generic AI outputs do not reflect the real product or buyer objections.",
      "Approving short-form concepts takes too long for small marketing teams.",
      "Rendered assets and posting plans often live in separate workflows.",
      "Teams struggle to test enough hooks before the campaign window closes.",
    ],
    nicheTags: [
      "ugc",
      "creative-ops",
      "short-form",
      "saas",
      "content-calendar",
      "growth",
    ],
    hookAngles: hookAngleSeeds.map((angle, index) => `${index + 1}. ${angle}`),
  };
}

function isBrandProfileTask(task: ClaudeAgentTask) {
  if (task.title?.startsWith("Brand profile:")) {
    return true;
  }

  const required = getRequiredFields(task.outputSchema);

  return (
    required.includes("productDescription") &&
    required.includes("audience") &&
    required.includes("hookAngles")
  );
}

function inferContentTaskFormat(
  task: ClaudeAgentTask,
): ContentTaskFormat | null {
  const titleFormat = task.title
    ? contentFormatByTaskTitle[task.title]
    : undefined;

  if (titleFormat) {
    return titleFormat;
  }

  const prompt = task.prompt.toLowerCase();

  if (prompt.includes("greenscreen meme")) {
    return "greenscreen_meme";
  }

  if (prompt.includes("hook demo")) {
    return "hook_demo";
  }

  if (prompt.includes("slideshow")) {
    return "slideshow";
  }

  if (prompt.includes("wall of text")) {
    return "wall_of_text";
  }

  return null;
}

function getRequestedScriptCount(task: ClaudeAgentTask) {
  const schema = task.outputSchema;
  const scriptsSchema = isRecord(schema?.properties)
    ? schema.properties.scripts
    : undefined;
  const schemaCount = isRecord(scriptsSchema)
    ? getFiniteNumber(scriptsSchema.minItems)
    : undefined;
  const promptCount = Number(
    task.prompt.match(/Generate exactly (\d+)/i)?.[1] ?? Number.NaN,
  );
  const count = schemaCount ?? (Number.isFinite(promptCount) ? promptCount : 1);

  return Math.min(50, Math.max(1, Math.floor(count)));
}

function fakeScriptForFormat(
  format: ContentTaskFormat,
  index: number,
): FakeScript {
  const variant = index + 1;
  const hashtags = ["ugc", "creativeops", "shortform", "growth"];

  switch (format) {
    case "greenscreen_meme":
      return {
        hook: `POV: the content backlog finally has a clear winner ${variant}`,
        memeCaption:
          "The team stops guessing and saves the strongest angle for render.",
        reactionLabel: `Instant clarity ${variant}`,
        caption:
          "Turn scattered website proof into short-form ideas your team can review quickly.",
        hashtags,
      };
    case "hook_demo":
      return {
        hook: `The fastest way to turn one landing page into a video ${variant}`,
        subhook:
          "Use the existing website copy as the product proof instead of starting from a blank prompt.",
        demoSteps: [
          {
            label: "Paste site",
            caption: "Drop the website URL so the brief starts from real copy.",
          },
          {
            label: "Pick angle",
            caption: "Choose the hook that maps to a real buyer objection.",
          },
          {
            label: "Render",
            caption: "Save the winning script and render it for the calendar.",
          },
        ],
        cta: "Use the saved winner in your next launch slot.",
        caption:
          "A practical workflow for turning site proof into ready-to-review short-form creative.",
        hashtags,
      };
    case "slideshow":
      return {
        hook: `Three reasons your website already has the next ad ${variant}`,
        slides: [
          "The headline names the promise buyers already understand.",
          "The pricing page exposes the objections worth answering.",
          "The about page gives the story that makes the proof feel human.",
        ],
        caption:
          "Your site already contains the raw material for a better short-form content test.",
        hashtags,
      };
    case "wall_of_text":
      return {
        hook: `A better way to review AI-generated creative ${variant}`,
        body: [
          "Start from the actual brand profile.",
          "Save only the ideas that match a buyer pain.",
          "Render the winner before the calendar slot gets stale.",
          "Export with the caption and destination already attached.",
        ].join("\n"),
        caption:
          "Creative review works better when generated ideas, renders, and scheduling stay connected.",
        hashtags,
      };
  }
}

function getRequiredFields(schema: Record<string, unknown> | undefined) {
  return Array.isArray(schema?.required)
    ? schema.required.filter(
        (field): field is string => typeof field === "string",
      )
    : [];
}

function getFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
