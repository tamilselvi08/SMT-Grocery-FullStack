import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads", "products");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
  cb(ok ? null : new Error("Only image files are allowed."), ok);
}

export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
