import { Router, type Router as IRouter } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getOffices,
  getOfficeById,
  trackContactClick,
  updateOffice,
} from "../controllers/office.controller";
import {
  getOfficeReviews,
  createReview,
} from "../controllers/review.controller";
import {
  addBookmark,
  removeBookmark,
} from "../controllers/bookmark.controller";

const router: IRouter = Router();

router.get("/", getOffices);
router.get("/:id", getOfficeById);
router.put("/:id", authenticate, updateOffice);
router.post("/:id/contact-click", authenticate, trackContactClick);
router.get("/:id/reviews", getOfficeReviews);
router.post("/:id/reviews", authenticate, createReview);
router.post("/:id/bookmark", authenticate, addBookmark);
router.delete("/:id/bookmark", authenticate, removeBookmark);

export default router;
