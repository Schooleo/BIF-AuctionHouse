import { Router } from "express";
import multer from "multer";
import { uploadImage, deleteImage } from "../controllers/upload.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

router.use(protect());

router.post("/", upload.single("image"), uploadImage);
router.post("/delete", deleteImage);

export default router;
