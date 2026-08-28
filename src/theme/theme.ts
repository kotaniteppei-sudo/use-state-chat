"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: "#1f5eb6",
    },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 10,
  },

  typography: {
    fontFamily: '"Noto Sans JP", "Yu Gothic", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
});
