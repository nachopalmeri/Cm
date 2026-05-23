import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0C0F",
        surface: "#1A1820",
        primary: "#F5F3F7",
        secondary: "#B8B0C3",
        muted: "#6E6578",
        peach: "#E8A87C",
        mint: "#9DBFAF",
        lavender: "#B8A4D4",
        rose: "#D4A4B8",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        accent: ["Space Grotesk", "monospace"],
      },
      spacing: {
        "section": "clamp(4rem, 10vw, 8rem)",
        "gutter": "clamp(1rem, 3vw, 3rem)",
      },
      animation: {
        "float": "float 4s ease-in-out infinite",
        "fade-up": "fadeUp 1s cubic-bezier(0.05, 0.7, 0.1, 1) forwards",
        "reveal": "reveal 1.5s cubic-bezier(0.05, 0.7, 0.1, 1) forwards",
        "shimmer": "shimmer 2s linear infinite",
        "morph": "morph 20s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(80px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        reveal: {
          from: { clipPath: "inset(0 100% 0 0)" },
          to: { clipPath: "inset(0 0% 0 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        morph: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "25%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
          "50%": { borderRadius: "50% 60% 30% 60% / 30% 60% 70% 40%" },
          "75%": { borderRadius: "60% 40% 60% 40% / 70% 30% 50% 60%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
