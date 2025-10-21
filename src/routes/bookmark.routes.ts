import { Router, type Router as IRouter } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getUserBookmarks,
  removeBookmark,
} from "../controllers/bookmark.controller";

const router: IRouter = Router();

router.get("/", authenticate, getUserBookmarks);
router.delete("/:officeId", authenticate, removeBookmark);

export default router;
