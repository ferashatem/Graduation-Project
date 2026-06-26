import { useMemo } from "react";
import { Breadcrumbs, Typography, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

function PageHeader({ title, breadcrumbs = [], action }) {
  const crumbs = useMemo(
    () => (Array.isArray(breadcrumbs) ? breadcrumbs : []),
    [breadcrumbs]
  );

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <Typography variant="h5" className="text-slate-800">
          {title}
        </Typography>
        {crumbs.length > 0 && (
          <Breadcrumbs aria-label="breadcrumb">
            {crumbs.map((crumb, index) => {
              const key = crumb.key || `${crumb.label}-${index}`;
              if (crumb.to) {
                return (
                  <MuiLink
                    key={key}
                    component={RouterLink}
                    to={crumb.to}
                    underline="hover"
                    color="inherit"
                  >
                    {crumb.label}
                  </MuiLink>
                );
              }
              return (
                <Typography key={key} color="text.primary">
                  {crumb.label}
                </Typography>
              );
            })}
          </Breadcrumbs>
        )}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default PageHeader;
