import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiLockClosed,
  HiX,
  HiPlus,
} from "react-icons/hi";
import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import app, { db, functions } from "../../firebase/firebaseConfig";
import { useAuthUser } from "../../auth/useAuthUser";
import BigLogo from "../../assets/university-logo.png";
import { fetchColleges } from "../../services/colleges.service";
import { createUserProfile } from "../../services/users.service";

const ROLE_TABS = [
  { value: "all", label: "All" },
  { value: "student", label: "Student" },
  { value: "assistant", label: "Assistant" },
  { value: "professor", label: "Professor" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_OPTIONS = ROLE_TABS.filter((tab) => tab.value !== "all");
const USERS_PER_PAGE = 4;
const ROLE_REQUIRES_COLLEGE = ["student", "assistant", "professor"];

const resolveCollegeName = (college) =>
  college?.name ||
  college?.collegeName ||
  college?.displayName ||
  college?.title ||
  college?.id ||
  "Unknown";

const getSecondaryAuth = () => {
  const existing = getApps().find((item) => item.name === "secondaryAuth");
  const secondaryApp = existing || initializeApp(app.options, "secondaryAuth");
  return getAuth(secondaryApp);
};

const getUserRoleKey = (user) => {
  const rawRole = user?.role ?? user?.Role ?? "";
  return rawRole ? String(rawRole).toLowerCase() : "";
};

const formatRoleLabel = (roleKey) => {
  if (!roleKey) return "N/A";
  return roleKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getUserName = (user) =>
  user?.name ?? user?.fullName ?? user?.displayName ?? user?.Full_Name ?? "N/A";

const getUserEmail = (user) => user?.email ?? user?.Email ?? "N/A";

const getUserPhone = (user) => user?.phoneNumber ?? user?.Phone_Number ?? "N/A";

const getUserCollegeId = (user) =>
  user?.collegeId ?? user?.collegeUserId ?? user?.College_User_ID ?? "N/A";

const formatCreatedAt = (timestamp) => {
  if (!timestamp) return "N/A";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("en-US");
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }
  return "N/A";
};

function CreateAdminUser() {
  const { user, authLoading } = useAuthUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegesError, setCollegesError] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [userRole, setUserRole] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editRole, setEditRole] = useState("student");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Student-specific fields
  const [year, setYear] = useState("");
  const [studentDeptId, setStudentDeptId] = useState("");
  const [collegeYears, setCollegeYears] = useState([]);
  const [collegeYearsLoading, setCollegeYearsLoading] = useState(false);
  const [selectedYearDocId, setSelectedYearDocId] = useState("");
  const [depts, setDepts] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const [editYear, setEditYear] = useState("");
  const [editStudentDeptId, setEditStudentDeptId] = useState("");
  const [editYearDocId, setEditYearDocId] = useState("");
  const [editCollegeId, setEditCollegeId] = useState("");
  const [editCollegeYears, setEditCollegeYears] = useState([]);
  const [editCollegeYearsLoading, setEditCollegeYearsLoading] = useState(false);
  const [editDepts, setEditDepts] = useState([]);
  const [editDeptsLoading, setEditDeptsLoading] = useState(false);

  const deleteUserAccount = useMemo(
    () => httpsCallable(functions, "deleteUserAccount"),
    [functions],
  );
  const editUserAccount = useMemo(
    () => httpsCallable(functions, "editUserAccount"),
    [functions],
  );

  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const canManageUsers = isSuperAdmin || isAdmin;

  const roleOptions = useMemo(() => {
    if (isSuperAdmin) return ROLE_OPTIONS;
    return ROLE_OPTIONS.filter((tab) => tab.value !== "super_admin");
  }, [isSuperAdmin]);

  const roleNeedsCollege = useMemo(
    () => ROLE_REQUIRES_COLLEGE.includes(role),
    [role],
  );
  const collegeOptions = useMemo(
    () =>
      colleges.map((college) => ({
        value: college.id,
        label: resolveCollegeName(college),
      })),
    [colleges],
  );
  const isCollegeMissing = useMemo(
    () => roleNeedsCollege && !collegesLoading && collegeOptions.length === 0,
    [roleNeedsCollege, collegesLoading, collegeOptions.length],
  );
  const isCollegeSelectionInvalid = useMemo(
    () =>
      roleNeedsCollege &&
      !collegesLoading &&
      collegeOptions.length > 0 &&
      !collegeId,
    [roleNeedsCollege, collegesLoading, collegeOptions.length, collegeId],
  );
  const isCreateDisabled = useMemo(() => {
    if (!roleNeedsCollege) return loading;
    if (collegesLoading) return true;
    if (collegeOptions.length === 0) return true;
    return loading || !collegeId;
  }, [
    roleNeedsCollege,
    collegesLoading,
    collegeOptions.length,
    collegeId,
    loading,
  ]);

  const loadUsers = useCallback(async () => {
    if (!user) return;

    setUsersLoading(true);
    setUsersError("");

    try {
      const tokenResult = await user.getIdTokenResult(true);
      const currentRole = tokenResult?.claims?.role || "";
      const normalizedRole = String(currentRole || "").toLowerCase();
      const allowedRoles = ["super_admin", "admin"];

      setUserRole(normalizedRole);

      if (!allowedRoles.includes(normalizedRole)) {
        setUsers([]);
        setUsersError("You do not have access to view all users.");
        return;
      }

      const snapshot = await getDocs(collection(db, "users"));
      const rows = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      rows.sort(
        (first, second) =>
          (second?.createdAt?.seconds ?? 0) - (first?.createdAt?.seconds ?? 0),
      );

      setUsers(rows);
    } catch {
      setUsersError("Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, [user]);

  const loadColleges = useCallback(async () => {
    setCollegesLoading(true);
    setCollegesError("");

    try {
      const data = await fetchColleges(db);
      setColleges(data);
      if (data.length > 0 && !collegeId) {
        setCollegeId(data[0].id);
      }
    } catch (error) {
      setColleges([]);
      setCollegesError(error?.message || "Failed to load colleges.");
    } finally {
      setCollegesLoading(false);
    }
  }, [collegeId]);

  const handleCreateAccount = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError("");
      // setSuccessMessage("");

      const trimmedEmail = email.trim();
      const trimmedName = name.trim();
      const trimmedPhoneNumber = phoneNumber.trim();
      const normalizedRole = String(role || "")
        .trim()
        .toLowerCase();
      const needsCollege = ROLE_REQUIRES_COLLEGE.includes(normalizedRole);

      if (!trimmedEmail || !trimmedName || !password || !normalizedRole) {
        setFormError("Full name, email, password, and role are required.");
        return;
      }

      if (isAdmin && normalizedRole === "super_admin") {
        setFormError("Admins cannot assign the super admin role.");
        return;
      }

      if (needsCollege && !collegeId) {
        setFormError("Select a college for this role.");
        return;
      }

      if (needsCollege && isCollegeMissing) {
        setFormError("Create at least one college before adding this role.");
        return;
      }

      setLoading(true);
      let createdUser = null;
      const secondaryAuth = getSecondaryAuth();

      try {
        const userCred = await createUserWithEmailAndPassword(
          secondaryAuth,
          trimmedEmail,
          password,
        );
        createdUser = userCred.user;

        if (!createdUser?.uid) {
          throw new Error("Create user failed to return uid.");
        }

        if (trimmedName) {
          try {
            await updateProfile(createdUser, { displayName: trimmedName });
          } catch {
            // non-critical — display name update failed
          }
        }

        await createUserProfile({
          db,
          uid: createdUser.uid,
          name: trimmedName,
          email: trimmedEmail,
          phoneNumber: trimmedPhoneNumber,
          role: normalizedRole,
          collegeId: needsCollege ? collegeId : "",
          departmentId: normalizedRole === "student" ? studentDeptId : "",
          year: normalizedRole === "student" ? Number(year) : undefined,
          yearId: normalizedRole === "student" ? selectedYearDocId : undefined,
        });

        await loadUsers();
        setEmail("");
        setName("");
        setPhoneNumber("");
        setPassword("");
        setRole("student");
        setCollegeId("");
        setYear("");
        setStudentDeptId("");
        setSelectedYearDocId("");
        setIsModalOpen(false);
        setActionSuccess("Account created successfully.");
      } catch (error) {
        setFormError(error?.message || "Account creation failed.");

        if (createdUser) {
          try {
            await deleteUser(createdUser);
          } catch {
            // cleanup best-effort
          }
        }
      } finally {
        try {
          await signOut(secondaryAuth);
        } catch {
          // secondary auth sign-out best-effort
        }
        setLoading(false);
      }
    },
    [
      email,
      name,
      password,
      phoneNumber,
      role,
      collegeId,
      isCollegeMissing,
      isAdmin,
      loadUsers,
      selectedYearDocId,
      studentDeptId,
      year,
    ],
  );

  const handleDeleteUser = useCallback(
    async (currentUser) => {
      const uid = currentUser?.id;
      if (!uid) return;

      const targetRole = getUserRoleKey(currentUser);
      if (isAdmin && targetRole === "super_admin") {
        setActionError("Admins cannot delete super admin accounts.");
        setActionSuccess("");
        return;
      }

      const displayName = getUserName(currentUser);
      const emailLabel = getUserEmail(currentUser);
      const confirmLabel = displayName !== "N/A" ? displayName : emailLabel;
      const shouldDelete = window.confirm(
        `Delete ${confirmLabel}? This cannot be undone.`,
      );

      if (!shouldDelete) return;

      setActionError("");
      setActionSuccess("");
      setDeletingUserId(uid);

      try {
        await deleteUserAccount({ uid });
        setUsers((prevUsers) => prevUsers.filter((item) => item.id !== uid));
        setActionSuccess(`${confirmLabel} was deleted.`);
      } catch (error) {
        setActionError(error?.message || "Failed to delete user.");
      } finally {
        setDeletingUserId("");
      }
    },
    [deleteUserAccount, isAdmin],
  );

  const openEditModal = useCallback(
    (currentUser) => {
      if (!currentUser) return;

      const targetRole = getUserRoleKey(currentUser);
      if (isAdmin && targetRole === "super_admin") {
        setActionError("Admins cannot edit super admin accounts.");
        setActionSuccess("");
        return;
      }

      setEditingUser(currentUser);
      setEditName(
        currentUser?.name ??
          currentUser?.fullName ??
          currentUser?.displayName ??
          currentUser?.Full_Name ??
          "",
      );
      setEditEmail(currentUser?.email ?? currentUser?.Email ?? "");
      setEditPhoneNumber(
        currentUser?.phoneNumber ?? currentUser?.Phone_Number ?? "",
      );
      setEditRole(getUserRoleKey(currentUser) || "student");
      setEditPassword("");
      setEditYear(currentUser?.year != null ? String(currentUser.year) : "");
      setEditYearDocId(currentUser?.yearId || "");
      setEditStudentDeptId(currentUser?.departmentId || "");
      setEditCollegeId(currentUser?.collegeId || "");
      setEditCollegeYears([]);
      setEditDepts([]);
      setEditFormError("");
      // Load colleges if not yet loaded
      if (colleges.length === 0) loadColleges();
      setActionError("");
      setActionSuccess("");
      setIsEditModalOpen(true);
    },
    [isAdmin],
  );

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditPhoneNumber("");
    setEditRole("student");
    setEditPassword("");
    setEditYear("");
    setEditStudentDeptId("");
    setEditYearDocId("");
    setEditCollegeId("");
    setEditCollegeYears([]);
    setEditDepts([]);
    setEditFormError("");
    setEditLoading(false);
  }, []);

  const handleEditAccount = useCallback(
    async (e) => {
      e.preventDefault();
      setEditFormError("");
      setActionError("");
      setActionSuccess("");

      const uid = editingUser?.id;
      const trimmedEmail = editEmail.trim();
      const trimmedName = editName.trim();
      const trimmedPhoneNumber = editPhoneNumber.trim();

      if (!uid) {
        setEditFormError("Select a user to edit.");
        return;
      }

      if (!trimmedName || !trimmedEmail) {
        setEditFormError("Full name and email are required.");
        return;
      }

      const targetRole = getUserRoleKey(editingUser);
      if (isAdmin && targetRole === "super_admin") {
        setEditFormError("Admins cannot edit super admin accounts.");
        return;
      }

      if (isAdmin && editRole === "super_admin") {
        setEditFormError("Admins cannot assign the super admin role.");
        return;
      }

      setEditLoading(true);

      try {
        const payload = {
          uid,
          email: trimmedEmail,
          name: trimmedName,
          role: editRole,
          phoneNumber: trimmedPhoneNumber,
        };

        if (editPassword) {
          payload.password = editPassword;
        }

        await editUserAccount(payload);

        // Persist student-specific fields directly to Firestore
        if (editRole === "student") {
          const studentUpdate = {};
          const parsedYear = Number(editYear);
          if (Number.isFinite(parsedYear) && parsedYear > 0)
            studentUpdate.year = parsedYear;
          if (editCollegeId.trim())
            studentUpdate.collegeId = editCollegeId.trim();
          if (editStudentDeptId.trim())
            studentUpdate.departmentId = editStudentDeptId.trim();
          if (editYearDocId.trim()) studentUpdate.yearId = editYearDocId.trim();
          if (Object.keys(studentUpdate).length > 0) {
            await updateDoc(doc(db, "users", uid), studentUpdate);
          }
        }

        setActionSuccess("User updated successfully.");
        closeEditModal();
        await loadUsers();
      } catch (error) {
        setEditFormError(error?.message || "Failed to edit user.");
      } finally {
        setEditLoading(false);
      }
    },
    [
      editEmail,
      editName,
      editPhoneNumber,
      editPassword,
      editRole,
      editingUser,
      editUserAccount,
      isAdmin,
      loadUsers,
      closeEditModal,
      editStudentDeptId,
      editYear,
      editYearDocId,
      editCollegeId,
    ],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUsers([]);
      setUserRole("");
      return;
    }
    loadUsers();
  }, [authLoading, user, loadUsers]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (roleNeedsCollege && !collegesLoading && colleges.length === 0) {
      loadColleges();
    }
  }, [
    isModalOpen,
    roleNeedsCollege,
    collegesLoading,
    colleges.length,
    loadColleges,
  ]);

  useEffect(() => {
    if (!roleNeedsCollege) {
      setCollegeId("");
      return;
    }
    if (!collegeId && collegeOptions.length > 0) {
      setCollegeId(collegeOptions[0].value);
    }
  }, [roleNeedsCollege, collegeId, collegeOptions]);

  // Load years for student department cascade
  useEffect(() => {
    if (role !== "student" || !collegeId) {
      setCollegeYears([]);
      setSelectedYearDocId("");
      setDepts([]);
      setStudentDeptId("");
      return;
    }
    let isActive = true;
    setCollegeYearsLoading(true);
    getDocs(collection(db, "colleges", collegeId, "years"))
      .then((snap) => {
        if (!isActive) return;
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setCollegeYears(items);
        setSelectedYearDocId("");
        setDepts([]);
        setStudentDeptId("");
      })
      .catch(() => {
        if (isActive) setCollegeYears([]);
      })
      .finally(() => {
        if (isActive) setCollegeYearsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [role, collegeId]);

  useEffect(() => {
    if (role !== "student" || !collegeId || !selectedYearDocId) {
      setDepts([]);
      setStudentDeptId("");
      return;
    }
    let isActive = true;
    setDeptsLoading(true);
    getDocs(
      collection(
        db,
        "colleges",
        collegeId,
        "years",
        selectedYearDocId,
        "departments",
      ),
    )
      .then((snap) => {
        if (!isActive) return;
        setDepts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setStudentDeptId("");
      })
      .catch(() => {
        if (isActive) setDepts([]);
      })
      .finally(() => {
        if (isActive) setDeptsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [role, collegeId, selectedYearDocId]);

  // Load years for edit modal student cascade
  useEffect(() => {
    if (!isEditModalOpen || editRole !== "student" || !editCollegeId) {
      setEditCollegeYears([]);
      setEditYearDocId((prev) => prev); // keep existing value
      return;
    }
    let isActive = true;
    setEditCollegeYearsLoading(true);
    getDocs(collection(db, "colleges", editCollegeId, "years"))
      .then((snap) => {
        if (!isActive) return;
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setEditCollegeYears(items);
      })
      .catch(() => {
        if (isActive) setEditCollegeYears([]);
      })
      .finally(() => {
        if (isActive) setEditCollegeYearsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [isEditModalOpen, editRole, editCollegeId]);

  // Load departments for edit modal student cascade
  useEffect(() => {
    if (
      !isEditModalOpen ||
      editRole !== "student" ||
      !editCollegeId ||
      !editYearDocId
    ) {
      setEditDepts([]);
      return;
    }
    let isActive = true;
    setEditDeptsLoading(true);
    getDocs(
      collection(
        db,
        "colleges",
        editCollegeId,
        "years",
        editYearDocId,
        "departments",
      ),
    )
      .then((snap) => {
        if (!isActive) return;
        setEditDepts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch(() => {
        if (isActive) setEditDepts([]);
      })
      .finally(() => {
        if (isActive) setEditDeptsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [isEditModalOpen, editRole, editCollegeId, editYearDocId]);

  const filteredUsers = useMemo(() => {
    const roleFiltered =
      activeRole === "all"
        ? users
        : users.filter(
            (currentUser) => getUserRoleKey(currentUser) === activeRole,
          );
    const query = searchTerm.trim().toLowerCase();

    if (!query) return roleFiltered;

    return roleFiltered.filter((currentUser) => {
      const roleKey = getUserRoleKey(currentUser);
      const searchableValues = [
        getUserName(currentUser),
        getUserEmail(currentUser),
        getUserPhone(currentUser),
        getUserCollegeId(currentUser),
        roleKey,
        formatRoleLabel(roleKey),
        currentUser?.uid,
        currentUser?.id,
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [activeRole, searchTerm, users]);

  const totalPages = useMemo(
    () => Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1,
    [filteredUsers.length],
  );

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [currentPage, filteredUsers]);

  const pageRangeLabel = useMemo(() => {
    if (!filteredUsers.length) return "Showing 0 of 0";
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const start = startIndex + 1;
    const end = Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length);
    return `Showing ${start}-${end} of ${filteredUsers.length}`;
  }, [currentPage, filteredUsers.length]);

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim()) return "No users match your search.";
    if (activeRole === "all") return "No users found.";
    return "No users found for this role.";
  }, [activeRole, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeRole, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b2c4a]/10">
            <img
              src={BigLogo}
              alt="beni Suef National University logo"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0b2c4a]">
              User Management
            </h1>
            <p className="text-sm text-slate-600">
              Create new accounts and assign roles for the portal.
            </p>
          </div>
        </div>
        {canManageUsers ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#0b2c4a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:bg-[#153a63]"
          >
            Add User
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0b2c4a]">
              User Directory
            </h2>
            <p className="text-sm text-slate-600">
              Browse and filter users by role.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {ROLE_TABS.map((tab) => {
                const isActive = activeRole === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveRole(tab.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      isActive
                        ? "border-transparent bg-[#0b2c4a] text-white shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="w-full sm:w-auto">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name,email, phone, college ID, or role"
                className="w-full rounded-full border border-slate-200 bg-white px-7 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              />
            </div>
          </div>
        </div>

        {actionError ? (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
            role="alert"
          >
            {actionError}
          </div>
        ) : null}

        {actionSuccess ? (
          <div
            className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
            role="status"
          >
            {actionSuccess}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">College ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {usersLoading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                    Loading users...
                  </td>
                </tr>
              ) : usersError ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-red-600" colSpan={7}>
                    {usersError}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((currentUser) => (
                  <tr key={currentUser.id}>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {getUserName(currentUser)}
                    </td>
                    <td className="px-4 py-4">{getUserEmail(currentUser)}</td>
                    <td className="px-4 py-4">{getUserPhone(currentUser)}</td>
                    <td className="px-4 py-4">
                      {getUserCollegeId(currentUser)}
                    </td>
                    <td className="px-4 py-4">
                      {formatRoleLabel(getUserRoleKey(currentUser))}
                    </td>
                    <td className="px-4 py-4">
                      {formatCreatedAt(currentUser?.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {canManageUsers ? (
                        isAdmin &&
                        getUserRoleKey(currentUser) === "super_admin" ? (
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Protected
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(currentUser)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(currentUser)}
                              disabled={deletingUserId === currentUser.id}
                              className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingUserId === currentUser.id
                                ? "Deleting"
                                : "Delete"}
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > USERS_PER_PAGE ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <span>{pageRangeLabel}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {canManageUsers && isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b2c4a]/10">
                  <HiPlus className="h-5 w-5 text-[#0b2c4a]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Create Account
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add a new user to the portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAccount} className="px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2">
                  <label
                    htmlFor="admin-name"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <HiUser className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="admin-name"
                      type="text"
                      placeholder="e.g. Ahmed Mohamed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <label
                    htmlFor="admin-email"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="admin-email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="admin-phone"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    Phone
                  </label>
                  <div className="relative">
                    <HiPhone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="admin-phone"
                      type="tel"
                      placeholder="+20 100 000 0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      autoComplete="tel"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="admin-password"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="admin-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                      required
                    />
                  </div>
                </div>

                {/* Role pills */}
                <div className="col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Role
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          role === opt.value
                            ? "bg-[#0b2c4a] text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* College */}
                {roleNeedsCollege ? (
                  <div className="col-span-2">
                    <label
                      htmlFor="admin-college"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                    >
                      College
                    </label>
                    <select
                      id="admin-college"
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                      disabled={collegesLoading || collegeOptions.length === 0}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10 disabled:opacity-60"
                      required
                    >
                      {collegesLoading ? (
                        <option value="">Loading colleges...</option>
                      ) : null}
                      {!collegesLoading && collegeOptions.length === 0 ? (
                        <option value="">No colleges found</option>
                      ) : null}
                      {collegeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {collegesError ? (
                      <p className="mt-1.5 text-xs text-red-600">
                        {collegesError}
                      </p>
                    ) : null}
                    {isCollegeMissing ? (
                      <p className="mt-1.5 text-xs text-amber-600">
                        No colleges found. Create a college first.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {role === "student" ? (
                  <>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Year Level
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 2"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Year (for dept)
                      </label>
                      <select
                        value={selectedYearDocId}
                        onChange={(e) => setSelectedYearDocId(e.target.value)}
                        disabled={
                          collegeYearsLoading || collegeYears.length === 0
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10 disabled:opacity-60"
                      >
                        <option value="">
                          {collegeYearsLoading ? "Loading..." : "Select year"}
                        </option>
                        {collegeYears.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.name || y.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Department
                      </label>
                      <select
                        value={studentDeptId}
                        onChange={(e) => setStudentDeptId(e.target.value)}
                        disabled={deptsLoading || depts.length === 0}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10 disabled:opacity-60"
                      >
                        <option value="">
                          {deptsLoading
                            ? "Loading..."
                            : "Select department (optional)"}
                        </option>
                        {depts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name || d.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
              </div>

              {formError ? (
                <div
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreateDisabled}
                  className="flex items-center gap-2 rounded-xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#153a63] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {canManageUsers && isEditModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={closeEditModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b2c4a]/10">
                  <HiUser className="h-5 w-5 text-[#0b2c4a]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Edit User
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingUser
                      ? getUserName(editingUser)
                      : "Update account details"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditAccount} className="px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label
                    htmlFor="edit-name"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <HiUser className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="edit-name"
                      type="text"
                      placeholder="Full name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                      required
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="edit-email"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="edit-email"
                      type="email"
                      placeholder="user@example.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                      required
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="edit-phone"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    Phone
                  </label>
                  <div className="relative">
                    <HiPhone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="edit-phone"
                      type="tel"
                      placeholder="+20 100 000 0000"
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      autoComplete="tel"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="edit-password"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="edit-password"
                      type="password"
                      placeholder="Leave blank to keep"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Role
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditRole(opt.value)}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${editRole === opt.value ? "bg-[#0b2c4a] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {editRole === "student" ? (
                  <>
                    <div className="col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                        College
                      </label>
                      <select
                        value={editCollegeId}
                        onChange={(e) => {
                          setEditCollegeId(e.target.value);
                          setEditYearDocId("");
                          setEditStudentDeptId("");
                        }}
                        disabled={
                          collegesLoading || collegeOptions.length === 0
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10 disabled:opacity-60"
                      >
                        <option value="">
                          {collegesLoading ? "Loading..." : "Select college"}
                        </option>
                        {collegeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Year
                      </label>
                      <select
                        value={editYearDocId}
                        onChange={(e) => {
                          setEditYearDocId(e.target.value);
                          setEditStudentDeptId("");
                        }}
                        disabled={
                          editCollegeYearsLoading ||
                          editCollegeYears.length === 0
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10 disabled:opacity-60"
                      >
                        <option value="">
                          {editCollegeYearsLoading
                            ? "Loading..."
                            : "Select year"}
                        </option>
                        {editCollegeYears.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.name || y.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Year Level (number)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 2"
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Department
                      </label>
                      <select
                        value={editStudentDeptId}
                        onChange={(e) => setEditStudentDeptId(e.target.value)}
                        disabled={editDeptsLoading || editDepts.length === 0}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:bg-white focus:ring-2 focus:ring-[#0b2c4a]/10 disabled:opacity-60"
                      >
                        <option value="">
                          {editDeptsLoading
                            ? "Loading..."
                            : "Select department"}
                        </option>
                        {editDepts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name || d.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
              </div>

              {editFormError ? (
                <div
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                  role="alert"
                >
                  {editFormError}
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center gap-2 rounded-xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#153a63] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CreateAdminUser;
