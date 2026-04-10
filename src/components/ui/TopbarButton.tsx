import type { ButtonHTMLAttributes, ReactNode } from "react";

interface TopbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isActive?: boolean;
}

export default function TopbarButton({
  children,
  className = "",
  isActive = false,
  type = "button",
  ...props
}: TopbarButtonProps) {
  return (
    <button
      type={type}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 
        ${
          isActive
            ? "border-(--border-soft) bg-(--surface-active) text-(--app-fg) shadow-sm"
            : "border-transparent text-(--text-muted) hover:bg-(--surface-hover) hover:text-(--app-fg)"
        } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
