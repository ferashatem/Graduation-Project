import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, Menu, MenuItem, ListItemText, Tooltip } from "@mui/material";
import { HiOutlineGlobeAlt, HiCheck } from "react-icons/hi";
import { SUPPORTED_LANGUAGES } from "../../i18n/config";

/**
 * Professional language switcher.
 * `variant="icon"` (default) renders a globe icon button — good for headers.
 * `variant="text"` renders the current language label — good for menus.
 */
export default function LanguageSwitcher({ variant = "icon", className = "" }) {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ??
    SUPPORTED_LANGUAGES[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setAnchorEl(null);
  };

  return (
    <>
      {variant === "text" ? (
        <button
          type="button"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 ${className}`}
        >
          <HiOutlineGlobeAlt className="h-5 w-5" />
          {current.nativeLabel}
        </button>
      ) : (
        <Tooltip title={t("common.language", "Language")}>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            className={className}
            aria-label={t("common.language", "Language")}
          >
            <HiOutlineGlobeAlt size={20} />
          </IconButton>
        </Tooltip>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <MenuItem
            key={lng.code}
            selected={lng.code === current.code}
            onClick={() => handleSelect(lng.code)}
            sx={{ minWidth: 160, gap: 1.5 }}
          >
            <ListItemText
              primary={lng.nativeLabel}
              secondary={lng.label}
              primaryTypographyProps={{ fontWeight: 600 }}
            />
            {lng.code === current.code && (
              <HiCheck size={16} style={{ color: "#059669" }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
