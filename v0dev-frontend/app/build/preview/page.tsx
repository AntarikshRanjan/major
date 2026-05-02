"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { DevicePreview } from "@/components/DevicePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { capitalize } from "@/lib/utils";

type Device = "desktop" | "tablet" | "mobile";

export default function PreviewPage() {
  const router = useRouter();
  const spec = useAppStore((state) => state.spec);
  const previewUrl = useAppStore((state) => state.generatedPreviewUrl);
  const reset = useAppStore((state) => state.reset);

  const [device, setDevice] = useState<Device>("desktop");
  const [frameKey, setFrameKey] = useState(0);

  const componentCount = useMemo(
    () => spec?.sections.reduce((total, section) => total + section.components.length, 0) ?? 0,
    [spec],
  );

  if (!spec || !previewUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
        <Card className="w-full max-w-lg space-y-4 p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Preview not ready yet</h1>
          <p className="text-sm leading-7 text-[var(--muted)]">
            We need to finish the generation flow before showing a preview.
          </p>
          <Button onClick={() => router.push("/build/generating")}>Return to generating</Button>
        </Card>
      </main>
    );
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "v0dev-export.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1600px] flex-col gap-4"
      >
        <div className="grid flex-1 gap-4 xl:grid-cols-[0.42fr_0.58fr]">
          <Card className="flex flex-col gap-6 p-6 md:p-8">
            <div className="space-y-2">
              <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent-blue)]">
                CreativeSpec summary
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Ready to ship
              </h1>
              <p className="text-sm leading-7 text-[var(--muted)]">
                Review the structure we&apos;re about to generate and export.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Sections</p>
                <p className="mt-2 text-3xl font-semibold text-white">{spec.sections.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Components</p>
                <p className="mt-2 text-3xl font-semibold text-white">{componentCount}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Sections</h2>
              <div className="space-y-3">
                {spec.sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <p className="font-medium text-white">
                      {section.id} · {section.type ?? "Unspecified"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {section.layoutStyle ?? section.layout ?? "Adaptive layout"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Animations</h2>
              <div className="flex flex-wrap gap-2">
                {spec.animationPlan.length > 0 ? (
                  spec.animationPlan.map((animation) => (
                    <span
                      key={`${animation.sectionId}-${animation.name}`}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80"
                    >
                      {animation.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--muted)]">No animations confirmed yet.</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Features</h2>
              <div className="flex flex-wrap gap-2">
                {spec.features.length > 0 ? (
                  spec.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80"
                    >
                      {feature}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--muted)]">No extra features selected yet.</span>
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={() => router.push("/build/mcq")}>
                Edit Spec
              </Button>
              <Button variant="outline" onClick={() => router.push("/build/generating")}>
                Regenerate
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["desktop", "tablet", "mobile"] as Device[]).map((item) => (
                  <Button
                    key={item}
                    variant={device === item ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setDevice(item)}
                  >
                    {capitalize(item)}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setFrameKey((value) => value + 1)}>
                Reload
              </Button>
            </div>

            <div key={frameKey} className="flex-1">
              <DevicePreview url={previewUrl} device={device} />
            </div>
          </Card>
        </div>

        <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[var(--muted)]">
            Your mock frontend flow is complete. Export or iterate from here.
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="bg-[var(--accent-green)] hover:bg-[#34d26c]" onClick={handleDownload}>
              Download as ZIP
            </Button>
            <Button variant="secondary" onClick={handleCopy}>
              Copy Share Link
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                reset();
                router.push("/");
              }}
            >
              Start Over
            </Button>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
