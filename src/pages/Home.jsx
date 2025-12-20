import React from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";

const functions = getFunctions();
const setUserRole = httpsCallable(functions, "setUserRole");

async function assignRole(uid, role) {
  // Make sure you are logged in as super_admin first
  const result = await setUserRole({ uid, role });
  console.log(result.data);
}

const studentDetails = [
  {
    label: "Student Name",
    value: "فراس حاتم عمر جابر الغرابلى",
    valueDir: "rtl",
  },
  { label: "Student ID", value: "220100152" },
  { label: "Faculty", value: "Faculty of Computer and Information Sciences" },
  { label: "Degree", value: "B.Sc." },
  { label: "Student Major", value: "Artificial Intelligence and Data Science" },
  { label: "Level", value: "Level 3" },
  { label: "Enrollment Status", value: "Enrolled" },
  { label: "Academic Status", value: "--" },
  { label: "Total Passed CH", value: "106.00" },
  { label: "CGPA", value: "2.66" },
];

function Home() {
  return (
    <section className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#f7f1e6] via-[#edf4ff] to-[#c7d7ff] p-6 text-[#0b2c4a] shadow-2xl ring-1 ring-white/70 sm:p-8">
      <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-[#103c6b]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 translate-x-1/3 rounded-full bg-[#ffcf70]/25 blur-3xl" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#0b2c4a] shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0b2c4a]" />
          Student Profile
        </div>

        <div className="mt-5 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-[#0b2c4a] sm:text-4xl font-['Palatino_Linotype','Book_Antiqua','Palatino','serif']">
            Academic Overview
          </h1>
          <p className="mt-3 text-sm text-[#1d3557]/80 sm:text-base">
            Snapshot of enrollment, academic standing, and program details.
          </p>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studentDetails.map((detail) => (
            <div
              key={detail.label}
              className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-white/60"
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/60">
                {detail.label}
              </dt>
              <dd
                className="mt-2 text-base font-semibold text-[#0b2c4a]"
                dir={detail.valueDir}
              >
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default Home;
