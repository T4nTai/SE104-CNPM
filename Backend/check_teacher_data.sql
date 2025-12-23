-- Kiểm tra thông tin giáo viên và phân công lớp
-- Script để debug và thêm dữ liệu test

-- 1. Xem tất cả giáo viên trong hệ thống
SELECT 
    nd.MaND,
    nd.TenDangNhap,
    nd.HoTen,
    nnd.TenNhom
FROM NGUOIDUNG nd
LEFT JOIN NHOM_NGUOIDUNG nnd ON nd.MaNhom = nnd.MaNhom
WHERE nnd.TenNhom = 'Teacher' OR nnd.MaNhom = 2;

-- 2. Xem các lớp hiện có và GVCN
SELECT 
    l.MaLop,
    l.TenLop,
    kl.TenKL as Khoi,
    nh.Nam1,
    nh.Nam2,
    l.MaGVCN,
    nd.HoTen as TenGVCN
FROM LOP l
LEFT JOIN KHOILOP kl ON l.MaKhoiLop = kl.MaKL
LEFT JOIN NAMHOC nh ON l.MaNamHoc = nh.MaNH
LEFT JOIN NGUOIDUNG nd ON l.MaGVCN = nd.MaND
ORDER BY l.MaLop;

-- 3. Xem bảng điểm môn (phân công dạy môn)
SELECT 
    bdm.MaBangDiemMon,
    bdm.MaLop,
    l.TenLop,
    bdm.MaHocKy,
    hk.TenHK,
    bdm.MaMon,
    mh.TenMonHoc,
    bdm.MaGV,
    nd.HoTen as TenGV
FROM BANGDIEMMON bdm
LEFT JOIN LOP l ON bdm.MaLop = l.MaLop
LEFT JOIN HOCKY hk ON bdm.MaHocKy = hk.MaHK
LEFT JOIN MONHOC mh ON bdm.MaMon = mh.MaMon
LEFT JOIN NGUOIDUNG nd ON bdm.MaGV = nd.MaND
ORDER BY bdm.MaLop, bdm.MaHocKy;

-- 4. THÊM DỮ LIỆU TEST (sửa MaGV theo kết quả query 1)
-- Giả sử MaGV = 1 (thay bằng MaND của giáo viên bạn muốn test)

-- Thêm làm GVCN cho lớp 1
-- UPDATE LOP SET MaGVCN = 1 WHERE MaLop = 1;

-- Thêm làm giáo viên bộ môn cho lớp 2 (chỉ dạy môn, không phải GVCN)
-- INSERT INTO BANGDIEMMON (MaLop, MaHocKy, MaMon, MaGV)
-- VALUES (2, 1, 1, 1);

-- Xem năm học và học kỳ hiện có
SELECT MaNH, Nam1, Nam2 FROM NAMHOC ORDER BY MaNH DESC;
SELECT MaHK, TenHK FROM HOCKY;

-- Xem các môn học
SELECT MaMon, TenMonHoc FROM MONHOC ORDER BY MaMon;
