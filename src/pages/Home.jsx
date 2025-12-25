// src/pages/admin/Home.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuthUser } from "../auth/useAuthUser";




export default function AdminHome() {
  const { user, authLoading } = useAuthUser();
  
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const loadAllUsers = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return;

    try {
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const role = tokenResult?.claims?.role || null;

      if (role !== "super_admin") {
        console.warn("Skipping users list: requires super_admin role.");
        return;
      }

      const snap = await getDocs(collection(db, "users"));
      const users = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      console.log("All users (users collection):", users);
    } catch (err) {
      console.error("Load users error:", err);
    }
  }, []);

  /**
   * Load profile from Users/{uid}
   * - If profile doesn't exist, create a minimal one then re-read.
   */
  

  const loadProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser?.uid) return;

    setLoadingProfile(true);

    try {
      // 1) Read role from custom claims (force refresh if you recently changed claims)
      // https://firebase.google.com/docs/auth/admin/custom-claims#access_custom_claims
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      // const role = tokenResult?.claims?.role || "student";
      console.log(tokenResult);
      // console.log(role);

      // 2) Try reading the profile
      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      console.log(ref);
      console.log(snap);

      // 3) If not found, create it (minimal profile) thejn read again
      if (!snap.exists()) {
        // const snap2 = await getDoc(ref);
        setProfile(snap.data());
      } else {
        setProfile(snap.data());
      }
    } catch (err) {
      console.error("Load profile error:", err);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    loadProfile(user);
    loadAllUsers(user);
  }, [authLoading, user, loadProfile, loadAllUsers]);

  const viewModel = useMemo(() => {
    const p = profile || {};
    return {
      name: p.fullName ?? p.Full_Name ?? user?.displayName ?? "—",
      email: p.email ?? p.Email ?? user?.email ?? "—",
      phone: p.phoneNumber ?? p.Phone_Number ?? "—",
      role: p.role ?? p.Role ?? p.title ?? p.Title ?? "—",
      uid: p.uid ?? user?.uid ?? "—",
    };
  }, [profile, user]);

  if (authLoading || loadingProfile) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  const roleLabel = (viewModel.role || "")
    .toString()
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Admin";

  return (
    <div style={{ padding: 24 }}>
      <h1>{roleLabel} Overview</h1>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        }}
      >
        <Card title="FULL NAME" value={viewModel.name} />
        <Card title="EMAIL" value={viewModel.email} />
        <Card title="PHONE NUMBER" value={viewModel.phone} />
        <Card title="ROLE" value={viewModel.role} />
        {/* <Card title="ROLE" value={viewModel.role} /> */}
        <Card title="UID" value={viewModel.uid} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: 16,
        borderRadius: 12,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.6 }}>
        {title}
      </div>
      <div style={{ marginTop: 8, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

