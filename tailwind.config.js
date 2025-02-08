import defaultTheme from "tailwindcss/defaultTheme";

const pxToRem = (dest) => 1 / (16 / dest);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./themes/**/layouts/**/*.html", "./layouts/**/*.html"],
  theme: {
    extend: {
      screens: {
        xs: `${pxToRem(420)}rem`,
      },
      zIndex: {
        min: "-1",
        1: "1",
        2: "2",
        100: "100",
        max: "9999",
      },

      typography: (theme) => ({
        DEFAULT: {
          css: {
            "code::before": {
              content: "none",
            },
            "code::after": {
              content: "none",
            },
            code: {
              backgroundColor: theme("colors.gray.100"),
              padding: "0.2em 0.4em",
              borderRadius: "0.25rem",
              fontSize: "90%",
              fontWeight: 500,
            },
          },
        },
      }),
    },
    colors: {
      black: "#000000",
      light: "#ffffff",
      gray: {
        50: "#1A1A1A",
        100: "#2D2D2D",
        200: "#3C3C3C",
        300: "#626262",
        400: "#878787",
        500: "#9B9B9B",
        600: "#B0B0B0",
        700: "#DFDFDF",
        800: "#F1F1F1",
      },
      green: {
        100: "#78DC81",
        200: "#1E5A23",
      },
      transparent: "transparent",
      current: "currentColor",
    },
    fontFamily: {
      proxima: ["Proxima", defaultTheme.fontFamily.sans],
      interVar: ['"Inter var"', defaultTheme.fontFamily.sans],
      interNormal: ["Inter", defaultTheme.fontFamily.sans],
    },
    fontSize: {
      50: `${pxToRem(11)}rem`,
      100: `${pxToRem(13)}rem`,
      200: `${pxToRem(15)}rem`,
      300: `${pxToRem(17)}rem`,
      400: `${pxToRem(20)}rem`,
      500: `${pxToRem(24)}rem`,
      600: `${pxToRem(28)}rem`,
      700: `${pxToRem(48)}rem`,
      800: `${pxToRem(64)}rem`,
      900: `${pxToRem(94)}rem`,
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
