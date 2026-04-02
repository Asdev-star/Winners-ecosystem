import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--gold)] text-black hover:brightness-110 border border-transparent",
  outline:
    "bg-transparent text-[var(--text)] hover:bg-white/5 border border-[var(--border)]",
  ghost: "bg-transparent text-[var(--text)] hover:bg-white/5 border border-transparent",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--gold)_30%,transparent)] ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
