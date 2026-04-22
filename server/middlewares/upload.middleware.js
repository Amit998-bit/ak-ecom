import multer from 'multer';
import path   from 'path';
import { ApiError } from '../utils/ApiError.util.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime    = allowed.test(file.mimetype);
  if (mime && ext) return cb(null, true);
  cb(new ApiError(400, 'Only image files are allowed'));
};

const upload = multer({
  storage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadSingle   = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
export const uploadFields   = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video',  maxCount: 1  },
]);

export default upload;
