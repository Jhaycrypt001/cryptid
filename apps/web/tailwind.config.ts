import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2F2EE", // page background
        surface: "#FFFFFF", // cards / panels
        ink: "#192837", // primary text
        muted: "#5B6B79", // secondary text
        edge: "#E4E3DD", // borders
        accent: "#7342E2", // brand purple
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(25,40,55,0.06), 0 8px 24px rgba(25,40,55,0.05)",
        accent: "0 4px 24px rgba(115,66,226,0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
