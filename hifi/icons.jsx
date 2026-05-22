// ── UniSys Icon Library ─────────────────────────────────────────────────────
// Heroicons-style 24px outline SVGs

const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.6, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const IconFill = ({ d, size = 20, color = 'currentColor', ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...rest}>
    <path d={d} />
  </svg>
);

// Navigation
const IHome       = (p) => <Icon {...p} d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />;
const IUsers      = (p) => <Icon {...p} d={["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 11a4 4 0 100-8 4 4 0 000 8z","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"]} />;
const IUser       = (p) => <Icon {...p} d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8z"]} />;
const IBook       = (p) => <Icon {...p} d={["M4 19.5A2.5 2.5 0 016.5 17H20","M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"]} />;
const ICalendar   = (p) => <Icon {...p} d={["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"]} />;
const IBell       = (p) => <Icon {...p} d={["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 01-3.46 0"]} />;
const ISettings   = (p) => <Icon {...p} d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />;
const ILogout     = (p) => <Icon {...p} d={["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"]} />;
const IBuilding   = (p) => <Icon {...p} d={["M3 21h18","M4 21V7l8-4 8 4v14","M9 21V12h6v9","M9 9h1m5 0h1M9 13h1m5 0h1"]} />;
const IBarChart   = (p) => <Icon {...p} d={["M18 20V10","M12 20V4","M6 20v-6"]} />;
const ILayers     = (p) => <Icon {...p} d={["M12 2L2 7l10 5 10-5-10-5z","M2 17l10 5 10-5","M2 12l10 5 10-5"]} />;
const IGrid       = (p) => <Icon {...p} d={["M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"]} />;
const IClipboard  = (p) => <Icon {...p} d={["M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2","M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z"]} />;
const IShield     = (p) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;

// Actions
const ISearch     = (p) => <Icon {...p} d={["M11 19a8 8 0 100-16 8 8 0 000 16z","M21 21l-4.35-4.35"]} />;
const IPlus       = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const IEdit       = (p) => <Icon {...p} d={["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"]} />;
const ITrash      = (p) => <Icon {...p} d={["M3 6h18","M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"]} />;
const IDownload   = (p) => <Icon {...p} d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M7 10l5 5 5-5","M12 15V3"]} />;
const IUpload     = (p) => <Icon {...p} d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]} />;
const IFilter     = (p) => <Icon {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
const ICheck      = (p) => <Icon {...p} d="M20 6L9 17l-5-5" />;
const IClose      = (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12" />;
const IChevronD   = (p) => <Icon {...p} d="M6 9l6 6 6-6" />;
const IChevronR   = (p) => <Icon {...p} d="M9 18l6-6-6-6" />;
const IChevronL   = (p) => <Icon {...p} d="M15 18l-6-6 6-6" />;
const IMoreV      = (p) => <Icon {...p} d="M12 5a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 21a1 1 0 110-2 1 1 0 010 2z" strokeWidth={2.5} />;
const ISend       = (p) => <Icon {...p} d={["M22 2L11 13","M22 2L15 22l-4-9-9-4 20-7z"]} />;
const ISparkle    = (p) => <Icon {...p} d={["M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"]} />;
const IEye        = (p) => <Icon {...p} d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 15a3 3 0 100-6 3 3 0 000 6z"]} />;
const IFileText   = (p) => <Icon {...p} d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]} />;
const IAlertCircle= (p) => <Icon {...p} d={["M12 22a10 10 0 100-20 10 10 0 000 20z","M12 8v4","M12 16h.01"]} />;
const IClock      = (p) => <Icon {...p} d={["M12 22a10 10 0 100-20 10 10 0 000 20z","M12 6v6l4 2"]} />;
const IGraduate   = (p) => <Icon {...p} d={["M22 10v6M2 10l10-5 10 5-10 5z","M6 12v5c3 3 9 3 12 0v-5"]} />;
const IActivity   = (p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />;
const IMapPin     = (p) => <Icon {...p} d={["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z","M12 13a3 3 0 100-6 3 3 0 000 6z"]} />;
const IKey        = (p) => <Icon {...p} d={["M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"]} />;
const IMessage    = (p) => <Icon {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
const ITrendUp    = (p) => <Icon {...p} d={["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"]} />;
const ITrendDown  = (p) => <Icon {...p} d={["M23 18l-9.5-9.5-5 5L1 6","M17 18h6v-6"]} />;
const ISun        = (p) => <Icon {...p} d={["M12 17a5 5 0 100-10 5 5 0 000 10z","M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"]} />;
const IMoon       = (p) => <Icon {...p} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />;
const IMenu       = (p) => <Icon {...p} d="M3 12h18M3 6h18M3 18h18" />;
const IRefresh    = (p) => <Icon {...p} d={["M1 4v6h6","M23 20v-6h-6","M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"]} />;

// Export all to window
window.Icons = {
  Home: IHome, Users: IUsers, User: IUser, Book: IBook, Calendar: ICalendar,
  Bell: IBell, Settings: ISettings, Logout: ILogout, Building: IBuilding,
  BarChart: IBarChart, Layers: ILayers, Grid: IGrid, Clipboard: IClipboard,
  Shield: IShield, Search: ISearch, Plus: IPlus, Edit: IEdit, Trash: ITrash,
  Download: IDownload, Upload: IUpload, Filter: IFilter, Check: ICheck,
  Close: IClose, ChevronD: IChevronD, ChevronR: IChevronR, ChevronL: IChevronL,
  MoreV: IMoreV, Send: ISend, Sparkle: ISparkle, Eye: IEye, FileText: IFileText,
  AlertCircle: IAlertCircle, Clock: IClock, Graduate: IGraduate, Activity: IActivity,
  MapPin: IMapPin, Key: IKey, Message: IMessage, TrendUp: ITrendUp,
  TrendDown: ITrendDown, Sun: ISun, Moon: IMoon, Menu: IMenu, Refresh: IRefresh,
};
