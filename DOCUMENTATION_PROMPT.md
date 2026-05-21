# Prompt: Generate Full Project Documentation

Copy everything below this line and give it to Claude.

---

## Context

You are documenting a **graduation project** called **UniSys** — a University Management System built as a full-stack web application. Your task is to produce complete, professional, well-structured documentation suitable for a graduation thesis or portfolio. The documentation must be written in **English** (or Arabic if requested) and cover every aspect of the system.

---

## Project Overview

**UniSys** is a comprehensive university management platform that digitizes all academic operations — from university structure management to AI-powered exam generation — for 5 user roles.

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.3 + Vite, React Router 7, Material-UI 5 + TailwindCSS 3, ApexCharts, Axios, Firebase, XLSX, jsPDF |
| Backend | ASP.NET Core 9.0 (C#), Clean Architecture (Api / Core / Infrastructure) |
| Database | PostgreSQL 14+ with EF Core 9 (Code-First), ULID identifiers, soft-delete pattern |
| Auth | JWT Bearer (HS256) + Refresh Tokens, RBAC, rate limiting |
| Caching | Redis (optional, graceful fallback) |
| Storage | Cloudflare R2 (materials/files, 500 MB limit) |
| AI Service | External FastAPI service (Railway-hosted) — exam generation, PDF parsing, document summarization, complaint analysis |
| Background Jobs | Hangfire — complaint intelligence, exam reminders, academic risk alerts |
| Message Queue | RabbitMQ via MassTransit (attendance async processing) |
| Real-time | SignalR (`/hubs/notifications`) |
| DevOps | Railway.app (CI/CD), Docker, automatic EF migrations on startup |

---

## User Roles & Access

| Role | Route Prefix | Responsibilities |
|------|-------------|-----------------|
| **SuperAdmin** | `/super_admin` | Create admins, bulk import users, full system access |
| **Admin** | `/admin` | Manage university structure, courses, students, doctors, regulations, analytics, notifications |
| **Doctor (Professor)** | `/prof` | Create/publish/grade exams, upload materials, manage courses, view schedule, complaints |
| **TeachingAssistant** | `/asst` | View courses, create attendance sessions, AI chat |
| **Student** | `/student` | Register for courses, take exams/quizzes, view grades/schedule, file complaints, AI assistant |

---

## System Architecture

### Clean Architecture (Backend)

```
UniversityManagementSystem/
├── Api/          → Controllers, Filters, Hubs, Program.cs
├── Core/         → DTOs, Domain Entities, Interfaces, Services
└── Infrastructure/ → EF DbContext, Repositories, External integrations
```

### Frontend (Feature-based)

```
src/
├── api/          → Axios clients per domain (examsApi, gradesApi, etc.)
├── auth/         → JWT helpers, RequireRole, ProtectedRoute
├── features/     → Modular features (colleges, students, complaints, chat…)
├── layouts/      → Per-role layouts (Admin, Professor, Student, Assistant)
├── pages/        → Page components per role
└── routes/       → AppRoutes.jsx (centralized routing)
```

---

## Database Entities (49 entities)

### Structural
- `University`, `College`, `Department`, `Batch`, `Group`
- `AcademicYear`, `AcademicYearDepartment`, `Semester`
- `Subject`, `SubjectOffering`, `SubjectPrerequisite`, `ScheduleEntry`

### Users
- `SystemUser` (base), `Student`, `Doctor`, `Admin`, `TeachingAssistant`
- `SubjectDoctor`, `SubjectAssistant`

### Academic & Grading
- `Enrollment`, `SubjectOfferingWaitlist`
- `StudentAcademicStatus` (GPA, CGPA, Standing, WarningCount, EarnedCredits)
- `AcademicPolicy` (MaxHours, GPA thresholds)
- `Exam`, `ExamQuestion`, `ExamSubmission`, `StudentExamVariant`
- `StudentGrade`, `Regulation`, `RegulationSubject`

### Operational
- `AttendanceSession`, `StudentAttendance`
- `Material`, `StudentFile`, `UploadedFile`
- `ChatMessage`, `Conversation`, `AiMemory`
- `Complaint`, `ComplaintAnalysis`, `ComplaintCluster`
- `AppNotification`, `AuditLog`, `RefreshToken`

**Key patterns:** All entities use **ULID** IDs, all have a `Code` (public alphanumeric), all support **soft-delete** via `DeletedAt`.

---

## Complete API Reference (30 Controllers, ~120 endpoints)

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | Public | Login (rate-limited: 5/min/IP) |
| POST | `/refresh-token` | Public | Refresh JWT |
| POST | `/revoke-token` | Any | Logout / revoke refresh token |
| POST | `/change-password` | Any | Change password |
| GET | `/me` | Any | Get current user claims |
| POST | `/register/student` | Admin/SuperAdmin | Register student |
| POST | `/register/doctor` | Admin/SuperAdmin | Register professor |
| POST | `/register/admin` | SuperAdmin | Register admin |
| POST | `/admin/reset-password/{userId}` | Admin/SuperAdmin | Reset user password |

### University Structure (`/api/university`, `/api/colleges`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/university/structure` | Get flat university info |
| GET | `/university/full-structure` | Get entire nested structure |
| POST | `/university` | Create university |
| PUT | `/university/by-code/{code}` | Update university |
| DELETE | `/university/by-code/{code}` | Delete university |
| GET | `/colleges` | Get all colleges (paginated) |
| POST | `/colleges` | Create college |
| GET | `/colleges/by-code/{code}` | Get college by code |

### Academic Years & Semesters (`/api/academicyears`, `/api/semesters`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/academicyears` | List all academic years |
| POST | `/academicyears` | Create academic year |
| POST | `/academicyears/{id}/activate` | Activate year |
| GET | `/academicyears/{yearId}/departments` | Get active departments for year |
| POST | `/academicyears/{yearId}/departments` | Assign department to year |
| POST | `/semesters` | Create semester |
| GET | `/semesters/by-academic-year/{id}` | Get semesters by year |
| PUT | `/semesters/{id}` | Update semester |
| DELETE | `/semesters/{id}` | Delete semester |

### Subjects & Offerings (`/api/subjects`, `/api/subjectofferings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subjects/by-batch/{batchId}` | Get batch subjects |
| GET | `/subjects/by-department/{deptId}` | Get dept subjects |
| POST | `/subjects` | Create subject |
| PUT | `/subjects/{code}` | Update subject |
| DELETE | `/subjects/{code}` | Delete subject |
| GET | `/subjectofferings/my-offerings` | Professor's offerings |
| GET | `/subjectofferings/by-semester/{id}` | Offerings by semester |
| POST | `/subjectofferings` | Create offering |
| GET | `/subjectofferings/my-enrollments` | Student's enrollments |

### Students & Doctors (`/api/students`, `/api/doctors`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | All students (paginated) |
| GET | `/students/search?q=` | Search students |
| GET | `/students/filter` | Filtered list (dept/batch/group) |
| POST | `/students` | Create student |
| PATCH | `/students/{id}` | Update profile |
| DELETE | `/students/{code}` | Soft-delete student |
| GET | `/doctors` | All doctors (paginated) |
| GET | `/doctors/search?q=` | Search doctors |
| POST | `/doctors` | Create doctor |
| GET | `/doctors/{code}/subjects` | Doctor's subjects |

### Exams & Grading (`/api/exams`, `/api/grades`, `/api/gpa`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/exams/my-exams` | Doctor | Doctor's exams |
| POST | `/exams` | Doctor | Create structured exam |
| POST | `/exams/generate-ai` | Doctor | AI-generate exam from topics |
| POST | `/exams/upload-pdf` | Doctor | Upload PDF → AI extracts questions |
| GET | `/exams/{id}` | Any | Get exam details |
| PUT | `/exams/by-code/{code}` | Doctor | Update exam (status, title…) |
| DELETE | `/exams/by-code/{code}` | Doctor | Delete exam |
| GET | `/exams/my-enrolled-exams` | Student | Student's available exams |
| GET | `/exams/{id}/my-variant` | Student | Randomized question subset |
| POST | `/exams/{id}/submit` | Student | Submit answers |
| GET | `/exams/{id}/my-submission` | Student | View own submission |
| GET | `/exams/{id}/results` | Doctor | All submissions + scores |
| POST | `/exams/{id}/auto-grade` | Doctor | Auto-grade MCQ/TrueFalse |
| POST | `/exams/grade-submission` | Doctor | Manually grade essay |
| POST | `/grades/import/{offeringId}` | Doctor | Import grades from Excel |
| POST | `/grades/calculate/{offeringId}` | Doctor | Calculate final grades |
| GET | `/gpa/my-gpa` | Student | Get own GPA/CGPA |
| POST | `/gpa/student/{id}/recalculate` | Admin | Recalculate student GPA |

### Enrollment & Registration (`/api/enrollments`, `/api/registration`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/enrollments/auto-enroll` | Auto-enroll by curriculum |
| POST | `/enrollments/{offeringId}` | Manual enrollment |
| GET | `/enrollments/my-enrollments` | Student's courses |
| GET | `/registration/eligible-offerings` | Available courses to register |
| POST | `/registration/enroll/{offeringId}` | Enroll with eligibility check |
| POST | `/registration/waitlist/{offeringId}` | Join waitlist |
| GET | `/registration/academic-status` | GPA, standing, warnings |
| GET | `/registration/my-roadmap` | Degree plan roadmap |

### Schedule & Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/schedule/my-schedule` | Professor's weekly schedule |
| GET | `/schedule/batch/{batchId}` | Batch schedule |
| POST | `/schedule` | Create schedule entry |
| POST | `/attendance/sessions` | Create session |
| POST | `/attendance/check-in` | Student check-in |
| GET | `/attendance/student/{id}/report` | Attendance report |

### Materials & Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/materials/upload` | Upload course material (500 MB) |
| GET | `/materials/by-offering/{id}` | List materials (paginated) |
| GET | `/materials/download/{id}` | Download material |
| POST | `/studentfiles/upload` | Student file upload (30 MB) |
| GET | `/studentfiles/my` | Student's files |

### AI & Chat (`/api/chat`, `/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/conversations` | Create new conversation |
| GET | `/chat/conversations` | List conversations |
| POST | `/chat/messages` | Send message → AI reply |
| GET | `/chat/conversations/{id}/messages` | Message history |
| POST | `/ai/summarize` | AI summarize student file |
| POST | `/ai/ask` | Ask AI about a file |

### Complaints, Notifications, Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/complaints` | Submit complaint |
| GET | `/complaints/my-reports` | Doctor's received reports |
| GET | `/complaints/all` | Admin: all complaints |
| GET | `/complaints/clusters` | AI-clustered complaint themes |
| GET | `/notifications` | Get notifications |
| POST | `/notifications/send-to-my-students` | Broadcast to students |
| GET | `/analytics/summary` | System summary stats |
| GET | `/analytics/student-count-by-department` | Distribution |
| GET | `/analytics/doctor-workload` | Workload stats |
| GET | `/audit-logs` | Admin audit trail |

---

## Key Feature Flows

### Exam Flow (Doctor → Student)
1. Doctor creates exam (Structured / AI-generated / PDF upload)
2. Exam saved as **Draft** → Doctor reviews
3. Doctor publishes → status = **Published**
4. Students see exam in `/student/quizzes`
5. Students submit answers (MCQ/TrueFalse/Essay)
6. Doctor closes exam → status = **Closed**
7. Doctor runs Auto-Grade (MCQ/TrueFalse scored automatically)
8. Doctor manually grades Essay questions
9. Grades feed into `StudentGrade` → GPA recalculated

### Grade Calculation
- `FinalScore = MidtermScore + CourseworkScore + FinalExamScore + PlatformScore`
- Excel import for Midterm/Coursework
- Platform auto-calculates FinalExam from submissions
- GPA thresholds configurable via `AcademicPolicy`

### Enrollment Flow
1. Admin creates: University → College → Department → Batch → Group
2. Admin creates Academic Year → Semesters → Subject Offerings
3. Student registers for eligible offerings (prerequisite check)
4. Waitlist system if offering is full
5. Auto-enrollment available based on curriculum regulations

### AI Integration
- Chat assistant: contextual answers using student's academic profile
- Exam generation: `POST /exams/generate-ai` with topics + difficulty
- PDF exam: `POST /exams/upload-pdf` → FastAPI parses PDF → returns questions
- Complaint analysis: AI clusters similar complaints, generates reports
- Document Q&A: Students ask questions about uploaded files

---

## Security

- **JWT Bearer (HS256):** Access token (short-lived) + Refresh token (stored, revocable)
- **RBAC:** Every endpoint decorated with `[Authorize(Roles="...")]`
- **Rate limiting:** 1000 req/min global, 5/min on `/auth/login`, 10/min on sensitive ops
- **MustChangePassword flag:** Forces password change on first login
- **Audit logging:** All mutations logged with user, timestamp, entity
- **Soft delete:** Data never permanently removed (DeletedAt timestamp)

---

## What to Document

Please generate the following documentation sections:

### 1. Executive Summary (1 page)
What the system does, who it serves, and what problems it solves.

### 2. System Architecture (with diagram description)
- Frontend architecture (component hierarchy, routing, API layer)
- Backend architecture (Clean Architecture layers, data flow)
- Infrastructure diagram (Railway, R2, Redis, RabbitMQ, FastAPI AI)
- Database ER overview (entity groups and relationships)

### 3. Functional Requirements
For each user role, list all functional requirements as numbered FR-XXX items.

### 4. Non-Functional Requirements
Performance, security, scalability, availability, maintainability.

### 5. Database Design
For each entity group, describe the key tables and their relationships. Highlight important design decisions (ULID, soft-delete, Code field pattern).

### 6. API Documentation
Format each endpoint group as a section with: Purpose, Endpoint, Method, Auth required, Request body (key fields), Response format, Example use case.

### 7. Frontend Pages & User Flows
For each role, describe the screens available and the primary user journeys with step-by-step flows.

### 8. AI & Intelligent Features
Describe the AI integration architecture, FastAPI service role, and each AI-powered feature.

### 9. Security Design
Authentication flow, authorization model, rate limiting strategy, audit trail.

### 10. Deployment & Infrastructure
Railway deployment, Docker setup, environment configuration, health checks, background jobs.

### 11. Testing Considerations
Suggested test strategy (unit, integration, E2E) for key flows.

### 12. Conclusion & Future Work
What the system achieves and what could be added next.

---

## Output Format

- Use **Markdown** with clear headings (H1/H2/H3)
- Use **tables** for API endpoints, entity fields, and comparisons
- Use **numbered lists** for requirements and steps
- Use **code blocks** for example request/response payloads
- Keep language **formal and professional** (graduation thesis style)
- Target length: **30–50 pages** equivalent

Start with Section 1 and work through all sections sequentially. If any section requires a diagram, describe it as a textual diagram using ASCII or a structured description that can be converted to a tool like draw.io or Mermaid.
