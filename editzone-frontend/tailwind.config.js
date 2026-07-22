/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#8b3ffb",
          violet: "#6d28f5",
          blue: "#2fb8ff",
          cyan: "#38e6ff",
          dark: "#07040f",
          panel: "#0f0a1f",
          panel2: "#150e2b",
          border: "#241a3d",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #8b3ffb 0%, #6d28f5 40%, #2fb8ff 100%)",
        "brand-radial": "radial-gradient(circle at 50% 0%, rgba(139,63,251,0.25), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 25px rgba(139,63,251,0.45)",
        "glow-blue": "0 0 25px rgba(47,184,255,0.45)",
      },
    },
  },
  plugins: [],
};
