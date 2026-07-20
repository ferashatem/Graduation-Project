import { Pagination } from "@mui/material";

function ComplaintsPagination({ totalCount, page, pageSize, onPageChange }) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-slate-400">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
      </p>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, p) => onPageChange(p)}
        size="small"
        shape="rounded"
      />
    </div>
  );
}

export default ComplaintsPagination;
