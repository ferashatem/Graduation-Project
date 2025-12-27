import { addDoc, serverTimestamp } from "firebase/firestore";
import {
  collegesCollection,
  yearsCollection,
  departmentsCollection,
  coursesCollection,
} from "./firestorePaths";

export const seedAcademicData = async () => {
  const collegeRef = await addDoc(collegesCollection(), {
    name: "College of Engineering",
    code: "ENG",
    createdAt: serverTimestamp(),
  });

  const year1Ref = await addDoc(yearsCollection(collegeRef.id), {
    name: "Year 1",
    order: 1,
    createdAt: serverTimestamp(),
  });

  const year2Ref = await addDoc(yearsCollection(collegeRef.id), {
    name: "Year 2",
    order: 2,
    createdAt: serverTimestamp(),
  });

  const csDeptRef = await addDoc(
    departmentsCollection(collegeRef.id, year1Ref.id),
    {
      name: "Computer Science",
      code: "CS",
      createdAt: serverTimestamp(),
    }
  );

  const eeDeptRef = await addDoc(
    departmentsCollection(collegeRef.id, year1Ref.id),
    {
      name: "Electrical Engineering",
      code: "EE",
      createdAt: serverTimestamp(),
    }
  );

  await addDoc(coursesCollection(collegeRef.id, year1Ref.id, csDeptRef.id), {
    name: "Intro to Programming",
    code: "CS101",
    creditHours: 3,
    description: "Programming basics with JavaScript.",
    createdAt: serverTimestamp(),
  });

  await addDoc(coursesCollection(collegeRef.id, year1Ref.id, csDeptRef.id), {
    name: "Data Structures",
    code: "CS201",
    creditHours: 3,
    description: "Core data structures and algorithms.",
    createdAt: serverTimestamp(),
  });

  await addDoc(coursesCollection(collegeRef.id, year1Ref.id, eeDeptRef.id), {
    name: "Circuit Analysis",
    code: "EE110",
    creditHours: 3,
    description: "DC and AC circuit fundamentals.",
    createdAt: serverTimestamp(),
  });

  return {
    collegeId: collegeRef.id,
    yearIds: [year1Ref.id, year2Ref.id],
    departmentIds: [csDeptRef.id, eeDeptRef.id],
  };
};
