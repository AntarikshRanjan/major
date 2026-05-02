import type {
  AnimationPlanItem,
  CreativeSpec,
  GenerateResponse,
  InputMode,
  JobStatusResponse,
  Question,
} from "@/lib/types";

type MockJob = {
  id: string;
  mode: InputMode;
  createdAt: number;
  sourceLabel: string;
  spec: CreativeSpec;
  questions: Question[];
};

type JobStore = Map<string, MockJob>;

const VIDEO_STEPS = [
  "Extracting video frames...",
  "Analyzing UI components...",
  "Detecting sections and layout...",
  "Identifying animations...",
  "Building your CreativeSpec...",
  "Generating clarification questions...",
];

const PROMPT_STEPS = [
  "Parsing your description...",
  "Identifying sections and components...",
  "Building your CreativeSpec...",
  "Generating clarification questions...",
];

function getStore(): JobStore {
  const globalStore = globalThis as typeof globalThis & {
    __v0devMockJobs?: JobStore;
  };

  if (!globalStore.__v0devMockJobs) {
    globalStore.__v0devMockJobs = new Map<string, MockJob>();
  }

  return globalStore.__v0devMockJobs;
}

function createId(): string {
  return `job_${Math.random().toString(36).slice(2, 10)}`;
}

function createSection(id: string, type: string | null, labels: Array<[string, string | null]>, layout: string | null, confidence: number): CreativeSpec["sections"][number] {
  return {
    id,
    type,
    components: labels.map(([componentType, label]) => ({
      type: componentType,
      label,
    })),
    layout,
    confidence,
  };
}

function buildSpecFromPrompt(prompt: string): CreativeSpec {
  const lower = prompt.toLowerCase();
  const theme = lower.includes("light") ? "light" : lower.includes("dark") ? "dark" : null;
  const style = lower.includes("minimal")
    ? "minimal"
    : lower.includes("premium") || lower.includes("cinematic")
      ? "premium"
      : lower.includes("editorial")
        ? "editorial"
        : null;
  const density = lower.includes("compact")
    ? "compact"
    : lower.includes("spacious") || lower.includes("airy")
      ? "spacious"
      : null;

  const sections: CreativeSpec["sections"] = [
    createSection(
      "sec_0",
      "hero",
      [
        ["heading", "Describe it. Build it."],
        ["button", "Get Started"],
      ],
      "split hero with strong CTA",
      0.92,
    ),
  ];

  if (lower.includes("feature")) {
    sections.push(
      createSection(
        "sec_1",
        "features",
        [
          ["grid", "Feature grid"],
          ["card", "Feature card"],
          ["icon", null],
        ],
        lower.includes("3-column") || lower.includes("three-column") ? "3-column grid" : "responsive card grid",
        0.86,
      ),
    );
  }

  if (lower.includes("pricing")) {
    sections.push(
      createSection(
        "sec_2",
        "pricing",
        [
          ["heading", "Pricing"],
          ["card", "Pricing tier"],
          ["button", "Start Free"],
        ],
        "stacked pricing cards",
        0.84,
      ),
    );
  }

  if (lower.includes("testimonial")) {
    sections.push(
      createSection(
        "sec_3",
        "testimonials",
        [
          ["heading", "Testimonials"],
          ["card", "Customer quote"],
        ],
        "carousel or stacked quotes",
        0.79,
      ),
    );
  }

  if (lower.includes("footer")) {
    sections.push(
      createSection(
        `sec_${sections.length}`,
        "footer",
        [
          ["nav", "Footer links"],
          ["text", "Copyright"],
        ],
        "multi-column footer",
        0.78,
      ),
    );
  }

  const animationPlan: AnimationPlanItem[] = lower.includes("animation")
    ? [
        {
          sectionId: "sec_0",
          name: "fade-in upward",
          trigger: "on first viewport entry",
        },
      ]
    : [];

  const features = [
    lower.includes("login") || lower.includes("auth") ? "User authentication" : null,
    lower.includes("payment") || lower.includes("checkout") ? "Payment integration" : null,
    lower.includes("contact form") ? "Contact form" : null,
  ].filter((item): item is string => item !== null);

  return {
    sections,
    design: {
      theme,
      density,
      style,
      colorPalette: lower.includes("purple")
        ? ["purple", "blue"]
        : lower.includes("green")
          ? ["green", "slate"]
          : [],
      animationLibrary: null,
    },
    animationPlan,
    features,
  };
}

function buildSpecFromVideo(fileName: string): CreativeSpec {
  const lower = fileName.toLowerCase();
  const isPortfolio = lower.includes("portfolio");
  const isStore = lower.includes("store") || lower.includes("shop");

  if (isPortfolio) {
    return {
      sections: [
        createSection("sec_0", "hero", [["heading", "Designer portfolio"], ["button", "View work"]], "full-bleed hero", 0.93),
        createSection("sec_1", "features", [["grid", "Project gallery"], ["card", "Case study tile"]], "masonry project grid", 0.88),
        createSection("sec_2", "content", [["text", "Case study details"], ["image", "Project imagery"]], "alternating text-media rows", 0.8),
      ],
      design: {
        theme: "dark",
        density: null,
        style: "editorial",
        colorPalette: ["black", "white", "electric blue"],
        animationLibrary: null,
      },
      animationPlan: [],
      features: ["Responsive layouts"],
    };
  }

  if (isStore) {
    return {
      sections: [
        createSection("sec_0", "hero", [["heading", "Seasonal collection"], ["button", "Shop now"]], "split promotional hero", 0.94),
        createSection("sec_1", "features", [["grid", "Featured products"], ["card", "Product card"], ["button", "Add to cart"]], "4-column product grid", 0.91),
        createSection("sec_2", "content", [["carousel", "Customer favorites"], ["card", "Featured item"]], "horizontal product carousel", 0.85),
      ],
      design: {
        theme: "light",
        density: "comfortable",
        style: "premium commerce",
        colorPalette: ["white", "stone", "orange"],
        animationLibrary: null,
      },
      animationPlan: [],
      features: ["Cart", "Product filtering"],
    };
  }

  return {
    sections: [
      createSection("sec_0", "navbar", [["nav", "Primary navigation"], ["logo", "Brand mark"]], "sticky top navigation", 0.88),
      createSection("sec_1", "hero", [["heading", "Accelerated computing for every workload"], ["button", "Explore platform"]], "wide cinematic hero", 0.95),
      createSection("sec_2", "features", [["grid", "Category grid"], ["card", "Category card"], ["image", null]], "multi-section category grid", 0.9),
      createSection("sec_3", "cta", [["heading", "Build with v0dev"], ["button", "Start building"]], "centered call to action", 0.83),
    ],
    design: {
      theme: "dark",
      density: null,
      style: "futuristic",
      colorPalette: ["green", "slate", "white"],
      animationLibrary: null,
    },
    animationPlan: [],
    features: [],
  };
}

function buildQuestions(spec: CreativeSpec): Question[] {
  const questions: Question[] = [];
  let index = 1;
  const nextId = () => `q_${String(index++).padStart(3, "0")}`;

  const push = (question: Omit<Question, "id">) => {
    questions.push({
      id: nextId(),
      ...question,
    });
  };

  for (const section of spec.sections) {
    const hasAnimation = spec.animationPlan.some((item) => item.sectionId === section.id);
    if (!hasAnimation) {
      push({
        category: "animation",
        question: `What animation should we add to ${section.id}${section.type ? ` (${section.type})` : ""}?`,
        options: ["Fade in upward", "Slide in softly", "Scale in gently", "No animation"],
        multi: false,
        reason: `${section.id} currently has no animation plan entries.`,
        targetSection: section.id,
      });
    }

    if (section.type === "features") {
      push({
        category: "layout",
        question: `How should ${section.id}'s feature content be organized?`,
        options: ["Tabbed categories", "Stacked scroll sections", "Sidebar navigation", "Keep the current grid"],
        multi: false,
        reason: `${section.id} is a feature-heavy section and may need stronger navigation structure.`,
        targetSection: section.id,
      });
    }
  }

  if (!spec.design.theme || (spec.design.colorPalette?.length ?? 0) === 0) {
    push({
      category: "design",
      question: "What color direction should v0dev use for the final website?",
      options: ["Dark with vivid accents", "Light and clean", "Dark with green highlights", "I will decide later"],
      multi: false,
      reason: "The current design data is incomplete for theme or color palette.",
      targetSection: null,
    });
  }

  if (!spec.design.density) {
    push({
      category: "design",
      question: "How spacious should the final layout feel?",
      options: ["Compact and dense", "Balanced spacing", "Airy and spacious", "Keep it adaptive"],
      multi: false,
      reason: "The CreativeSpec has no explicit density preference yet.",
      targetSection: null,
    });
  }

  push({
    category: "animation",
    question: "Which animation library should power the final experience?",
    options: ["GSAP", "Framer Motion", "CSS only", "No strong preference"],
    multi: false,
    reason: "Animation tooling preference is always useful before generation.",
    targetSection: null,
  });

  if (spec.features.length === 0) {
    push({
      category: "features",
      question: "Which extra product features should we add beyond the reference?",
      options: ["User authentication", "Payment integration", "Contact form", "Newsletter signup", "No extra features"],
      multi: true,
      reason: "The current CreativeSpec does not include explicit product features.",
      targetSection: null,
    });
  }

  push({
    category: "features",
    question: "How should the generated site handle mobile responsiveness?",
    options: ["Mobile first", "Desktop first", "Balanced responsive scaling", "Desktop only"],
    multi: false,
    reason: "Responsive behavior should always be confirmed before code generation.",
    targetSection: null,
  });

  while (questions.length < 8 && spec.sections.length > 0) {
    const section = spec.sections[questions.length % spec.sections.length];
    push({
      category: "layout",
      question: `Should ${section.id} stay close to the reference layout or be simplified?`,
      options: ["Stay close to the reference", "Simplify the layout", "Make it more editorial", "Decide adaptively"],
      multi: false,
      reason: `Additional layout confirmation helps stabilize generation for ${section.id}.`,
      targetSection: section.id,
    });
  }

  return questions.slice(0, 12);
}

function buildPreviewHtml(spec: CreativeSpec): string {
  const sectionMarkup = spec.sections
    .map(
      (section) => `
        <section class="panel">
          <div class="eyebrow">${section.id}${section.type ? ` · ${section.type}` : ""}</div>
          <h2>${section.components.find((component) => component.type === "heading")?.label ?? "Generated section"}</h2>
          <p>${section.layout ?? "Adaptive layout generated from your CreativeSpec."}</p>
          <div class="chips">
            ${section.components
              .map((component) => `<span>${component.label ?? component.type}</span>`)
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");

  const theme = spec.design.theme === "light" ? "#f8fafc" : "#0a0a0a";
  const foreground = spec.design.theme === "light" ? "#111827" : "#f8fafc";
  const accent = spec.design.colorPalette?.[0]?.includes("green") ? "#22c55e" : "#3b82f6";

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { margin: 0; font-family: Inter, sans-serif; background: ${theme}; color: ${foreground}; }
        main { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }
        .hero { padding: 56px 0 40px; }
        .hero h1 { font-size: clamp(2.75rem, 5vw, 4.5rem); line-height: 1; margin: 0 0 16px; }
        .hero p { max-width: 680px; color: ${foreground}bb; font-size: 1.05rem; line-height: 1.8; }
        .hero .cta { display: inline-flex; margin-top: 24px; padding: 14px 22px; border-radius: 999px; background: ${accent}; color: white; font-weight: 600; }
        .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top: 36px; }
        .panel { border: 1px solid ${foreground}22; background: ${foreground}08; border-radius: 28px; padding: 24px; }
        .panel h2 { margin: 10px 0 8px; font-size: 1.4rem; }
        .panel p { margin: 0; color: ${foreground}bb; line-height: 1.7; }
        .eyebrow { color: ${accent}; text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.72rem; }
        .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
        .chips span { border: 1px solid ${foreground}22; border-radius: 999px; padding: 8px 12px; font-size: 0.8rem; }
      </style>
    </head>
    <body>
      <main>
        <section class="hero">
          <div class="eyebrow">v0dev mock preview</div>
          <h1>${spec.sections[0]?.components.find((component) => component.type === "heading")?.label ?? "Generated website preview"}</h1>
          <p>This is a realistic mock preview generated from your current CreativeSpec. It reflects the sections, components, and design direction captured so far.</p>
          <span class="cta">Launch project</span>
        </section>
        <div class="grid">${sectionMarkup}</div>
      </main>
    </body>
  </html>`;
}

function createJob(mode: InputMode, sourceLabel: string, input: string): MockJob {
  const spec = mode === "prompt" ? buildSpecFromPrompt(input) : buildSpecFromVideo(input);
  const questions = buildQuestions(spec);
  return {
    id: createId(),
    mode,
    createdAt: Date.now(),
    sourceLabel,
    spec,
    questions,
  };
}

export function createPromptJob(prompt: string): MockJob {
  const job = createJob("prompt", "Prompt analysis", prompt);
  getStore().set(job.id, job);
  return job;
}

export function createUploadJob(fileName: string): MockJob {
  const job = createJob(fileName.includes("record") ? "record" : "upload", "Video analysis", fileName);
  getStore().set(job.id, job);
  return job;
}

export function getJob(jobId: string): MockJob | null {
  return getStore().get(jobId) ?? null;
}

export function getJobStatus(jobId: string): JobStatusResponse | null {
  const job = getJob(jobId);
  if (!job) {
    return null;
  }

  const steps = job.mode === "prompt" ? PROMPT_STEPS : VIDEO_STEPS;
  const durationMs = job.mode === "prompt" ? 9000 : 14000;
  const elapsed = Date.now() - job.createdAt;
  const progress = Math.min(100, Math.max(4, Math.round((elapsed / durationMs) * 100)));
  const activeIndex = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));

  return {
    status: progress >= 100 ? "completed" : "processing",
    step: steps[activeIndex],
    progress,
  };
}

export function mergeJobAnswers(jobId: string, answers: Record<string, string | string[]>): CreativeSpec | null {
  const job = getJob(jobId);
  if (!job) {
    return null;
  }

  const nextSpec: CreativeSpec = {
    ...job.spec,
    sections: job.spec.sections.map((section) => ({ ...section })),
    design: {
      ...job.spec.design,
      colorPalette: [...(job.spec.design.colorPalette ?? [])],
    },
    animationPlan: [...job.spec.animationPlan],
    features: [...job.spec.features],
  };

  for (const question of job.questions) {
    const answer = answers[question.id];
    if (!answer) {
      continue;
    }

    const normalized = Array.isArray(answer) ? answer : [answer];
    if (question.category === "animation") {
      const targetSections =
        question.targetSection === null
          ? nextSpec.sections
          : nextSpec.sections.filter((section) => section.id === question.targetSection);
      for (const section of targetSections) {
        for (const option of normalized) {
          if (option.toLowerCase().includes("no animation")) {
            continue;
          }
          if (!nextSpec.animationPlan.some((item) => item.sectionId === section.id && item.name === option)) {
            nextSpec.animationPlan.push({
              sectionId: section.id,
              name: option,
              trigger: "on scroll",
            });
          }
        }
      }
    }

    if (question.category === "design") {
      const first = normalized[0] ?? "";
      const lower = question.question.toLowerCase();
      if (lower.includes("color") || lower.includes("theme")) {
        nextSpec.design.theme = first.toLowerCase().includes("light")
          ? "light"
          : first.toLowerCase().includes("dark")
            ? "dark"
            : nextSpec.design.theme;
        nextSpec.design.colorPalette = Array.from(
          new Set([
            ...(nextSpec.design.colorPalette ?? []),
            first.toLowerCase().includes("green")
              ? "green"
              : first.toLowerCase().includes("purple")
                ? "purple"
                : first.toLowerCase().includes("orange")
                  ? "orange"
                  : first.toLowerCase().includes("blue")
                    ? "blue"
                    : first,
          ]),
        );
      }
      if (lower.includes("animation library")) {
        nextSpec.design.animationLibrary = first;
      }
      if (lower.includes("spacious") || lower.includes("layout feel") || lower.includes("density")) {
        nextSpec.design.density = first;
      }
    }

    if (question.category === "features") {
      nextSpec.features = Array.from(new Set([...nextSpec.features, ...normalized.filter((item) => !item.toLowerCase().includes("no extra"))]));
    }

    if (question.category === "layout" && question.targetSection) {
      const section = nextSpec.sections.find((item) => item.id === question.targetSection);
      if (section) {
        section.layoutStyle = normalized[0] ?? null;
      }
    }
  }

  const updatedQuestions = buildQuestions(nextSpec);
  const updatedJob: MockJob = {
    ...job,
    spec: nextSpec,
    questions: updatedQuestions,
  };
  getStore().set(job.id, updatedJob);
  return nextSpec;
}

export function getGeneratedAssets(jobId: string): GenerateResponse | null {
  const job = getJob(jobId);
  if (!job) {
    return null;
  }

  const html = buildPreviewHtml(job.spec);
  const previewUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

  return {
    previewUrl,
    downloadUrl: `/exports/${jobId}.zip`,
  };
}
