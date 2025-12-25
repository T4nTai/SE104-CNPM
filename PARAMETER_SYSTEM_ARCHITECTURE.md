# Parameter Integration Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN UI (Frontend)                          │
│                   ParameterSettings.tsx                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ PUT /admin/namhoc/:MaNH/thamso
                         │ {gradeWeight: {oral, main15p, midterm, final}}
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     ADMIN SERVICE                                │
│    admin.service.js                                              │
│    ├─ mapThamSoPayload()    [Convert FE to DB format]           │
│    └─ validateThamSo()      [Validate all parameters]           │
│       ├─ Type checking      (decimal for weights)               │
│       ├─ Range checking     (0-100 for weights)                 │
│       └─ Sum validation     (must equal 100)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Validated data
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   DATABASE (THAMSO)                              │
│                                                                  │
│  TuoiToiThieu          → minAge      [Used by: Student Service]│
│  TuoiToiDa             → maxAge      [Used by: Student Service]│
│  SiSoToiDa             → maxStudents [Used by: Student Service]│
│  DiemDatMon            → passSubject [Used by: Report Service] │
│  DiemDat               → passSemester[Used by: Report Service] │
│  HesoMieng             → oral weight [Used by: Teacher Service]│
│  HesoChinh15p          → 15min weight[Used by: Teacher Service]│
│  HesoGiuaky            → midterm wt  [Used by: Teacher Service]│
│  HesoCuoiky            → final weight[Used by: Teacher Service]│
│  MaNamHoc              → academic yr [Used by: All Services]   │
└──┬──────────────────────────────────────────────────────────┬──┘
   │                                                             │
   │                     ┌─────────────────────────────────────┘
   │                     │
   │  Query ThamSo      │
   │  WHERE MaNamHoc=?  │
   │                     │
┌──▼──────────────────────────────────────────────────────────────┐
│                  ENFORCEMENT SERVICES                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TEACHER SERVICE: addStudentToClass()                    │   │
│  │                                                          │   │
│  │  IF NgaySinh provided:                                 │   │
│  │    age = calculateAge(NgaySinh)                         │   │
│  │    IF age < TuoiToiThieu → ERROR                       │   │
│  │    IF age > TuoiToiDa → ERROR                          │   │
│  │                                                          │   │
│  │  IF adding to class:                                   │   │
│  │    current = count students in class                   │   │
│  │    IF current + 1 > SiSoToiDa → ERROR                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TEACHER SERVICE: enterGradebook()                       │   │
│  │                                                          │   │
│  │  IF HesoMieng OR HesoChinh15p OR ... is set:           │   │
│  │    1. Group scores by category (mieng, 15p, etc.)      │   │
│  │    2. Calculate category avg (weighted by LHKT)        │   │
│  │    3. Apply category weights from THAMSO               │   │
│  │    4. Compute DiemTBMon = Σ(catAvg * hesoWeight)      │   │
│  │  ELSE:                                                  │   │
│  │    Use legacy LHKT-only weighting (backward compat)    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ REPORT SERVICE: reportBySemesterAndClass()             │   │
│  │ REPORT SERVICE: reportBySubject()                       │   │
│  │                                                          │   │
│  │  Pass threshold = DiemDat (for semester) or            │   │
│  │                  DiemDatMon (for subject)              │   │
│  │  Count students where DiemTBHK/DiemTBMon >= threshold  │   │
│  │  Calculate pass rate = passed / total * 100            │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘


OPERATION: Add Student to Class
════════════════════════════════════════════════════════════════════

  Request: POST /teacher/classes/{MaLop}/semesters/{MaHocKy}/students
           { MaHocSinh, HoTen, NgaySinh, GioiTinh, ... }
                │
                ├─► Query Lop(MaLop) → Get MaNamHoc
                │       │
                │       └─► Query ThamSo(MaNamHoc)
                │
                ├─► Calculate age from NgaySinh
                │       │
                │       ├─► IF age < TuoiToiThieu
                │       │   └─► Return ERROR 400
                │       │
                │       └─► IF age > TuoiToiDa
                │           └─► Return ERROR 400
                │
                ├─► Count current HocSinhLop(MaLop, MaHocKy)
                │       │
                │       └─► IF count + 1 > SiSoToiDa
                │           └─► Return ERROR 400
                │
                └─► Create HocSinhLop record
                    └─► Return HTTP 201 SUCCESS


OPERATION: Enter Grades for a Subject
════════════════════════════════════════════════════════════════════

  Request: POST /teacher/gradebooks/enter
           {
             MaLop, MaHocKy, MaMon,
             scores: [{
               MaHocSinh,
               details: [
                 { MaLHKT: 1, Lan: 1, Diem: 8 },    // oral: 8
                 { MaLHKT: 2, Lan: 1, Diem: 9 },    // 15p: 9
                 { MaLHKT: 4, Lan: 1, Diem: 7 },    // midterm: 7
                 { MaLHKT: 5, Lan: 1, Diem: 8 }     // final: 8
               ]
             }]
           }
                │
                ├─► Preload LoaiHinhKiemTra (all exam types)
                │   └─► Build weightMap[MaLHKT] = HeSo
                │
                ├─► Query Lop(MaLop) → Get MaNamHoc
                │   │
                │   └─► Query ThamSo(MaNamHoc)
                │       └─► Get HesoMieng, HesoChinh15p, etc.
                │
                ├─► For each student score:
                │
                ├──► Check if THAMSO weights are set
                │    │
                │    YES ─►  USE CATEGORY-BASED CALCULATION
                │    │       │
                │    │       ├─► Classify each exam into category
                │    │       │   (1→mieng, 2→15p, 4→giuaky, 5→cuoiky)
                │    │       │
                │    │       ├─► For each category:
                │    │       │   catAvg = Σ(score × LHKT_Heso) / Σ(LHKT_Heso)
                │    │       │
                │    │       ├─► Apply category weights from THAMSO:
                │    │       │   DiemTBMon = Σ(catAvg × catWeight) / Σ(catWeight)
                │    │       │
                │    │       └─► Save DiemTBMon to CTBangDiemMonHocSinh
                │    │
                │    NO  ─►  USE LEGACY LHKT-ONLY CALCULATION
                │           │
                │           ├─► DiemTBMon = Σ(score × LHKT_Heso) / Σ(LHKT_Heso)
                │           │
                │           └─► Save DiemTBMon to CTBangDiemMonHocSinh
                │
                └─► Recalculate DiemTBHK for all students in class
                    └─► Update HocSinhLop with new DiemTBHK


OPERATION: Generate Semester Report
════════════════════════════════════════════════════════════════════

  Request: GET /admin/reports/semester?MaHocKy={x}&MaNamHoc={y}&MaLop={z}
                │
                ├─► Query ThamSo(MaNamHoc) → Get DiemDat
                │
                ├─► Get all HocSinhLop(MaLop, MaHocKy)
                │
                ├─► Count students with DiemTBHK >= DiemDat
                │   │
                │   ├─► SoLuongDat = count
                │   └─► TiLeDat = (SoLuongDat / Total) × 100%
                │
                ├─► Classify students into brackets (Xuất sắc, Giỏi, etc.)
                │
                └─► Return report with pass rate


CALCULATION EXAMPLE: Weighted Average with Category Weights
════════════════════════════════════════════════════════════════════

  Input (THAMSO):  HesoMieng=20%, HesoChinh15p=30%, HesoGiuaky=25%, HesoCuoiky=25%
  Input (Exams):   Oral=8, 15min=9, Midterm=7, Final=8

  Step 1: Calculate category averages (assuming each has one exam for simplicity)
    catAvg[mieng] = 8
    catAvg[15p] = 9
    catAvg[giuaky] = 7
    catAvg[cuoiky] = 8

  Step 2: Apply category weights
    DiemTBMon = (8×0.20 + 9×0.30 + 7×0.25 + 8×0.25) / (0.20+0.30+0.25+0.25)
              = (1.6 + 2.7 + 1.75 + 2.0) / 1.0
              = 8.05

  Result: DiemTBMon = 8.05

```

---

## Data Flow Summary

### Input Path (Admin → Database)
```
ParameterSettings UI
    ↓
Frontend API: upsertParameters()
    ↓
Backend: PUT /admin/namhoc/:MaNH/thamso
    ↓
admin.service.js: mapThamSoPayload()
    ↓
admin.service.js: validateThamSo()
    ↓
Database: THAMSO table (INSERT/UPDATE)
```

### Enforcement Paths (Database → Operations)
```
Database: THAMSO
    ↓
    ├─► teacher.service.js: addStudentToClass()
    │   └─► Age & Class Size Enforcement
    │
    ├─► teacher.service.js: enterGradebook()
    │   └─► Grade Weight Application
    │
    └─► report.service.js: reportBySemesterAndClass/reportBySubject()
        └─► Pass Rate Calculation
```

---

## Parameter Mapping Reference

### Frontend → Backend Mapping
```
Frontend (ParameterSettings.tsx)  →  Backend (admin.service.js)
─────────────────────────────────     ──────────────────────────
minAge                            →   TuoiToiThieu
maxAge                            →   TuoiToiDa
maxStudentsPerClass               →   SiSoToiDa
minPassScore                      →   DiemToiThieu
maxScore                          →   DiemToiDa
subjectPassScore                  →   DiemDatMon
semesterPassScore                 →   DiemDat
gradeWeight.oral                  →   HesoMieng
gradeWeight.main15p               →   HesoChinh15p
gradeWeight.midterm               →   HesoGiuaky
gradeWeight.final                 →   HesoCuoiky
```

### Database Column Names (THAMSO)
```
PascalCase (Code)     Snake_Case (Database)
──────────────────    ──────────────────────
TuoiToiThieu          Tuoi_Toi_Thieu
TuoiToiDa             Tuoi_Toi_Da
SiSoToiDa             Si_So_Toi_Da
DiemToiThieu          Diem_Toi_Thieu
DiemToiDa             Diem_Toi_Da
DiemDatMon            Diem_Dat_Mon
DiemDat               Diem_Dat
HesoMieng             Heso_Mieng
HesoChinh15p          Heso_Chinh_15p
HesoGiuaky            Heso_Giua_ky
HesoCuoiky            Heso_Cuoi_ky
MaNamHoc              Ma_Nam_Hoc
```

---

## Error Handling Flow

```
API Request
    ↓
VALIDATION LAYER (validateThamSo, validate form data)
    ├─ Type validation fails
    │  └─→ HTTP 400: "{field} phải là số nguyên/thập phân"
    │
    ├─ Range validation fails
    │  └─→ HTTP 400: "{field} phải trong khoảng [min..max]"
    │
    ├─ Sum validation fails (weights)
    │  └─→ HTTP 400: "Tổng của các hệ số trọng số phải bằng 100 (hiện tại: X)"
    │
    └─ Logic validation fails (age, class size)
       └─→ HTTP 400: "{field} phải >= X" / "{field} phải <= X"

    ↓ (if validations pass)

ENFORCEMENT LAYER (age check, class size check, weight calculation)
    ├─ Age validation fails
    │  └─→ HTTP 400: "Tuổi học sinh (X) phải >= Y" or "phải <= Z"
    │
    ├─ Class size check fails
    │  └─→ HTTP 400: "Vượt sĩ số tối đa của lớp"
    │
    └─ Calculation proceeds normally
       └─→ HTTP 200/201: Success

DATABASE
    └─→ Data persisted / Scores calculated with weights
```
