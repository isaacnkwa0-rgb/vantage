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
        // VANTAGE Design System — Business Green
        sidebar: {
          DEFAULT: "#14532d",
          foreground: "#bbf7d0",
          "foreground-active": "#FFFFFF",
          border: "#166534",
          accent: "#166534",
        },
        brand: {
          DEFAULT: "#16a34a",
          hover: "#15803d",
          foreground: "#FFFFFF",
        },
        profit: "#10B981",
        loss: "#EF4444",
        warning: "#F59E0B",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
