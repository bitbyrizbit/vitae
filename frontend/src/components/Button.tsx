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
    "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";

  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-[15px]",
  };

  const variants = {
    primary: "bg-brown text-white hover:bg-brown-dim shadow-sm",
    secondary: "bg-surface-1 border border-rule-strong text-text hover:border-brown hover:text-brown shadow-sm",
    ghost: "text-text-secondary hover:text-brown",
    danger: "border border-coral bg-coral-bg text-coral hover:bg-coral hover:text-white shadow-sm",
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