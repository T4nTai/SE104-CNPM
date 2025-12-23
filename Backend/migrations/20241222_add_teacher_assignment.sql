-- Add MaGVCN to LOP and foreign key to NGUOIDUNG
ALTER TABLE LOP
  ADD COLUMN IF NOT EXISTS MaGVCN INT NULL AFTER SiSo;

-- MySQL/MariaDB do not support IF NOT EXISTS for FK, so guard with a name check in application if needed.
-- Drop existing constraint with same name before adding if it already exists.
ALTER TABLE LOP
  ADD CONSTRAINT fk_LOP_GVCN FOREIGN KEY (MaGVCN) REFERENCES NGUOIDUNG(MaNguoiDung);

-- Add MaGV to BANGDIEMMON and foreign key to NGUOIDUNG
ALTER TABLE BANGDIEMMON
  ADD COLUMN IF NOT EXISTS MaGV INT NULL AFTER MaMon;

ALTER TABLE BANGDIEMMON
  ADD CONSTRAINT fk_BDM_GV FOREIGN KEY (MaGV) REFERENCES NGUOIDUNG(MaNguoiDung);
