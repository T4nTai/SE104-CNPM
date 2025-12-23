-- ===============================
-- Database: teaching
-- ===============================

SET FOREIGN_KEY_CHECKS = 0;
DROP SCHEMA IF EXISTS teaching;
SET FOREIGN_KEY_CHECKS = 1;

CREATE SCHEMA teaching
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE teaching;

-- ===============================
-- HOC SINH
-- ===============================
CREATE TABLE hocsinh (
  MaHocSinh VARCHAR(100) PRIMARY KEY,
  HoTen VARCHAR(100) NOT NULL,
  NgaySinh DATE NOT NULL,
  GioiTinh VARCHAR(10),
  Email VARCHAR(100),
  SDT VARCHAR(20),
  DiaChi VARCHAR(255),
  NgayTiepNhan DATE,
  GhiChu VARCHAR(255),
  INDEX idx_hocsinh_hoten (HoTen),
  INDEX idx_hocsinh_email (Email),
  INDEX idx_hocsinh_sdt (SDT)
) ENGINE=InnoDB;

-- ===============================
-- QUYEN
-- ===============================
CREATE TABLE quyen (
  MaQuyen INT AUTO_INCREMENT PRIMARY KEY,
  PhanQuyenHeThong TINYINT(1),
  ThayDoiThamSo TINYINT(1),
  ThayDoiQuyDinh TINYINT(1),
  DieuChinhNghiepVu TINYINT(1),
  TraCuuDiemVaLopHoc TINYINT(1),
  TraCuuHocSinh TINYINT(1)
) ENGINE=InnoDB;

-- ===============================
-- NHOM NGUOI DUNG
-- ===============================
CREATE TABLE nhomnguoidung (
  MaNhomNguoiDung INT AUTO_INCREMENT PRIMARY KEY,
  TenNhomNguoiDung VARCHAR(100) UNIQUE,
  MaQuyen INT NOT NULL,
  CONSTRAINT fk_nhom_quyen
    FOREIGN KEY (MaQuyen) REFERENCES quyen(MaQuyen)
) ENGINE=InnoDB;

-- ===============================
-- NGUOI DUNG
-- ===============================
CREATE TABLE nguoidung (
  MaNguoiDung INT AUTO_INCREMENT PRIMARY KEY,
  TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
  MatKhau VARCHAR(255) NOT NULL,
  HoVaTen VARCHAR(100),
  Email VARCHAR(100),
  MaNhomNguoiDung INT NOT NULL,
  MaHocSinh VARCHAR(100) UNIQUE,
  CONSTRAINT fk_nd_nhom
    FOREIGN KEY (MaNhomNguoiDung) REFERENCES nhomnguoidung(MaNhomNguoiDung),
  CONSTRAINT fk_nd_hocsinh
    FOREIGN KEY (MaHocSinh) REFERENCES hocsinh(MaHocSinh)
) ENGINE=InnoDB;

-- ===============================
-- HOC KY
-- ===============================
CREATE TABLE hocky (
  MaHK INT AUTO_INCREMENT PRIMARY KEY,
  TenHK VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- ===============================
-- KHOI LOP
-- ===============================
CREATE TABLE khoilop (
  MaKL INT AUTO_INCREMENT PRIMARY KEY,
  TenKL VARCHAR(50) NOT NULL,
  SoLop INT
) ENGINE=InnoDB;

-- ===============================
-- NAM HOC
-- ===============================
CREATE TABLE namhoc (
  MaNH INT AUTO_INCREMENT PRIMARY KEY,
  Nam1 INT NOT NULL,
  Nam2 INT NOT NULL,
  UNIQUE (Nam1, Nam2)
) ENGINE=InnoDB;

-- ===============================
-- LOP
-- ===============================
CREATE TABLE lop (
  MaLop INT AUTO_INCREMENT PRIMARY KEY,
  TenLop VARCHAR(50) NOT NULL,
  MaKhoiLop INT NOT NULL,
  MaNamHoc INT NOT NULL,
  SiSo INT,
  MaGVCN INT,
  CONSTRAINT fk_lop_khoi
    FOREIGN KEY (MaKhoiLop) REFERENCES khoilop(MaKL),
  CONSTRAINT fk_lop_namhoc
    FOREIGN KEY (MaNamHoc) REFERENCES namhoc(MaNH),
  CONSTRAINT fk_lop_gvcn
    FOREIGN KEY (MaGVCN) REFERENCES nguoidung(MaNguoiDung)
) ENGINE=InnoDB;

-- ===============================
-- MON HOC
-- ===============================
CREATE TABLE monhoc (
  MaMonHoc INT AUTO_INCREMENT PRIMARY KEY,
  TenMonHoc VARCHAR(100) NOT NULL,
  MaMon VARCHAR(50) UNIQUE,
  MoTa TEXT,
  HeSoMon FLOAT NOT NULL
) ENGINE=InnoDB;

-- ===============================
-- BANG DIEM MON
-- ===============================
CREATE TABLE bangdiemmon (
  MaBangDiemMon INT AUTO_INCREMENT PRIMARY KEY,
  MaLop INT NOT NULL,
  MaHocKy INT NOT NULL,
  MaMon INT NOT NULL,
  MaGV INT,
  UNIQUE (MaLop, MaHocKy, MaMon),
  CONSTRAINT fk_bdm_lop FOREIGN KEY (MaLop) REFERENCES lop(MaLop),
  CONSTRAINT fk_bdm_hk FOREIGN KEY (MaHocKy) REFERENCES hocky(MaHK),
  CONSTRAINT fk_bdm_mon FOREIGN KEY (MaMon) REFERENCES monhoc(MaMonHoc),
  CONSTRAINT fk_bdm_gv FOREIGN KEY (MaGV) REFERENCES nguoidung(MaNguoiDung)
) ENGINE=InnoDB;

-- ===============================
-- CT BANG DIEM MON - HOC SINH
-- ===============================
CREATE TABLE ct_bangdiemmon_hocsinh (
  MaCTBangDiemMon INT AUTO_INCREMENT PRIMARY KEY,
  MaBangDiemMon INT NOT NULL,
  MaHocSinh VARCHAR(100) NOT NULL,
  DiemTBMon FLOAT,
  UNIQUE (MaBangDiemMon, MaHocSinh),
  CONSTRAINT fk_ctbdm_bdm FOREIGN KEY (MaBangDiemMon)
    REFERENCES bangdiemmon(MaBangDiemMon),
  CONSTRAINT fk_ctbdm_hs FOREIGN KEY (MaHocSinh)
    REFERENCES hocsinh(MaHocSinh)
) ENGINE=InnoDB;

-- ===============================
-- LOAI HINH KIEM TRA
-- ===============================
CREATE TABLE loaihinhkiemtra (
  MaLHKT INT AUTO_INCREMENT PRIMARY KEY,
  TenLHKT VARCHAR(100) NOT NULL,
  HeSo FLOAT NOT NULL
) ENGINE=InnoDB;

-- ===============================
-- CT BANG DIEM MON - LHKT
-- ===============================
CREATE TABLE ct_bangdiemmon_lhkt (
  MaCTBangDiemMon INT NOT NULL,
  MaLHKT INT NOT NULL,
  Lan INT NOT NULL,
  Diem FLOAT,
  PRIMARY KEY (MaCTBangDiemMon, MaLHKT, Lan),
  CONSTRAINT fk_ctbdm_lhkt_ct FOREIGN KEY (MaCTBangDiemMon)
    REFERENCES ct_bangdiemmon_hocsinh(MaCTBangDiemMon),
  CONSTRAINT fk_ctbdm_lhkt_lhkt FOREIGN KEY (MaLHKT)
    REFERENCES loaihinhkiemtra(MaLHKT)
) ENGINE=InnoDB;

-- ===============================
-- BAO CAO TK HOC KY
-- ===============================
CREATE TABLE baocaotkhk (
  MaHocKy INT NOT NULL,
  MaNamHoc INT NOT NULL,
  MaLop INT NOT NULL,
  SoLuongDat INT,
  TiLeDat FLOAT,
  PRIMARY KEY (MaHocKy, MaNamHoc, MaLop),
  CONSTRAINT fk_bctkhk_hk FOREIGN KEY (MaHocKy) REFERENCES hocky(MaHK),
  CONSTRAINT fk_bctkhk_nh FOREIGN KEY (MaNamHoc) REFERENCES namhoc(MaNH),
  CONSTRAINT fk_bctkhk_lop FOREIGN KEY (MaLop) REFERENCES lop(MaLop)
) ENGINE=InnoDB;

-- ===============================
-- BAO CAO TK MON
-- ===============================
CREATE TABLE baocaotkmon (
  MaBCTKMon INT AUTO_INCREMENT PRIMARY KEY,
  MaMon INT NOT NULL,
  MaHocKy INT NOT NULL,
  MaNamHoc INT NOT NULL,
  UNIQUE (MaMon, MaHocKy, MaNamHoc),
  CONSTRAINT fk_bctkm_mon FOREIGN KEY (MaMon) REFERENCES monhoc(MaMonHoc),
  CONSTRAINT fk_bctkm_hk FOREIGN KEY (MaHocKy) REFERENCES hocky(MaHK),
  CONSTRAINT fk_bctkm_nh FOREIGN KEY (MaNamHoc) REFERENCES namhoc(MaNH)
) ENGINE=InnoDB;

-- ===============================
-- CT BAO CAO TK MON
-- ===============================
CREATE TABLE ct_baocaotkmon (
  MaBCTKMon INT NOT NULL,
  MaLop INT NOT NULL,
  SoLuongDat INT,
  TiLeDat FLOAT,
  PRIMARY KEY (MaBCTKMon, MaLop),
  CONSTRAINT fk_ctbctkmon_bc FOREIGN KEY (MaBCTKMon)
    REFERENCES baocaotkmon(MaBCTKMon),
  CONSTRAINT fk_ctbctkmon_lop FOREIGN KEY (MaLop)
    REFERENCES lop(MaLop)
) ENGINE=InnoDB;

-- ===============================
-- HOC SINH - LOP
-- ===============================
CREATE TABLE hocsinh_lop (
  MaLop INT NOT NULL,
  MaHocSinh VARCHAR(100) NOT NULL,
  MaHocKy INT NOT NULL,
  DiemTBHK FLOAT,
  PRIMARY KEY (MaLop, MaHocSinh, MaHocKy),
  CONSTRAINT fk_hsl_lop FOREIGN KEY (MaLop) REFERENCES lop(MaLop),
  CONSTRAINT fk_hsl_hs FOREIGN KEY (MaHocSinh) REFERENCES hocsinh(MaHocSinh),
  CONSTRAINT fk_hsl_hk FOREIGN KEY (MaHocKy) REFERENCES hocky(MaHK)
) ENGINE=InnoDB;

-- ===============================
-- THAM SO
-- ===============================
CREATE TABLE thamso (
  MaThamSo INT AUTO_INCREMENT PRIMARY KEY,
  TuoiToiDa INT,
  TuoiToiThieu INT,
  SiSoToiDa INT,
  DiemToiThieu INT,
  DiemToiDa INT,
  DiemDatMon INT,
  DiemDat INT,
  MaNamHoc INT NOT NULL UNIQUE,
  CONSTRAINT fk_thamso_nh FOREIGN KEY (MaNamHoc)
    REFERENCES namhoc(MaNH)
) ENGINE=InnoDB;

-- ===============================
-- INSERT DATA (GIỮ NGUYÊN)
-- ===============================

INSERT INTO quyen
(PhanQuyenHeThong, ThayDoiThamSo, ThayDoiQuyDinh, DieuChinhNghiepVu, TraCuuDiemVaLopHoc, TraCuuHocSinh)
VALUES
(1,1,1,1,1,1),
(0,0,0,1,1,1),
(0,0,0,0,1,1);

INSERT INTO nhomnguoidung (TenNhomNguoiDung, MaQuyen)
VALUES
('admin', 1),
('teacher', 2),
('student', 3);

INSERT INTO loaihinhkiemtra (TenLHKT, HeSo)
VALUES
('Miệng/15''', 1),
('1 tiết', 2),
('Giữa kì', 3),
('Cuối kì', 3);
