import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

/**
 * Colour lives in src/app/globals.css as CSS variables. This file only gives
 * those variables Tailwind names, so a component writes `bg-surface text-ink`
 * and inherits light/dark automatically.
 *
 * The full Tailwind hue palettes below are kept because channel tags store a
 * hue name ("emerald", "sky", ...) in the database and the UI rebuilds a class
 * from it at runtime. That contract is unchanged; see `safelist`.
 */
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        red: colors.red,
        orange: colors.orange,
        amber: colors.amber,
        yellow: colors.yellow,
        lime: colors.lime,
        green: colors.green,
        emerald: colors.emerald,
        teal: colors.teal,
        cyan: colors.cyan,
        sky: colors.sky,
        blue: colors.blue,
        indigo: colors.indigo,
        violet: colors.violet,
        purple: colors.purple,
        fuchsia: colors.fuchsia,
        pink: colors.pink,
        rose: colors.rose,
        stone: colors.stone,
        gray: colors.gray,

        // Semantic tokens.
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        inset: "var(--bg-inset)",
        hovered: "var(--bg-hover)",

        line: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--text-primary)",
          soft: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverted: "var(--text-inverted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          contrast: "var(--accent-contrast)",
        },
        positive: "var(--status-positive)",
        caution: "var(--status-warning)",
        danger: "var(--status-danger)",
        nav: {
          DEFAULT: "var(--nav-bg)",
          line: "var(--nav-border)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        control: "var(--radius-control)",
        surface: "var(--radius-surface)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      maxWidth: {
        content: "1240px",
        prose: "68ch",
      },
      transitionTimingFunction: {
        // One easing curve for the whole product.
        pm: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "pm-rise": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "pm-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  safelist: [
    {
      // Channel tag hues are resolved from database values at runtime.
      pattern:
        /bg-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|stone|gray)-(400|500)/,
    },
    {
      pattern:
        /text-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|stone|gray)-(400|500)/,
    },
  ],
  plugins: [],
};
export default config;
