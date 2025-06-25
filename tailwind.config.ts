import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ara_red: "#ED3A3A",
        ara_red_bright: "#F9C7C7",
        ara_red_most_bright: "#FDF0F0",
        ara_red_dark: "#c62626",
        ara_blue: "#538DD1",
        ara_gray: "#666666",
        ara_gray_bright: "#B6B6B6",
        ara_event_yellow_bright: "#FFEDD2",
        ara_event_green_bright: "#F8FFCC",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
} satisfies Config;