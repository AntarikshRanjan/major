"use client";

import { cn } from "@/lib/utils";

type Device = "desktop" | "tablet" | "mobile";

interface DevicePreviewProps {
  url: string;
  device: Device;
}

const widths: Record<Device, string> = {
  desktop: "w-full",
  tablet: "w-[820px] max-w-full",
  mobile: "w-[390px] max-w-full",
};

export function DevicePreview({ url, device }: DevicePreviewProps) {
  return (
    <div className="flex flex-1 items-start justify-center overflow-hidden rounded-[32px] border border-[var(--border)] bg-[#090909] p-4">
      <div className={cn("overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-2xl transition-all duration-300", widths[device])}>
        <iframe
          title="Generated website preview"
          src={url}
          className="h-[72vh] w-full bg-white"
        />
      </div>
    </div>
  );
}
