import { createTheme } from "@mui/material/styles";

const softShadow = "0 1px 2px rgba(16,24,40,0.06)";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563EB",
    },
    background: {
      default: "#F4F5F7",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },
    divider: "#E6E8EC",
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h4: {
      fontWeight: 650,
      letterSpacing: "-0.02em",
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: softShadow,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: softShadow,
        },
      },
    },
  },
});

export default theme;
