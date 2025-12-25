// Subject grades for student transcript
export interface GradeRecord {
  MaMon: string;
  TenMon: string;
  DiemMieng?: number | null;
  Diem15Phut?: number | null;
  Diem1Tiet?: number | null;
  DiemGiuaKy?: number;
  DiemCuoiKy?: number;
  DiemTBMon?: number;
  HeSo?: number;
  XepLoai?: string; // Xuất sắc, Giỏi, Khá, Yếu, Kém
  details?: ScoreDetail[];
}

// Semester average for a student in a class
export interface SemesterAverage {
  MaLop: string;
  TenLop: string;
  MaKhoiLop: string;
  MaHocKy: string;
  TenHK: string;
  DiemTBHocKy?: number;
  DiemTBHocKyQuy?: string;
}

// Student in a class (teacher view)
export interface StudentInClass {
  MaHocSinh: string;
  HoTen: string;
  GioiTinh: string;
  NgaySinh: string;
  Email?: string;
  SDT?: string; // Backend uses SDT
  SoDienThoai?: string; // Deprecated, use SDT
  DiaChi?: string;
  DiemTBHocKy?: number;
}

// Class summary (teacher view)
export interface ClassInfo {
  MaLop: string;
  TenLop: string;
  MaKhoiLop: string;
  TenKhoiLop?: string;
  MaNamHoc?: string;
  NamHoc?: string;
  MaGVCN?: string | number; // Mã giáo viên chủ nhiệm (homeroom teacher ID)
  SiSo?: number;
  SoLuongHocSinh?: number;
  roles?: ('homeroom' | 'subject')[]; // Roles of teacher in this class
  subjects?: Array<{
    MaMon: number;
    TenMonHoc?: string;
    MaHocKy?: number;
    TenHK?: string;
  }>;
  DanhSachHocSinh?: StudentInClass[];
}

// Score detail for gradebook entry
export interface ScoreDetail {
  MaLHKT: string; // Loại hình kiểm tra (1=Miệng, 2=15 phút, 3=1 tiết, 4=Giữa kỳ, 5=Cuối kỳ)
  Lan: number; // Attempt/round
  Diem: number;
}

export interface StudentScore {
  MaHocSinh: string;
  MaMon?: string;
  HoTen?: string;
  DiemMieng?: number | null;
  Diem15Phut?: number | null;
  Diem1Tiet?: number | null;
  DiemGiuaKy?: number;
  DiemCuoiKy?: number;
  DiemTBMon?: number;
  details?: ScoreDetail[];
}

export interface StudentSearchResult {
  MaHocSinh: string;
  HoTen: string;
  GioiTinh: string;
  NgaySinh: string;
  Email?: string;
  SDT?: string; // Backend uses SDT
  SoDienThoai?: string; // Deprecated, use SDT
  DiaChi?: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    MaNguoiDung?: string;
    id?: string;
    TenDangNhap?: string;
    TenNguoiDung?: string;
    HoVaTen?: string;
    Email?: string;
    role?: 'admin' | 'teacher' | 'student';
    VaiTro?: 'admin' | 'teacher' | 'student';
  };
}

// User Management Types
export interface Quyen {
  MaQuyen: number;
  PhanQuyenHeThong?: number;
  ThayDoiThamSo?: number;
  ThayDoiQuyDinh?: number;
  DieuChinhNghiepVu?: number;
  TraCuuDiemVaLopHoc?: number;
  TraCuuHocSinh?: number;
}

export interface NhomNguoiDung {
  MaNhomNguoiDung: number;
  TenNhomNguoiDung: string;
  MaQuyen: number;
  quyen?: Quyen;
}

export interface HocSinhInfo {
  MaHocSinh: string;
  HoTen: string;
  Email?: string;
}

export interface NguoiDung {
  MaNguoiDung: number;
  TenDangNhap: string;
  HoVaTen?: string;
  Email?: string;
  MaNhomNguoiDung: number;
  MaHocSinh?: string;
  nhom?: NhomNguoiDung;
  hocSinh?: HocSinhInfo;
}

export interface CreateNguoiDungPayload {
  TenDangNhap: string;
  MatKhau: string;
  HoVaTen?: string;
  Email?: string;
  MaNhomNguoiDung: number;
  MaHocSinh?: string;
  sendEmail?: boolean;
}

export interface UpdateNguoiDungPayload {
  TenDangNhap?: string;
  MatKhau?: string;
  HoVaTen?: string;
  Email?: string;
  MaNhomNguoiDung?: number;
  MaHocSinh?: string;
}

export interface ImportSummary {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

