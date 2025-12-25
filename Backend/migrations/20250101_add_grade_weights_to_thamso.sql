-- Migration: Add grade weight columns to THAMSO table
-- These columns store the weights for different exam categories:
-- HesoMieng: Weight for oral exams (%)
-- HesoChinh15p: Weight for 15-minute main tests (%)
-- HesoGiuaky: Weight for midterm exams (%)
-- HesoCuoiky: Weight for final exams (%)
-- The sum of these weights should equal 100

ALTER TABLE THAMSO
ADD COLUMN HesoMieng DECIMAL(5, 2) DEFAULT 0 AFTER DiemDat,
ADD COLUMN HesoChinh15p DECIMAL(5, 2) DEFAULT 0 AFTER HesoMieng,
ADD COLUMN HesoGiuaky DECIMAL(5, 2) DEFAULT 0 AFTER HesoChinh15p,
ADD COLUMN HesoCuoiky DECIMAL(5, 2) DEFAULT 0 AFTER HesoGiuaky;