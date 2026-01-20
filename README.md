# Coowned-dashboard
Our new client wants to build a fractional ownership app where users can buy shares in real estate units. This includes a mobile app for users and an admin dashboard for backend operations. We will build it on top of our Brokers Hub infrastructure.

## Attendance + Engagement (Firebase-only)

### New collections
- offerings/{offeringId}
- sessions/{sessionId}
- attendance/{sessionId}_{studentId}
- attendanceAgg_session/{sessionId}
- engagementAgg/{sessionId}_{studentId}

### Example documents

offerings/{offeringId}
```json
{
  "collegeId": "college_1",
  "yearId": "year_2",
  "departmentId": "dept_10",
  "courseId": "CS101",
  "termId": "2026-spring",
  "section": "A",
  "instructorId": "prof_uid",
  "roomId": "room_12",
  "createdAt": "serverTimestamp"
}
```

sessions/{sessionId}
```json
{
  "offeringId": "offering_abc",
  "startTime": "Timestamp",
  "endTime": "Timestamp",
  "createdBy": "instructor_uid",
  "createdAt": "serverTimestamp"
}
```

attendance/{sessionId}_{studentId}
```json
{
  "sessionId": "session_123",
  "offeringId": "offering_abc",
  "studentId": "student_uid",
  "status": "present",
  "method": "manual",
  "checkInAt": "serverTimestamp",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

attendanceAgg_session/{sessionId}
```json
{
  "sessionId": "session_123",
  "offeringId": "offering_abc",
  "presentCount": 18,
  "lateCount": 2,
  "absentCount": 3,
  "excusedCount": 1,
  "enrolledCount": 24,
  "attendanceRate": 0.75,
  "updatedAt": "serverTimestamp"
}
```

engagementAgg/{sessionId}_{studentId}
```json
{
  "sessionId": "session_123",
  "offeringId": "offering_abc",
  "studentId": "student_uid",
  "samplesCount": 120,
  "focusedCount": 85,
  "distractedCount": 20,
  "awayCount": 15,
  "focusPct": 0.71,
  "awayPct": 0.12,
  "updatedAt": "serverTimestamp"
}
```

### How it works
- setAttendance (callable) upserts attendance records.
- onWrite trigger recomputes attendanceAgg_session per session.
- EngagementTracker aggregates focus every 10 seconds and calls pushEngagement.

Notes
- Aggregation functions are at-least-once; recompute logic is idempotent.
- Engagement aggregation stores only counters (no images or video).
