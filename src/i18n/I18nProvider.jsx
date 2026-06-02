import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getDirection } from "./config";
import { buildTheme } from "../theme/muiTheme";

// One emotion cache per direction. The RTL cache runs the rtl plugin so MUI's
// generated styles (margins, paddings, positions…) are mirrored automatically.
const ltrCache = createCache({ key: "mui-ltr", stylisPlugins: [prefixer] });
const rtlCache = createCache({
  key: "mui-rtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export default function I18nProvider({ children }) {
  const { i18n } = useTranslation();
  const dir = getDirection(i18n.language);

  // Keep <html> in sync so Tailwind's rtl: variants and native bidi work.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", i18n.language);
  }, [dir, i18n.language]);

  const theme = useMemo(() => buildTheme(dir), [dir]);
  const cache = dir === "rtl" ? rtlCache : ltrCache;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
