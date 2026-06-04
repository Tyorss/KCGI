import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151a23",
        muted: "#667085",
        line: "#d9e1df",
        panel: "#ffffff",
        canvas: "#f5f7f5",
        navy: "#172554",
        teal: "#28776f",
        gold: "#b8872f",
        coral: "#c8664b",
        violet: "#67558a"
      },
      boxShadow: {
        panel: "0 10px 24px rgba(30, 41, 59, 0.07)"
      }
    }
  },
  plugins: []
};

export default config;
