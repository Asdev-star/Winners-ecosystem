import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = "", type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={`w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--gold)_24%,transparent)] ${className}`.trim()}
      {...props}
    />
  );
}
