import { Link } from "@tanstack/react-router";

interface LogoProps {
  variant?: "light" | "dark";
  showTagline?: boolean;
  className?: string;
}

export function Logo({ variant = "dark", showTagline = false, className = "" }: LogoProps) {
  const textColor = variant === "light" ? "text-navy" : "text-white";
  return (
    <Link to="/" className={`inline-flex flex-col leading-none ${className}`}>
      <span className={`font-display font-extrabold text-2xl tracking-tight ${textColor}`}>
        EconA<span className="text-gold">*</span>
      </span>
      {showTagline && (
        <span className="text-xs text-muted-foreground mt-1 font-body">
          Ace Your A-Level Economics.
        </span>
      )}
    </Link>
  );
}
