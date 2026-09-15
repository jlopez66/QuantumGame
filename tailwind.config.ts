import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#000000",
          dark: "#111111",
          darker: "#1A1A1A",
          white: "#FFFFFF",
          cyan: "#00F2FE",
          purple: "#4FACFE",
          green: "#00FF87",
        },
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-roboto)", "Arial", "sans-serif"],
      },
      backgroundImage: {
        "quantum-gradient":
          "linear-gradient(90deg, #00F2FE 0%, #4FACFE 50%, #00FF87 100%)",
        "quantum-gradient-radial":
          "radial-gradient(circle, #4FACFE 0%, #000000 70%)",
      },
      boxShadow: {
        "neon-cyan": "0 0 5px #00F2FE, 0 0 20px #00F2FE, 0 0 40px rgba(0,242,254,0.4)",
        "neon-purple": "0 0 5px #4FACFE, 0 0 20px #4FACFE, 0 0 40px rgba(79,172,254,0.4)",
        "neon-green": "0 0 5px #00FF87, 0 0 20px #00FF87, 0 0 40px rgba(0,255,135,0.4)",
        "neon-soft": "0 0 30px rgba(79,172,254,0.25)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.85", filter: "brightness(1.3)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "gradient-x": "gradient-x 3s ease infinite",
        float: "float 4s ease-in-out infinite",
      },
      backgroundSize: {
        "200%": "200% 200%",
      },
    },
  },
  plugins: [],
};

export default config;
