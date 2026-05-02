export type InputMode = "prompt" | "record" | "upload";

export type QuestionCategory = "animation" | "design" | "layout" | "features";

export interface SectionComponent {
  type: string;
  label: string | null;
}

export interface Section {
  id: string;
  type: string | null;
  components: SectionComponent[];
  layout: string | null;
  confidence: number | null;
  layoutStyle?: string;
}

export interface AnimationPlanItem {
  sectionId: string | null;
  name: string;
  trigger: string | null;
}

export interface CreativeSpecDesign {
  theme: string | null;
  density: string | null;
  style: string | null;
  colorPalette?: string[];
  animationLibrary?: string | null;
}

export interface CreativeSpec {
  sections: Section[];
  design: CreativeSpecDesign;
  animationPlan: AnimationPlanItem[];
  features: string[];
}

export interface Question {
  id: string;
  category: QuestionCategory;
  question: string;
  options: string[];
  multi: boolean;
  reason: string;
  targetSection: string | null;
}

export interface JobStatusResponse {
  status: "queued" | "processing" | "completed";
  step: string;
  progress: number;
}

export interface EnhancePromptResponse {
  enhanced: string;
}

export interface AnalyzePromptResponse {
  jobId: string;
  spec: CreativeSpec;
}

export interface UploadVideoResponse {
  jobId: string;
}

export interface McqResponse {
  questions: Question[];
  generated_from?: string;
  total_questions?: number;
}

export interface MergeAnswersResponse {
  updatedSpec: CreativeSpec;
}

export interface GenerateResponse {
  previewUrl: string;
  downloadUrl: string;
}

export interface ApiErrorResponse {
  error: string;
}

export interface ModeCardConfig {
  mode: InputMode;
  title: string;
  description: string;
  badge: string;
  cta: string;
  accent: string;
  icon: "prompt" | "record" | "upload";
  recommended?: boolean;
  href: string;
}

export interface ExamplePrompt {
  label: string;
  prompt: string;
}

export interface ProcessingStepItem {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}
