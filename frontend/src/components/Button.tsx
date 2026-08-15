import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]";

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
  };

  const variants = {
    primary: "bg-gold text-base hover:bg-gold-bright",
    secondary: "border border-rule text-text-secondary hover:border-text-tertiary hover:text-text",
    ghost: "text-text-secondary hover:text-text",
    danger: "border border-coral-dim text-coral hover:bg-coral-dim/30",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} rounded-[3px] ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full mr-2"
          style={{ animation: "spin 0.6s linear infinite" }}
        />
      )}
      {children}
    </button>
  );
}