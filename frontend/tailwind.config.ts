import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        elevated: "var(--shadow-elevated)",
      },
      backgroundImage: {
        hero: "var(--gradient-hero)",
        noise: "var(--texture-noise)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },

        // Kiosk attract / idle mode (20–40s loop, subtle + GPU-friendly)
        "attract-headline": {
          "0%": { opacity: "0.92", transform: "translate3d(0, 0, 0)" },
          "35%": { opacity: "1", transform: "translate3d(0, -10px, 0)" },
          "70%": { opacity: "0.96", transform: "translate3d(0, -4px, 0)" },
          "100%": { opacity: "0.92", transform: "translate3d(0, 0, 0)" },
        },
        "attract-ghost": {
          "0%": { opacity: "0.10", transform: "translate3d(-10px, 8px, 0) scale(1.01)" },
          "50%": { opacity: "0.16", transform: "translate3d(12px, -6px, 0) scale(1.02)" },
          "100%": { opacity: "0.10", transform: "translate3d(-10px, 8px, 0) scale(1.01)" },
        },
        "attract-sub": {
          "0%": { opacity: "0.72", letterSpacing: "0.02em" },
          "50%": { opacity: "0.92", letterSpacing: "0.06em" },
          "100%": { opacity: "0.72", letterSpacing: "0.02em" },
        },
        "attract-cta": {
          "0%": { opacity: "0.78", transform: "translate3d(0, 0, 0)" },
          "50%": { opacity: "1", transform: "translate3d(0, -2px, 0)" },
          "100%": { opacity: "0.78", transform: "translate3d(0, 0, 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 260ms cubic-bezier(.2,.8,.2,1)",
        float: "float 6s ease-in-out infinite",

        // Attract mode (long-loop, seamless)
        "attract-headline": "attract-headline 28s ease-in-out infinite",
        "attract-ghost": "attract-ghost 34s ease-in-out infinite",
        "attract-sub": "attract-sub 26s ease-in-out infinite",
        "attract-cta": "attract-cta 22s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
