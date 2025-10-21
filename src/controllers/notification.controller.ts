import { Response } from "express";
import { Notification } from "../models";
import { AuthRequest, NotificationType } from "../types";
import logger from "../utils/logger";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { userId: req.user?.userId };
    if (type && type !== "all") query.type = type;
    if (isRead !== undefined) query.isRead = isRead === "true";

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user?.userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user?.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    logger.error("Mark notification as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { userId: req.user?.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    logger.error("Mark all notifications as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: { ar: string; en: string },
  message: { ar: string; en: string },
  data?: any
) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
    });
  } catch (error) {
    logger.error("Create notification error:", error);
  }
};
