export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  // Extract API response body message (axios errors)
  const apiMessage = error.response?.data?.message;
  if (apiMessage) return apiMessage;
  if (error.message) return error.message;
  return fallback;
};
