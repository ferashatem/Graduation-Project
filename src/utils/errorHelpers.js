const DB_ERROR_MAP = [
  { match: /duplicate key.*IX_SubjectOfferings_SubjectId_SemesterId/i, msg: "This subject is already offered in this semester. Each subject can only be offered once per semester." },
  { match: /duplicate key.*IX_SubjectOfferings/i, msg: "A subject offering with these details already exists." },
  { match: /duplicate key/i, msg: "This record already exists. Please check for duplicates." },
  { match: /violates foreign key/i, msg: "One of the selected values is invalid or has been deleted." },
  { match: /23505/i, msg: "This record already exists. Please check for duplicates." },
  { match: /23503/i, msg: "One of the selected values is invalid or has been deleted." },
];

const friendlyDbError = (raw) => {
  for (const { match, msg } of DB_ERROR_MAP) {
    if (match.test(raw)) return msg;
  }
  return null;
};

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (!error) return fallback;
  if (typeof error === "string") return friendlyDbError(error) ?? error;

  const data = error.response?.data;
  if (data) {
    // Standard API wrapper: { message: "..." }
    if (data.message && data.message !== "Request successful.") {
      return friendlyDbError(data.message) ?? data.message;
    }
    // ASP.NET Core ValidationProblemDetails (bypasses wrapper filter): { title, errors }
    if (data.errors) {
      const firstErrors = Object.values(data.errors).flat();
      if (firstErrors.length > 0) return friendlyDbError(firstErrors[0]) ?? firstErrors[0];
    }
    if (data.title) return friendlyDbError(data.title) ?? data.title;
    // Plain string body
    if (typeof data === "string" && data.length > 0) return friendlyDbError(data) ?? data;
  }

  if (error.message) return friendlyDbError(error.message) ?? error.message;
  return fallback;
};
