# دليل الـ Upload الكامل — University Management System
## لفريق الفرونت اند

---

## الفكرة العامة (اقرأها الأول)

كل الـ uploads في النظام بتروح على **Cloudflare R2** (زي AWS S3 بس أرخص).

```
المستخدم يختار ملف
  → الفرونت يبعت multipart/form-data
  → الـ .NET backend يستقبله ويتحقق منه
  → يرفعه على R2 ويحفظ الـ storage key في الـ DB
  → بيرجع للفرونت ID + URL

لما المستخدم يحتاج يحمّل الملف:
  → الفرونت يطلب من الـ backend
  → الـ backend يعمل signed URL (صالحة 60 دقيقة)
  → الفرونت يفتح الـ URL مباشرة ← R2 يبعت الملف
  (البيانات متعدّيش أبداً على الـ backend عند التحميل)
```

---

## جدول كل الـ Endpoints دفعة واحدة

| Endpoint | الدور | أقصى حجم | الأنواع المسموحة | عملية فورية؟ |
|----------|-------|-----------|-----------------|--------------|
| `POST /api/Materials/upload` | Doctor | **500 MB** | PDF, Word, PPT, Excel, صور, فيديو, ZIP | ✅ فوري |
| `POST /api/File/upload` | أي مستخدم | **50 MB** | PDF, Office, صور, CSV, ZIP | ✅ فوري |
| `POST /api/StudentFiles/upload` | Student | **30 MB** | PDF, Word, Excel, صور | ✅ فوري |
| `POST /api/Students/import-excel` | Admin | بدون حد | **.xlsx فقط** | ✅ فوري |
| `POST /api/Students/bulk-upload-direct` | Admin | **20 MB** | Excel, PDF, CSV, Text | ⏳ أسينكرونوس |
| `POST /api/Students/bulk-upload-ai` | Admin | **20 MB** | Excel, PDF, CSV, Text | ⏳ أسينكرونوس |
| `POST /api/Doctors/bulk-upload` | Admin | **20 MB** | Excel, PDF, CSV, Text | ⏳ أسينكرونوس |
| `POST /api/Grades/import/{offeringId}` | Doctor / Admin | **50 MB** | Excel | ✅ فوري |
| `POST /api/Exams/upload-pdf` | Doctor | بدون حد | PDF | ✅ فوري |
| `POST /api/Regulations` | Admin / SuperAdmin | **50 MB** | PDF, Word, Excel, Text | ✅ فوري |

---

## 1. رفع المواد التعليمية (Materials)

### مين يرفع؟
Doctor فقط — لازم يكون عنده `role: "Doctor"` في الـ JWT.

### الـ Endpoint

```
POST /api/Materials/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### الـ Form Fields

| الحقل | النوع | مطلوب؟ | الوصف |
|-------|-------|---------|-------|
| `OfferingId` | string (ULID) | ✅ | الـ SubjectOffering اللي المادة دي تابعاله |
| `File` | file | ✅ | الملف نفسه |

### الأنواع المسموحة

```
✅ مسموح:
  application/pdf                                                    → PDF
  application/msword                                                 → .doc
  application/vnd.openxmlformats-officedocument.wordprocessingml.document → .docx
  application/vnd.ms-powerpoint                                     → .ppt
  application/vnd.openxmlformats-officedocument.presentationml.presentation → .pptx
  application/vnd.ms-excel                                          → .xls
  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet → .xlsx
  image/jpeg  image/png  image/gif                                   → صور
  video/mp4   video/webm                                             → فيديو
  text/plain                                                         → txt
  application/zip                                                    → zip

❌ مش مسموح: أي حاجة تانية (exe, rar, mp3, ...)
```

### أقصى حجم
**500 MB** — ضخم عشان الفيديوهات والمحاضرات.

### كود الفرونت (مثال)

```javascript
async function uploadMaterial(offeringId, file) {
  const formData = new FormData();
  formData.append('OfferingId', offeringId);
  formData.append('File', file);

  const response = await fetch('/api/Materials/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // لا تحط Content-Type يدوياً — المتصفح يحدده مع boundary تلقائياً
    },
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err);
  }
  return await response.json(); // MaterialDto
}
```

### الـ Response (201 Created)

```json
{
  "id": "01JMAT...",
  "fileName": "Lecture-01-DataStructures.pdf",
  "contentType": "application/pdf",
  "fileSize": 2048576,
  "uploadedAt": "2026-05-14T10:30:00Z",
  "uploadedByDoctor": "Dr. Khaled Hassan",
  "subjectOfferingId": "01JOFFER..."
}
```

### الأخطاء المحتملة

| Status | السبب |
|--------|-------|
| `400` | ما فيش ملف / الملف فاضي |
| `400` | نوع الملف مش مسموح |
| `400` | الملف أكبر من 500 MB |
| `401` | مفيش token أو انتهى |
| `403` | الدكتور مش معين على الـ offering دي |
| `404` | الـ OfferingId مش موجود |

### كيف الطالب يحمّل المادة؟

```
// خطوة 1: جيب قايمة المواد
GET /api/Materials/by-offering/{offeringId}?page=1&pageSize=10

// خطوة 2: لما الطالب يضغط تحميل
GET /api/Materials/download/{materialId}
← Response: { "SignedUrl": "https://r2.cloudflare.com/...?X-Amz-Signature=...", "ExpiresInMinutes": 60 }

// خطوة 3: افتح الـ URL في المتصفح
window.open(response.SignedUrl, '_blank');
```

> ⚠️ **مهم:** الـ SignedUrl بتنتهي بعد 60 دقيقة. ما تخزنهاش في state — كل ما الطالب عايز يحمّل، اعمل request جديد.

---

## 2. رفع ملف عام (General File Upload)

### مين يرفع؟
أي مستخدم عنده token صالح.

### الـ Endpoint

```
POST /api/File/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### الـ Form Fields

| الحقل | النوع | مطلوب؟ |
|-------|-------|---------|
| `file` | file | ✅ |

> لاحظ: اسم الحقل صغير `file` (مش `File`).

### الأنواع المسموحة

```
PDF, Word (doc/docx), Excel (xls/xlsx)
صور: jpeg, png, gif, webp
Text, CSV, ZIP
```

### أقصى حجم
**50 MB**

### الـ Response (200)

```json
{
  "fileId": "01JFILE...",
  "fileName": "data.xlsx",
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "size": 102400,
  "url": "https://pub-xxx.r2.dev/files/abc123_data.xlsx"
}
```

### Endpoints تانية متعلقة

```
GET    /api/File              ← قايمة ملفاتي
PUT    /api/File/{id}/rename  ← Admin فقط
DELETE /api/File/{id}         ← Admin فقط (soft delete)
```

---

## 3. رفع ملف طالب (للتحليل بالـ AI)

### مين يرفع؟
Student فقط — لأغراض الـ AI (تلخيص، شرح، استخراج).

### الـ Endpoint

```
POST /api/StudentFiles/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### الـ Form Fields

| الحقل | النوع | مطلوب؟ |
|-------|-------|---------|
| `file` | file | ✅ |

### الأنواع المسموحة

```
PDF, Word (doc/docx), Excel (xls/xlsx)
صور: jpeg, png, webp  (مش gif!)
```

### أقصى حجم
**30 MB**

### ميزة مخفية — Text Extraction التلقائي

لو الطالب رفع ملف `.txt`:
- الـ backend بيقرأ الـ 50,000 حرف الأول تلقائياً
- بيحطهم في `ExtractedText` في الـ DB
- الـ AI بيستخدم النص دا مباشرة بدون ما يفضل يفتح الملف تاني

### الـ Response (200)

```json
{
  "fileId": "01JSTUF...",
  "fileName": "my-notes.pdf",
  "size": 2097152,
  "textExtracted": false
}
```

- `textExtracted: true` → النص اتاخد مباشرة (TXT files)
- `textExtracted: false` → الـ AI هيشتغل على الملف من R2

### بعد رفع الملف — كيف الطالب يستخدمه مع الـ AI؟

```
// الطالب يرفع الملف
POST /api/StudentFiles/upload → { fileId: "01JSTUF..." }

// بعدين يبعت رسالة في الـ chat:
POST /api/Chat/messages {
  conversationId: "01JCONV...",
  message: "لخصلي الملف ده",
  fileId: "01JSTUF..."   ← لو الـ ChatService بيدعم ده
}
```

---

## 4. استيراد الطلاب من Excel (فوري)

### مين يرفع؟
Admin فقط.

### الـ Endpoint

```
POST /api/Students/import-excel
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### الـ Form Fields

| الحقل | النوع | مطلوب؟ | الشرط |
|-------|-------|---------|-------|
| `file` | file | ✅ | لازم `.xlsx` (extension فقط، مش MIME) |

### شكل ملف الـ Excel المطلوب

| FullName | Email | NationalId | Phone | UniversityStudentId | BatchCode | GroupCode |
|----------|-------|------------|-------|--------------------|-----------|-----------| 
| Ahmed Ali | ahmed@uni.edu | 12345678901234 | 01012345678 | 20260001 | BATCH-CS-2026 | GROUP-A |

> ⚠️ أسماء الأعمدة بالظبط زي كده — case-sensitive.

### الـ Response (200)

```json
{
  "success": true,
  "imported": 45,
  "failed": 2,
  "errors": [
    "Row 10: National ID already exists",
    "Row 23: BatchCode 'BATCH-XX' not found"
  ]
}
```

### الأخطاء المحتملة

| Status | السبب |
|--------|-------|
| `400` | الامتداد مش `.xlsx` |
| `400` | ملف فاضي |
| `400` | اسم عمود غلط في الـ Excel |

---

## 5. الاستيراد المجمّع بالخلفية (Async Bulk Upload)

### الفرق عن الاستيراد الفوري

| | Import Excel (فوري) | Bulk Upload (خلفية) |
|--|---------------------|---------------------|
| **الاستجابة** | ينتظر ويرجع النتيجة | يرجع فوراً بـ JobId |
| **الوقت** | ثوان | دقائق |
| **الحجم الأقصى** | بدون حد واضح | 20 MB |
| **المعالجة** | في الـ request نفسه | Hangfire background job |
| **الأنسب لـ** | ملفات صغيرة | ملفات كبيرة / بيانات كتيرة |

### Endpoints الثلاث

```
POST /api/Students/bulk-upload-direct   ← طلاب (معالجة مباشرة)
POST /api/Students/bulk-upload-ai       ← طلاب (معالجة بالـ AI)
POST /api/Doctors/bulk-upload           ← دكاترة
```

### الـ Form Fields

| الحقل | النوع | مطلوب؟ |
|-------|-------|---------|
| `file` | file | ✅ |

### الأنواع المسموحة
Excel, PDF, CSV, Text — أقصى **20 MB**

### الـ Response (202 Accepted)

```json
{
  "jobId": "01JJOB...",
  "message": "File accepted for direct processing"
}
```

### كيف الفرونت يتابع الـ Job؟

```javascript
// ابعت الملف
const res = await uploadBulk(file);
const jobId = res.jobId;

// استنى وتابع
// الـ backend ما عندوش polling endpoint معروف —
// ممكن تعمل polling على حالة الملف:
// GET /api/File/{jobId}  ← لو ValidationStatus اتغير لـ "Ready" يبقى خلص

// أو تعرض رسالة للـ Admin:
// "تم استلام الملف — هيتعالج في الخلفية. هيوصلك إشعار لما يخلص."
```

> ⚠️ **ملاحظة للفرونت:** في الوقت الحالي ما فيش webhook أو SSE للـ job status. اعرض رسالة للـ Admin إنه يستنى وياخد إشعار.

---

## 6. استيراد الدرجات من Excel

### مين يرفع؟
Doctor أو Admin.

### الـ Endpoint

```
POST /api/Grades/import/{offeringId}
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Route Param

| الحقل | النوع | مطلوب؟ |
|-------|-------|---------|
| `offeringId` | string (ULID) | ✅ |

### الـ Form Fields

| الحقل | النوع | مطلوب؟ |
|-------|-------|---------|
| `file` | file | ✅ |

### شكل ملف Excel الدرجات

| StudentCode | AssignmentGrade | MidGrade | ParticipationGrade | FinalGrade |
|-------------|----------------|----------|-------------------|------------|
| STU20260001 | 20 | 25 | 5 | 40 |
| STU20260002 | 18 | 22 | 4 | 35 |

**مجموع الدرجات:** `Assignment + Mid + Participation + Final = Total`

**الـ LetterGrade يتحسب تلقائياً:**
```
90+ → A
80+ → B
70+ → C
60+ → D
أقل → F
```

### الـ Response (200)

```json
{
  "imported": 98,
  "failed": 2,
  "errors": [
    "Row 5: Student code 'STU999' not found"
  ],
  "uploadedFileId": "01JFILE..."
}
```

### ماذا يحدث داخلياً؟

```
Doctor يرفع Excel
  → الملف يتحفظ على R2 كـ archive (backup)
  → ExcelImportService يقرأ الصفوف
  → لكل طالب: upsert StudentGrade record
  → GradeService.CalculateGradesForOfferingAsync() يتنادى تلقائياً
  → GPA كل طالب يتعاد حسابه فوراً
```

---

## 7. رفع امتحان PDF

### مين يرفع؟
Doctor فقط.

### الـ Endpoint

```
POST /api/Exams/upload-pdf?subjectOfferingId={offeringId}
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Query Param

| الحقل | النوع | مطلوب؟ |
|-------|-------|---------|
| `subjectOfferingId` | string (ULID) | ✅ |

### الـ Form Field

| الحقل | النوع | مطلوب؟ |
|-------|-------|---------|
| `file` | file | ✅ (PDF) |

### الـ Response (201)

```json
{
  "id": "01JEXAM...",
  "code": "EXAM-CS301-001",
  "title": "Midterm Exam",
  "type": "PDF",
  "filePath": "exams/abc123_midterm.pdf",
  "status": "Draft",
  "subjectOfferingId": "01JOFFER..."
}
```

---

## 8. رفع وثيقة اللوائح (Regulations)

### مين يرفع؟
Admin أو SuperAdmin.

### الـ Endpoint

```
POST /api/Regulations
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### الـ Form Fields

| الحقل | النوع | مطلوب؟ | ملاحظات |
|-------|-------|---------|---------|
| `title` | string | ✅ | عنوان اللائحة |
| `content` | string | ✅ أو `file` | النص النصي للائحة |
| `type` | string (enum) | ✅ | `Academic` / `Administrative` / إلخ |
| `file` | file | ✅ أو `content` | ملف PDF/Word |
| `departmentId` | string (ULID) | ❌ | لو اللائحة خاصة بقسم |
| `subjectsJson` | string (JSON) | ❌ | مصفوفة أكواد المواد المرتبطة |

> إما `content` أو `file` — لازم واحد منهم على الأقل موجود.

### مثال على `subjectsJson`

```json
["CS301", "CS302", "CS401"]
```

ابعته كـ string مع الـ form:
```javascript
formData.append('subjectsJson', JSON.stringify(['CS301', 'CS302']));
```

### الأنواع المسموحة للملف

```
application/pdf
application/msword / .docx
application/vnd.ms-excel / .xlsx
text/plain
```

### أقصى حجم
**50 MB**

### الـ Response (201)

```json
{
  "id": "01JREG...",
  "title": "Academic Integrity Policy 2026",
  "content": "...",
  "type": "Academic",
  "isActive": true,
  "fileId": "01JFILE...",
  "fileUrl": "https://pub-xxx.r2.dev/files/abc_policy.pdf",
  "departmentId": null,
  "subjects": [
    { "subjectCode": "CS301", "subjectName": "Data Structures" }
  ]
}
```

---

## قواعد مهمة جداً للفرونت اند

### ❶ لا تحط `Content-Type` يدوياً في الـ Headers

```javascript
// ❌ غلط — هيكسر الـ boundary
headers: { 'Content-Type': 'multipart/form-data' }

// ✅ صح — سيب المتصفح يحدده تلقائياً
const formData = new FormData();
formData.append('File', file);
fetch(url, { method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` } });
```

---

### ❷ تحقق من الملف قبل الإرسال (Client-side Validation)

```javascript
function validateFile(file, options) {
  const { maxSizeMB, allowedTypes } = options;

  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`الملف أكبر من ${maxSizeMB} MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`نوع الملف "${file.type}" مش مدعوم`);
  }
}

// مثال للاستخدام مع المواد التعليمية:
validateFile(selectedFile, {
  maxSizeMB: 500,
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'image/gif',
    'video/mp4', 'video/webm',
    'text/plain', 'application/zip'
  ]
});
```

---

### ❸ Progress Bar للملفات الكبيرة

```javascript
async function uploadWithProgress(url, formData, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.responseText));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));

    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

// الاستخدام:
await uploadWithProgress(
  '/api/Materials/upload',
  formData,
  token,
  (percent) => setUploadProgress(percent)  // setState في React
);
```

---

### ❹ الـ Signed URLs — قواعد صارمة

```
✅ افعل:
  - اطلب signed URL كل مرة قبل التحميل مباشرة
  - استخدم window.open(signedUrl) أو <a href={signedUrl} download>
  - ما تعرضش الـ URL للمستخدم مباشرة

❌ لا تفعل:
  - ما تخزنش الـ signedUrl في الـ state أو localStorage
  - ما تستخدمش الـ URL بعد ما الـ user يفضل على الصفحة أكتر من ساعة
  - ما تعملش fetch على الـ signedUrl (إلا لو عايز تعمل download تلقائي)
```

---

### ❺ التعامل مع Async Jobs (Bulk Upload)

```javascript
async function bulkUploadStudents(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/Students/bulk-upload-direct', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const { jobId, message } = await response.json();
  // response.status = 202

  // عرض للـ Admin:
  showNotification(`✅ تم استلام الملف. معرّف العملية: ${jobId}. هيتعالج في الخلفية.`);

  // اختياري — polling للحالة:
  pollJobStatus(jobId);
}

async function pollJobStatus(jobId) {
  const interval = setInterval(async () => {
    const file = await fetch(`/api/File/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    if (file.validationStatus === 'Ready') {
      clearInterval(interval);
      showNotification('✅ تم معالجة الملف بنجاح!');
    } else if (file.validationStatus === 'Failed') {
      clearInterval(interval);
      showNotification('❌ فشل معالجة الملف. تحقق من محتواه.');
    }
  }, 5000); // كل 5 ثوان
}
```

---

## الـ DB Entities اللي بتتعامل معاها (للفهم مش للاستخدام المباشر)

```
UploadedFile          ← أساس كل الملفات
  ├── id (ULID)
  ├── fileName
  ├── storageKey       ← المفتاح على R2 (مش الـ URL)
  ├── contentType
  ├── fileSizeBytes
  ├── uploadedByUserId → SystemUser
  ├── validationStatus → "Ready" | "Processing" | "Failed"
  └── deletedAt        ← soft delete

Material              ← مواد الدروس التعليمية
  ├── id (ULID)
  ├── fileName
  ├── storageKey
  ├── subjectOfferingId → SubjectOffering
  ├── uploadedByDoctorId → Doctor
  ├── fileId           → UploadedFile
  └── deletedAt

StudentFile           ← ملفات الطلاب للـ AI
  ├── id (ULID)
  ├── fileName
  ├── storageKey
  ├── uploadedByStudentId → Student
  ├── extractedText    ← النص المستخرج (TXT files)
  └── deletedAt
```

---

## ملخص شامل — كل endpoint في سطرين

```
POST /api/Materials/upload          → Doctor | 500MB | PDF+Office+Video | رفع مادة للكورس
GET  /api/Materials/by-offering/:id → Student/Doctor/Admin | قايمة مواد الكورس
GET  /api/Materials/download/:id    → Student/Doctor/Admin | signed URL للتحميل (60 دقيقة)
GET  /api/Materials/:id/metadata    → أي مستخدم | بيانات الملف + signed URL

POST /api/File/upload               → أي مستخدم | 50MB | PDF+Office+صور | ملف عام
GET  /api/File                      → أي مستخدم | قايمة ملفاتي

POST /api/StudentFiles/upload       → Student | 30MB | PDF+Office+صور | للـ AI
GET  /api/StudentFiles/my           → Student | قايمة ملفاتي

POST /api/Students/import-excel     → Admin | xlsx | استيراد طلاب فوري
POST /api/Students/bulk-upload-direct → Admin | 20MB | استيراد طلاب في الخلفية
POST /api/Students/bulk-upload-ai   → Admin | 20MB | استيراد طلاب بالـ AI في الخلفية
POST /api/Doctors/bulk-upload       → Admin | 20MB | استيراد دكاترة في الخلفية

POST /api/Grades/import/:offeringId → Doctor/Admin | 50MB | xlsx | استيراد درجات + حساب GPA
POST /api/Exams/upload-pdf          → Doctor | PDF | رفع امتحان PDF

POST /api/Regulations               → Admin | 50MB | PDF+Office | رفع لائحة
PUT  /api/Regulations/:id           → Admin | تعديل لائحة مع استبدال الملف
```

---

*آخر تحديث: 14 مايو 2026*
