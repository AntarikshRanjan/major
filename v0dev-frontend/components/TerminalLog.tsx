"use client";

import { useEffect, useRef } from "react";

interface TerminalLogProps {
  messages: string[];
}

export function TerminalLog({ messages }: TerminalLogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="h-64 overflow-y-auto rounded-3xl border border-[var(--border)] bg-black px-5 py-4 font-mono text-sm text-[var(--accent-green)]"
    >
      <div className="space-y-2">
        {messages.map((message, index) => (
          <p key={`${message}-${index}`} className="whitespace-pre-wrap">
            {message}
          </p>
        ))}
      </div>
    </div>
  );
}
