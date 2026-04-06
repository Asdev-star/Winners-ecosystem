import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={`w-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition-all duration-150 placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--gold)_24%,transparent)] ${className}`.trim()}
      style={{ borderRadius: "var(--card-radius, 12px)" }}
      {...props}
    />
  );
}
