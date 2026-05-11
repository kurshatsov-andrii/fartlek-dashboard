import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      colors: {
        // PRIMARY BRAND — Strava-style fiery orange (hsl 14 100% 60%)
        neon: {
          DEFAULT: "#ff6633",
          50: "#fff1ec",
          100: "#ffdccc",
          200: "#ffb999",
          300: "#ff9566",
          400: "#ff8052",
          500: "#ff6633",
          600: "#e54d1a",
          700: "#b83a12",
          800: "#80280d",
          900: "#451608",
        },
        // SECONDARY ACCENT — golden yellow (hsl 53 100% 53%)
        accent: {
          DEFAULT: "#ffeb14",
          300: "#fff066",
          400: "#ffed33",
          500: "#ffeb14",
          600: "#e6d300",
          700: "#b3a500",
        },
        // BACKGROUNDS — pure dark grayscale (hsl 0 0% n%)
        ink: {
          950: "#0a0a0a",
          900: "#0f0f0f",
          850: "#141414",
          800: "#1a1a1a",
          700: "#1f1f1f",
          600: "#29292a",
          500: "#3a3a3b",
        },
        // Secondary accent palette for charts/badges (harmonized with orange)
        cyber: {
          pink: "#ff3d7f",
          blue: "#3da5ff",
          purple: "#9b5cff",
          orange: "#ff6633",
          yellow: "#ffeb14",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,102,51,0.22), transparent 70%)",
        "neon-gradient":
          "linear-gradient(135deg, #ff6633 0%, #ff8052 45%, #ffeb14 100%)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      boxShadow: {
        // Brand glows — warm orange instead of green
        neon: "0 0 24px rgba(255,102,51,0.45), 0 0 48px rgba(255,102,51,0.20)",
        "neon-sm": "0 0 12px rgba(255,102,51,0.5)",
        glass:
          "0 8px 32px 0 rgba(0,0,0,0.45), inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 12px rgba(255,102,51,0.45)" },
          "100%": { boxShadow: "0 0 28px rgba(255,102,51,0.85)" },
        },
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
};

export default config;
