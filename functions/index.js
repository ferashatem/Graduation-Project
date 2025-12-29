/*
Cloud Functions callable user management with role-based access controls.
Admins are limited to professor/assistant/student to prevent privilege escalation.
Client-side before calling: await auth.currentUser.getIdToken(true);
*/
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const VALID_ROLES = ["super_admin", "admin", "professor", "assistant", "student"];
const ADMIN_ALLOWED_ROLES = ["professor", "assistant", "student"];
const GLOBAL_ADMIN_ROLES = ["super_admin", "globaladmin"];
const DEPARTMENT_ADMIN_ROLES = ["admin", "departmentadmin"];
const ASSISTANT_ELIGIBLE_ROLES = ["assistant", "ta"];
const PROFESSOR_ROLE = "professor";

const normalizeRole = (role) => (role ? String(role).trim().toLowerCase() : "");

const assertAuthenticated = (request) => {
  if (!request.auth) {
    logger.warn("Unauthenticated callable request.");
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
};

const getCallerRole = (request) => normalizeRole(request.auth.token.role);

const isGlobalAdmin = (role) => GLOBAL_ADMIN_ROLES.includes(role);
const isDepartmentAdmin = (role) => DEPARTMENT_ADMIN_ROLES.includes(role);

const getCallerDepartmentId = (request) =>
  request.auth?.token?.departmentId ||
  request.auth?.token?.department_id ||
  request.auth?.token?.department ||
  "";

const logPermissionDenied = (request, callerRole, reason) => {
  logger.warn(
    `Permission denied: Caller UID ${request.auth?.uid || "unknown"} Role ${
      callerRole || "none"
    } ${reason}`
  );
};

const assertCallerIsAdminOrSuperAdmin = (request, callerRole, action) => {
  if (callerRole === "super_admin" || callerRole === "admin") {
    return;
  }
  logPermissionDenied(request, callerRole, `Action ${action}`);
  throw new HttpsError(
    "permission-denied",
    `Only Super Admins or Admins can ${action} users.`
  );
};

const assertAdminAllowedRole = (request, callerRole, role, action) => {
  if (callerRole !== "admin") {
    return;
  }
  if (ADMIN_ALLOWED_ROLES.includes(role)) {
    return;
  }
  logPermissionDenied(
    request,
    callerRole,
    `Action ${action} Role ${role || "unknown"}`
  );
  throw new HttpsError(
    "permission-denied",
    "Admins can only manage professor, assistant, or student accounts."
  );
};

const assertAssignmentAccess = (request, callerRole, action) => {
  if (isGlobalAdmin(callerRole) || isDepartmentAdmin(callerRole)) {
    return;
  }
  logPermissionDenied(request, callerRole, `Action ${action}`);
  throw new HttpsError(
    "permission-denied",
    "Only global or department admins can manage course offerings."
  );
};

const assertDepartmentScope = (request, callerRole, departmentId, action) => {
  if (!isDepartmentAdmin(callerRole)) {
    return;
  }
  const callerDepartmentId = getCallerDepartmentId(request);
  if (!callerDepartmentId) {
    logPermissionDenied(request, callerRole, `Action ${action} missing department`);
    throw new HttpsError(
      "permission-denied",
      "Department admin is missing department scope."
    );
  }
  if (callerDepartmentId !== departmentId) {
    logPermissionDenied(request, callerRole, `Action ${action} department mismatch`);
    throw new HttpsError(
      "permission-denied",
      "Department admins can only manage their own department."
    );
  }
};

const getTargetRole = async (uid) => {
  let role = "";

  try {
    const userRecord = await admin.auth().getUser(uid);
    role = normalizeRole(userRecord?.customClaims?.role);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  if (!role) {
    const snapshot = await admin.firestore().collection("users").doc(uid).get();
    if (snapshot.exists) {
      role = normalizeRole(snapshot.data()?.role);
    }
  }

  return role;
};

const throwAsHttpsError = (error) => {
  if (error instanceof HttpsError) {
    throw error;
  }
  const code = String(error?.code || "");
  if (code.startsWith("auth/")) {
    throw new HttpsError("invalid-argument", error.message || "Invalid request.");
  }
  throw new HttpsError("invalid-argument", error?.message || "Invalid request.");
};

exports.createUserWithRole = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action createUserWithRole`
  );

  assertCallerIsAdminOrSuperAdmin(request, callerRole, "create");

  const { email, password, displayName, role } = request.data || {};
  const normalizedRole = normalizeRole(role);
  const trimmedEmail = String(email || "").trim();

  if (!trimmedEmail || !password || !normalizedRole) {
    throw new HttpsError(
      "invalid-argument",
      "email, password, and role are required."
    );
  }

  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  assertAdminAllowedRole(request, callerRole, normalizedRole, "create");

  try {
    const userRecord = await admin.auth().createUser({
      email: trimmedEmail,
      password: String(password),
      displayName: displayName ? String(displayName).trim() : undefined,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: normalizedRole,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: trimmedEmail,
        displayName: displayName ? String(displayName).trim() : "",
        role: normalizedRole,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info(
      `Successfully created user ${userRecord.uid} with role ${normalizedRole}`
    );

    return {
      uid: userRecord.uid,
      email: userRecord.email || trimmedEmail,
      message: "User created successfully.",
    };
  } catch (error) {
    logger.error("Create user error:", error);
    throwAsHttpsError(error);
  }
});

exports.editUserAccount = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action editUserAccount`
  );

  assertCallerIsAdminOrSuperAdmin(request, callerRole, "edit");

  const { uid, email, password, displayName, role } = request.data || {};
  const trimmedUid = String(uid || "").trim();
  const normalizedRole = role !== undefined ? normalizeRole(role) : "";

  if (!trimmedUid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  if (role !== undefined && !normalizedRole) {
    throw new HttpsError("invalid-argument", "role is invalid.");
  }

  if (normalizedRole && !VALID_ROLES.includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  const hasUpdates =
    email !== undefined ||
    password !== undefined ||
    displayName !== undefined ||
    normalizedRole;

  if (!hasUpdates) {
    throw new HttpsError("invalid-argument", "No updates provided.");
  }

  try {
    if (callerRole === "admin") {
      const targetRole = await getTargetRole(trimmedUid);
      assertAdminAllowedRole(request, callerRole, targetRole, "edit");
      if (normalizedRole) {
        assertAdminAllowedRole(request, callerRole, normalizedRole, "assign");
      }
    }

    const authUpdate = {};
    const fsUpdate = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      if (!trimmedEmail) {
        throw new HttpsError("invalid-argument", "email is required.");
      }
      authUpdate.email = trimmedEmail;
      fsUpdate.email = trimmedEmail;
    }

    if (password !== undefined) {
      const nextPassword = String(password);
      if (!nextPassword) {
        throw new HttpsError("invalid-argument", "password is required.");
      }
      authUpdate.password = nextPassword;
    }

    if (displayName !== undefined) {
      const nextDisplayName = String(displayName).trim();
      authUpdate.displayName = nextDisplayName;
      fsUpdate.displayName = nextDisplayName;
    }

    if (Object.keys(authUpdate).length > 0) {
      await admin.auth().updateUser(trimmedUid, authUpdate);
    }

    if (normalizedRole) {
      await admin.auth().setCustomUserClaims(trimmedUid, {
        role: normalizedRole,
      });
      fsUpdate.role = normalizedRole;
    }

    await admin.firestore().collection("users").doc(trimmedUid).set(fsUpdate, {
      merge: true,
    });

    logger.info(`Successfully updated user ${trimmedUid}`);

    return { uid: trimmedUid, message: "User updated successfully." };
  } catch (error) {
    logger.error("Edit user error:", error);
    throwAsHttpsError(error);
  }
});

exports.deleteUserAccount = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action deleteUserAccount`
  );

  assertCallerIsAdminOrSuperAdmin(request, callerRole, "delete");

  const { uid } = request.data || {};
  const trimmedUid = String(uid || "").trim();

  if (!trimmedUid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  try {
    if (callerRole === "admin") {
      const targetRole = await getTargetRole(trimmedUid);
      assertAdminAllowedRole(request, callerRole, targetRole, "delete");
    }

    await admin.auth().deleteUser(trimmedUid);
    await admin.firestore().collection("users").doc(trimmedUid).delete();

    logger.info(`Successfully deleted user ${trimmedUid}`);

    return { uid: trimmedUid, message: "User deleted successfully." };
  } catch (error) {
    logger.error("Delete user error:", error);
    throwAsHttpsError(error);
  }
});

exports.listOfferings = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action listOfferings`
  );
  assertAssignmentAccess(request, callerRole, "list offerings");

  const { courseId, termId } = request.data || {};
  const trimmedCourseId = String(courseId || "").trim();
  const trimmedTermId = termId ? String(termId).trim() : "";

  if (!trimmedCourseId) {
    throw new HttpsError("invalid-argument", "courseId is required.");
  }

  try {
    let queryRef = admin
      .firestore()
      .collection("courseOfferings")
      .where("courseId", "==", trimmedCourseId);

    if (trimmedTermId) {
      queryRef = queryRef.where("termId", "==", trimmedTermId);
    }

    if (isDepartmentAdmin(callerRole)) {
      const callerDepartmentId = getCallerDepartmentId(request);
      if (!callerDepartmentId) {
        throw new HttpsError(
          "permission-denied",
          "Department admin is missing department scope."
        );
      }
      queryRef = queryRef.where("departmentId", "==", callerDepartmentId);
    }

    const snapshot = await queryRef.get();
    const offerings = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return { offerings };
  } catch (error) {
    logger.error("List offerings error:", error);
    throwAsHttpsError(error);
  }
});

exports.createOffering = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action createOffering`
  );
  assertAssignmentAccess(request, callerRole, "create offerings");

  const {
    courseId,
    departmentId,
    termId,
    termName,
    sectionCode,
    capacity,
  } = request.data || {};

  const trimmedCourseId = String(courseId || "").trim();
  const trimmedDepartmentId = String(departmentId || "").trim();
  const trimmedTermId = String(termId || "").trim();
  const trimmedTermName = String(termName || "").trim();
  const normalizedSectionCode = String(sectionCode || "").trim().toUpperCase();

  if (
    !trimmedCourseId ||
    !trimmedDepartmentId ||
    !trimmedTermId ||
    !trimmedTermName ||
    !normalizedSectionCode
  ) {
    throw new HttpsError(
      "invalid-argument",
      "courseId, departmentId, termId, termName, and sectionCode are required."
    );
  }

  assertDepartmentScope(
    request,
    callerRole,
    trimmedDepartmentId,
    "create offering"
  );

  let capacityValue;
  if (capacity !== undefined && capacity !== null && String(capacity).trim()) {
    const parsed = Number(capacity);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new HttpsError(
        "invalid-argument",
        "capacity must be a positive number."
      );
    }
    capacityValue = parsed;
  }

  const offeringRef = admin.firestore().collection("courseOfferings").doc();
  const payload = {
    courseId: trimmedCourseId,
    departmentId: trimmedDepartmentId,
    termId: trimmedTermId,
    termName: trimmedTermName,
    sectionCode: normalizedSectionCode,
    assistantIds: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: request.auth.uid,
  };

  if (capacityValue !== undefined) {
    payload.capacity = capacityValue;
  }

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const duplicateQuery = admin
        .firestore()
        .collection("courseOfferings")
        .where("courseId", "==", trimmedCourseId)
        .where("termId", "==", trimmedTermId)
        .where("sectionCode", "==", normalizedSectionCode)
        .limit(1);

      const duplicateSnap = await transaction.get(duplicateQuery);
      if (!duplicateSnap.empty) {
        throw new HttpsError(
          "already-exists",
          "An offering already exists for this course, term, and section."
        );
      }

      transaction.set(offeringRef, payload);
    });

    logger.info(
      `Created offering ${offeringRef.id} for course ${trimmedCourseId}`
    );

    return {
      offering: {
        id: offeringRef.id,
        courseId: trimmedCourseId,
        departmentId: trimmedDepartmentId,
        termId: trimmedTermId,
        termName: trimmedTermName,
        sectionCode: normalizedSectionCode,
        capacity: capacityValue,
        professorId: null,
        assistantIds: [],
      },
    };
  } catch (error) {
    logger.error("Create offering error:", error);
    throwAsHttpsError(error);
  }
});

exports.assignInstructor = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action assignInstructor`
  );
  assertAssignmentAccess(request, callerRole, "assign instructors");

  const { offeringId, userId, role } = request.data || {};
  const trimmedOfferingId = String(offeringId || "").trim();
  const trimmedUserId = String(userId || "").trim();
  const normalizedRole = normalizeRole(role);

  if (!trimmedOfferingId || !trimmedUserId || !normalizedRole) {
    throw new HttpsError(
      "invalid-argument",
      "offeringId, userId, and role are required."
    );
  }

  if (!["professor", "assistant"].includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "role must be professor or assistant.");
  }

  if (request.auth.uid === trimmedUserId) {
    throw new HttpsError(
      "permission-denied",
      "You cannot assign yourself to a course offering."
    );
  }

  const targetRole = await getTargetRole(trimmedUserId);
  if (!targetRole) {
    throw new HttpsError("invalid-argument", "Target user not found.");
  }
  if (normalizedRole === PROFESSOR_ROLE && targetRole !== PROFESSOR_ROLE) {
    throw new HttpsError("invalid-argument", "User is not a professor.");
  }
  if (
    normalizedRole === "assistant" &&
    !ASSISTANT_ELIGIBLE_ROLES.includes(targetRole)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "User is not eligible to be assigned as assistant."
    );
  }

  const offeringRef = admin.firestore().collection("courseOfferings").doc(trimmedOfferingId);
  const auditRef = admin.firestore().collection("auditLogs").doc();
  let updatedOffering = null;

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const offeringSnap = await transaction.get(offeringRef);
      if (!offeringSnap.exists) {
        throw new HttpsError("not-found", "Offering not found.");
      }

      const offering = offeringSnap.data();
      assertDepartmentScope(
        request,
        callerRole,
        String(offering?.departmentId || ""),
        "assign instructor"
      );

      const assistantIds = Array.isArray(offering.assistantIds)
        ? [...offering.assistantIds]
        : [];

      const updatePayload = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid,
      };

      if (normalizedRole === PROFESSOR_ROLE) {
        if (offering.professorId) {
          throw new HttpsError(
            "already-exists",
            "A professor is already assigned to this offering."
          );
        }
        updatePayload.professorId = trimmedUserId;
        updatedOffering = {
          ...offering,
          professorId: trimmedUserId,
          assistantIds,
        };
      } else {
        if (!assistantIds.includes(trimmedUserId)) {
          assistantIds.push(trimmedUserId);
        }
        updatePayload.assistantIds = assistantIds;
        updatedOffering = {
          ...offering,
          assistantIds,
        };
      }

      transaction.update(offeringRef, updatePayload);
      transaction.set(auditRef, {
        entityType: "courseOfferingAssignment",
        offeringId: trimmedOfferingId,
        courseId: offering.courseId,
        action: "ASSIGN",
        targetUserId: trimmedUserId,
        targetRole: normalizedRole === PROFESSOR_ROLE ? "professor" : "assistant",
        performedBy: request.auth.uid,
        performedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          termId: offering.termId,
          termName: offering.termName,
          sectionCode: offering.sectionCode,
          departmentId: offering.departmentId,
        },
      });
    });

    return {
      offering: updatedOffering
        ? { id: trimmedOfferingId, ...updatedOffering }
        : { id: trimmedOfferingId },
    };
  } catch (error) {
    logger.error("Assign instructor error:", error);
    throwAsHttpsError(error);
  }
});

exports.unassignInstructor = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action unassignInstructor`
  );
  assertAssignmentAccess(request, callerRole, "unassign instructors");

  const { offeringId, userId, role } = request.data || {};
  const trimmedOfferingId = String(offeringId || "").trim();
  const trimmedUserId = String(userId || "").trim();
  const normalizedRole = normalizeRole(role);

  if (!trimmedOfferingId || !trimmedUserId || !normalizedRole) {
    throw new HttpsError(
      "invalid-argument",
      "offeringId, userId, and role are required."
    );
  }

  if (!["professor", "assistant"].includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "role must be professor or assistant.");
  }

  if (request.auth.uid === trimmedUserId) {
    throw new HttpsError(
      "permission-denied",
      "You cannot unassign yourself from a course offering."
    );
  }

  const offeringRef = admin.firestore().collection("courseOfferings").doc(trimmedOfferingId);
  const auditRef = admin.firestore().collection("auditLogs").doc();
  let updatedOffering = null;

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const offeringSnap = await transaction.get(offeringRef);
      if (!offeringSnap.exists) {
        throw new HttpsError("not-found", "Offering not found.");
      }

      const offering = offeringSnap.data();
      assertDepartmentScope(
        request,
        callerRole,
        String(offering?.departmentId || ""),
        "unassign instructor"
      );

      const assistantIds = Array.isArray(offering.assistantIds)
        ? [...offering.assistantIds]
        : [];

      const updatePayload = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid,
      };

      if (normalizedRole === PROFESSOR_ROLE) {
        if (offering.professorId !== trimmedUserId) {
          throw new HttpsError(
            "already-exists",
            "Professor assignment does not match the selected user."
          );
        }
        updatePayload.professorId = null;
        updatedOffering = {
          ...offering,
          professorId: null,
          assistantIds,
        };
      } else {
        const nextAssistantIds = assistantIds.filter((id) => id !== trimmedUserId);
        updatePayload.assistantIds = nextAssistantIds;
        updatedOffering = {
          ...offering,
          assistantIds: nextAssistantIds,
        };
      }

      transaction.update(offeringRef, updatePayload);
      transaction.set(auditRef, {
        entityType: "courseOfferingAssignment",
        offeringId: trimmedOfferingId,
        courseId: offering.courseId,
        action: "UNASSIGN",
        targetUserId: trimmedUserId,
        targetRole: normalizedRole === PROFESSOR_ROLE ? "professor" : "assistant",
        performedBy: request.auth.uid,
        performedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          termId: offering.termId,
          termName: offering.termName,
          sectionCode: offering.sectionCode,
          departmentId: offering.departmentId,
        },
      });
    });

    return {
      offering: updatedOffering
        ? { id: trimmedOfferingId, ...updatedOffering }
        : { id: trimmedOfferingId },
    };
  } catch (error) {
    logger.error("Unassign instructor error:", error);
    throwAsHttpsError(error);
  }
});
