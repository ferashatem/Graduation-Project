/*
Cloud Functions callable user management with role-based access controls.
Admins are limited to professor/assistant/student to prevent privilege escalation.
Client-side before calling: await auth.currentUser.getIdToken(true);
*/
const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const VALID_ROLES = ["super_admin", "admin", "professor", "assistant", "student"];
const ADMIN_ALLOWED_ROLES = ["professor", "assistant", "student"];
const GLOBAL_ADMIN_ROLES = ["super_admin", "globaladmin"];
const DEPARTMENT_ADMIN_ROLES = ["admin", "departmentadmin"];
const ASSISTANT_ELIGIBLE_ROLES = ["assistant", "ta"];
const PROFESSOR_ROLE = "professor";
const ASSISTANT_ROLE = "assistant";
const ASSIGNMENT_COLLECTION = "assignments";
const COURSE_ASSIGNMENTS_COLLECTION = "courseAssignments";
const PROF_COURSES_COLLECTION = "prof_courses";
const ASSISTANT_COURSES_COLLECTION = "assistant_courses";
const AI_CONVERSATIONS_COLLECTION = "ai_conversations";
const ROLE_COLLECTIONS = {
  super_admin: "super_admins",
  admin: "admins",
  professor: "profs",
  assistant: "assistants",
  student: "students",
};
const ROLE_COLLECTION_ROOT = "roles";

const ROLE_ALIASES = {
  superadmin: "super_admin",
  "super-admin": "super_admin",
  "super admin": "super_admin",
  admins: "admin",
  prof: "professor",
  profs: "professor",
  professors: "professor",
  assistants: "assistant",
  ta: "assistant",
  tas: "assistant",
  students: "student",
  "global admin": "globaladmin",
  "global_admin": "globaladmin",
  "department admin": "departmentadmin",
  "department_admin": "departmentadmin",
};

const E164_REGEX = /^\+[1-9]\d{1,14}$/;
const ATTENDANCE_STATUSES = ["present", "late", "absent", "excused"];
const INSTRUCTOR_ROLES = ["super_admin", "admin", "professor", "assistant"];

const normalizeRole = (role) => {
  if (!role) return "";
  const cleaned = String(role).trim().toLowerCase();
  return ROLE_ALIASES[cleaned] || cleaned;
};
const normalizeValue = (value) =>
  value === null || value === undefined ? "" : String(value).trim();
const normalizeAttendanceStatus = (status) =>
  normalizeValue(status).toLowerCase();
const toNonNegativeInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
};
const normalizeIdArray = (values) => {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map(normalizeValue).filter(Boolean)));
};
const normalizeSection = (section) => normalizeValue(section).toUpperCase();
const buildOfferingId = ({ courseId, termId, yearLevel, section }) =>
  `${courseId}__${termId}__Y${yearLevel}__S${section}`;
const getRoleCollectionName = (role) => ROLE_COLLECTIONS[normalizeRole(role)] || "";
const getRoleUserDocRef = (uid, role) => {
  const collectionName = getRoleCollectionName(role);
  if (!collectionName) return null;
  return admin
    .firestore()
    .collection("users")
    .doc(ROLE_COLLECTION_ROOT)
    .collection(collectionName)
    .doc(uid);
};

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

const assertInstructorOrAdmin = (request, callerRole, action) => {
  if (INSTRUCTOR_ROLES.includes(callerRole)) {
    return;
  }
  logPermissionDenied(request, callerRole, `Action ${action}`);
  throw new HttpsError(
    "permission-denied",
    "Only instructors or admins can manage attendance."
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

const assertCallerIsAdminOrSuperAdminForAssignments = (
  request,
  callerRole,
  action
) => {
  if (callerRole === "super_admin" || callerRole === "admin") {
    return;
  }
  logPermissionDenied(request, callerRole, `Action ${action}`);
  throw new HttpsError(
    "permission-denied",
    "Only Super Admins or Admins can manage assignments."
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

const getUserProfile = async (uid) => {
  const trimmedUid = normalizeValue(uid);
  if (!trimmedUid) return null;

  let authRecord = null;
  try {
    authRecord = await admin.auth().getUser(trimmedUid);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  const snapshot = await admin.firestore().collection("users").doc(trimmedUid).get();
  const data = snapshot.exists ? snapshot.data() : null;
  const role = normalizeRole(authRecord?.customClaims?.role || data?.role);

  if (!authRecord && !snapshot.exists) {
    return null;
  }

  return {
    uid: trimmedUid,
    role,
    displayName: String(
      data?.name || data?.displayName || authRecord?.displayName || ""
    ),
    email: String(data?.email || authRecord?.email || ""),
  };
};

const buildUserSummary = (profile) => ({
  uid: profile.uid,
  displayName: profile.displayName || "",
  email: profile.email || "",
});

const resolveCourseName = (data) =>
  normalizeValue(data?.CourseName || data?.courseName || data?.courseLabel) ||
  "Course";

const buildProfCoursePayload = (assignmentId, profUid, data) => ({
  assignmentId,
  courseId: normalizeValue(data?.courseId),
  courseName: resolveCourseName(data),
  termId: normalizeValue(data?.termId),
  collegeId: normalizeValue(data?.collegeId),
  collegeName: normalizeValue(data?.collegeName),
  collegeCode: normalizeValue(data?.collegeCode),
  professorId: normalizeValue(profUid),
  assistantIds: normalizeIdArray(data?.assistantIds),
  createdAt: data?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
  createdBy: normalizeValue(data?.createdBy),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const buildAssistantCoursePayload = (assignmentId, assistantUid, data) => ({
  assignmentId,
  courseId: normalizeValue(data?.courseId),
  courseName: resolveCourseName(data),
  termId: normalizeValue(data?.termId),
  collegeId: normalizeValue(data?.collegeId),
  collegeName: normalizeValue(data?.collegeName),
  collegeCode: normalizeValue(data?.collegeCode),
  assistantId: normalizeValue(assistantUid),
  professorIds: normalizeIdArray(data?.professorIds),
  createdAt: data?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
  createdBy: normalizeValue(data?.createdBy),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const chunkArray = (array = [], size = 200) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const upsertProfCourses = async (professorIds, assignmentId, data) => {
  const ids = normalizeIdArray(professorIds);
  if (!ids.length || !assignmentId) return;

  const db = admin.firestore();
  const opsPerProfessor = 2;
  const maxBatchOps = 450;
  const chunkSize = Math.max(1, Math.floor(maxBatchOps / opsPerProfessor));

  const batches = chunkArray(ids, chunkSize);
  const commits = batches.map((batchIds) => {
    const batch = db.batch();
    batchIds.forEach((profUid) => {
      const profRef = db.collection(PROF_COURSES_COLLECTION).doc(profUid);
      const courseRef = profRef.collection("courses").doc(assignmentId);
      const payload = buildProfCoursePayload(assignmentId, profUid, data);
      batch.set(
        profRef,
        {
          professorId: profUid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      batch.set(courseRef, payload, { merge: true });
    });
    return batch.commit();
  });

  await Promise.all(commits);
};

const removeProfCourses = async (professorIds, assignmentId) => {
  const ids = normalizeIdArray(professorIds);
  if (!ids.length || !assignmentId) return;

  const db = admin.firestore();
  const opsPerProfessor = 2;
  const maxBatchOps = 450;
  const chunkSize = Math.max(1, Math.floor(maxBatchOps / opsPerProfessor));

  const batches = chunkArray(ids, chunkSize);
  const commits = batches.map((batchIds) => {
    const batch = db.batch();
    batchIds.forEach((profUid) => {
      const profRef = db.collection(PROF_COURSES_COLLECTION).doc(profUid);
      const courseRef = profRef.collection("courses").doc(assignmentId);
      batch.set(
        profRef,
        {
          professorId: profUid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      batch.delete(courseRef);
    });
    return batch.commit();
  });

  await Promise.all(commits);
};

const upsertAssistantCourses = async (assistantIds, assignmentId, data) => {
  const ids = normalizeIdArray(assistantIds);
  if (!ids.length || !assignmentId) return;

  const db = admin.firestore();
  const opsPerAssistant = 2;
  const maxBatchOps = 450;
  const chunkSize = Math.max(1, Math.floor(maxBatchOps / opsPerAssistant));

  const batches = chunkArray(ids, chunkSize);
  const commits = batches.map((batchIds) => {
    const batch = db.batch();
    batchIds.forEach((assistantUid) => {
      const assistantRef = db
        .collection(ASSISTANT_COURSES_COLLECTION)
        .doc(assistantUid);
      const courseRef = assistantRef.collection("courses").doc(assignmentId);
      const payload = buildAssistantCoursePayload(
        assignmentId,
        assistantUid,
        data
      );
      batch.set(
        assistantRef,
        {
          assistantId: assistantUid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      batch.set(courseRef, payload, { merge: true });
    });
    return batch.commit();
  });

  await Promise.all(commits);
};

const removeAssistantCourses = async (assistantIds, assignmentId) => {
  const ids = normalizeIdArray(assistantIds);
  if (!ids.length || !assignmentId) return;

  const db = admin.firestore();
  const opsPerAssistant = 2;
  const maxBatchOps = 450;
  const chunkSize = Math.max(1, Math.floor(maxBatchOps / opsPerAssistant));

  const batches = chunkArray(ids, chunkSize);
  const commits = batches.map((batchIds) => {
    const batch = db.batch();
    batchIds.forEach((assistantUid) => {
      const assistantRef = db
        .collection(ASSISTANT_COURSES_COLLECTION)
        .doc(assistantUid);
      const courseRef = assistantRef.collection("courses").doc(assignmentId);
      batch.set(
        assistantRef,
        {
          assistantId: assistantUid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      batch.delete(courseRef);
    });
    return batch.commit();
  });

  await Promise.all(commits);
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

  const { email, password, name, displayName, role, phoneNumber, phone } =
    request.data || {};
  const normalizedRole = normalizeRole(role);
  const trimmedEmail = String(email || "").trim();
  const trimmedName = normalizeValue(name || displayName);
  const trimmedPhoneNumber = normalizeValue(phoneNumber || phone);

  if (!trimmedEmail || !password || !normalizedRole || !trimmedName) {
    throw new HttpsError(
      "invalid-argument",
      "name, email, password, and role are required."
    );
  }

  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  assertAdminAllowedRole(request, callerRole, normalizedRole, "create");

  const roleCollection = getRoleCollectionName(normalizedRole);
  if (!roleCollection) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  let userRecord = null;

  try {
    userRecord = await admin.auth().createUser({
      email: trimmedEmail,
      password: String(password),
      displayName: trimmedName,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: normalizedRole,
    });

    const userProfile = {
      uid: userRecord.uid,
      name: trimmedName,
      email: trimmedEmail,
      role: normalizedRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (trimmedPhoneNumber) {
      userProfile.phoneNumber = trimmedPhoneNumber;
    }

    const batch = admin.firestore().batch();
    const userDocRef = admin.firestore().collection("users").doc(userRecord.uid);
    const roleDocRef = getRoleUserDocRef(userRecord.uid, normalizedRole);
    if (!roleDocRef) {
      throw new HttpsError("invalid-argument", "The specified role is not valid.");
    }

    batch.set(userDocRef, userProfile);
    batch.set(roleDocRef, userProfile);

    await batch.commit();

    logger.info(
      `Successfully created user ${userRecord.uid} with role ${normalizedRole}`
    );

    return {
      uid: userRecord.uid,
      email: userRecord.email || trimmedEmail,
      name: trimmedName,
      role: normalizedRole,
      message: "User created successfully.",
    };
  } catch (error) {
    if (userRecord?.uid) {
      try {
        await admin.auth().deleteUser(userRecord.uid);
      } catch (cleanupError) {
        logger.warn("Failed to rollback auth user after create error.", cleanupError);
      }
    }
    logger.error("Create user error:", error);
    throwAsHttpsError(error);
  }
});

exports.bulkCreateUsers = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action bulkCreateUsers`
  );

  assertCallerIsAdminOrSuperAdmin(request, callerRole, "bulk create");

  const users = Array.isArray(request.data?.users) ? request.data.users : [];
  if (!users.length) {
    throw new HttpsError(
      "invalid-argument",
      "users must be a non-empty array."
    );
  }

  const results = [];

  for (let index = 0; index < users.length; index += 1) {
    const row = users[index] || {};
    const username = normalizeValue(
      row.username || row.name || row.fullName || row.displayName
    );
    const email = normalizeValue(row.email).toLowerCase();
    const password = normalizeValue(row.password);
    const role = normalizeRole(row.role);
    const phone = normalizeValue(row.phone || row.phoneNumber);

    const result = {
      index,
      email,
      status: "failed",
    };

    let userRecord = null;

    try {
      if (!username || username.length < 2) {
        throw new HttpsError(
          "invalid-argument",
          "username must be at least 2 characters."
        );
      }
      if (!email) {
        throw new HttpsError("invalid-argument", "email is required.");
      }
      if (!password || String(password).length < 6) {
        throw new HttpsError(
          "invalid-argument",
          "password must be at least 6 characters."
        );
      }
      if (!role) {
        throw new HttpsError("invalid-argument", "role is required.");
      }
      if (!VALID_ROLES.includes(role)) {
        throw new HttpsError(
          "invalid-argument",
          "The specified role is not valid."
        );
      }

      assertAdminAllowedRole(request, callerRole, role, "create");

      const warnings = [];
      let phoneNumber = "";

      if (phone) {
        if (E164_REGEX.test(phone)) {
          phoneNumber = phone;
        } else {
          warnings.push("Phone number ignored because it is not in E.164 format.");
        }
      }

      const authPayload = {
        email,
        password: String(password),
        displayName: username,
      };
      if (phoneNumber) {
        authPayload.phoneNumber = phoneNumber;
      }

      userRecord = await admin.auth().createUser(authPayload);

      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role,
      });

      const userProfile = {
        uid: userRecord.uid,
        name: username,
        email,
        role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: request.auth.uid,
      };
      if (phoneNumber) {
        userProfile.phoneNumber = phoneNumber;
      }

      const batch = admin.firestore().batch();
      const userDocRef = admin.firestore().collection("users").doc(userRecord.uid);
      batch.set(userDocRef, userProfile);

      const roleDocRef = getRoleUserDocRef(userRecord.uid, role);
      if (roleDocRef) {
        batch.set(roleDocRef, userProfile);
      }

      await batch.commit();

      result.status = "success";
      result.uid = userRecord.uid;
      if (warnings.length) {
        result.warnings = warnings;
      }
    } catch (error) {
      if (userRecord?.uid) {
        try {
          await admin.auth().deleteUser(userRecord.uid);
        } catch (cleanupError) {
          logger.warn(
            "Failed to rollback auth user after bulk create error.",
            cleanupError
          );
        }
      }

      const errorCode = String(error?.code || "");
      if (errorCode === "auth/email-already-exists") {
        result.error = "Email already exists.";
      } else if (error instanceof HttpsError) {
        result.error = error.message;
      } else if (errorCode.startsWith("auth/")) {
        result.error = error.message || "Invalid request.";
      } else {
        result.error = error?.message || "Failed to create user.";
      }

      logger.warn("Bulk create user failed.", {
        index,
        email,
        error: result.error,
      });
    }

    results.push(result);
  }

  return results;
});

exports.setAttendance = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action setAttendance`
  );

  assertInstructorOrAdmin(request, callerRole, "set attendance");

  const { sessionId, offeringId, studentId, status, method } =
    request.data || {};
  const trimmedSessionId = normalizeValue(sessionId);
  const trimmedOfferingId = normalizeValue(offeringId);
  const trimmedStudentId = normalizeValue(studentId);
  const normalizedStatus = normalizeAttendanceStatus(status);
  const normalizedMethod = normalizeValue(method) || "manual";

  if (!trimmedSessionId || !trimmedStudentId || !trimmedOfferingId) {
    throw new HttpsError(
      "invalid-argument",
      "sessionId, offeringId, and studentId are required."
    );
  }

  if (!ATTENDANCE_STATUSES.includes(normalizedStatus)) {
    throw new HttpsError(
      "invalid-argument",
      `status must be one of: ${ATTENDANCE_STATUSES.join(", ")}.`
    );
  }

  const docId = `${trimmedSessionId}_${trimmedStudentId}`;
  const attendanceRef = admin.firestore().collection("attendance").doc(docId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await admin.firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(attendanceRef);
    const payload = {
      sessionId: trimmedSessionId,
      offeringId: trimmedOfferingId,
      studentId: trimmedStudentId,
      status: normalizedStatus,
      method: normalizedMethod || "manual",
      checkInAt: now,
      updatedAt: now,
    };

    if (!snapshot.exists) {
      payload.createdAt = now;
    }

    transaction.set(attendanceRef, payload, { merge: true });
  });

  return {
    docId,
    sessionId: trimmedSessionId,
    studentId: trimmedStudentId,
    status: normalizedStatus,
  };
});

exports.pushEngagement = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action pushEngagement`
  );

  const {
    sessionId,
    offeringId,
    studentId,
    focusedCount,
    distractedCount,
    awayCount,
    samplesCount,
  } = request.data || {};

  const trimmedSessionId = normalizeValue(sessionId);
  const trimmedOfferingId = normalizeValue(offeringId);
  const trimmedStudentId = normalizeValue(studentId);

  if (!trimmedSessionId || !trimmedStudentId) {
    throw new HttpsError(
      "invalid-argument",
      "sessionId and studentId are required."
    );
  }

  const focusedValue = toNonNegativeInt(focusedCount);
  const distractedValue = toNonNegativeInt(distractedCount);
  const awayValue = toNonNegativeInt(awayCount);
  const computedSamples = focusedValue + distractedValue + awayValue;
  const sampleValue = toNonNegativeInt(samplesCount) || computedSamples;

  if (!sampleValue) {
    throw new HttpsError(
      "invalid-argument",
      "At least one engagement sample is required."
    );
  }

  let resolvedOfferingId = trimmedOfferingId;
  if (!resolvedOfferingId) {
    try {
      const sessionSnap = await admin
        .firestore()
        .collection("sessions")
        .doc(trimmedSessionId)
        .get();
      resolvedOfferingId = normalizeValue(sessionSnap.data()?.offeringId);
    } catch (error) {
      logger.warn("Unable to resolve offeringId for engagement.", error);
    }
  }

  const docId = `${trimmedSessionId}_${trimmedStudentId}`;
  const engagementRef = admin.firestore().collection("engagementAgg").doc(docId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await admin.firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(engagementRef);
    const prev = snapshot.exists ? snapshot.data() : {};

    const nextFocused = (prev.focusedCount || 0) + focusedValue;
    const nextDistracted = (prev.distractedCount || 0) + distractedValue;
    const nextAway = (prev.awayCount || 0) + awayValue;
    const nextSamples = (prev.samplesCount || 0) + sampleValue;
    const focusPct = nextSamples ? nextFocused / nextSamples : 0;
    const awayPct = nextSamples ? nextAway / nextSamples : 0;

    transaction.set(
      engagementRef,
      {
        sessionId: trimmedSessionId,
        offeringId:
          resolvedOfferingId || prev?.offeringId || prev?.offering_id || "",
        studentId: trimmedStudentId,
        samplesCount: nextSamples,
        focusedCount: nextFocused,
        distractedCount: nextDistracted,
        awayCount: nextAway,
        focusPct,
        awayPct,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  return {
    docId,
    sessionId: trimmedSessionId,
    studentId: trimmedStudentId,
    samplesCount: sampleValue,
  };
});

exports.editUserAccount = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action editUserAccount`
  );

  assertCallerIsAdminOrSuperAdmin(request, callerRole, "edit");

  const { uid, email, password, name, displayName, role, phoneNumber, phone } =
    request.data || {};
  const trimmedUid = String(uid || "").trim();
  const normalizedRole = role !== undefined ? normalizeRole(role) : "";
  const hasNameUpdate = name !== undefined || displayName !== undefined;
  const trimmedName = hasNameUpdate ? normalizeValue(name || displayName) : "";
  const hasPhoneUpdate = phoneNumber !== undefined || phone !== undefined;
  const trimmedPhoneNumber = hasPhoneUpdate
    ? normalizeValue(phoneNumber || phone)
    : "";

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
    hasNameUpdate ||
    normalizedRole ||
    hasPhoneUpdate;

  if (!hasUpdates) {
    throw new HttpsError("invalid-argument", "No updates provided.");
  }

  if (hasNameUpdate && !trimmedName) {
    throw new HttpsError("invalid-argument", "name is required.");
  }

  try {
    const existingRole = await getTargetRole(trimmedUid);

    if (callerRole === "admin") {
      if (existingRole) {
        assertAdminAllowedRole(request, callerRole, existingRole, "edit");
      }
      if (normalizedRole) {
        assertAdminAllowedRole(request, callerRole, normalizedRole, "assign");
      }
    }

    const effectiveRole = normalizedRole || existingRole;
    if (!effectiveRole) {
      throw new HttpsError("invalid-argument", "role is required.");
    }

    const roleCollection = getRoleCollectionName(effectiveRole);
    if (!roleCollection) {
      throw new HttpsError("invalid-argument", "The specified role is not valid.");
    }

    const authUpdate = {};
    const profileUpdate = { uid: trimmedUid };

    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      if (!trimmedEmail) {
        throw new HttpsError("invalid-argument", "email is required.");
      }
      authUpdate.email = trimmedEmail;
      profileUpdate.email = trimmedEmail;
    }

    if (password !== undefined) {
      const nextPassword = String(password);
      if (!nextPassword) {
        throw new HttpsError("invalid-argument", "password is required.");
      }
      authUpdate.password = nextPassword;
    }

    if (hasNameUpdate) {
      authUpdate.displayName = trimmedName;
      profileUpdate.name = trimmedName;
    }

    if (hasPhoneUpdate) {
      profileUpdate.phoneNumber = trimmedPhoneNumber
        ? trimmedPhoneNumber
        : admin.firestore.FieldValue.delete();
    }

    if (Object.keys(authUpdate).length > 0) {
      await admin.auth().updateUser(trimmedUid, authUpdate);
    }

    if (normalizedRole) {
      await admin.auth().setCustomUserClaims(trimmedUid, {
        role: normalizedRole,
      });
      profileUpdate.role = normalizedRole;
    }

    const batch = admin.firestore().batch();
    const usersDocRef = admin.firestore().collection("users").doc(trimmedUid);
    batch.set(
      usersDocRef,
      {
        ...profileUpdate,
        role: effectiveRole,
      },
      { merge: true }
    );

    if (existingRole && normalizedRole && existingRole !== normalizedRole) {
      const previousRoleDoc = getRoleUserDocRef(trimmedUid, existingRole);
      if (previousRoleDoc) {
        batch.delete(previousRoleDoc);
      }
    }

    const roleDocRef = getRoleUserDocRef(trimmedUid, effectiveRole);
    if (!roleDocRef) {
      throw new HttpsError("invalid-argument", "The specified role is not valid.");
    }
    batch.set(
      roleDocRef,
      {
        ...profileUpdate,
        role: effectiveRole,
      },
      { merge: true }
    );

    await batch.commit();

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
    const targetRole = await getTargetRole(trimmedUid);
    if (callerRole === "admin" && targetRole) {
      assertAdminAllowedRole(request, callerRole, targetRole, "delete");
    }

    const batch = admin.firestore().batch();
    const userDocRef = admin.firestore().collection("users").doc(trimmedUid);
    batch.delete(userDocRef);

    const roleDocRef = getRoleUserDocRef(trimmedUid, targetRole);
    if (roleDocRef) {
      batch.delete(roleDocRef);
    }

    await batch.commit();
    await admin.auth().deleteUser(trimmedUid);

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

exports.upsertAssignment = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action upsertAssignment`
  );
  assertCallerIsAdminOrSuperAdminForAssignments(
    request,
    callerRole,
    "manage assignments"
  );

  const {
    courseId,
    termId,
    yearLevel,
    section,
    professorId,
    assistantIds,
  } = request.data || {};

  const trimmedCourseId = normalizeValue(courseId);
  const trimmedTermId = normalizeValue(termId);
  const trimmedSection = normalizeSection(section);
  const trimmedProfessorId = normalizeValue(professorId);
  const trimmedYearLevel = normalizeValue(yearLevel);
  const parsedYearLevel = Number(trimmedYearLevel);

  if (
    !trimmedCourseId ||
    !trimmedTermId ||
    !trimmedSection ||
    !trimmedProfessorId ||
    !trimmedYearLevel
  ) {
    throw new HttpsError(
      "invalid-argument",
      "courseId, termId, yearLevel, section, and professorId are required."
    );
  }

  if (!Number.isFinite(parsedYearLevel) || parsedYearLevel <= 0) {
    throw new HttpsError(
      "invalid-argument",
      "yearLevel must be a positive number."
    );
  }

  const uniqueAssistantIds = Array.from(
    new Set(
      (assistantIds || []).map(normalizeValue).filter(Boolean)
    )
  );

  if (
    request.auth.uid === trimmedProfessorId ||
    uniqueAssistantIds.includes(request.auth.uid)
  ) {
    throw new HttpsError(
      "permission-denied",
      "You cannot assign yourself to a course."
    );
  }

  const professorProfile = await getUserProfile(trimmedProfessorId);
  if (!professorProfile || !professorProfile.role) {
    throw new HttpsError("invalid-argument", "Professor not found.");
  }
  if (professorProfile.role !== PROFESSOR_ROLE) {
    throw new HttpsError("invalid-argument", "User is not a professor.");
  }

  const assistantProfiles = await Promise.all(
    uniqueAssistantIds.map((uid) => getUserProfile(uid))
  );

  if (assistantProfiles.some((profile) => !profile || !profile.role)) {
    throw new HttpsError(
      "invalid-argument",
      "One or more assistants were not found."
    );
  }

  const invalidAssistant = assistantProfiles.find(
    (profile) => profile.role !== ASSISTANT_ROLE
  );

  if (invalidAssistant) {
    throw new HttpsError(
      "invalid-argument",
      "One or more assistants do not have the assistant role."
    );
  }

  const offeringId = buildOfferingId({
    courseId: trimmedCourseId,
    termId: trimmedTermId,
    yearLevel: String(parsedYearLevel),
    section: trimmedSection,
  });

  const assignmentRef = admin
    .firestore()
    .collection(ASSIGNMENT_COLLECTION)
    .doc(offeringId);

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const existingSnap = await transaction.get(assignmentRef);
      const payload = {
        offeringId,
        courseId: trimmedCourseId,
        termId: trimmedTermId,
        yearLevel: parsedYearLevel,
        section: trimmedSection,
        professorId: professorProfile.uid,
        assistantIds: assistantProfiles.map((profile) => profile.uid),
        professor: buildUserSummary(professorProfile),
        assistants: assistantProfiles.map(buildUserSummary),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid,
      };

      if (!existingSnap.exists) {
        payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
        payload.createdBy = request.auth.uid;
      }

      transaction.set(assignmentRef, payload, { merge: true });
    });

    const savedSnap = await assignmentRef.get();
    return {
      assignment: savedSnap.exists
        ? { offeringId, ...savedSnap.data() }
        : { offeringId },
    };
  } catch (error) {
    logger.error("Upsert assignment error:", error);
    throwAsHttpsError(error);
  }
});

exports.syncAttendanceAggBySession = onDocumentWritten(
  "attendance/{docId}",
  async (event) => {
    const afterSnap = event.data?.after;
    const beforeSnap = event.data?.before;

    const afterData = afterSnap?.exists ? afterSnap.data() : null;
    const beforeData = beforeSnap?.exists ? beforeSnap.data() : null;

    const sessionId =
      normalizeValue(afterData?.sessionId) ||
      normalizeValue(beforeData?.sessionId) ||
      "";

    if (!sessionId) {
      logger.warn("syncAttendanceAggBySession missing sessionId.");
      return;
    }

    const attendanceSnap = await admin
      .firestore()
      .collection("attendance")
      .where("sessionId", "==", sessionId)
      .get();

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let offeringId = "";

    attendanceSnap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const status = normalizeAttendanceStatus(data.status);
      if (!offeringId) {
        offeringId = normalizeValue(data.offeringId);
      }

      switch (status) {
        case "present":
          presentCount += 1;
          break;
        case "late":
          lateCount += 1;
          break;
        case "absent":
          absentCount += 1;
          break;
        case "excused":
          excusedCount += 1;
          break;
        default:
          break;
      }
    });

    // TODO: Replace with enrollment-based count when available.
    const enrolledCount = attendanceSnap.size;
    const attendanceRate = enrolledCount
      ? presentCount / Math.max(enrolledCount, 1)
      : 0;

    await admin
      .firestore()
      .collection("attendanceAgg_session")
      .doc(sessionId)
      .set(
        {
          sessionId,
          offeringId,
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          enrolledCount,
          attendanceRate,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }
);

exports.syncCourseAssignmentsIndex = onDocumentWritten(
  `${COURSE_ASSIGNMENTS_COLLECTION}/{assignmentId}`,
  async (event) => {
    const assignmentId = event.params?.assignmentId || "";
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;

    const beforeData = beforeSnap?.exists ? beforeSnap.data() : null;
    const afterData = afterSnap?.exists ? afterSnap.data() : null;

    const beforeProfessorIds = normalizeIdArray(beforeData?.professorIds);
    const afterProfessorIds = normalizeIdArray(afterData?.professorIds);
    const beforeAssistantIds = normalizeIdArray(beforeData?.assistantIds);
    const afterAssistantIds = normalizeIdArray(afterData?.assistantIds);

    if (!assignmentId) {
      logger.warn("syncCourseAssignmentsIndex missing assignmentId.");
      return;
    }

    if (!afterData) {
      const deletes = [];
      if (beforeProfessorIds.length) {
        deletes.push(removeProfCourses(beforeProfessorIds, assignmentId));
      }
      if (beforeAssistantIds.length) {
        deletes.push(removeAssistantCourses(beforeAssistantIds, assignmentId));
      }
      if (deletes.length) {
        await Promise.all(deletes);
      }
      return;
    }

    const removedProfessorIds = beforeProfessorIds.filter(
      (profId) => !afterProfessorIds.includes(profId)
    );
    const removedAssistantIds = beforeAssistantIds.filter(
      (assistantId) => !afterAssistantIds.includes(assistantId)
    );

    const writes = [];
    if (removedProfessorIds.length) {
      writes.push(removeProfCourses(removedProfessorIds, assignmentId));
    }
    if (removedAssistantIds.length) {
      writes.push(removeAssistantCourses(removedAssistantIds, assignmentId));
    }
    if (afterProfessorIds.length) {
      writes.push(upsertProfCourses(afterProfessorIds, assignmentId, afterData));
    }
    if (afterAssistantIds.length) {
      writes.push(
        upsertAssistantCourses(afterAssistantIds, assignmentId, afterData)
      );
    }

    if (!writes.length) return;

    await Promise.all(writes);
  }
);

/* ------------------------------------------------------------------
   Course AI Assistant (Professor only, isolated from other AI code)
-------------------------------------------------------------------*/
exports.courseAiAssistant = onCall(
  { cors: true, timeoutSeconds: 60 },
  async (request) => {
    assertAuthenticated(request);

    const callerRole = getCallerRole(request);
    if (callerRole !== PROFESSOR_ROLE) {
      logPermissionDenied(request, callerRole, "Course AI Assistant");
      throw new HttpsError(
        "permission-denied",
        "Only professors can use the course AI assistant."
      );
    }

    const {
      conversationId,
      courseDocId,
      responseMessageId,
      recentMessages,
      lecture,
    } = request.data || {};

    const trimmedConversationId = normalizeValue(conversationId);
    const trimmedCourseDocId = normalizeValue(courseDocId);
    const trimmedMessageId = normalizeValue(responseMessageId);

    if (!trimmedConversationId || !trimmedCourseDocId || !trimmedMessageId) {
      throw new HttpsError(
        "invalid-argument",
        "conversationId, courseDocId, and responseMessageId are required."
      );
    }

    const conversationRef = admin
      .firestore()
      .collection(AI_CONVERSATIONS_COLLECTION)
      .doc(trimmedConversationId);
    const conversationSnap = await conversationRef.get();

    if (!conversationSnap.exists) {
      throw new HttpsError("not-found", "Conversation not found.");
    }

    const conversation = conversationSnap.data() || {};
    if (conversation.professorId !== request.auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "You do not own this conversation."
      );
    }
    if (conversation.courseDocId !== trimmedCourseDocId) {
      throw new HttpsError(
        "invalid-argument",
        "Course does not match the conversation."
      );
    }

    // Ensure the professor actually owns the course in the professor index.
    const courseSnap = await admin
      .firestore()
      .collection(PROF_COURSES_COLLECTION)
      .doc(request.auth.uid)
      .collection("courses")
      .doc(trimmedCourseDocId)
      .get();
    if (!courseSnap.exists) {
      throw new HttpsError(
        "permission-denied",
        "You do not have access to this course."
      );
    }

    const apiUrl = String(process.env.COURSE_AI_API_URL || "");
    const apiKey = String(process.env.COURSE_AI_API_KEY || "");
    const model = String(process.env.COURSE_AI_MODEL || "course-ai-model");
    const temperature = Number(process.env.COURSE_AI_TEMPERATURE || 0.3);

    if (!apiUrl || !apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "Course AI environment variables are not set."
      );
    }

    const sanitizedMessages = Array.isArray(recentMessages)
      ? recentMessages
          .filter((message) => normalizeValue(message?.content))
          .slice(-12)
          .map((message) => ({
            role: message.role === "ai" ? "assistant" : "user",
            content: normalizeValue(message.content),
          }))
      : [];

    const lectureTitle = normalizeValue(lecture?.lectureTitle || lecture?.title);
    const lectureNumber = normalizeValue(lecture?.lectureNumber);
    const lectureNotes = normalizeValue(lecture?.notes);
    const lecturePdfUrl = normalizeValue(lecture?.pdfUrl);
    const lectureId = normalizeValue(lecture?.lectureId);

    const lectureContextLines = [
      lectureTitle ? `Lecture Title: ${lectureTitle}` : "",
      lectureNumber ? `Lecture Number: ${lectureNumber}` : "",
      lectureId ? `Lecture Id: ${lectureId}` : "",
      lectureNotes ? `Lecture Notes: ${lectureNotes}` : "",
      lecturePdfUrl ? `Lecture PDF URL: ${lecturePdfUrl}` : "",
    ].filter(Boolean);

    const lectureContext = lectureContextLines.length
      ? lectureContextLines.join("\n")
      : "No lecture content was provided.";

    const systemPrompt = [
      `You are the Course AI Assistant for course ${trimmedCourseDocId}.`,
      "You MUST use only the lecture content provided below.",
      "Do NOT use external knowledge or information from other lectures.",
      "If the lecture content is insufficient, respond with: Insufficient lecture information.",
      "",
      "LECTURE CONTENT:",
      lectureContext,
    ].join("\n");

    let aiResponseText = "";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: Number.isFinite(temperature) ? temperature : 0.3,
          messages: [{ role: "system", content: systemPrompt }, ...sanitizedMessages],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `AI API error ${response.status}: ${errorText || response.statusText}`
        );
      }

      const payload = await response.json();
      aiResponseText =
        payload?.choices?.[0]?.message?.content ||
        payload?.choices?.[0]?.text ||
        "";

      if (!aiResponseText) {
        throw new Error("AI response was empty.");
      }

      await conversationRef
        .collection("messages")
        .doc(trimmedMessageId)
        .set(
          {
            content: aiResponseText,
            status: "done",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      await conversationRef.set(
        { updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

      return { ok: true };
    } catch (error) {
      logger.error("courseAiAssistant error:", error);
      await conversationRef
        .collection("messages")
        .doc(trimmedMessageId)
        .set(
          {
            content: "AI response failed. Please try again.",
            status: "error",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      throw new HttpsError(
        "internal",
        error?.message || "Failed to generate AI response."
      );
    }
  }
);

/* ----------------------------------------------------------------
   Firestore trigger (Gen2): sync custom claim `role` whenever a
   users/{uid} document is created or updated.
   This replaces the v1 auth onCreate trigger, which requires Gen1
   and is incompatible with Node.js 24.
----------------------------------------------------------------- */
exports.syncRoleClaimOnUserWrite = onDocumentWritten(
  "users/{uid}",
  async (event) => {
    const uid = event.params.uid;
    const afterData = event.data?.after?.data();

    if (!afterData) {
      // Document deleted — nothing to do.
      return;
    }

    const role = afterData.role
      ? String(afterData.role).trim().toLowerCase()
      : "student";

    try {
      await admin.auth().setCustomUserClaims(uid, { role });
      logger.info(`syncRoleClaimOnUserWrite: uid=${uid} role=${role}`);
    } catch (err) {
      logger.error(`syncRoleClaimOnUserWrite: failed for uid=${uid}`, err);
    }
  }
);

// ─── generateQuiz ─────────────────────────────────────────────────────────────
// Requires GEMINI_API_KEY in Firebase Functions secrets.
// Set with: firebase functions:secrets:set GEMINI_API_KEY
exports.generateQuiz = onRequest(
  { cors: true, secrets: ["GEMINI_API_KEY"] },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Expected multipart/form-data" });
    }

    try {
      // Extract boundary and parse multipart body manually
      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      if (!boundaryMatch) return res.status(400).json({ error: "No boundary in content-type" });
      const boundary = boundaryMatch[1].trim();

      const rawBody = req.rawBody;
      if (!rawBody) return res.status(400).json({ error: "Empty body" });

      const boundaryBuf = Buffer.from("--" + boundary);
      const fileParts = [];
      let start = 0;
      while (start < rawBody.length) {
        const boundaryIdx = rawBody.indexOf(boundaryBuf, start);
        if (boundaryIdx === -1) break;
        const headerStart = boundaryIdx + boundaryBuf.length + 2;
        const headerEnd = rawBody.indexOf(Buffer.from("\r\n\r\n"), headerStart);
        if (headerEnd === -1) break;
        const headerStr = rawBody.slice(headerStart, headerEnd).toString();
        const dataStart = headerEnd + 4;
        const nextBoundary = rawBody.indexOf(boundaryBuf, dataStart);
        const dataEnd = nextBoundary === -1 ? rawBody.length : nextBoundary - 2;
        if (headerStr.includes('name="file"')) {
          fileParts.push(rawBody.slice(dataStart, dataEnd));
        }
        start = nextBoundary === -1 ? rawBody.length : nextBoundary;
      }

      if (fileParts.length === 0) return res.status(400).json({ error: "No file found in request" });

      const base64Pdf = fileParts[0].toString("base64");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64Pdf,
                  },
                },
                {
                  text: 'You are a university exam generator. Read this lecture PDF and output ONLY valid JSON — no markdown, no backticks, no preamble. Return an array of exactly 10 objects. Each object: {"question": "string", "options": ["A","B","C","D"], "correctIndex": 0} where correctIndex is 0-based index of correct option.',
                },
              ],
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      const geminiData = await geminiRes.json();

      if (!geminiRes.ok) {
        logger.error("Gemini API error", geminiData);
        throw new Error(geminiData.error?.message || "Gemini API error");
      }

      const raw = geminiData.candidates[0].content.parts[0].text;
      const clean = raw.replace(/```json|```/g, "").trim();
      const questions = JSON.parse(clean);

      return res.status(200).json({ questions });
    } catch (err) {
      logger.error("generateQuiz error", err);
      return res.status(500).json({ error: err.message || "Generation failed" });
    }
  }
);
