import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0b2c4a",
      light: "#1d5fa3",
      dark: "#153a63",
    },
    secondary: {
      main: "#1d5fa3",
    },
    error: {
      main: "#dc2626",
    },
    text: {
      primary: "#0b2c4a",
      secondary: "#64748b",
    },
    background: {
      default: "#f6f8fc",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Montserrat, system-ui, sans-serif",
    fontWeightRegular: 500,
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme: themeValue }) => ({
          borderRadius: themeValue.shape.borderRadius,
          fontWeight: 600,
          letterSpacing: "0.01em",
          textTransform: "none",
        }),
        contained: {
          boxShadow: "0 12px 18px -16px rgba(15, 23, 42, 0.6)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme: themeValue }) => ({
          borderRadius: themeValue.shape.borderRadius,
          fontSize: "0.875rem",
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme: themeValue }) => ({
          borderRadius: themeValue.shape.borderRadius * 1.25,
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: themeValue }) => ({
          borderRadius: themeValue.shape.borderRadius,
          backgroundColor: "#ffffff",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(11, 44, 74, 0.35)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(11, 44, 74, 0.5)",
            borderWidth: 1,
          },
        }),
        notchedOutline: {
          borderColor: "rgba(15, 23, 42, 0.12)",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme: themeValue }) => ({
          border: "none",
          color: themeValue.palette.text.primary,
          fontSize: "0.875rem",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgba(11, 44, 74, 0.05)",
            color: themeValue.palette.text.primary,
            borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
          },
          "& .MuiDataGrid-columnSeparator": {
            display: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(11, 44, 74, 0.04)",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid rgba(15, 23, 42, 0.08)",
          },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
            outline: "none",
          },
          "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
            outline: "none",
          },
        }),
      },
    },
  },
});

export default theme;
