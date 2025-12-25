# Flow Test: Kiểm tra hoạt động Tham số hệ thống

Mục tiêu: Xác nhận các tham số do Admin cấu hình theo năm học (Tuổi tối thiểu/tối đa, Sĩ số tối đa, Điểm tối thiểu/tối đa, Trọng số điểm) đã được frontend tuân thủ trong các luồng giáo viên.

## Tiền đề
- Có dữ liệu năm học, học kỳ, lớp, môn và phân công giáo viên.
- Tài khoản Admin để chỉnh tham số, tài khoản Giáo viên để thao tác lớp/môn.
- Backend và Frontend đang chạy, đã cấu hình API URL đúng.

## Thiết lập tham số (vai trò Admin)
1. Mở màn hình Admin "Thiết lập tham số" (ParameterSettings).
2. Chọn năm học cần kiểm thử.
3. Đặt các giá trị sau để dễ quan sát:
   - Sĩ số tối đa (`SiSoToiDa`): 2
   - Tuổi tối thiểu (`TuoiToiThieu`): 16
   - Tuổi tối đa (`TuoiToiDa`): 17
   - Điểm tối thiểu (`DiemToiThieu`): 0
   - Điểm tối đa (`DiemToiDa`): 10
   - Trọng số điểm:
     - `HesoMieng` = 1
     - `HesoChinh15p` = 2 (áp cho điểm 1 tiết)
     - `HesoGiuaky` = 3
     - `HesoCuoiky` = 3
4. Lưu tham số và đảm bảo phản hồi thành công.

## Kiểm thử 1: Sĩ số tối đa trong quản lý danh sách lớp (giáo viên)
Màn: Teacher → Quản lý danh sách lớp (`ClassListManagement`).

Bước:
- Chọn đúng năm học và học kỳ tương ứng với tham số đã lưu.
- Chọn một lớp bất kỳ; đảm bảo lớp có ≤ 2 học sinh ban đầu.
- Thêm lần lượt học sinh thứ 1 và thứ 2 (tuổi 16–17, hợp lệ).
- Cố gắng thêm học sinh thứ 3.

Kỳ vọng:
- Khi thêm học sinh thứ 3, hiển thị cảnh báo: "Lớp đã đủ sĩ số (tối đa 2 học sinh)" và không thêm mới.
- Số lượng học sinh trong lớp không vượt quá 2.

## Kiểm thử 2: Ràng buộc tuổi học sinh
Màn: Teacher → Quản lý danh sách lớp (`ClassListManagement`).

Bước:
- Thêm một học sinh có tuổi 15 (nhỏ hơn `TuoiToiThieu`).
- Thêm một học sinh có tuổi 18 (lớn hơn `TuoiToiDa`).

Kỳ vọng:
- Hiển thị cảnh báo theo tham số: "Tuổi học sinh phải từ 16 đến 17" và không thêm vào lớp.

## Kiểm thử 3: Ràng buộc điểm theo khoảng cho phép
Màn: Teacher → Nhập bảng điểm (`GradeEntry`).

Bước:
- Chọn lớp, môn và học kỳ cùng năm học đã thiết lập tham số.
- Với một học sinh:
  - Nhập điểm giữa kỳ = 11 (vượt `DiemToiDa`).
  - Nhập điểm miệng/15p = -1 (nhỏ hơn `DiemToiThieu`).
- Thử bấm Lưu.

Kỳ vọng:
- Hiển thị cảnh báo: "Có X điểm ngoài khoảng cho phép (0–10). Vui lòng kiểm tra lại." và không lưu khi còn điểm ngoài khoảng.

## Kiểm thử 4: Tính trung bình môn theo trọng số tham số
Màn: Teacher → Nhập bảng điểm (`GradeEntry`).

Bước:
- Cho một học sinh, nhập:
  - Miệng/15p: 8, 9 (trung bình miệng = 8.5)
  - 1 tiết: 7 (trung bình tiết = 7)
  - Giữa kỳ: 6
  - Cuối kỳ: 8
- Xác nhận giá trị trung bình hiển thị (hoặc sau lưu), công thức:

  Average = (Cuối kỳ × 3 + Giữa kỳ × 3 + Trung bình 1 tiết × 2 + Trung bình miệng × 1) / (1+2+3+3)

  Tính tay: (8×3 + 6×3 + 7×2 + 8.5×1) / 9 = (24 + 18 + 14 + 8.5) / 9 = 64.5 / 9 ≈ 7.2

Kỳ vọng:
- Giá trị trung bình hiển thị ≈ 7.2 (làm tròn theo UI, thường 1 chữ số thập phân).

## Kiểm thử 5: Đổi năm học và kiểm tra lại
Bước:
- Về màn Admin, đổi tham số sang năm học khác (ví dụ `SiSoToiDa` = 3, `TuoiToiThieu` = 15, `TuoiToiDa` = 18).
- Về màn giáo viên:
  - Chọn năm học mới ở bộ lọc.
  - Thực hiện lại Kiểm thử 1 và 2.

Kỳ vọng:
- Ràng buộc cập nhật theo tham số của năm học mới (ví dụ sĩ số tối đa 3, tuổi cho phép 15–18).

## Lưu ý kỹ thuật
- `ClassListManagement.tsx`: đã đọc tham số năm học và áp dụng `TuoiToiThieu`, `TuoiToiDa`, `SiSoToiDa` cho kiểm tra trước khi thêm học sinh.
- `GradeEntry.tsx`: đã đọc tham số năm học; dùng `HesoMieng`, `HesoChinh15p`, `HesoGiuaky`, `HesoCuoiky` cho tính trung bình và kiểm tra giá trị điểm trong khoảng `DiemToiThieu`–`DiemToiDa` trước khi lưu.
- Nếu tham số không tải được, UI dùng giá trị mặc định an toàn (tuổi 15–20, sĩ số 40, điểm 0–10).

## Mẹo chạy nhanh (tuỳ chọn)
```bash
# Backend (tuỳ theo dự án):
# cd Backend
# npm install
# npm start

# Frontend:
# cd Frontend
# npm install
# npm run dev
```

## Kết quả mong đợi
- Tất cả kiểm thử trên phản ánh đúng thay đổi tham số từ Admin theo năm học.
- Không có case nào vượt qua ràng buộc khi tham số đã đặt rõ.
