import type { ExamplePrompt, ModeCardConfig } from "@/lib/types";

export const modeCards: ModeCardConfig[] = [
  {
    mode: "prompt",
    title: "Write a Prompt",
    description:
      "Describe your website in plain English. Best for developers and technical users.",
    badge: "For Developers",
    cta: "Start with Prompt",
    accent: "#3b82f6",
    icon: "prompt",
    href: "/build/prompt",
  },
  {
    mode: "record",
    title: "Record Your Screen",
    description:
      "Browse a website you like while we record your screen. AI will analyze and clone the design.",
    badge: "Most Powerful",
    cta: "Start Recording",
    accent: "#22c55e",
    icon: "record",
    recommended: true,
    href: "/build/record",
  },
  {
    mode: "upload",
    title: "Upload a Video",
    description:
      "Already have a screen recording? Upload it directly and let AI analyze it.",
    badge: "Quick Start",
    cta: "Upload Video",
    accent: "#a855f7",
    icon: "upload",
    href: "/build/upload",
  },
];

export const examplePrompts: ExamplePrompt[] = [
  {
    label: "SaaS Landing Page",
    prompt:
      "Build me a SaaS landing page with a dark theme, a bold hero section, animated feature cards, a three-tier pricing table, customer testimonials, and a CTA footer. Use electric blue accents and smooth scroll animations.",
  },
  {
    label: "E-commerce Store",
    prompt:
      "Create a modern e-commerce storefront with a large hero banner, featured products grid, category filters, product cards with hover states, customer reviews, and a clean checkout CTA. Keep it premium and editorial.",
  },
  {
    label: "Portfolio Website",
    prompt:
      "Design a sleek personal portfolio with an intro hero, project gallery, case study sections, testimonials, contact form, and subtle motion throughout. Use a dark theme with vivid accent colors and cinematic imagery.",
  },
];

export const rotatingMessages = [
  "Analyzing your design taste...",
  "Detecting color schemes...",
  "Mapping out your sections...",
  "Training our creative eye on your video...",
];

export const generationMessages = [
  "> Initializing Next.js project...",
  "> Creating Hero section...",
  "> Adding GSAP animations...",
  "> Installing dependencies...",
  "> Running build check...",
  "> Fixing issues...",
  "> Done!",
];
