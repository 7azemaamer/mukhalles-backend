import { Router, type Router as IRouter } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller";

const router: IRouter = Router();

router.get("/", authenticate, getNotifications);
router.put("/:id/read", authenticate, markAsRead);
router.put("/read-all", authenticate, markAllAsRead);

export default router;
