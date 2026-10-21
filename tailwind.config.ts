import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — map to CSS variables
        bg:        "var(--color-bg)",
        surface:   "var(--color-surface)",
        border:    "var(--color-border)",
        "text-base":   "var(--color-text)",
        "text-muted":  "var(--color-muted)",
        link:      "var(--color-link)",
        primary:   "var(--color-primary)",
        "primary-soft": "var(--color-primary-soft)",
        "on-primary":   "var(--color-on-primary)",
        highlight: "var(--color-highlight)",
        "on-highlight": "var(--color-on-highlight)",
        success:   "var(--color-success)",
        warning:   "var(--color-warning)",
        danger:    "var(--color-danger)",
        // Raw palette (for when you need a fixed value)
        ember:     "#F2542D",
        "ember-deep": "#B8320F",
        ink:       "#16130F",
        cream:     "#FFF6EC",
        sun:       "#FFC93C",
        // Sidebar specific
        sidebar: {
          DEFAULT:            "var(--sidebar-bg)",
          foreground:         "var(--sidebar-fg)",
          "foreground-active":"var(--sidebar-fg-active)",
          border:             "var(--sidebar-border)",
          accent:             "var(--sidebar-accent)",
        },
      },
      borderRadius: {
        none: "0",
        sm:   "8px",
        DEFAULT: "14px",
        md:   "14px",
        lg:   "18px",
        xl:   "24px",
        "2xl": "24px",
        full: "9999px",
      },
      fontFamily: {
        sans:    ["var(--font-body)", "Manrope", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Bricolage Grotesque", "Arial", "sans-serif"],
        mono:    ["Manrope", "Arial", "sans-serif"],  // no more JetBrains Mono
      },
      keyframes: {
        "scan-line": {
          "0%": { top: "0%" },
          "50%": { top: "calc(100% - 2px)" },
          "100%": { top: "0%" },
        },
      },
      animation: {
        "scan-line": "scan-line 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
