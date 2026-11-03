import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        habibi: {
          50: "#fff8eb",
          100: "#ffedc6",
          200: "#ffd988",
          300: "#ffc04a",
          400: "#ffa621",
          500: "#f98607",
          600: "#dd6102",
          700: "#b74006",
          800: "#94310c",
          900: "#7a290d",
        },
        chili: {
          400: "#f0594a",
          500: "#e03a2c",
          600: "#c42a1e",
        },
        olive: {
          400: "#9aa857",
          500: "#7d8b3d",
          600: "#636f2f",
        },
        night: {
          700: "#2a2420",
          800: "#1c1815",
          900: "#12100e",
          950: "#0a0908",
        },
        cream: {
          50: "#fffdf8",
          100: "#fbf5e9",
          200: "#f3e7cf",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "ui-serif", "Georgia", "serif"],
      },
      backgroundImage: {
        "ember-gradient": "linear-gradient(135deg, #f98607 0%, #e03a2c 100%)",
        "night-gradient": "linear-gradient(180deg, #12100e 0%, #1c1815 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(249, 134, 7, 0.55)",
        card: "0 10px 40px -12px rgba(0, 0, 0, 0.55)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

