import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "hsl(var(--bg-app) / <alpha-value>)",
        surface: "hsl(var(--bg-surface) / <alpha-value>)",
        subtle: "hsl(var(--bg-subtle) / <alpha-value>)",
        "content-primary": "hsl(var(--text-primary) / <alpha-value>)",
        "content-secondary": "hsl(var(--text-secondary) / <alpha-value>)",
        "content-muted": "hsl(var(--text-muted) / <alpha-value>)",
        line: "hsl(var(--border) / <alpha-value>)",
        indigo: {
          DEFAULT: "hsl(var(--indigo) / <alpha-value>)",
          soft: "hsl(var(--indigo-soft) / <alpha-value>)",
        },
        success: "hsl(var(--success) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Geist",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      width: {
        sidebar: "15.5rem", // 248px
        "sidebar-compact": "4rem",
        topbar: "4.5rem", // 72px -> usado como altura via h-topbar
      },
      height: {
        topbar: "4.5rem",
        "topbar-mobile": "3.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
