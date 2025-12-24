-- Migration: Add grade weight columns to THAMSO table
-- These columns store the weights for different exam categories:
-- HesoMieng: Weight for oral exams (%)
-- HesoChinh15p: Weight for 15-minute main tests (%)
-- HesoGiuaky: Weight for midterm exams (%)
-- HesoCuoiky: Weight for final exams (%)
-- The sum of these weights should equal 100

ALTER TABLE THAMSO
ADD COLUMN Heso_Mieng DECIMAL(5, 2) DEFAULT 0 AFTER Diem_Dat,
ADD COLUMN Heso_Chinh_15p DECIMAL(5, 2) DEFAULT 0 AFTER Heso_Mieng,
ADD COLUMN Heso_Giua_ky DECIMAL(5, 2) DEFAULT 0 AFTER Heso_Chinh_15p,
ADD COLUMN Heso_Cuoi_ky DECIMAL(5, 2) DEFAULT 0 AFTER Heso_Giua_ky;
