import apiClient from "../../../api/apiClient";

export const analyzeDeletion = async (entityName, entityId) => {
  const res = await apiClient.post("/deletion/analyze", { entityName, entityId });
  return res.data?.data ?? res.data;
};

export const executeDeletion = async ({
  entityName,
  entityId,
  typedConfirmationPhrase,
  adminPassword,
  secondAdminApprovalToken = null,
}) => {
  const res = await apiClient.post("/deletion/execute", {
    entityName,
    entityId,
    typedConfirmationPhrase,
    adminPassword,
    secondAdminApprovalToken,
  });
  return res.data?.data ?? res.data;
};
