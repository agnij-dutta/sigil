/** @type {import('postcss').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {
      theme: {
        extend: {
          keyframes: {
            highlight: {
              "0%": { backgroundColor: "transparent" },
              "100%": { backgroundColor: "var(--highlight)" },
            },
            flash: {
              "0%": { backgroundColor: "hsl(var(--card))" },
              "50%": { backgroundColor: "var(--highlight)" },
              "100%": { backgroundColor: "hsl(var(--card))" },
            },
            "accordion-down": {
              from: { height: "0" },
              to: { height: "var(--radix-accordion-content-height)" },
            },
            "accordion-up": {
              from: { height: "var(--radix-accordion-content-height)" },
              to: { height: "0" },
            },
            "fade-in": {
              "0%": { opacity: "0" },
              "100%": { opacity: "1" },
            },
            "fade-in-up": {
              "0%": { opacity: "0", transform: "translateY(10px)" },
              "100%": { opacity: "1", transform: "translateY(0)" },
            },
            "scale-in": {
              "0%": { opacity: "0", transform: "scale(0.95)" },
              "100%": { opacity: "1", transform: "scale(1)" },
            },
          },
          animation: {
            highlight: "highlight 0.6s ease forwards",
            flash: "flash 0.6s ease forwards",
            "accordion-down": "accordion-down 0.2s ease-out",
            "accordion-up": "accordion-up 0.2s ease-out",
            "fade-in": "fade-in 0.5s ease-out",
            "fade-in-up": "fade-in-up 0.5s ease-out",
            "scale-in": "scale-in 0.2s ease-out",
          },
          backgroundImage: {
            "grid-small-black": "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(0 0 0 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e\")",
            "grid-small-white": "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e\")",
          },
        },
      },
    },
  },
};

export default config;
