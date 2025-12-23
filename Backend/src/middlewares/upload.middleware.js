import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const allowedExts = new Set([".csv", ".xls", ".xlsx"]); // support csv/xls/xlsx

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!allowedExts.has(ext)) {
    return cb(new Error("Chỉ hỗ trợ file CSV hoặc Excel (.csv, .xls, .xlsx)"));
  }
  cb(null, true);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
