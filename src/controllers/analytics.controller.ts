import { Response } from "express";
import { Office, Review, Analytics } from "../models";
import { AuthRequest } from "../types";
import logger from "../utils/logger";

export const getCompanyAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const office = await Office.findOne({
      _id: id,
      companyId: req.user?.userId,
    });

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    const reviews = await Review.find({ officeId: id, isApproved: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "individualProfile.fullName")
      .lean();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const viewsByDay = await Analytics.aggregate([
      {
        $match: {
          metric: "office_views",
          "dimensions.officeId": office._id,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: "$value" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const contactsByDay = await Analytics.aggregate([
      {
        $match: {
          metric: "contact_clicks",
          "dimensions.officeId": office._id,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: "$value" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          profileViews: office.stats.profileViews,
          contactClicks: office.stats.contactClicks,
          bookmarks: office.stats.bookmarks,
          reviewsCount: office.ratingCount,
          averageRating: office.rating,
        },
        trends: {
          viewsByDay,
          contactsByDay,
        },
        popularServices: office.services.slice(0, 5),
        recentReviews: reviews,
      },
    });
  } catch (error) {
    logger.error("Get company analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get analytics",
    });
  }
};

export const getPlatformAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { period = "30d" } = req.query;

    const days =
      period === "7d" ? 7 : period === "90d" ? 90 : period === "1y" ? 365 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await Analytics.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: "$metric",
          total: { $sum: "$value" },
        },
      },
    ]);

    const metricsByDay = await Analytics.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            metric: "$metric",
          },
          count: { $sum: "$value" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    const topCities = await Analytics.aggregate([
      {
        $match: {
          metric: "office_views",
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$dimensions.city",
          views: { $sum: "$value" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        metrics,
        metricsByDay,
        topCities,
      },
    });
  } catch (error) {
    logger.error("Get platform analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get platform analytics",
    });
  }
};
