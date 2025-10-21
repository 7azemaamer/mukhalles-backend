import { Router, type Router as IRouter } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  registerCompany,
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyDocument,
  getCompanyServices,
  createService,
  updateService,
  deleteService,
  getDelegate,
  updateDelegate,
} from "../controllers/company.controller";
import { upload } from "../utils/fileUpload";

const router: IRouter = Router();

router.post("/register", authenticate, registerCompany);
router.get("/profile", authenticate, getCompanyProfile);
router.put("/profile", authenticate, updateCompanyProfile);
router.post(
  "/documents",
  authenticate,
  upload.single("file"),
  uploadCompanyDocument
);
router.get("/services", authenticate, getCompanyServices);
router.post("/services", authenticate, createService);
router.put("/services/:id", authenticate, updateService);
router.delete("/services/:id", authenticate, deleteService);
router.get("/delegates", authenticate, getDelegate);
router.post("/delegates", authenticate, updateDelegate);

export default router;
