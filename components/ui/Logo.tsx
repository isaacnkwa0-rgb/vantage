"use client";

interface LogoProps {
  variant?: "full" | "mark" | "inverted";
  size?: number;     // mark size in px, default 32
  className?: string;
}

export function Logo({ variant = "full", size = 32, className = "" }: LogoProps) {
  const markSize = size;

  // Standard mark: Primary bg, Ink boxes
  const StandardMark = (
    <svg width={markSize} height={markSize} viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="88" height="88" rx="24" style={{ fill: "var(--color-primary)" }}/>
      <rect x="22" y="40" width="30" height="26" rx="6" fill="none" stroke="#16130F" strokeWidth="5"/>
      <rect x="36" y="22" width="30" height="26" rx="6" fill="#16130F"/>
    </svg>
  );

  // Inverted mark: Primary bg, Cream boxes (for dark backgrounds)
  const InvertedMark = (
    <svg width={markSize} height={markSize} viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="88" height="88" rx="24" style={{ fill: "var(--color-primary)" }}/>
      <rect x="22" y="40" width="30" height="26" rx="6" fill="none" stroke="#FFF6EC" strokeWidth="5"/>
      <rect x="36" y="22" width="30" height="26" rx="6" fill="#FFF6EC"/>
    </svg>
  );

  if (variant === "mark") {
    return <span className={className} aria-label="Stokka">{StandardMark}</span>;
  }

  if (variant === "inverted") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Stokka">
        {InvertedMark}
        <span
          style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', Arial, sans-serif", fontWeight: 800, letterSpacing: "-0.04em", color: "#FFF6EC", fontSize: markSize * 0.75 }}
        >
          stokka
        </span>
      </span>
    );
  }

  // variant === "full"
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Stokka">
      {StandardMark}
      <span
        style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', Arial, sans-serif", fontWeight: 800, letterSpacing: "-0.04em", color: "#16130F", fontSize: markSize * 0.75 }}
      >
        stokka
      </span>
    </span>
  );
}
