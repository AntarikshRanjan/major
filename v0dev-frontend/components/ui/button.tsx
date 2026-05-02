import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent-blue)] text-white hover:bg-[#4d8df9]",
  secondary: "bg-[#141414] text-white border border-[var(--border)] hover:border-white/25",
  ghost: "bg-transparent text-white hover:bg-white/5",
  danger: "bg-[var(--accent-red)] text-white hover:bg-[#f15b67]",
  outline: "bg-transparent text-white border border-white/15 hover:border-white/30 hover:bg-white/5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-[1.02] active:scale-[0.99]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
