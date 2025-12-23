import axios, { AxiosInstance } from 'axios';
import {
  AuthResponse,
  ClassInfo,
  GradeRecord,
  SemesterAverage,
  StudentInClass,
  StudentScore,
  StudentSearchResult,
  Quyen,
  NhomNguoiDung,
  NguoiDung,
  CreateNguoiDungPayload,
  UpdateNguoiDungPayload,
} from './types';

// Fallback to default URL if VITE_API_BASE_URL is not set
const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Set auth token
export function setAuthToken(token?: string) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
  } else {
    delete apiClient.defaults.headers.common.Authorization;
    localStorage.removeItem('authToken');
  }
}

// Restore token from storage on init
const storedToken = localStorage.getItem('authToken');
if (storedToken) setAuthToken(storedToken);

export const api = {
  // ========== Auth ==========
  async login(TenDangNhap: string, MatKhau: string): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/login', { TenDangNhap, MatKhau });
    return data.data || data;
  },

  async register(payload: {
    TenNguoiDung: string;
    Email: string;
    MatKhau: string;
    VaiTro?: string;
  }): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data || data;
  },

  async registerUser(payload: {
    TenDangNhap: string;
    MatKhau: string;
    HoVaTen?: string | null;
    Email?: string | null;
    role?: 'teacher' | 'admin';
  }): Promise<any> {
    const { data } = await apiClient.post('/auth/register-user', payload);
    return data.data || data;
  },

  async registerStudent(payload: {
    TenDangNhap: string;
    MatKhau: string;
    HoVaTen?: string | null;
    Email?: string | null;
    MaHocSinh: string;
    HoTen: string;
    GioiTinh: string;
    NgaySinh: string;
    DiaChi?: string | null;
  }): Promise<any> {
    const { data } = await apiClient.post('/auth/register-student', payload);
    return data.data || data;
  },

  async registerRequest(payload: {
    TenDangNhap: string;
    MatKhau: string;
    HoVaTen?: string | null;
    Email?: string | null;
  }): Promise<any> {
    const { data } = await apiClient.post('/auth/register-request', payload);
    return data.data || data;
  },

  async me() {
    const { data } = await apiClient.get('/auth/me');
    return data.data || data;
  },

  // ========== Student Endpoints ==========
  async getMyClasses(MaHocKy?: string): Promise<SemesterAverage[]> {
    const { data } = await apiClient.get('/students/me/classes', {
      params: { MaHocKy },
    });
    return (data.data || data) as SemesterAverage[];
  },

  async getMyScores(MaHocKy: string): Promise<GradeRecord[]> {
    const { data } = await apiClient.get('/students/me/scores', {
      params: { MaHocKy },
    });
    const payload = data.data || data;
    if (Array.isArray(payload)) {
      const sem = payload.find((p: any) => String(p.MaHocKy) === String(MaHocKy)) || payload[0];
      const monScores = sem?.monScores || [];
      return monScores.map((m: any) => ({
        MaMon: String(m.MaMon),
        TenMon: m.TenMonHoc || m.TenMon || '',
        DiemMieng: m.DiemMieng ?? null,
        Diem15Phut: m.Diem15Phut ?? null,
        Diem1Tiet: m.Diem1Tiet ?? null,
        DiemGiuaKy: m.DiemGiuaKy ?? null,
        DiemCuoiKy: m.DiemCuoiKy ?? null,
        DiemTBMon: m.DiemTBMon ?? null,
        details: m.details || [],
      })) as GradeRecord[];
    }
    return payload as GradeRecord[];
  },

  // ========== Teacher Endpoints ==========
  async getTeacherClasses(params?: { MaGV?: string | number; MaNamHoc?: string; MaKhoiLop?: string; MaHocKy?: string }): Promise<ClassInfo[]> {
    const { data } = await apiClient.get('/teacher/classes', { params });
    return (data.data || data) as ClassInfo[];
  },

  async getStudentsByClass(MaLop: string, MaHocKy: string): Promise<any[]> {
    const { data } = await apiClient.get(`/teacher/classes/${MaLop}/semesters/${MaHocKy}/students`);
    return (data.data || data) as any[];
  },

  async getMyClassDetails(MaLop: string | number, MaHocKy: string | number): Promise<{ classInfo: any; classmates: any[] }>{
    const { data } = await apiClient.get(`/students/classes/${MaLop}/semesters/${MaHocKy}/details`);
    return (data.data || data) as { classInfo: any; classmates: any[] };
  },

  async importStudents(MaLop: string, MaHocKy: string, file: File): Promise<any> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post(`/teacher/classes/${MaLop}/semesters/${MaHocKy}/students/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data || data;
  },

  async addStudentToClass(
    MaLop: string,
    MaHocKy: string,
    student: {
      MaHocSinh: string;
      HoTen: string;
      GioiTinh: string;
      NgaySinh: string;
      Email?: string;
      SDT?: string;
      DiaChi?: string;
    }
  ): Promise<{ enroll: any; createdAccount?: { TenDangNhap: string; tempPass: string; Email: string; HoTen: string } } | void> {
    const { data } = await apiClient.post(`/teacher/classes/${MaLop}/semesters/${MaHocKy}/students`, student);
    return data.data || data;
  },

  async updateStudent(MaHocSinh: string, updates: Partial<StudentInClass>): Promise<void> {
    await apiClient.put(`/teacher/students/${MaHocSinh}`, updates);
  },

  async deleteStudent(MaHocSinh: string): Promise<void> {
    await apiClient.delete(`/teacher/students/${MaHocSinh}`);
  },

  async getStudentScores(MaHocSinh: string, MaHocKy?: string, MaMon?: string): Promise<StudentScore[]> {
    const { data } = await apiClient.get(`/teacher/students/${MaHocSinh}/scores`, {
      params: { MaHocKy, MaMon },
    });
    const payload = data.data || data;
    if (Array.isArray(payload)) {
      const sem = MaHocKy
        ? payload.find((p: any) => String(p.MaHocKy) === String(MaHocKy)) || payload[0]
        : payload[0];
      const monScores = sem?.monScores || [];
      return monScores.map((m: any) => ({
        MaHocSinh,
        MaMon: String(m.MaMon),
        HoTen: m.HoTen,
        DiemMieng: m.DiemMieng ?? null,
        Diem15Phut: m.Diem15Phut ?? null,
        Diem1Tiet: m.Diem1Tiet ?? null,
        DiemGiuaKy: m.DiemGiuaKy ?? null,
        DiemCuoiKy: m.DiemCuoiKy ?? null,
        DiemTBMon: m.DiemTBMon ?? null,
        details: m.details || [],
      })) as StudentScore[];
    }
    return payload as StudentScore[];
  },

  async searchStudents(q: string): Promise<StudentSearchResult[]> {
    const { data } = await apiClient.get('/teacher/students/search', { params: { q } });
    return (data.data || data) as StudentSearchResult[];
  },

  async enterGradebook(payload: {
    MaLop: string;
    MaHocKy: string;
    MaMon: string;
    scores: Array<{
      MaHocSinh: string;
      details: Array<{ MaLHKT: string; Lan: number; Diem: number }>;
    }>;
  }): Promise<void> {
    await apiClient.post('/teacher/gradebooks/enter', payload);
  },

  async importGrades(MaLop: string, MaMon: string, MaHocKy: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(`/teacher/classes/${MaLop}/subjects/${MaMon}/semesters/${MaHocKy}/import-grades`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data || data;
  },

  async getTeacherAssignments(MaGV?: string | number): Promise<{ homeroom: any[]; subject: any[] }> {
    // MaGV is optional now - backend will extract from JWT token
    const { data } = await apiClient.get('/teacher/assignments', MaGV ? { params: { MaGV } } : undefined);
    return data.data || data;
  },

  // ========== Admin - Khoi Lop (Grade Levels) ==========
  async createGrade(payload: {
    TenKL: string;
    SoLop?: number;
  }): Promise<any> {
    const { data } = await apiClient.post('/admin/khoilop', payload);
    return data.data || data;
  },

  async listGrades(): Promise<any[]> {
    const { data } = await apiClient.get('/admin/khoilop');
    return data.data || data;
  },

  async updateGrade(MaKL: string, payload: {
    TenKL?: string;
    SoLop?: number;
  }): Promise<any> {
    const { data } = await apiClient.put(`/admin/khoilop/${MaKL}`, payload);
    return data.data || data;
  },

  async deleteGrade(MaKL: string): Promise<void> {
    await apiClient.delete(`/admin/khoilop/${MaKL}`);
  },

  // ========== Admin - Mon Hoc (Subjects) ==========
  async createSubject(payload: {
    TenMonHoc: string;
    MaMon?: string;
    HeSoMon: number;
    MoTa?: string;
  }): Promise<any> {
    const { data } = await apiClient.post('/admin/monhoc', payload);
    return data.data || data;
  },

  async listSubjects(): Promise<any[]> {
    const { data } = await apiClient.get('/admin/monhoc');
    return data.data || data;
  },

  async updateSubject(MaMonHoc: string, payload: {
    TenMonHoc?: string;
    MaMon?: string;
    HeSoMon?: number;
    MoTa?: string;
  }): Promise<any> {
    const { data } = await apiClient.put(`/admin/monhoc/${MaMonHoc}`, payload);
    return data.data || data;
  },

  async deleteSubject(MaMonHoc: string): Promise<void> {
    await apiClient.delete(`/admin/monhoc/${MaMonHoc}`);
  },

  // ========== Admin - Hoc Ky (Semesters) ==========
  async createSemester(payload: {
    TenHK: string
  }): Promise<any> {
    const { data } = await apiClient.post('/admin/hocky', payload);
    return data.data || data;
  },

  async listSemesters(params?: { MaNamHoc?: number; NamHoc?: string }): Promise<any[]> {
    const { data } = await apiClient.get('/admin/hocky', { params });
    return data.data || data;
  },

  async updateSemester(MaHK: string, payload: {
    TenHK?: string;
    NamHoc?: string; // optional text, maps to MaNamHoc on server
    MaNamHoc?: number; // optional direct id
    NgayBatDau?: string;
    NgayKetThuc?: string;
  }): Promise<any> {
    const { data } = await apiClient.put(`/admin/hocky/${MaHK}`, payload);
    return data.data || data;
  },

  async deleteSemester(MaHK: string): Promise<void> {
    await apiClient.delete(`/admin/hocky/${MaHK}`);
  },

  // ========== Admin - Loai Hinh Kiem Tra (Test Types) ==========
  async createTestType(payload: {
    TenLHKT: string;
    HeSo?: number;
  }): Promise<any> {
    const { data } = await apiClient.post('/admin/lhkt', payload);
    return data.data || data;
  },

  async listTestTypes(): Promise<any[]> {
    const { data } = await apiClient.get('/admin/lhkt');
    return data.data || data;
  },

  async updateTestType(MaLHKT: string, payload: {
    TenLHKT?: string;
    HeSo?: number;
  }): Promise<any> {
    const { data } = await apiClient.put(`/admin/lhkt/${MaLHKT}`, payload);
    return data.data || data;
  },

  async deleteTestType(MaLHKT: string): Promise<void> {
    await apiClient.delete(`/admin/lhkt/${MaLHKT}`);
  },

  // ========== Admin - Nam Hoc (Academic Years) ==========
  async listAcademicYears(): Promise<any[]> {
    const { data } = await apiClient.get('/admin/namhoc');
    return data.data || data;
  },

  async createAcademicYear(payload: { Nam1?: number; Nam2?: number; NamHoc?: string }): Promise<any> {
    const { data } = await apiClient.post('/admin/namhoc', payload);
    return data.data || data;
  },

  // ========== Admin - Lop (Classes) ==========
  async createClass(payload: {
    TenLop: string;
    MaKhoiLop: number;
    MaNamHoc: number;
    SiSo?: number;
  }): Promise<any> {
    const { data } = await apiClient.post('/admin/lop', payload);
    return data.data || data;
  },

  async listClasses(params?: { MaNamHoc?: number; MaKhoiLop?: number }): Promise<any[]> {
    const { data } = await apiClient.get('/admin/lop', { params });
    return data.data || data;
  },

  async deleteClass(MaLop: string): Promise<void> {
    await apiClient.delete(`/admin/lop/${MaLop}`);
  },

  async assignHomeroom(MaLop: number | string, MaGVCN: number | string): Promise<any> {
    const { data } = await apiClient.put(`/admin/lop/${MaLop}/assign-homeroom`, { MaGVCN });
    return data.data || data;
  },

  async assignSubjectTeacher(payload: { MaLop: number | string; MaMon: number | string; MaHocKy: number | string; MaGV: number | string }): Promise<any> {
    const { data } = await apiClient.put('/admin/gradebooks/assign-teacher', payload);
    return data.data || data;
  },

  // ========== Admin - Class Assignments Management ==========
  async getClassAssignments(params?: { MaNamHoc?: number; MaKhoiLop?: number }): Promise<any[]> {
    const { data } = await apiClient.get('/admin/class-assignments', { params });
    return data.data || data;
  },

  async removeHomeroomTeacher(MaLop: number): Promise<any> {
    const { data } = await apiClient.delete(`/admin/class-assignments/homeroom/${MaLop}`);
    return data.data || data;
  },

  async removeSubjectTeacher(MaBangDiemMon: number): Promise<any> {
    const { data } = await apiClient.delete(`/admin/class-assignments/subject/${MaBangDiemMon}`);
    return data.data || data;
  },

  // ========== Admin - Tham So (Parameters by Academic Year) ==========
  async getParameters(MaNH: string): Promise<any> {
    const { data } = await apiClient.get(`/admin/namhoc/${MaNH}/thamso`);
    return data.data || data;
  },
  async upsertParameters(MaNH: string, payload: {
    tuoiToiThieu: number;
    tuoiToiDa: number;
    soHocSinhToiDa1Lop: number;
    diemToiThieu: number;
    diemToiDa: number;
    diemDatToiThieu: number;
    diemToiThieuHocKy: number;
  }): Promise<any> {
    const { data } = await apiClient.put(`/admin/namhoc/${MaNH}/thamso/upsert`, payload);
    return data.data || data;
  },

  // ========== Reports ==========
  async getReportBySemesterAndClass(params: {
    MaHocKy: number | string;
    MaNamHoc: number | string;
    MaLop: number | string;
  }): Promise<any> {
    const { data } = await apiClient.get('/reports/semester-class', { params });
    return data.data || data;
  },

  async getReportBySubject(params: {
    MaHocKy: number | string;
    MaNamHoc: number | string;
    MaMon: number | string;
  }): Promise<any> {
    const { data } = await apiClient.get('/reports/subject', { params });
    return data.data || data;
  },

  // ========== Admin - Quyen (Permissions) ==========
  async createQuyen(payload: Partial<Quyen>): Promise<Quyen> {
    const { data } = await apiClient.post('/admin/quyen', payload);
    return data.data || data;
  },

  async listQuyen(): Promise<Quyen[]> {
    const { data } = await apiClient.get('/admin/quyen');
    return data.data || data;
  },

  async getQuyen(MaQuyen: number): Promise<Quyen> {
    const { data } = await apiClient.get(`/admin/quyen/${MaQuyen}`);
    return data.data || data;
  },

  async updateQuyen(MaQuyen: number, payload: Partial<Quyen>): Promise<Quyen> {
    const { data } = await apiClient.put(`/admin/quyen/${MaQuyen}`, payload);
    return data.data || data;
  },

  async deleteQuyen(MaQuyen: number): Promise<void> {
    await apiClient.delete(`/admin/quyen/${MaQuyen}`);
  },

  // ========== Admin - Nhom Nguoi Dung (User Groups) ==========
  async createNhomNguoiDung(payload: {
    TenNhomNguoiDung: string;
    MaQuyen: number;
  }): Promise<NhomNguoiDung> {
    const { data } = await apiClient.post('/admin/nhomnguoidung', payload);
    return data.data || data;
  },

  async listNhomNguoiDung(): Promise<NhomNguoiDung[]> {
    const { data } = await apiClient.get('/admin/nhomnguoidung');
    return data.data || data;
  },

  async getNhomNguoiDung(MaNhom: number): Promise<NhomNguoiDung> {
    const { data } = await apiClient.get(`/admin/nhomnguoidung/${MaNhom}`);
    return data.data || data;
  },

  async updateNhomNguoiDung(MaNhom: number, payload: {
    TenNhomNguoiDung?: string;
    MaQuyen?: number;
  }): Promise<NhomNguoiDung> {
    const { data } = await apiClient.put(`/admin/nhomnguoidung/${MaNhom}`, payload);
    return data.data || data;
  },

  async deleteNhomNguoiDung(MaNhom: number): Promise<void> {
    await apiClient.delete(`/admin/nhomnguoidung/${MaNhom}`);
  },

  // ========== Admin - Nguoi Dung (Users) ==========
  async createNguoiDung(payload: CreateNguoiDungPayload): Promise<NguoiDung> {
    const { data } = await apiClient.post('/admin/nguoidung', payload);
    return data.data || data;
  },

  async listNguoiDung(MaNhomNguoiDung?: number): Promise<NguoiDung[]> {
    const { data } = await apiClient.get('/admin/nguoidung', {
      params: MaNhomNguoiDung ? { MaNhomNguoiDung } : undefined,
    });
    return data.data || data;
  },

  async getNguoiDung(MaNguoiDung: number): Promise<NguoiDung> {
    const { data } = await apiClient.get(`/admin/nguoidung/${MaNguoiDung}`);
    return data.data || data;
  },

  async updateNguoiDung(MaNguoiDung: number, payload: UpdateNguoiDungPayload): Promise<NguoiDung> {
    const { data } = await apiClient.put(`/admin/nguoidung/${MaNguoiDung}`, payload);
    return data.data || data;
  },

  async deleteNguoiDung(MaNguoiDung: number): Promise<void> {
    await apiClient.delete(`/admin/nguoidung/${MaNguoiDung}`);
  },

  async resetMatKhau(MaNguoiDung: number, MatKhauMoi: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post(`/admin/nguoidung/${MaNguoiDung}/reset-password`, {
      MatKhauMoi,
    });
    return data.data || data;
  },

  async importNguoiDung(file: File): Promise<any> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post('/admin/nguoidung/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data || data;
  },
};

