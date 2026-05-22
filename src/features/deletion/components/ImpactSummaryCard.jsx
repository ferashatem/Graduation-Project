import React from "react";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import GradeIcon from "@mui/icons-material/Grade";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

const HISTORICAL_ENTITIES = new Set(["StudentGrade", "Enrollment", "ExamSubmission", "Student"]);

const ENTITY_META = {
  Student:         { label: "Students",          icon: <PeopleIcon fontSize="small" /> },
  Department:      { label: "Departments",        icon: <AccountTreeIcon fontSize="small" /> },
  StudentGrade:    { label: "Student Grades",     icon: <GradeIcon fontSize="small" /> },
  SubjectOffering: { label: "Subject Offerings",  icon: <SchoolIcon fontSize="small" /> },
  Exam:            { label: "Exams",              icon: <EventNoteIcon fontSize="small" /> },
  Enrollment:      { label: "Enrollments",        icon: <HistoryEduIcon fontSize="small" /> },
  ExamSubmission:  { label: "Exam Submissions",   icon: <AssignmentIcon fontSize="small" /> },
};

function getIcon(key) {
  return ENTITY_META[key]?.icon ?? <FolderIcon fontSize="small" />;
}
function getLabel(key) {
  return ENTITY_META[key]?.label ?? key;
}

export default function ImpactSummaryCard({ counts = {} }) {
  const entries = Object.entries(counts);
  if (!entries.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {entries.map(([key, count]) => {
        const isHighlighted = HISTORICAL_ENTITIES.has(key) && count > 0;
        return (
          <div
            key={key}
            className={`flex flex-col items-center justify-center rounded-xl border p-3 gap-1 text-center transition-all ${
              isHighlighted
                ? "border-red-300 bg-red-50 text-red-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span className={isHighlighted ? "text-red-500" : "text-slate-400"}>
              {getIcon(key)}
            </span>
            <span className="text-2xl font-bold leading-none">{count}</span>
            <span className="text-xs font-medium">{getLabel(key)}</span>
          </div>
        );
      })}
    </div>
  );
}
