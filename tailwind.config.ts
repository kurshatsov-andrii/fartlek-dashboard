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
        neon: {
          DEFAULT: "#00ff88",
          50: "#e6fff3",
          100: "#b3ffd9",
          200: "#80ffbf",
          300: "#4dffa6",
          400: "#1aff8c",
          500: "#00ff88",
          600: "#00cc6e",
          700: "#009954",
          800: "#00663a",
          900: "#00331d",
        },
        ink: {
          950: "#06080c",
          900: "#0a0d14",
          850: "#0d1119",
          800: "#11151f",
          700: "#1a2030",
          600: "#252c40",
          500: "#3a4258",
        },
        cyber: {
          pink: "#ff0080",
          blue: "#00d4ff",
          purple: "#a855f7",
          orange: "#ff6b35",
          yellow: "#ffd700",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,255,136,0.18), transparent 70%)",
        "neon-gradient":
          "linear-gradient(135deg, #00ff88 0%, #00d4ff 50%, #a855f7 100%)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      boxShadow: {
        neon: "0 0 24px rgba(0,255,136,0.35), 0 0 48px rgba(0,255,136,0.15)",
        "neon-sm": "0 0 12px rgba(0,255,136,0.4)",
        glass:
          "0 8px 32px 0 rgba(0,0,0,0.37), inset 0 1px 0 0 rgba(255,255,255,0.06)",
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
          "0%": { boxShadow: "0 0 12px rgba(0,255,136,0.4)" },
          "100%": { boxShadow: "0 0 28px rgba(0,255,136,0.8)" },
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
