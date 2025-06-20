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
          },
          animation: {
            highlight: "highlight 0.6s ease forwards",
            flash: "flash 0.6s ease forwards",
          },
        },
      },
    },
  },
};

export default config;
