import { Response } from "express";
import { Bookmark, Office } from "../models";
import { AuthRequest } from "../types";
import logger from "../utils/logger";

export const getUserBookmarks = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, city, category } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const bookmarks = await Bookmark.find({ userId: req.user?.userId })
      .populate("officeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    let filteredBookmarks = bookmarks;

    if (city || category) {
      filteredBookmarks = bookmarks.filter((bookmark: any) => {
        const office = bookmark.officeId;
        if (!office) return false;
        if (city && office.city !== city) return false;
        if (category && office.category !== category) return false;
        return true;
      });
    }

    const total = await Bookmark.countDocuments({ userId: req.user?.userId });

    res.status(200).json({
      success: true,
      data: {
        bookmarks: filteredBookmarks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get user bookmarks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bookmarks",
    });
  }
};

export const addBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const office = await Office.findById(id);

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    const existingBookmark = await Bookmark.findOne({
      userId: req.user?.userId,
      officeId: id,
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: "Office already bookmarked",
      });
    }

    await Bookmark.create({
      userId: req.user?.userId,
      officeId: id,
    });

    await Office.findByIdAndUpdate(id, { $inc: { "stats.bookmarks": 1 } });

    res.status(201).json({
      success: true,
      message: "Office bookmarked successfully",
      isBookmarked: true,
    });
  } catch (error) {
    logger.error("Add bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add bookmark",
    });
  }
};

export const removeBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const bookmark = await Bookmark.findOne({
      userId: req.user?.userId,
      officeId: id,
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found",
      });
    }

    await Bookmark.findByIdAndDelete(bookmark._id);
    await Office.findByIdAndUpdate(id, { $inc: { "stats.bookmarks": -1 } });

    res.status(200).json({
      success: true,
      message: "Bookmark removed successfully",
      isBookmarked: false,
    });
  } catch (error) {
    logger.error("Remove bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove bookmark",
    });
  }
};
